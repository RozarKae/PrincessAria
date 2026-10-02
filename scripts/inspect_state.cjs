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
  const port = 9340;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_diag_'));

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
  console.log('Connected to CDP.');

  const consoleLogs = [];
  const exceptions = [];

  cdp.ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && cdp.pending.has(msg.id)) {
      const { resolve, reject } = cdp.pending.get(msg.id);
      cdp.pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({ type: msg.params.type, args: msg.params.args.map(a => a.value || a.description) });
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails);
    }
  };

  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.reload');

  console.log('Reloaded page, waiting 3s for startup...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('CAPTURED EXCEPTIONS:', JSON.stringify(exceptions, null, 2));
  console.log('CAPTURED CONSOLE LOGS:', JSON.stringify(consoleLogs, null, 2));

  const evalRes = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      try {
        const g = window.game;
        const am = window.assetManager;
        if (!am) return { error: 'window.assetManager is undefined' };
        const keys = Array.from(am.images.keys()).slice(0, 30);
        const ariaIdleFrames = am.getFrameSequence('aria', 'idle', 8);
        const p = g ? g.player : null;
        const clip = p && p.anim ? p.anim.currentClip : null;
        const frameDesc = p && p.anim ? p.anim.getCurrentFrame() : null;

        const canvas = document.getElementById('game-canvas');

        return {
          hasGame: !!g,
          gameState: g ? g.state : null,
          assetCount: am.images.size,
          assetKeysSample: keys,
          ariaIdleFramesFound: ariaIdleFrames.length,
          clipName: clip ? clip.name : null,
          clipFrames: clip ? clip.frames.length : null,
          frameDesc: frameDesc ? {
            type: frameDesc.type,
            hasFrameData: !!frameDesc.frameData,
            scaleX: frameDesc.scaleX,
            scaleY: frameDesc.scaleY,
          } : null,
          canvasWidth: canvas ? canvas.width : null,
          canvasHeight: canvas ? canvas.height : null,
        };
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    })()`,
    returnByValue: true
  });

  console.log('DIAGNOSTIC evalRes:', JSON.stringify(evalRes, null, 2));

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
}

run().catch(console.error);
