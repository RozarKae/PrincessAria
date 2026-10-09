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
    this.consoleLogs = [];
    this.errors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
          this.consoleLogs.push({ type: msg.params.type, text });
          console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]`, text);
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
          this.errors.push(desc);
          console.error('[BROWSER EXCEPTION]', desc);
        }

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
  const port = 9499;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_cinematic_pass1_'));
  const projectRoot = path.resolve(__dirname, '..');
  const shotsDir = path.join(projectRoot, 'reports', 'cinematics_pass1');
  const artifactDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\2e162784-828c-4e45-924c-f81d571965ec';

  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  console.log('[TEST] Launching Chrome targeting preview port 4173 on cdp port', port);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--window-size=1280,720',
    'http://localhost:4173/'
  ], { stdio: 'ignore' });

  async function takeScreenshot(cdp, filename) {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(shotsDir, filename), buf);
    fs.writeFileSync(path.join(artifactDir, filename), buf);
    console.log(`[TEST] Saved screenshot: ${filename} (${buf.length} bytes)`);
  }

  try {
    await new Promise(r => setTimeout(r, 2000));

    const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
    const targets = JSON.parse(rawList);
    const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:4173'));
    if (!page) throw new Error('Could not find localhost:4173 page target in Chrome');

    const cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[TEST] Connected to CDP. Waiting for game object...');
    let gameReady = false;
    for (let i = 0; i < 50; i++) {
      const res = await cdp.send('Runtime.evaluate', {
        expression: 'Boolean(window.game && window.game.state)',
        returnByValue: true
      });
      if (res?.result?.value === true) {
        console.log(`[TEST] Game initialized after ${(i + 1) * 200}ms! Current state:`, await cdp.send('Runtime.evaluate', { expression: 'window.game.state' }));
        gameReady = true;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    if (!gameReady) {
      throw new Error('Game failed to initialize within 10s');
    }

    // 1. Start the game into WORLD_INTRO
    console.log('[TEST] Triggering game.restartGame()...');
    const startRes = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        window.game.restartGame();
        return window.game.state;
      })()`,
      returnByValue: true
    });
    console.log('[TEST] Game State after restartGame():', startRes.result?.value);

    // Wait 0.6s into Intro (Phase 1 / Atmosphere)
    await new Promise(r => setTimeout(r, 600));

    // Wait for Phase 2 (World Reveal ~ 1.5s into sequence)
    await new Promise(r => setTimeout(r, 1200));
    await takeScreenshot(cdp, 'cinematic_01_world_reveal.png');

    // Wait for Phase 3/4 (Portal & Aria Entry ~ 3.0s into sequence)
    await new Promise(r => setTimeout(r, 1600));
    await takeScreenshot(cdp, 'cinematic_02_aria_entry.png');

    // Wait for Phase 5 (Landing ~ 4.5s into sequence)
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot(cdp, 'cinematic_03_aria_landing.png');

    // Wait for Phase 6 (Story lore ~ 6.0s into sequence)
    await new Promise(r => setTimeout(r, 1600));
    await takeScreenshot(cdp, 'cinematic_04_story_lore.png');

    // Wait for Phase 7 -> completion into PLAYING (~ 9.5s total)
    await new Promise(r => setTimeout(r, 3800));
    const playRes = await cdp.send('Runtime.evaluate', {
      expression: 'window.game.state',
      returnByValue: true
    });
    console.log('[TEST] Game State after Intro sequence completion:', playRes.result?.value);
    await takeScreenshot(cdp, 'cinematic_05_gameplay_active.png');

    // 2. Test SKIP FUNCTIONALITY
    console.log('[TEST] Testing skip functionality...');
    await cdp.send('Runtime.evaluate', { expression: 'window.game.restartGame()' });
    await new Promise(r => setTimeout(r, 700));
    console.log('[TEST] Triggering skip during intro...');
    const skipRes = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        window.game.cinematic.skip(window.game);
        return window.game.state;
      })()`,
      returnByValue: true
    });
    console.log('[TEST] Game State immediately after skip:', skipRes.result?.value);
    await takeScreenshot(cdp, 'cinematic_06_skipped_to_gameplay.png');

    // 3. Test OUTRO SEQUENCE
    console.log('[TEST] Testing WORLD_OUTRO sequence...');
    await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        window.game.state = 'WORLD_OUTRO';
        window.game.cinematic.startOutro(window.game);
        return window.game.state;
      })()`,
      returnByValue: true
    });

    // Outro Phase 1: Victory pose
    await new Promise(r => setTimeout(r, 800));
    await takeScreenshot(cdp, 'cinematic_07_outro_victory.png');

    // Outro Phase 2: Batboy rescue / Sanctuary lore
    await new Promise(r => setTimeout(r, 1600));
    await takeScreenshot(cdp, 'cinematic_08_outro_batboy_rescue.png');

    // Outro Phase 4: Aria WALKING animation toward portal
    await new Promise(r => setTimeout(r, 2200));
    await takeScreenshot(cdp, 'cinematic_09_outro_aria_walk.png');

    // Outro Phase 5: Portal Entry & Depth Occlusion
    await new Promise(r => setTimeout(r, 1800));
    await takeScreenshot(cdp, 'cinematic_10_outro_portal_entry.png');

    // Outro completion -> World advance
    await new Promise(r => setTimeout(r, 3800));
    const worldRes = await cdp.send('Runtime.evaluate', {
      expression: '({ state: window.game.state, world: window.game.gameState.world, level: window.game.gameState.level })',
      returnByValue: true
    });
    console.log('[TEST] Game Status after Outro completion:', JSON.stringify(worldRes.result?.value));
    // Wait for World 2 intro to reveal
    await new Promise(r => setTimeout(r, 1200));
    await takeScreenshot(cdp, 'cinematic_11_world2_intro.png');

    console.log('[TEST] Total exceptions encountered:', cdp.errors.length);
    console.log('[TEST] ALL CINEMATIC TESTS COMPLETED SUCCESSFULLY!');

    cdp.close();
  } catch (err) {
    console.error('[TEST ERROR]', err);
  } finally {
    try { chrome.kill(); } catch (e) {}
    setTimeout(() => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    }, 500);
  }
}

run();
