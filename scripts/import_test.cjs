const { spawn } = require('child_process');
const http = require('http');

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
  const port = 9522;
  const proc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page');
  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Runtime.enable');

  const res = await cdp.send('Runtime.evaluate', {
    expression: 'import("/src/main.js").catch(e => ({ error: e.message, stack: e.stack }))',
    awaitPromise: true,
    returnByValue: true
  });
  console.log('IMPORT MAIN.JS RESULT:', JSON.stringify(res, null, 2));

  // Wait for assets to finish preloading and loop to start
  console.log('Waiting for assetManager.isReady and loop to start...');
  for (let i = 0; i < 30; i++) {
    const check = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.game && window.assetManager && window.assetManager.isReady && window.game.framesCount > 2)',
      returnByValue: true
    });
    if (check?.result?.value) {
      console.log('Game loop is actively rendering at step', i);
      break;
    }
    await new Promise(r => setTimeout(r, 250));
  }

  const res2 = await cdp.send('Runtime.evaluate', {
    expression: `({
      hasGame: !!window.game,
      state: window.game?.state,
      frames: window.game?.framesCount,
      amReady: window.assetManager?.isReady,
      masterPlate: !!window.game?.player?.rig?.masterPlates?.front,
      masterSrc: window.game?.player?.rig?.masterPlates?.front?.src?.slice(0, 80),
      masterComplete: window.game?.player?.rig?.masterPlates?.front?.complete,
      masterNaturalW: window.game?.player?.rig?.masterPlates?.front?.naturalWidth,
    })`,
    returnByValue: true
  });
  console.log('GAME STATE:', JSON.stringify(res2.result.value, null, 2));

  const fs = require('fs');
  const path = require('path');
  const artifactsDir = 'C:\\\\Users\\\\krato\\\\.gemini\\\\antigravity-ide\\\\brain\\\\08f833e8-339b-437f-89e5-b8e0c3f3273b';
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_title_verified_success.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_title_verified_success.png');

  cdp.close();
  proc.kill();
}

run().catch(console.error);
