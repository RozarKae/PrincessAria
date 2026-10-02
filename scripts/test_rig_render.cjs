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
  const port = 9375;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_rig_test_'));

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

  for (let i = 0; i < 30; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__game && window.assetManager && window.assetManager.isReady)'
    });
    if (res?.result?.value) break;
    await new Promise(r => setTimeout(r, 200));
  }

  const renderData = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__game || window.game;
      const player = g?.player;
      if (!player) return { error: 'No player' };

      // Ensure layers are bound
      player.bindRigLayers();

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 400, 400);

      // Draw rig in center
      ctx.save();
      ctx.translate(200, 300);
      player.rig.draw(ctx, { testMode: true });
      ctx.restore();

      return {
        dataUrl: canvas.toDataURL('image/png'),
        nodeCount: player.rig.nodes.size,
        boundLayers: Array.from(player.rig.nodes.values()).filter(n => !!n.image).map(n => n.name)
      };
    })()`,
    returnByValue: true
  });

  const res = renderData.result.value;
  console.log('Rig Render result: nodeCount =', res.nodeCount, 'boundLayers =', res.boundLayers);
  if (res.dataUrl) {
    const base64 = res.dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('test_rig_render.png', Buffer.from(base64, 'base64'));
    console.log('Saved test_rig_render.png');
  }

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
}

run().catch(console.error);
