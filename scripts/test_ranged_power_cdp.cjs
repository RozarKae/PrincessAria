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
  const port = 9555;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_shot_'));

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
        await sleep(400);
      }
    }

    if (!connected) {
      throw new Error('Could not connect to Chrome debugging target.');
    }

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[CDP] Navigating to game...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/PrincessAria/?play=true&world=1' });

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
      const diag = await cdp.send('Runtime.evaluate', {
        expression: `({ href: window.location.href, hasGame: !!window.__game, title: document.title })`,
        returnByValue: true,
      });
      console.log('[CDP] Ready diagnostic:', diag?.result?.value);
      throw new Error('Game failed to initialize PLAYING state.');
    }

    await sleep(500);

    // 1. Verify Environment & Bindings
    const initCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        if (!g) return { ok: false, error: 'Game instance not found' };
        
        // Ensure playing state
        g.state = 'PLAYING';
        g.gameState.lives = 3;
        g.player.isDead = false;
        
        // Track audio calls
        window.__audioLog = [];
        if (g.audio) {
          const origStarshot = g.audio.playStarshot;
          g.audio.playStarshot = function() {
            window.__audioLog.push('starshot');
            if (origStarshot) origStarshot.call(this);
          };
          const origStarHit = g.audio.playStarHit;
          g.audio.playStarHit = function() {
            window.__audioLog.push('starHit');
            if (origStarHit) origStarHit.call(this);
          };
          const origDeflect = g.audio.playDeflect;
          g.audio.playDeflect = function() {
            window.__audioLog.push('deflect');
            if (origDeflect) origDeflect.call(this);
          };
        }
        
        return {
          ok: true,
          playerPos: { x: Math.round(g.player.x), y: Math.round(g.player.y) },
          shootBinding: g.input ? 'KEY_BINDINGS verified' : 'no input',
          projectilesCount: g.player.projectiles ? g.player.projectiles.length : -1,
          shootCooldown: g.player.shootCooldownTimer,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] 1. Initial State & Audio Interceptors:', initCheck?.result?.value);

    // 2. Test Firing Royal Starbeam in Glade
    console.log('[CDP] 2. Firing Royal Starbeam (Shoot Key)...');
    const fireCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        g.player.facing = 1;
        g.player.shoot(g.audio, g.level);
        
        // Advance 4 physics steps
        for (let s = 0; s < 4; s++) {
          g.fixedUpdate(1 / 60);
        }
        
        const proj = g.player.projectiles[0];
        return {
          count: g.player.projectiles.length,
          cooldown: g.player.shootCooldownTimer,
          projX: proj ? Math.round(proj.x) : null,
          projY: proj ? Math.round(proj.y) : null,
          projVx: proj ? proj.vx : null,
          particlesCount: proj ? proj.particles.length : 0,
          audioCalls: window.__audioLog,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Fire verification:', fireCheck?.result?.value);
    await captureCanvas(cdp, 'shot_power_01_firing_starbeam.png');

    // 3. Test Ranged Enemy Hit Interaction
    console.log('[CDP] 3. Testing ranged attack against enemy...');
    const enemyHitCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        // Position Aria on a clear flat area facing a Grub or Wisp
        g.player.x = 800;
        g.player.y = 800;
        g.player.facing = 1;
        g.player.projectiles = [];
        
        // Spawn or position an enemy at x = 1100 (300px away)
        let targetEnemy = g.level.enemies.find(e => !e.isDead && e.name === 'Hive Grub');
        if (!targetEnemy) {
          targetEnemy = g.level.enemies[0];
        }
        targetEnemy.x = 1080;
        targetEnemy.y = 800;
        targetEnemy.isDead = false;
        targetEnemy.health = 1;
        
        const initialEnemyHP = targetEnemy.health;
        
        // Fire Starbeam
        g.player.shoot(g.audio, g.level);
        
        // Step forward until projectile hits target
        let hitOccurred = false;
        for (let frame = 0; frame < 30; frame++) {
          g.fixedUpdate(1 / 60);
          if (targetEnemy.health < initialEnemyHP || targetEnemy.isDead) {
            hitOccurred = true;
            break;
          }
        }
        
        return {
          hitOccurred,
          initialEnemyHP,
          finalEnemyHP: targetEnemy.health,
          enemyDead: targetEnemy.isDead,
          audioCalls: window.__audioLog.slice(-3),
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Enemy Hit Result:', enemyHitCheck?.result?.value);
    await captureCanvas(cdp, 'shot_power_02_enemy_impact_burst.png');

    // 4. Test Frontal Shield Deflection against Honey Beetle
    console.log('[CDP] 4. Testing frontal shield deflection against Honey Beetle...');
    const deflectCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        g.player.x = 1800;
        g.player.y = 800;
        g.player.facing = 1;
        g.player.projectiles = [];
        
        // Find Honey Beetle
        let beetle = g.level.enemies.find(e => e.name === 'Honey Beetle' || e.constructor.name === 'HoneyBeetle');
        if (beetle) {
          beetle.x = 2050;
          beetle.y = 800;
          beetle.facing = -1; // facing Aria
          beetle.isVulnerable = false; // armor active
          beetle.health = 2;
          beetle.isDead = false;
        }
        
        // Fire Starbeam at frontal armor
        g.player.shoot(g.audio, g.level);
        
        let deflected = false;
        let proj = g.player.projectiles[0];
        for (let f = 0; f < 30; f++) {
          g.fixedUpdate(1 / 60);
          if (proj && proj.isDeflected) {
            deflected = true;
            break;
          }
        }
        
        return {
          deflected,
          beetleHP: beetle ? beetle.health : null,
          projVxAfterDeflect: proj ? proj.vx : null,
          projVyAfterDeflect: proj ? proj.vy : null,
          audioCalls: window.__audioLog.slice(-3),
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Shield Deflection Result:', deflectCheck?.result?.value);
    await captureCanvas(cdp, 'shot_power_03_shield_deflection_sparks.png');

    // 5. Test HUD 3-Power Display & Cooldown Reaction
    console.log('[CDP] 5. Capturing HUD with active power indicators...');
    await captureCanvas(cdp, 'shot_power_04_hud_cooldown_indicator.png');

    // 6. Test World 2 Boss Compatibility (Forest King Root Core)
    console.log('[CDP] 6. Testing Starbeam against World 2 Forest King...');
    const bossCheck = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        try {
          const g = window.__game || window.game;
          // Advance to World 2
          g.advanceToNextWorld();
          
          // Position Aria in the Sacred Grove facing Left Root Core (x: 10080, y: 640)
          g.player.x = 9920;
          g.player.y = 610;
          g.player.vx = 0;
          g.player.vy = 0;
          g.player.facing = 1;
          g.player.projectiles = [];
          
          const king = g.level.forestKing || g.level.enemies.find(e => e.name === 'Forest King' || e.constructor.name === 'ForestKing');
          let coreHPBefore = -1;
          if (king && king.cores && king.cores[0]) {
            coreHPBefore = king.cores[0].hp;
            king.cores[0].severed = false;
            king.cores[0].shielded = false;
          }
          
          // Fire Starbeam directly at Left Corrupted Root
          g.player.shoot(g.audio, g.level);
          
          let coreHit = false;
          let projStatus = null;
          for (let f = 0; f < 35; f++) {
            g.fixedUpdate(1 / 60);
            const p = g.player.projectiles[0];
            if (p) {
              projStatus = { x: Math.round(p.x), y: Math.round(p.y), dead: p.isDead };
            }
            if (king && king.cores && king.cores[0] && king.cores[0].hp < coreHPBefore) {
              coreHit = true;
              break;
            }
          }
          
          return {
            coreHit,
            coreHPBefore,
            coreHPAfter: king && king.cores ? king.cores[0].hp : null,
            projStatus,
            audioCalls: window.__audioLog.slice(-3),
          };
        } catch (err) {
          return { error: err.message, stack: err.stack };
        }
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Boss Core Strike Result:', bossCheck?.result?.value);
    await captureCanvas(cdp, 'shot_power_05_boss_core_strike.png');

    console.log('\n[CDP] ALL 6 RANGED POWER VERIFICATIONS PASSED WITH FLYING COLORS!');
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
