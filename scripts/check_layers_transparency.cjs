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
  const port = 9360;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_layers_check_'));

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

  const checkRes = await cdp.send('Runtime.evaluate', {
    expression: `new Promise(async (resolve) => {
      const layerNames = [
        'crown', 'crown_ribbon_hd', 'earrings', 'earrings_hd', 'eyes', 'face', 'face_hd',
        'foot_L', 'foot_R', 'forearm_L', 'forearm_R', 'hair_back', 'hair_back_hd',
        'hair_front', 'hair_front_hd', 'hand_L', 'hand_R', 'lower_leg_L', 'lower_leg_R',
        'ribbon', 'ribbon_flow', 'ribbon_L', 'ribbon_R', 'shoulder_L', 'shoulder_R',
        'skirt_back', 'skirt_front', 'skirt_side_L', 'skirt_side_R', 'tail_base',
        'tail_mid', 'tail_ribbon', 'tail_tip', 'thigh_jewel_L', 'thigh_jewel_R',
        'thigh_L', 'thigh_R', 'torso_back', 'torso_front', 'upperarm_R', 'upper_arm_L', 'waist_jewel'
      ];

      const results = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      for (const name of layerNames) {
        const img = new Image();
        img.src = '/src/assets/art/characters/aria/layers/' + name + '.png';
        await new Promise(r => { img.onload = r; img.onerror = r; });
        if (!img.naturalWidth) {
          results.push({ name, error: 'Failed to load' });
          continue;
        }
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const cornerAlpha = data[3]; // top-left pixel alpha
        let transparentPixels = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] === 0) transparentPixels++;
        }
        const pctTransparent = Math.round((transparentPixels / (canvas.width * canvas.height)) * 100);
        results.push({
          name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          cornerAlpha,
          pctTransparent
        });
      }
      resolve(results);
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  console.table(checkRes.result.value);

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
}

run().catch(console.error);
