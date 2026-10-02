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
  const port = 9355;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_bug_check_'));

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1600,900',
      'http://localhost:5173/',
    ],
    { stdio: 'ignore' }
  );

  await new Promise(r => setTimeout(r, 2500));

  const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  const logs = [];
  cdp.ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push({ type: 'EXCEPTION', data: msg.params });
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push({ type: 'CONSOLE', args: msg.params.args });
    }
  };

  // Wait ready
  for (let i = 0; i < 30; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__game && window.assetManager && window.assetManager.isReady)'
    });
    if (res?.result?.value) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Call restartGame()
  const restartRes = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      try {
        const g = window.__game || window.game;
        g.restartGame();
        return { success: true, playerPos: { x: g.player.x, y: g.player.y }, state: g.state };
      } catch (e) {
        return { success: false, error: e.message, stack: e.stack };
      }
    })()`,
    returnByValue: true
  });
  console.log('RESTART GAME RESULT:', restartRes.result.value);

  // Check what methods Player has
  const playerMethods = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const proto = Object.getPrototypeOf(g.player);
      return Object.getOwnPropertyNames(proto);
    })()`,
    returnByValue: true
  });
  console.log('PLAYER PROTOTYPE METHODS:', playerMethods.result.value);

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
}

run().catch(console.error);
