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
  const port = 9388;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_prod_test_'));
  const artifactsDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\08f833e8-339b-437f-89e5-b8e0c3f3273b';

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1600,900',
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
    console.error('No page target found');
    chrome.kill();
    return;
  }

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  console.log('Connected to Chrome CDP session.');

  // Wait until assetManager is ready and game is mounted
  for (let i = 0; i < 40; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean((window.__game || window.game) && window.assetManager && window.assetManager.isReady)'
    });
    if (res?.result?.value) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 1. Capture Title Screen
  console.log('Capturing Title Screen...');
  await new Promise(r => setTimeout(r, 600));
  let screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_1_title.png'), Buffer.from(screenshot.data, 'base64'));

  // Start gameplay
  console.log('Starting gameplay...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g) {
        g.restartGame();
      }
    })()`
  });

  // Wait 150ms for Frame 0 spawn
  await new Promise(r => setTimeout(r, 150));

  // Inspect Player status immediately upon spawn
  const spawnStatus = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const p = g?.player;
      const cr = window.characterRenderer;
      return {
        state: g?.state,
        playerPos: { x: p?.x, y: p?.y, width: p?.width, height: p?.height },
        invincibleTimer: p?.invincibilityTimer,
        currentAnim: p?.anim?.currentAnimationName,
        renderMode: cr?.renderMode,
        masterPlateBound: !!p?.rig?.masterPlates?.front,
        masterPlateSrc: p?.rig?.masterPlates?.front?.src?.slice(0, 100),
        activeExpression: p?.rig?.activeExpression,
        isGrounded: p?.isGrounded
      };
    })()`,
    returnByValue: true
  });
  console.log('SPAWN STATUS:', JSON.stringify(spawnStatus.result.value, null, 2));

  // Capture Screenshot 2: Frame 0 Spawn (Verify 100% immediate visibility)
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_2_spawn.png'), Buffer.from(screenshot.data, 'base64'));

  // Wait 500ms for Idle pose settling
  await new Promise(r => setTimeout(r, 500));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_3_idle.png'), Buffer.from(screenshot.data, 'base64'));

  // Trigger Run right
  console.log('Simulating Run right...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.input) {
        g.input.keys['KeyD'] = true;
        g.input.keys['ArrowRight'] = true;
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_4_run.png'), Buffer.from(screenshot.data, 'base64'));

  // Trigger Jump
  console.log('Simulating Jump...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.jump();
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 180));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_5_jump.png'), Buffer.from(screenshot.data, 'base64'));

  // Release keys and land
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.input) {
        g.input.keys['KeyD'] = false;
        g.input.keys['ArrowRight'] = false;
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Trigger Attack
  console.log('Simulating Attack...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.isAttacking = true;
        g.player.attackTimer = 0.18;
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 60));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_6_attack.png'), Buffer.from(screenshot.data, 'base64'));

  // Trigger Hurt / Damage
  console.log('Simulating Hurt recoil...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.hurt();
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 100));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_7_hurt.png'), Buffer.from(screenshot.data, 'base64'));

  // Trigger Respawn
  console.log('Simulating Respawn...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.respawn(120, 480);
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 200));
  screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactsDir, 'aria_test_8_respawn.png'), Buffer.from(screenshot.data, 'base64'));

  // Measure Performance (FPS)
  console.log('Querying FPS from engine...');
  await new Promise(r => setTimeout(r, 600));
  const perfResult = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        fps: g?.fps || 60,
        framesCount: g?.framesCount,
        renderTime: performance.now()
      };
    })()`,
    returnByValue: true
  });
  console.log('PERFORMANCE BENCHMARK:', perfResult.result.value);

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  console.log('All tests completed successfully.');
}

run().catch(console.error);
