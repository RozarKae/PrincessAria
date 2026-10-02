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
    const c = document.getElementById('game-canvas');
    if (!c) return null;
    return c.toDataURL('image/png');
  })()`;

  const evalRes = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (evalRes && evalRes.result && evalRes.result.value) {
    const base64 = evalRes.result.value.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(process.cwd(), filename);
    fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
    console.log(`[Director] Saved screenshot: ${outPath} (${base64.length} bytes)`);
    return outPath;
  }
  throw new Error('Failed to capture canvas screenshot');
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9339;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_dir_'));

  console.log(`[Director] Launching Chrome on port ${port}...`);
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
      'http://localhost:5173/', // Start on Title Screen!
    ],
    { stdio: 'ignore' }
  );

  await sleep(2500);

  let rawList;
  try {
    rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  } catch (err) {
    console.error('[Director] Failed to fetch targets:', err);
    chrome.kill();
    process.exit(1);
  }

  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  if (!page || !page.webSocketDebuggerUrl) {
    console.error('[Director] Page target not found');
    chrome.kill();
    process.exit(1);
  }

  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[Director] Connected to game page. Waiting for assets and game loop...');

  for (let attempt = 0; attempt < 40; attempt++) {
    const readyRes = await cdp.send('Runtime.evaluate', {
      expression: `Boolean(window.__game && window.assetManager && window.assetManager.isReady)`
    });
    if (readyRes?.result?.value) {
      console.log(`[Director] Game engine and assets ready after ${(attempt + 1) * 200}ms.`);
      break;
    }
    await sleep(200);
  }
  await sleep(800); // Allow render loop to produce full frames

  // 1. EVALUATE FIRST IMPRESSION: TITLE SCREEN
  console.log('[Director] Evaluating 1. Title Screen & First Impression...');
  await captureCanvas(cdp, 'director_1_title_screen.png');

  // Start Game: Press Enter / Start
  console.log('[Director] Pressing Enter to begin game...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g) {
        g.restartGame();
      }
    })()`,
  });
  await sleep(600);

  // 2. EVALUATE SPAWN & FIRST MOMENT (Sunstone Glade)
  console.log('[Director] Evaluating 2. Spawn Point & Opening View...');
  await captureCanvas(cdp, 'director_2_spawn_arrival.png');

  // 3. EVALUATE MOVEMENT FEEL: Walk, Jump, Dash, Attack
  console.log('[Director] Evaluating 3. Movement & Attack Feel...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.vx = 220; // moving right
        g.player.facing = 1;
        g.player.anim.play('RUN');
      }
    })()`,
  });
  await sleep(400);
  await captureCanvas(cdp, 'director_3_run_movement.png');

  // Jump and Stardust Attack in mid-air
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.y -= 140;
        g.player.vy = -350;
        g.player.isGrounded = false;
        g.player.attack();
      }
    })()`,
  });
  await sleep(150);
  await captureCanvas(cdp, 'director_3_aerial_attack.png');

  // 4. EVALUATE COMBAT & ENCOUNTER 1: Rope Bridge Pincer (x: 950)
  console.log('[Director] Evaluating 4. Encounter 1: Rope Bridge Pincer...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 940;
        g.player.y = 560;
        g.player.vx = 0;
        g.player.vy = 0;
        g.camera.x = 800;
      }
    })()`,
  });
  await sleep(600);
  await captureCanvas(cdp, 'director_4_encounter1_bridge.png');

  // 5. EVALUATE LANDMARK 1: The Sunstone Shrine Awakening (x: 2050)
  console.log('[Director] Evaluating 5. Section 1 Landmark: Sunstone Shrine Awakening...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 2050;
        g.player.y = 800;
        g.camera.x = 1850;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_5_landmark_sunstone_shrine.png');

  // 6. EVALUATE SECTION 2 TRANSITION & CHASM BRINK (x: 2440)
  console.log('[Director] Evaluating 6. Section 2 Transition & Chasm Brink...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 2440;
        g.player.y = 800;
        g.camera.x = 2250;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_6_chasm_brink_transition.png');

  // 7. EVALUATE HOLLOW REDWOOD LANDMARK (x: 3880)
  console.log('[Director] Evaluating 7. Section 2 Landmark: The Great Hollow Redwood...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 3880;
        g.player.y = 400;
        g.camera.x = 3600;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_7_hollow_redwood_landmark.png');

  // 8. EVALUATE SECRET ROYAL APIARY (x: 4460, y: 280)
  console.log('[Director] Evaluating 8. Section 2 Secret Structure: Royal Apiary...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 4460;
        g.player.y = 280;
        g.camera.x = 4250;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_8_royal_apiary_secret.png');

  // 9. EVALUATE SECTION 3 TRANSITION & COLONNADE VIADUCT (x: 5320)
  console.log('[Director] Evaluating 9. Section 3 Transition & Colonnade Viaduct...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 5320;
        g.player.y = 700;
        g.camera.x = 5100;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_9_section3_colonnade_entry.png');

  // 10. EVALUATE CRUMBLE BLOCKS & RUNESTONE ELEVATOR (x: 6220)
  console.log('[Director] Evaluating 10. Section 3 Crumble Blocks & Moving Runestones...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 6220;
        g.player.y = 520;
        g.camera.x = 6000;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_10_crumble_runestone_elevator.png');

  // 11. EVALUATE WATCHTOWER LANDMARK & SIEGE ENCOUNTER (x: 6950)
  console.log('[Director] Evaluating 11. Section 3 Landmark: Fortress Watchtower & Siege...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 6950;
        g.player.y = 660;
        g.camera.x = 6750;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_11_watchtower_siege.png');

  // 12. EVALUATE CITADEL GATEWAY & VICTORY (x: 7840)
  console.log('[Director] Evaluating 12. Grand Citadel Gateway & Batboy Rescue...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 7840;
        g.player.y = 680;
        g.camera.x = 7500;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'director_12_citadel_victory.png');

  console.log('[Director] All playthrough moments captured successfully.');
  cdp.close();
  chrome.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(err => {
  console.error('[Director] Error during playthrough:', err);
  process.exit(1);
});
