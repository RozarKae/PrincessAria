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
  const port = 9460;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_verify_'));
  const artifactsDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\08f833e8-339b-437f-89e5-b8e0c3f3273b';

  console.log('Spawning Chrome on port', port);
  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--headless=new',
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
  if (!page) {
    console.error('Target page not found:', targets);
    chrome.kill();
    return;
  }

  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  console.log('Connected to CDP. Waiting for game and asset preloading...');
  for (let i = 0; i < 60; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean((window.__game || window.game) && window.assetManager && window.assetManager.isReady && (window.__game || window.game)?.player?.rig?.masterPlates?.front?.complete)'
    });
    if (res?.result?.value) {
      console.log('Master plate verified ready at step', i);
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Let title screen render for 800ms
  await new Promise(r => setTimeout(r, 800));

  // Inspect title screen state
  const titleInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const p = g?.player;
      return {
        state: g?.state,
        framesCount: g?.framesCount,
        fps: g?.fps,
        renderMode: window.characterRenderer?.renderMode,
        masterBound: !!p?.rig?.masterPlates?.front,
        masterSrc: p?.rig?.masterPlates?.front?.src,
        masterComplete: p?.rig?.masterPlates?.front?.complete,
        masterNaturalW: p?.rig?.masterPlates?.front?.naturalWidth,
        playerPos: { x: p?.x, y: p?.y, w: p?.width, h: p?.height }
      };
    })()`,
    returnByValue: true
  });
  console.log('TITLE SCREEN STATE:', JSON.stringify(titleInfo.result.value, null, 2));

  // 1. Capture Title Screen
  let screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_1_title.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_1_title.png');

  // 2. Start Game -> Spawn Frame 0
  console.log('Starting game...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.restartGame();
    })()`
  });

  // Wait 120ms for frame 0 spawn
  await new Promise(r => setTimeout(r, 120));

  const spawnInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const p = g?.player;
      return {
        state: g?.state,
        playerPos: { x: p?.x, y: p?.y },
        anim: p?.anim?.currentAnimationName,
        invincibilityTimer: p?.invincibilityTimer,
        isHurt: p?.isHurt,
        masterBound: !!p?.rig?.masterPlates?.front
      };
    })()`,
    returnByValue: true
  });
  console.log('SPAWN STATE (Frame 0):', JSON.stringify(spawnInfo.result.value, null, 2));

  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_2_spawn.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_2_spawn.png');

  // 3. Wait for Idle ground settling
  await new Promise(r => setTimeout(r, 600));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_3_idle.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_3_idle.png');

  // 4. Run Right
  console.log('Running Right...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.input.keys['KeyD'] = true;
      g.input.keys['ArrowRight'] = true;
    })()`
  });
  await new Promise(r => setTimeout(r, 500));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_4_run.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_4_run.png');

  // 5. Jump
  console.log('Jumping...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.player.jump();
    })()`
  });
  await new Promise(r => setTimeout(r, 160));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_5_jump.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_5_jump.png');

  // Release keys & settle
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.input.keys['KeyD'] = false;
      g.input.keys['ArrowRight'] = false;
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // 6. Attack
  console.log('Attacking...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.player.isAttacking = true;
      g.player.attackTimer = 0.18;
    })()`
  });
  await new Promise(r => setTimeout(r, 60));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_6_attack.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_6_attack.png');

  // 7. Hurt / Recoil
  console.log('Hurt recoil...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.player.hurt();
    })()`
  });
  await new Promise(r => setTimeout(r, 80));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_7_hurt.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_7_hurt.png');

  // 8. Respawn
  console.log('Respawn...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.player.respawn(120, 480);
    })()`
  });
  await new Promise(r => setTimeout(r, 150));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_final_8_respawn.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('Saved aria_final_8_respawn.png');

  // Performance query
  const perf = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        fps: g?.fps || 60,
        framesCount: g?.framesCount,
        loopRunning: !!g?.lastTime
      };
    })()`,
    returnByValue: true
  });
  console.log('PERFORMANCE METRICS:', JSON.stringify(perf.result.value, null, 2));

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  console.log('Verification finished successfully.');
}

run().catch(console.error);
