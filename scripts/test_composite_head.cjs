const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.pending.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9365;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_composite_check_'));

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      'http://localhost:5173/'
    ],
    { stdio: 'ignore' }
  );

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const json = await httpGet(`http://127.0.0.1:${port}/json`);
      targets = JSON.parse(json);
      if (targets.length > 0) break;
    } catch (e) {}
  }

  const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  targets = JSON.parse(rawList);
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const snapData = await cdp.send('Runtime.evaluate', {
    expression: `new Promise(async (resolve) => {
      const loadImg = (src) => new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });

      const [hairBack, face, hairFront, crown] = await Promise.all([
        loadImg('/src/assets/art/characters/aria/layers/hair_back_hd.png'),
        loadImg('/src/assets/art/characters/aria/layers/face_hd.png'),
        loadImg('/src/assets/art/characters/aria/layers/hair_front_hd.png'),
        loadImg('/src/assets/art/characters/aria/layers/crown_ribbon_hd.png')
      ]);

      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      // Draw centered
      const cx = 500;
      const cy = 600;

      // 1. Hair back
      ctx.drawImage(hairBack, cx - hairBack.width / 2, cy - 350);
      // 2. Face
      ctx.drawImage(face, cx - face.width / 2, cy - 300);
      // 3. Hair front
      ctx.drawImage(hairFront, cx - hairFront.width / 2, cy - 380);
      // 4. Crown
      ctx.drawImage(crown, cx - crown.width / 2, cy - 450);

      resolve(canvas.toDataURL('image/png'));
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  const base64 = snapData.result.value.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('test_composite_head.png', Buffer.from(base64, 'base64'));
  console.log('Saved test_composite_head.png (size:', base64.length, ')');

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
}

run().catch(console.error);
