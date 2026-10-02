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
  constructor(wsUrl) { this.wsUrl = wsUrl; this.ws = null; this.id = 1; this.pending = new Map(); }
  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(msg.error); else resolve(msg.result);
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
  close() { if (this.ws) this.ws.close(); }
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9425;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_title_test_'));
  const artifactsDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\08f833e8-339b-437f-89e5-b8e0c3f3273b';

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1600,900',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  // Wait for game loop to render at least 20 frames
  for (let i = 0; i < 40; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean((window.__game || window.game)?.framesCount > 15 && window.assetManager?.isReady)'
    });
    if (res?.result?.value) break;
    await new Promise(r => setTimeout(r, 250));
  }

  // Inspect title screen state
  const info = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const p = g?.player;
      return {
        state: g?.state,
        framesCount: g?.framesCount,
        amReady: window.assetManager?.isReady,
        masterBound: !!p?.rig?.masterPlates?.front,
        masterSrc: p?.rig?.masterPlates?.front?.src?.slice(0, 80),
        renderMode: window.characterRenderer?.renderMode,
      };
    })()`,
    returnByValue: true
  });
  console.log('TITLE SCREEN INFO:', info.result.value);

  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_title_verified.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_title_verified.png');

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
}

run().catch(console.error);
