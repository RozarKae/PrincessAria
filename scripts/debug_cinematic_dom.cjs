const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

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

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9466;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debug_dom_'));
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1600,900',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  try {
    await new Promise(r => setTimeout(r, 2000));
    const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
    const targets = JSON.parse(rawList);
    const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
    const cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Connected to CDP. Waiting for game loop initialization...');
    for (let i = 0; i < 50; i++) {
      const res = await cdp.send('Runtime.evaluate', {
        expression: 'Boolean(window.__game && window.__game.titleScreen && window.__game.titleScreen.isActive)'
      });
      if (res?.result?.value) {
        console.log(`Initialized after ${(i + 1) * 200}ms!`);
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    const domCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const root = document.getElementById('cinematic-title-root');
        const imgA = document.getElementById('cinematic-img-a');
        const imgB = document.getElementById('cinematic-img-b');

        function getInfo(el) {
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            id: el.id,
            rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
            opacity: cs.opacity,
            zIndex: cs.zIndex,
            backgroundImage: cs.backgroundImage,
            backgroundSize: cs.backgroundSize,
            backgroundColor: cs.backgroundColor,
            transform: cs.transform,
            display: cs.display,
            visibility: cs.visibility
          };
        }

        const children = Array.from(root?.children || []).map(c => ({
          tag: c.tagName,
          id: c.id,
          zIndex: window.getComputedStyle(c).zIndex,
          opacity: window.getComputedStyle(c).opacity,
          bg: window.getComputedStyle(c).backgroundColor,
          bgImg: window.getComputedStyle(c).backgroundImage?.slice(0, 50),
          rect: c.getBoundingClientRect()
        }));

        return {
          root: getInfo(root),
          imgA: getInfo(imgA),
          imgB: getInfo(imgB),
          children: children,
          activeImg: window.__game?.titleScreen?.activeImg,
          currentShotIndex: window.__game?.titleScreen?.currentShotIndex,
          isPlayingCinematic: window.__game?.titleScreen?.isPlayingCinematic,
        };
      })()`,
      returnByValue: true
    });

    console.log('DOM RESULT:', JSON.stringify(domCheck.result.value, null, 2));
    cdp.close();
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

run().catch(console.error);
