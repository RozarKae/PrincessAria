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
    console.log(`[CDP] Saved canvas screenshot: ${outPath} (${base64.length} bytes)`);
    return outPath;
  }
  throw new Error('Failed to capture canvas screenshot');
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9338;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_exp_'));

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
      'http://localhost:5173/?play=true',
    ],
    { stdio: 'ignore' }
  );

  await sleep(2500);

  let rawList;
  try {
    rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  } catch (err) {
    console.error('[CDP] Failed to fetch targets:', err);
    chrome.kill();
    process.exit(1);
  }

  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  if (!page || !page.webSocketDebuggerUrl) {
    console.error('[CDP] Page target not found');
    chrome.kill();
    process.exit(1);
  }

  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[CDP] WebSocket connected to game page.');

  // Let game initialize assets and game loop
  await sleep(1500);

  // 1. Initial State (Glade Arrival)
  const initialInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        hasGame: !!g,
        levelWidth: g?.level?.width,
        playerX: g?.player?.x,
        playerY: g?.player?.y,
        platforms: g?.level?.platforms?.length,
        enemies: g?.level?.enemies?.length,
        checkpoints: g?.level?.checkpoints?.length,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Initial Game State:', initialInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat1_glade_arrival.png');

  // 2. Teleport Aria to the Chasm Brink (x: 2420, y: 790) to test transition
  console.log('[CDP] Testing Transition to Section 2 Chasm Brink (x: 2420)...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 2420;
        g.player.y = 790;
        g.player.vx = 0;
        g.player.vy = 0;
        g.camera.x = 2200;
      }
    })()`,
  });
  await sleep(800);
  await captureCanvas(cdp, 'expansion_beat5_chasm_brink.png');

  // 3. Test Bouncy Amber Raft at x: 2680
  console.log('[CDP] Testing Bouncy Amber Raft at x: 2680...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 2700;
        g.player.y = 700;
        g.player.vy = 120; // falling down onto raft
        g.camera.x = 2500;
      }
    })()`,
  });
  await sleep(400); // allow bounce resolution
  const bounceInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        vy: g?.player?.vy,
        isGrounded: g?.player?.isGrounded,
        scaleY: g?.player?.scaleY,
        biome: g?.audio?.currentBiome,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Amber Bounce Physics & Biome State:', bounceInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat6_amber_bounce.png');

  // 4. Test Hanging Vine Climbing at x: 2940
  console.log('[CDP] Testing Vine Climbing at x: 2940...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 2945;
        g.player.y = 540;
        g.player.vx = 0;
        g.player.vy = 0;
        g.input.keys['KeyW'] = true; // climb up
        g.input.keys['ArrowUp'] = true;
      }
    })()`,
  });
  await sleep(400);
  const vineInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        isClimbing: g?.player?.isClimbing,
        vy: g?.player?.vy,
        playerY: g?.player?.y,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Vine Climbing State:', vineInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat6_vine_climb.png');

  // Clear climb input
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g) {
        g.input.keys['KeyW'] = false;
        g.input.keys['ArrowUp'] = false;
      }
    })()`,
  });

  // 5. Test Monumental Landmark: The Great Hollow Redwood & Amber Cataract (x: 3850)
  console.log('[CDP] Testing Hollow Redwood Landmark at x: 3850...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 3850;
        g.player.y = 440;
        g.camera.x = 3600;
      }
    })()`,
  });
  await sleep(1000);
  const landmarkInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        hollowRedwoodTriggered: g?.level?.hollowRedwoodTriggered,
        shrineBannerText: g?.level?.shrineBannerText,
        shrineBannerTimer: g?.level?.shrineBannerTimer,
        cameraX: g?.camera?.x,
        cameraY: g?.camera?.y,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Hollow Redwood Landmark State:', landmarkInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat7_hollow_redwood_landmark.png');

  // 6. Test Secret Structure: The Forgotten Royal Apiary (x: 4480, y: 320)
  console.log('[CDP] Testing Secret Royal Apiary Sanctuary at x: 4480...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 4480;
        g.player.y = 280;
        g.camera.x = 4250;
      }
    })()`,
  });
  await sleep(800);
  const secretInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        apiaryDiscovered: g?.level?.apiaryDiscovered,
        secretBannerText: g?.level?.secretBannerText,
        secretBannerTimer: g?.level?.secretBannerTimer,
        score: g?.gameState?.score,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Secret Royal Apiary State:', secretInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat8_royal_apiary_secret.png');

  // 7. Test Lower Sentry Gate Encounter (x: 4380, y: 600)
  console.log('[CDP] Testing Redwood Sentry Gate Encounter at x: 4380...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 4380;
        g.player.y = 600;
        g.camera.x = 4200;
      }
    })()`,
  });
  await sleep(800);
  const sentryInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const beetle = g?.level?.enemies?.find(e => e.species === 'beetle' && e.x > 3000);
      const grub = g?.level?.enemies?.find(e => e.species === 'grub' && e.x > 3000);
      return {
        beetleState: beetle?.fsm?.currentState,
        grubState: grub?.fsm?.currentState,
        synergy: g?.level?.encounterCoordinator?.activeSynergy,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Sentry Gate Encounter State:', sentryInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat8_sentry_gate_encounter.png');

  // 8. Test Section 2 Exit Outpost Gateway & Section 3 Transition at x: 5020
  console.log('[CDP] Testing Outpost Gateway and Section 3 Transition at x: 5020...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 5020;
        g.player.y = 660;
        g.camera.x = 4700;
      }
    })()`,
  });
  await sleep(800);
  const outpostInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        gameState: g?.state,
        outpostTriggered: g?.level?.outpostTriggered,
        shrineBannerText: g?.level?.shrineBannerText,
        biome: g?.audio?.currentBiome,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Outpost Gateway State:', outpostInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat9_outpost_gateway.png');

  // 9. Test Section 3 Colonnade Gateway & Checkpoint 3 at x: 5320
  console.log('[CDP] Testing Section 3 Colonnade Gateway at x: 5320...');
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
  const colonnadeInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        biome: g?.audio?.currentBiome,
        cameraX: g?.camera?.x,
        checkpoint3: g?.level?.checkpoints?.find(c => c.id === 3),
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Section 3 Colonnade Gateway State:', colonnadeInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat10_colonnade_gateway.png');

  // 10. Test Section 3 Crumble Block & Moving Runestones at x: 5780
  console.log('[CDP] Testing Crumble Block & Moving Runestones at x: 5780...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 5820;
        g.player.y = 600; // falling onto crumble block
        g.player.vy = 80;
        g.camera.x = 5600;
      }
    })()`,
  });
  await sleep(400); // allow landing and shake start
  const crumbleShakeInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const cb = g?.level?.platforms?.find(p => p.type === 'crumble_block');
      const mp = g?.level?.movingPlatforms?.find(m => m.type === 'moving_runestone');
      return {
        crumbleShaking: cb?.isShaking,
        crumbleBroken: cb?.isBroken,
        shakeTimer: cb?.shakeTimer,
        movingRunestoneX: mp?.x,
        movingRunestoneY: mp?.y,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Crumble Block Shake & Moving Runestone State:', crumbleShakeInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat11_crumble_viaduct.png');

  // Wait for crumble block to shatter
  await sleep(600);

  // 11. Test Section 3 Secret Structure: The Sunstone Armory Vault at x: 6300, y: 320
  console.log('[CDP] Testing Secret Sunstone Armory Vault at x: 6300...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 6300;
        g.player.y = 310;
        g.camera.x = 6100;
      }
    })()`,
  });
  await sleep(800);
  const armoryInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        armoryDiscovered: g?.level?.armoryDiscovered,
        secretBannerText: g?.level?.secretBannerText,
        secretBannerTimer: g?.level?.secretBannerTimer,
        score: g?.gameState?.score,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Sunstone Armory Vault Secret State:', armoryInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat12_armory_vault_secret.png');

  // 12. Test Section 3 Monumental Landmark: The Sunstone Fortress Watchtower at x: 6920
  console.log('[CDP] Testing Sunstone Fortress Watchtower Landmark at x: 6920...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 6920;
        g.player.y = 660;
        g.camera.x = 6700;
      }
    })()`,
  });
  await sleep(1000);
  const watchtowerInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        watchtowerTriggered: g?.level?.watchtowerTriggered,
        shrineBannerText: g?.level?.shrineBannerText,
        shrineBannerTimer: g?.level?.shrineBannerTimer,
        cameraX: g?.camera?.x,
        checkpoint4: g?.level?.checkpoints?.find(c => c.id === 4),
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Fortress Watchtower Landmark State:', watchtowerInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat14_watchtower_landmark.png');

  // 13. Test Watchtower Rampart Siege Encounter at x: 7200
  console.log('[CDP] Testing Watchtower Rampart Siege Encounter at x: 7200...');
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g && g.player) {
        g.player.x = 7200;
        g.player.y = 540;
        g.camera.x = 7000;
      }
    })()`,
  });
  await sleep(800);
  const siegeInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const beetle = g?.level?.enemies?.find(e => e.species === 'beetle' && e.x > 6500);
      const firefly = g?.level?.enemies?.find(e => e.species === 'firefly' && e.x > 6500);
      return {
        beetleState: beetle?.fsm?.currentState,
        fireflyState: firefly?.fsm?.currentState,
        synergy: g?.level?.encounterCoordinator?.activeSynergy,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Watchtower Siege Encounter State:', siegeInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat14_watchtower_siege_encounter.png');

  // 14. Test Grand Citadel Gateway & Batboy Rescue at x: 7840
  console.log('[CDP] Testing Citadel Gateway & Batboy Victory at x: 7840...');
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
  const victoryInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        gameState: g?.state,
        isRescued: g?.level?.batboy?.isRescued,
        playerVictory: g?.player?.isVictory,
        score: g?.gameState?.score,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Grand Citadel Victory State:', victoryInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat15_citadel_victory.png');

  console.log('[CDP] All Section 1, 2, and 3 Expansion playtests completed successfully!');
  cdp.close();
  chrome.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(err => {
  console.error('[CDP] Error running expansion playtest:', err);
  process.exit(1);
});
