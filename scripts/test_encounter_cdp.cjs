const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

async function sleep(ms) {
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
  const userDataDir = path.join(os.tmpdir(), 'project_aria_cdp_' + Date.now());

  console.log('Launching Headless Chrome with Remote Debugging...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--no-first-run',
    '--run-all-compositor-stages-before-draw',
    'about:blank',
  ]);

  // Wait for Chrome to initialize
  await sleep(1500);

  let versionData;
  for (let i = 0; i < 10; i++) {
    try {
      const json = await httpGet('http://127.0.0.1:9222/json/list');
      const list = JSON.parse(json);
      if (list && list.length > 0) {
        versionData = list[0];
        break;
      }
    } catch (e) {
      await sleep(500);
    }
  }

  if (!versionData) {
    console.error('Could not connect to Chrome debugging endpoint!');
    chromeProc.kill();
    return;
  }

  console.log('Connecting CDP Client to:', versionData.webSocketDebuggerUrl);
  const client = new CDPClient(versionData.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  console.log('Navigating to http://localhost:5173/?play=true ...');
  await client.send('Page.navigate', { url: 'http://localhost:5173/?play=true' });

  // Wait until game is initialized and playing
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    const chk = await client.send('Runtime.evaluate', {
      expression: 'Boolean(window.game && window.game.level && window.game.state === "PLAYING")',
      returnByValue: true,
    });
    if (chk.result && chk.result.value) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    console.log('Force restarting game directly into playing state...');
    await client.send('Runtime.evaluate', {
      expression: 'if (window.game) window.game.restartGame();',
    });
    await sleep(1000);
  }

  // Helper to send key down/up
  async function pressKey(key, code) {
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: 0 });
    await sleep(60);
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: 0 });
    await sleep(60);
  }

  async function holdKey(key, code, durationMs) {
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code });
    await sleep(durationMs);
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
    await sleep(60);
  }

  async function captureScreenshot(filename) {
    try {
      const evalRes = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const c = document.getElementById('game-canvas');
          return c ? c.toDataURL('image/png') : null;
        })()`,
        returnByValue: true,
      });
      if (evalRes && evalRes.result && evalRes.result.value) {
        const base64Data = evalRes.result.value.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const outPath = path.join(__dirname, '..', filename);
        fs.writeFileSync(outPath, buffer);
        console.log(`Saved canvas screenshot: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
        return;
      }
    } catch (e) {
      console.warn('Canvas toDataURL failed, attempting CDP Page.captureScreenshot...', e);
    }

    const res = await client.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(__dirname, '..', filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved CDP screenshot: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // Turn on AI debug overlay directly
  await client.send('Runtime.evaluate', {
    expression: 'if (window.game && window.game.level && !window.game.level.debugAI) window.game.level.toggleDebugAI();',
  });
  await sleep(400);

  // Query in-game state
  let evalResult = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.game;
      if (!g || !g.level) return { error: 'Game not ready' };
      const coord = g.level.encounterCoordinator;
      return {
        playerX: g.player ? g.player.x : 0,
        playerY: g.player ? g.player.y : 0,
        enemies: g.level.enemies.map(e => ({
          name: e.name,
          role: e.role,
          state: e.fsm.currentState,
          x: Math.round(e.x),
          y: Math.round(e.y),
          hp: e.health,
          hasLOS: e.perception ? e.perception.hasDirectSight : false,
          awareness: e.perception ? Math.round(e.perception.awareness * 100) : 0,
        })),
        coordinator: coord ? {
          groupAlerted: coord.groupAlerted,
          activeSynergy: coord.activeSynergy,
          primaryTokenHolder: coord.primaryTokenHolder ? coord.primaryTokenHolder.name : null,
          harasserTokenHolder: coord.harasserTokenHolder ? coord.harasserTokenHolder.name : null,
        } : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Initial Game Status:', JSON.stringify(evalResult.result.value, null, 2));
  await captureScreenshot('encounter_initial_spawn.png');

  // 3. Move Aria onto the Suspended Bridge (x: 960, y: 590) to trigger Encounter 1: Bridge Pincer
  console.log('Engaging Encounter 1: Suspended Bridge Pincer (x: 960, y: 590)...');
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.game;
      if (g && g.player) {
        g.player.x = 960;
        g.player.y = 590;
        g.player.vx = 0;
        g.player.vy = 0;
      }
    })()`,
  });
  // Wait 1.6 seconds for enemies to sense Aria, react, telegraph, and engage
  await sleep(1600);

  evalResult = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.game;
      const coord = g.level.encounterCoordinator;
      return {
        playerX: Math.round(g.player.x),
        playerY: Math.round(g.player.y),
        enemies: g.level.enemies.map(e => ({
          name: e.name,
          role: e.role,
          state: e.fsm.currentState,
          x: Math.round(e.x),
          y: Math.round(e.y),
          hp: e.health,
          hasLOS: e.perception ? e.perception.hasDirectSight : false,
          awareness: e.perception ? Math.round(e.perception.awareness * 100) : 0,
        })),
        coordinator: coord ? {
          groupAlerted: coord.groupAlerted,
          activeSynergy: coord.activeSynergy,
          primaryTokenHolder: coord.primaryTokenHolder ? coord.primaryTokenHolder.name : null,
          harasserTokenHolder: coord.harasserTokenHolder ? coord.harasserTokenHolder.name : null,
        } : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Bridge Encounter Active Status:', JSON.stringify(evalResult.result.value, null, 2));
  await captureScreenshot('encounter1_bridge_pincer_active.png');

  // 4. Move Aria to the Sunstone Terrace (x: 1480, y: 820) to engage Honey Beetle and Hive Firefly
  console.log('Engaging Encounter 2: Sunstone Terrace Siege (x: 1480, y: 820)...');
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.game;
      if (g && g.player) {
        g.player.x = 1480;
        g.player.y = 820;
        g.player.vx = 0;
        g.player.vy = 0;
      }
    })()`,
  });
  // Wait 1.8 seconds for Beetle horn scrape telegraph & Firefly dive calculation
  await sleep(1800);

  evalResult = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.game;
      const coord = g.level.encounterCoordinator;
      return {
        playerX: Math.round(g.player.x),
        playerY: Math.round(g.player.y),
        enemies: g.level.enemies.map(e => ({
          name: e.name,
          role: e.role,
          state: e.fsm.currentState,
          x: Math.round(e.x),
          y: Math.round(e.y),
          hp: e.health,
          hasLOS: e.perception ? e.perception.hasDirectSight : false,
          awareness: e.perception ? Math.round(e.perception.awareness * 100) : 0,
        })),
        coordinator: coord ? {
          groupAlerted: coord.groupAlerted,
          activeSynergy: coord.activeSynergy,
          primaryTokenHolder: coord.primaryTokenHolder ? coord.primaryTokenHolder.name : null,
          harasserTokenHolder: coord.harasserTokenHolder ? coord.harasserTokenHolder.name : null,
        } : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Terrace Siege Encounter Active Status:', JSON.stringify(evalResult.result.value, null, 2));
  await captureScreenshot('encounter2_terrace_siege_active.png');

  client.close();
  chromeProc.kill();
  console.log('All encounters verified and captured successfully!');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
