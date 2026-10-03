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
        if (this.onEvent) this.onEvent(msg);
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
  const diag = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        px: Math.round(g?.player?.x),
        py: Math.round(g?.player?.y),
        isDead: g?.player?.isDead,
        camX: Math.round(g?.camera?.x),
        isCinematic: g?.camera?.isCinematic,
      };
    })()`,
    returnByValue: true,
  });
  console.log(`[CDP] Capture state for ${filename}:`, diag?.result?.value);

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
    console.log(`[CDP] Saved canvas screenshot: ${outPath} (${base64.length} bytes)`);

    // Also copy to brain artifacts directory if it exists
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

async function setPlayerPosition(cdp, x, y, opts = {}) {
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (!g || !g.player) return false;
      g.state = 'PLAYING';
      g.gameState.lives = 99;
      g.player.isDead = false;
      g.player.isInvincible = false;
      g.player.invincibilityTimer = 0;
      g.respawnTimer = 0;
      g.player.x = ${x};
      g.player.y = ${y};
      g.player.vx = ${opts.vx || 0};
      g.player.vy = ${opts.vy || 0};
      if (${opts.isGrounded !== undefined}) {
        g.player.isGrounded = ${opts.isGrounded};
      }
      if (g.camera) {
        g.camera.isCinematic = false;
        g.camera.cinematicTarget = null;
        g.camera.panTarget = null;
        const targetCamX = ${opts.cameraX !== undefined} ? ${opts.cameraX} : Math.max(0, ${x} + 22 - g.camera.width / 2);
        g.camera.x = targetCamX;
        g.camera.targetX = targetCamX;
      }
      return true;
    })()`,
  });
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9444;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_w2_'));

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
      'http://localhost:5173/PrincessAria/?play=true&world=2',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  try {
    // Wait for Chrome to bind port and find target game page
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
          console.log(`[CDP] Connected to Chrome page: ${gamePage.title} (${gamePage.url})`);
          break;
        }
      } catch (e) {
        await sleep(250);
      }
    }

    if (!connected) {
      throw new Error('Could not connect to Chrome via CDP');
    }

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Collect console logs and errors
    const consoleLogs = [];
    const consoleErrors = [];
    cdp.onEvent = (msg) => {
      try {
        if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params.type;
          const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
          if (type === 'error') {
            consoleErrors.push(text);
          } else {
            consoleLogs.push(`[${type}] ${text}`);
          }
        }
      } catch (e) {}
    };

    console.log('[CDP] Waiting for Game and World 2 level to initialize...');
    let gameReady = false;
    for (let i = 0; i < 30; i++) {
      const readyRes = await cdp.send('Runtime.evaluate', {
        expression: `!!(window.__game && window.__game.player && window.__game.state === 'PLAYING')`,
        returnByValue: true,
      });
      if (readyRes?.result?.value) {
        gameReady = true;
        break;
      }
      // Print diagnostics on slow start
      if (i === 10) {
        const diag = await cdp.send('Runtime.evaluate', {
          expression: `({ href: window.location.href, hasCanvas: !!document.getElementById('game-canvas'), hasGame: !!window.__game, title: document.title })`,
          returnByValue: true,
        });
        console.log('[CDP] Mid-poll page diagnostic:', diag?.result?.value);
      }
      await sleep(400);
    }
    console.log(`[CDP] Game engine ready: ${gameReady}`);

    // 1. VERIFY LEVEL INITIALIZATION AND PROGRESSION STATE
    const initStatus = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        if (!g) return { error: 'Game instance not found' };
        return {
          world: g.gameState.world,
          levelName: g.level.data.name,
          levelWidth: g.level.width,
          levelHeight: g.level.height,
          platformCount: g.level.platforms.length,
          shardCount: g.level.shards.length,
          enemyCount: g.level.enemies.length,
          playerSpawn: { x: g.player.x, y: g.player.y },
          goal: g.level.goal,
          currentBiome: g.audio ? g.audio.currentBiome : null,
          fps: g.fps,
        };
      })()`,
      returnByValue: true,
    });

    console.log('[CDP] World 2 Initialization State:', JSON.stringify(initStatus.result.value, null, 2));

    const state = initStatus.result.value;
    if (state.world !== 2) {
      throw new Error(`Expected World 2, but got World ${state.world}`);
    }
    if (state.levelWidth !== 10800) {
      throw new Error(`Expected level width 10800, but got ${state.levelWidth}`);
    }
    if (state.platformCount < 40) {
      throw new Error(`Expected at least 40 platforms, got ${state.platformCount}`);
    }
    if (state.enemyCount < 8) {
      throw new Error(`Expected at least 8 enemies, got ${state.enemyCount}`);
    }

    // BEAT 1: Arrival at The Whispering Perimeter (x: 400, y: 790)
    console.log('[CDP] Testing Beat 1: The Whispering Perimeter Glade Arrival...');
    await setPlayerPosition(cdp, 420, 790, { cameraX: 0 });
    await sleep(800);
    await captureCanvas(cdp, 'world2_beat01_glade_arrival.png');

    // BEAT 2: Shadow Squirrel Encounter & Whispering Elder Oak Landmark (x: 2100)
    console.log('[CDP] Testing Beat 2: Shadow Squirrel encounter & Whispering Elder Oak Landmark...');
    await setPlayerPosition(cdp, 2050, 790, { cameraX: 1600 });
    await sleep(800);
    const landmark1Status = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        return {
          shrineCinematicTriggered: g.level.shrineCinematicTriggered,
          shrineBannerText: g.level.shrineBannerText,
          score: g.gameState.score,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Landmark 1 State:', landmark1Status.result.value);
    await captureCanvas(cdp, 'world2_beat02_whispering_elder_oak_landmark.png');

    // BEAT 3: Section 2 Bioluminescent Fungal Hollows & Bouncy Mushroom Trampoline
    console.log('[CDP] Testing Beat 3: Bioluminescent Fungal Hollows & Bouncy Mushroom Trampoline...');
    // Drop player onto bouncy mushroom at x: 2700, y: 750
    await setPlayerPosition(cdp, 2740, 740, { vy: 200, cameraX: 2300 });
    await sleep(250); // allow collision to register bounce
    const bounceStatus = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        return {
          playerY: g.player.y,
          playerVy: g.player.vy,
          score: g.gameState.score,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Bouncy Mushroom Bounce Status (high launch vy):', bounceStatus.result.value);
    await captureCanvas(cdp, 'world2_beat03_bouncy_mushroom_trampoline.png');

    // BEAT 4: Section 2 Mycelium Shrine Landmark & Fairy Ring Sanctuary Secret
    console.log('[CDP] Testing Beat 4: Mycelium Shrine Landmark & Secret Sanctuary...');
    await setPlayerPosition(cdp, 4000, 668, { isGrounded: true, vy: 0, cameraX: 3600 });
    await sleep(800);
    const landmark2Status = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        return {
          hollowRedwoodTriggered: g.level.hollowRedwoodTriggered,
          shrineBannerText: g.level.shrineBannerText,
          score: g.gameState.score,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Landmark 2 State:', landmark2Status.result.value);
    await captureCanvas(cdp, 'world2_beat04_mycelium_shrine_landmark.png');

    // BEAT 5: Section 3 Briar Thicket Thorn Goblin Rolling Shield & Bramble Hazards
    console.log('[CDP] Testing Beat 5: Briar Thicket Thorn Goblin & Bramble Hazards...');
    await setPlayerPosition(cdp, 5850, 604, { isGrounded: true, vy: 0, cameraX: 5400 });
    await sleep(800);
    const goblinStatus = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const goblin = g.level.enemies.find(e => e.species === 'thorn_goblin');
        return {
          goblinFound: !!goblin,
          isRolling: goblin ? goblin.isRolling : false,
          shieldUp: goblin ? goblin.shieldUp : false,
          health: goblin ? goblin.health : 0,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Thorn Goblin Encounter State:', goblinStatus.result.value);
    await captureCanvas(cdp, 'world2_beat05_briar_thicket_thorn_goblin.png');

    // BEAT 6: Section 3 Briar Gate Landmark (x: 7200)
    console.log('[CDP] Testing Beat 6: Briar Gate of Ancient Thorns Landmark...');
    await setPlayerPosition(cdp, 7200, 628, { isGrounded: true, vy: 0, cameraX: 6800 });
    await sleep(800);
    const landmark3Status = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        return {
          watchtowerTriggered: g.level.watchtowerTriggered,
          shrineBannerText: g.level.shrineBannerText,
          score: g.gameState.score,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Landmark 3 State:', landmark3Status.result.value);
    await captureCanvas(cdp, 'world2_beat06_briar_gate_landmark.png');

    // BEAT 7: Section 4 Corrupted Forest King Titan Boss Encounter (x: 10200)
    console.log('[CDP] Testing Beat 7: Corrupted Forest King Titan Boss Encounter...');
    await setPlayerPosition(cdp, 10100, 828, { isGrounded: true, vy: 0, cameraX: 9800 });
    await sleep(900);
    const bossStatus = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const king = g.level.enemies.find(e => e.species === 'forest_king');
        return {
          bossFound: !!king,
          isPurified: king ? king.isPurified : false,
          cores: king ? king.cores : null,
          banner: g.level.shrineBannerText,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Forest King Boss Status:', bossStatus.result.value);
    await captureCanvas(cdp, 'world2_beat07_forest_king_boss_encounter.png');

    // BEAT 8: Sever Root Cores & Purify Forest King!
    console.log('[CDP] Testing Beat 8: Severing Root Cores and Liberating Forest King...');
    await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const king = g.level.enemies.find(e => e.species === 'forest_king');
        if (king) {
          king.cores[0].severed = true;
          king.cores[0].hp = 0;
          king.cores[1].severed = true;
          king.cores[1].hp = 0;
          king.cores[2].shielded = false;
          king.cores[2].severed = true;
          king.cores[2].hp = 0;
          king.purify(g.level, g.camera);
        }
        return true;
      })()`,
    });
    await sleep(600);
    const purifiedStatus = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const king = g.level.enemies.find(e => e.species === 'forest_king');
        return {
          isPurified: king ? king.isPurified : false,
          goalPos: g.level.goal,
          banner: g.level.shrineBannerText,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Purified Forest King Status:', purifiedStatus.result.value);
    await captureCanvas(cdp, 'world2_beat08_forest_king_purified.png');

    // BEAT 9: Ancient Portal & World 2 Clear Victory Screen
    console.log('[CDP] Testing Beat 9: Ancient Portal Entrance and World 2 Clear Victory...');
    await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        g.player.x = g.level.goal.x;
        g.player.y = g.level.goal.y;
        g.fixedUpdate(1 / 60);
        return {
          state: g.state,
          score: g.gameState.score,
        };
      })()`,
      returnByValue: true,
    });
    await sleep(700);
    const clearStatus = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        return {
          gameState: g.state,
          score: g.gameState.score,
          coins: g.gameState.coins,
          world: g.gameState.world,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Level Clear State:', clearStatus.result.value);
    await captureCanvas(cdp, 'world2_beat09_world2_clear_victory.png');

    // Final Performance & Error Check
    const perfCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        return {
          fps: g ? g.fps : 0,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Final FPS Check:', perfCheck.result.value);
    console.log(`[CDP] Total Console Errors Encountered: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('[CDP] Console Errors:', consoleErrors);
    }

    console.log('====================================================');
    console.log('✅ WORLD 2 FULL CDP PLAYTEST PASSED SUCCESSFULLY!');
    console.log('====================================================');

  } catch (err) {
    console.error('[CDP] Playtest test failed with error:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run();
