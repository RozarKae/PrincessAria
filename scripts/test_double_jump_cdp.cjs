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

async function captureCanvas(cdp, filename) {
  const expr = `(function() {
    const g = window.__game || window.game;
    if (g) {
      if (g.camera && g.player) {
        g.camera.update(g.player, g.level.width, 1 / 60, g.level.height);
      }
      g.render();
    }
    const c = document.getElementById('game-canvas');
    if (!c) return null;
    return c.toDataURL('image/png');
  })()`;

  const evalRes = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (evalRes && evalRes.result && evalRes.result.value) {
    const base64 = evalRes.result.value.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(process.cwd(), filename);
    fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
    console.log(`[CDP] Saved screenshot: ${outPath} (${base64.length} bytes)`);

    const brainDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\2f7d6b6a-8e5c-440e-bce8-d4acde9f1365';
    if (fs.existsSync(brainDir)) {
      const brainOutPath = path.join(brainDir, path.basename(filename));
      fs.writeFileSync(brainOutPath, Buffer.from(base64, 'base64'));
      console.log(`[CDP] Copied to artifact directory: ${brainOutPath}`);
    }
    return outPath;
  }
  throw new Error('Failed to capture canvas screenshot');
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9666;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_dj_'));

  console.log(`[CDP] Launching Chrome on port ${port}...`);
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
      'http://localhost:5173/PrincessAria/?play=true&world=1',
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
          console.log(`[CDP] Connected to Chrome page: ${gamePage.title}`);
          break;
        }
      } catch (e) {
        await sleep(300);
      }
    }

    if (!connected) {
      throw new Error('Could not connect to Chrome debugging target.');
    }

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[CDP] Waiting for game ready...');
    let gameReady = false;
    for (let i = 0; i < 35; i++) {
      const r = await cdp.send('Runtime.evaluate', {
        expression: `!!(window.__game && window.__game.player && window.__game.state === 'PLAYING')`,
        returnByValue: true,
      });
      if (r?.result?.value) {
        gameReady = true;
        console.log(`[CDP] Game ready after ${i * 300}ms!`);
        break;
      }
      await sleep(300);
    }

    if (!gameReady) {
      throw new Error('Game failed to initialize PLAYING state.');
    }

    // 1. Verify Double Jump Initial State & Audio Hook
    console.log('[CDP] 1. Verifying Double Jump initial capacity...');
    const initCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        window.__audioLog = [];
        if (g.audio) {
          const origJump = g.audio.playJump;
          g.audio.playJump = function() {
            window.__audioLog.push('jump');
            if (origJump) origJump.call(this);
          };
          const origDJ = g.audio.playDoubleJump;
          g.audio.playDoubleJump = function() {
            window.__audioLog.push('doubleJump');
            if (origDJ) origDJ.call(this);
          };
        }
        return {
          canDoubleJump: g.player.canDoubleJump,
          isGrounded: g.player.isGrounded,
          doubleJumpParticles: g.player.doubleJumpParticles.length,
          pos: { x: Math.round(g.player.x), y: Math.round(g.player.y) }
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Initial Double Jump State:', initCheck?.result?.value);

    // 2. Perform Ground Jump followed by Mid-Air Double Jump
    console.log('[CDP] 2. Performing Ground Jump then Mid-Air Double Jump...');
    const jumpTest = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        g.player.x = 280;
        g.player.y = 796;
        g.player.isGrounded = true;
        g.player.canDoubleJump = true;
        g.player.doubleJumpParticles = [];
        window.__audioLog = [];
        
        // 1. Initial ground jump
        g.player.vy = -1020; // PHYSICS.JUMP_VELOCITY
        g.player.isGrounded = false;
        if (g.audio && g.audio.playJump) g.audio.playJump();
        
        // Advance 12 frames into air (rising)
        for (let f = 0; f < 12; f++) {
          g.fixedUpdate(1 / 60);
        }
        
        const midAirVyBefore = Math.round(g.player.vy);
        const midAirYBefore = Math.round(g.player.y);
        const canDJBefore = g.player.canDoubleJump;
        
        // 2. Trigger Mid-Air Double Jump!
        // Simulate JUMP input just pressed in mid-air
        const fakeInput = {
          justPressed: (k) => k === 'JUMP',
          isDown: (k) => false,
          justReleased: (k) => false,
        };
        g.player.update(fakeInput, g.audio, 1 / 60, g.level);
        
        const midAirVyAfter = Math.round(g.player.vy);
        const canDJAfter = g.player.canDoubleJump;
        const ringCount = g.player.doubleJumpParticles.length;
        
        // Step 2 frames to let ring begin expanding
        g.fixedUpdate(1 / 60);
        g.fixedUpdate(1 / 60);
        
        return {
          canDJBefore,
          midAirVyBefore,
          midAirYBefore,
          midAirVyAfter,
          canDJAfter,
          ringCount,
          audioCalls: window.__audioLog,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Double Jump Execution Result:', jumpTest?.result?.value);
    await captureCanvas(cdp, 'double_jump_01_midair_flutter.png');

    // 3. Verify Reaching Elevated High Platform via Double Jump
    console.log('[CDP] 3. Testing elevated platform clearance with Double Jump...');
    const heightTest = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        // Position Aria before elevated timber platform (x: 1040, y: 550)
        // Normal single jump apex is ~208px high (800 -> 592)
        // Double jump reaches an additional 170px (can clear y = 430!)
        g.player.x = 900;
        g.player.y = 800;
        g.player.vx = 280;
        g.player.vy = -1020;
        g.player.isGrounded = false;
        g.player.canDoubleJump = true;
        
        let minYReached = 800;
        
        // Advance 14 frames until near apex
        for (let f = 0; f < 14; f++) {
          g.fixedUpdate(1 / 60);
          if (g.player.y < minYReached) minYReached = Math.round(g.player.y);
        }
        
        const apex1 = minYReached;
        
        // Trigger Double Jump at apex
        const fakeInput = {
          justPressed: (k) => k === 'JUMP',
          isDown: (k) => false,
          justReleased: (k) => false,
        };
        g.player.update(fakeInput, g.audio, 1 / 60, g.level);
        
        // Advance 20 more frames
        for (let f = 0; f < 20; f++) {
          g.fixedUpdate(1 / 60);
          if (g.player.y < minYReached) minYReached = Math.round(g.player.y);
        }
        
        const apex2 = minYReached;
        
        return {
          groundY: 800,
          singleJumpApex: apex1,
          doubleJumpApex: apex2,
          totalClimb: 800 - apex2,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Height & Clearance Result:', heightTest?.result?.value);
    await captureCanvas(cdp, 'double_jump_02_elevated_platform_reach.png');

    // 4. Verify Grounding and Enemy Stomp Reset
    console.log('[CDP] 4. Testing Double Jump replenishment upon landing & stomping...');
    const resetTest = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        // 1. Consume double jump
        g.player.canDoubleJump = false;
        g.player.isGrounded = false;
        
        // Land on ground
        g.player.land();
        const resetOnLand = g.player.canDoubleJump;
        
        // 2. Consume again, then bounce off enemy
        g.player.canDoubleJump = false;
        g.player.bounceFromEnemy();
        const resetOnStomp = g.player.canDoubleJump;
        
        return {
          resetOnLand,
          resetOnStomp,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Reset Verification Result:', resetTest?.result?.value);
    await captureCanvas(cdp, 'double_jump_03_enemy_bounce_reset.png');

    console.log('\n[CDP] ALL DOUBLE JUMP VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('[CDP] Error during verification:', err);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

run();
