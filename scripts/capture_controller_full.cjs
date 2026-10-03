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

async function captureFullPage(cdp, filename) {
  const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const brainDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\2f7d6b6a-8e5c-440e-bce8-d4acde9f1365';
  const outPath = path.join(brainDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`[CDP] Saved full page screenshot: ${outPath} (${buffer.length} bytes)`);
  return outPath;
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9670;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_full_'));

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1280,720',
      'http://localhost:5173/PrincessAria/?world=1&play=true',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        const jsonStr = await httpGet(`http://127.0.0.1:${port}/json`);
        const pages = JSON.parse(jsonStr);
        const gamePage = pages.find(p => p.type === 'page' && (p.url.includes('localhost:5173') || p.url.includes('PrincessAria')));
        if (gamePage && gamePage.webSocketDebuggerUrl) {
          cdp = new CDPClient(gamePage.webSocketDebuggerUrl);
          await cdp.connect();
          connected = true;
          break;
        }
      } catch (e) {
        await sleep(300);
      }
    }

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await sleep(2000);

    // 1. Show Controller Toast in gameplay
    await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const pad = {
          index: 0,
          id: "Xbox Wireless Controller",
          connected: true,
          mapping: "standard",
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
          axes: [0, 0, 0, 0],
        };
        g.input.gamepad.registerGamepad(pad, true);
      })()`,
    });
    await sleep(400);
    await captureFullPage(cdp, 'controller_toast_gameplay.png');

    // 2. Capture Title Screen with controller prompt
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/PrincessAria/' });
    await sleep(2500);

    // Skip cinematic montage to living loop
    await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        if (g && g.titleScreen) {
          g.titleScreen.skipToLivingMenu();
        }
      })()`,
    });
    await sleep(600);
    await captureFullPage(cdp, 'controller_title_screen_menu.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

run();
