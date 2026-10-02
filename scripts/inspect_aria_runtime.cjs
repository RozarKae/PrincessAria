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
  const port = 9348;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_rig_check_'));

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
  if (!pageTarget) {
    console.error('No localhost:5173 target found:', targets);
    chrome.kill();
    return;
  }
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

  const readyCheck = await cdp.send('Runtime.evaluate', {
    expression: `({
      hasGame: !!window.game,
      hasUnderGame: !!window.__game,
      hasAm: !!window.assetManager,
      amReady: window.assetManager?.isReady,
      url: window.location.href
    })`,
    returnByValue: true
  });
  console.log('Ready check:', readyCheck.result.value);

  // Inspect assetManager and player
  const result = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const am = window.assetManager;
      const game = window.game;
      const player = game?.player;
      const cr = window.characterRenderer;

      const rigNodes = [];
      if (player && player.rig) {
        player.rig.nodes.forEach((node, key) => {
          rigNodes.push({
            name: key,
            hasImage: !!node.image,
            imageSrc: node.image?.src || null,
            w: node.width,
            h: node.height,
            visible: node.visible,
            worldX: node.worldX,
            worldY: node.worldY,
            zIndex: node.zIndex
          });
        });
      }

      const allCachedKeys = am ? Array.from(am.images.keys()) : [];

      return {
        assetCount: am?.images?.size,
        ariaKeys: allCachedKeys.filter(k => k.includes('aria')),
        renderMode: cr?.renderMode,
        hasPlayer: !!player,
        rigNodeCount: rigNodes.length,
        boundLayersCount: rigNodes.filter(n => n.hasImage).length,
        boundLayers: rigNodes.filter(n => n.hasImage).map(n => ({ name: n.name, w: n.w, h: n.h })),
        unboundLayers: rigNodes.filter(n => !n.hasImage).map(n => n.name)
      };
    })()`,
    returnByValue: true
  });

  console.log('Inspection result:', JSON.stringify(result.result.value, null, 2));

  cdp.close();
  chrome.kill();
}

run().catch(console.error);
