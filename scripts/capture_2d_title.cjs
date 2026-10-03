const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

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
  const port = 9672;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_2d_'));

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1920,1080',
      'http://localhost:5173/PrincessAria/?play=true&world=1',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  try {
    for (let i = 0; i < 30; i++) {
      try {
        const jsonStr = await httpGet(`http://127.0.0.1:${port}/json`);
        const pages = JSON.parse(jsonStr);
        const gamePage = pages.find(p => p.type === 'page' && (p.url.includes('localhost:5173') || p.url.includes('PrincessAria')));
        if (gamePage && gamePage.webSocketDebuggerUrl) {
          cdp = new CDPClient(gamePage.webSocketDebuggerUrl);
          await cdp.connect();
          break;
        }
      } catch (e) {
        await sleep(300);
      }
    }

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await sleep(2000);

    // Draw 2D TitleScreen onto an offscreen canvas and capture it
    const res = await cdp.send('Runtime.evaluate', {
      expression: `(async function() {
        const g = window.__game || window.game;
        const mod = await import('/PrincessAria/src/ui/TitleScreen.js');
        const ts = new mod.TitleScreen();
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 1920;
        offCanvas.height = 1080;
        const ctx = offCanvas.getContext('2d');
        ts.draw(ctx, g.player);
        return offCanvas.toDataURL('image/png');
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });

    if (res?.result?.value) {
      const base64 = res.result.value.replace(/^data:image\/png;base64,/, '');
      const brainDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\2f7d6b6a-8e5c-440e-bce8-d4acde9f1365';
      const outPath = path.join(brainDir, 'controller_05_royal_controls_guide_box.png');
      fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
      console.log(`Saved screenshot: ${outPath} (${base64.length} bytes)`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

run();
