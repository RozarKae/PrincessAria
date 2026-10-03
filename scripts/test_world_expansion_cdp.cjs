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
      if (${opts.cameraX !== undefined}) {
        g.camera.x = ${opts.cameraX};
      }
      return true;
    })()`,
  });
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
      'http://localhost:5173/PrincessAria/?play=true',
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
  const page = targets.find(t => t.type === 'page' && (t.url.includes('localhost:5173') || t.url.includes('PrincessAria')));
  if (!page || !page.webSocketDebuggerUrl) {
    console.error('[CDP] Page target not found');
    chrome.kill();
    process.exit(1);
  }

  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[CDP] WebSocket connected to game page.');

  // Wait for game initialization
  console.log('[CDP] Waiting for game initialization and PLAYING state...');
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
    await sleep(400);
  }
  console.log(`[CDP] Game engine ready: ${gameReady}`);

  // 1. Initial State (Section 1: Glade Arrival)
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
        biome: g?.audio?.currentBiome,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Initial Game State (Section 1):', initialInfo?.result?.value);
  await sleep(500);
  await captureCanvas(cdp, 'expansion_beat1_glade_arrival.png');

  // 2. Beat 5: Section 2 Whispering Canopy Chasm Brink (x: 2420, y: 790)
  console.log('[CDP] Testing Transition to Section 2 Chasm Brink (x: 2420)...');
  await setPlayerPosition(cdp, 2420, 790, { cameraX: 2200 });
  await sleep(800);
  await captureCanvas(cdp, 'expansion_beat5_chasm_brink.png');

  // 3. Beat 6: Bouncy Amber Raft at x: 2700
  console.log('[CDP] Testing Bouncy Amber Raft at x: 2700...');
  await setPlayerPosition(cdp, 2700, 700, { vy: 120, cameraX: 2500, isGrounded: false });
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

  // 4. Beat 6: Hanging Vine Climbing at x: 2945
  console.log('[CDP] Testing Vine Climbing at x: 2945...');
  await setPlayerPosition(cdp, 2945, 540, { cameraX: 2800 });
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (g) {
        g.input.keys['KeyW'] = true;
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

  // 5. Beat 7: Monumental Landmark: The Great Hollow Redwood & Amber Cataract (x: 3850)
  console.log('[CDP] Testing Hollow Redwood Landmark at x: 3850...');
  await setPlayerPosition(cdp, 3850, 440, { cameraX: 3600 });
  await sleep(1000);
  const landmarkInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        hollowRedwoodTriggered: g?.level?.hollowRedwoodTriggered,
        shrineBannerText: g?.level?.shrineBannerText,
        shrineBannerTimer: g?.level?.shrineBannerTimer,
        cameraX: g?.camera?.x,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Hollow Redwood Landmark State:', landmarkInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat7_hollow_redwood_landmark.png');

  // 6. Beat 8: Secret Structure 2: The Forgotten Royal Apiary (x: 4480, y: 280)
  console.log('[CDP] Testing Secret Royal Apiary Sanctuary at x: 4480...');
  await setPlayerPosition(cdp, 4480, 280, { cameraX: 4250 });
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

  // 7. Beat 8: Lower Sentry Gate Encounter (x: 4380, y: 600)
  console.log('[CDP] Testing Redwood Sentry Gate Encounter at x: 4380...');
  await setPlayerPosition(cdp, 4380, 600, { cameraX: 4200 });
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

  // 8. Beat 9: Section 2 Exit Outpost Gateway & Section 3 Transition at x: 5020
  console.log('[CDP] Testing Outpost Gateway and Section 3 Transition at x: 5020...');
  await setPlayerPosition(cdp, 5020, 660, { cameraX: 4700 });
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

  // 9. Beat 10: Section 3 Colonnade Gateway & Checkpoint 3 at x: 5320
  console.log('[CDP] Testing Section 3 Colonnade Gateway at x: 5320...');
  await setPlayerPosition(cdp, 5320, 700, { cameraX: 5100 });
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

  // 10. Beat 11: Section 3 Crumble Block & Moving Runestones at x: 5820
  console.log('[CDP] Testing Crumble Block & Moving Runestones at x: 5820...');
  await setPlayerPosition(cdp, 5820, 600, { vy: 80, cameraX: 5600, isGrounded: false });
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

  // 11. Beat 12: Section 3 Secret Structure 3: The Sunstone Armory Vault at x: 6300, y: 310
  console.log('[CDP] Testing Secret Sunstone Armory Vault at x: 6300...');
  await setPlayerPosition(cdp, 6300, 310, { cameraX: 6100 });
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

  // 12. Beat 14: Section 3 Monumental Landmark: The Sunstone Fortress Watchtower at x: 6920
  console.log('[CDP] Testing Sunstone Fortress Watchtower Landmark at x: 6920...');
  await setPlayerPosition(cdp, 6920, 660, { cameraX: 6700 });
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

  // 13. Beat 14: Watchtower Rampart Siege Encounter at x: 7200
  console.log('[CDP] Testing Watchtower Rampart Siege Encounter at x: 7200...');
  await setPlayerPosition(cdp, 7200, 540, { cameraX: 7000 });
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

  // 14. Beat 15: Grand Citadel Gateway & Spire Threshold Approach at x: 7840
  console.log('[CDP] Testing Grand Citadel Gateway & Spire Approach at x: 7840...');
  await setPlayerPosition(cdp, 7840, 680, { cameraX: 7500 });
  await sleep(800);
  const citadelInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        gameState: g?.state,
        cameraX: g?.camera?.x,
        playerX: g?.player?.x,
        biome: g?.audio?.currentBiome,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Grand Citadel Gateway State:', citadelInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat15_citadel_gateway.png');

  // 15. Beat 16: Spire Threshold Gateway Landmark & Checkpoint 5 at x: 8180
  console.log('[CDP] Testing Spire Threshold Gateway & Checkpoint 5 at x: 8180...');
  await setPlayerPosition(cdp, 8180, 680, { cameraX: 8000 });
  await sleep(1000);
  const spireGatewayInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        spireGatewayTriggered: g?.level?.spireGatewayTriggered,
        shrineBannerText: g?.level?.shrineBannerText,
        shrineBannerTimer: g?.level?.shrineBannerTimer,
        checkpoint5: g?.level?.checkpoints?.find(c => c.id === 5),
        biome: g?.audio?.currentBiome,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Spire Threshold Gateway State:', spireGatewayInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat16_spire_threshold.png');

  // 16. Beat 17: Hex Gauntlet & Moving Hex Lift at x: 8520
  console.log('[CDP] Testing Hex Gauntlet & Moving Hex Lift at x: 8520...');
  await setPlayerPosition(cdp, 8520, 620, { cameraX: 8350 });
  await sleep(600);
  const hexGauntletInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const beetle = g?.level?.enemies?.find(e => e.species === 'beetle' && e.x > 8400);
      const movingHex = g?.level?.movingPlatforms?.find(m => m.type === 'moving_hex');
      return {
        isGrounded: g?.player?.isGrounded,
        beetleState: beetle?.fsm?.currentState,
        movingHexX: movingHex?.x,
        movingHexY: movingHex?.y,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Hex Gauntlet State:', hexGauntletInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat17_hex_gauntlet.png');

  // 17. Beat 17: Honey Geyser 1 Updraft Catapult Launch at x: 8960
  console.log('[CDP] Testing Honey Geyser 1 Updraft Catapult Launch at x: 8960...');
  await setPlayerPosition(cdp, 8960, 710, { vy: 100, cameraX: 8800, isGrounded: false });
  await sleep(150); // allow geyser launch trigger
  const geyserInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        playerVy: g?.player?.vy,
        playerY: g?.player?.y,
        isGrounded: g?.player?.isGrounded,
        cameraShakeTimer: g?.camera?.shakeTimer,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Honey Geyser Updraft Launch State:', geyserInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat17_geyser_updraft.png');

  // 18. Beat 18: The Queen's Forbidden Secret Vault at x: 9340, y: 280
  console.log('[CDP] Testing The Queen\'s Forbidden Secret Vault at x: 9340...');
  await setPlayerPosition(cdp, 9340, 276, { cameraX: 9150 });
  await sleep(800);
  const secretVaultInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        spireSecretDiscovered: g?.level?.spireSecretDiscovered,
        secretBannerText: g?.level?.secretBannerText,
        secretBannerTimer: g?.level?.secretBannerTimer,
        score: g?.gameState?.score,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Queen\'s Secret Vault State:', secretVaultInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat18_secret_vault.png');

  // 19. Beat 18: Sticky Amber Nectar Run at x: 9340, y: 720
  console.log('[CDP] Testing Sticky Amber Nectar Run Slowdown at x: 9340...');
  await setPlayerPosition(cdp, 9340, 718, { vx: 220, cameraX: 9150 });
  await sleep(400);
  const stickyAmberInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        playerVx: g?.player?.vx,
        isGrounded: g?.player?.isGrounded,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Sticky Amber Run State:', stickyAmberInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat18_sticky_amber_run.png');

  // 20. Beat 19: Royal Ante-Chamber Siege Encounter at x: 9920
  console.log('[CDP] Testing Royal Ante-Chamber Siege Encounter at x: 9920...');
  await setPlayerPosition(cdp, 9920, 650, { cameraX: 9700 });
  await sleep(800);
  const anteChamberInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const beetle = g?.level?.enemies?.find(e => e.species === 'beetle' && e.x > 9800);
      const firefly = g?.level?.enemies?.find(e => e.species === 'firefly' && e.x > 9800);
      const wisp = g?.level?.enemies?.find(e => e.species === 'wisp' && e.x > 9800);
      return {
        beetleState: beetle?.fsm?.currentState,
        fireflyState: firefly?.fsm?.currentState,
        hasWisp: !!wisp,
        checkpoint6: g?.level?.checkpoints?.find(c => c.id === 6),
        synergy: g?.level?.encounterCoordinator?.activeSynergy,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Royal Ante-Chamber Siege State:', anteChamberInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat19_antechamber_siege.png');

  // 21. Beat 20: The Sovereign Royal Chrysalis Throne Climax at x: 10360
  console.log('[CDP] Testing Sovereign Throne Climax at x: 10360...');
  await setPlayerPosition(cdp, 10360, 656, { cameraX: 10100 });
  await sleep(1000);
  const throneClimaxInfo = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        sovereignThroneTriggered: g?.level?.sovereignThroneTriggered,
        shrineBannerText: g?.level?.shrineBannerText,
        shrineBannerTimer: g?.level?.shrineBannerTimer,
        cameraFocusX: g?.camera?.focusTargetX,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP] Sovereign Throne Climax State:', throneClimaxInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat20_sovereign_throne_climax.png');

  // 22. Beat 20: Batboy Rescue & Complete World 1 Victory at x: 10480
  console.log('[CDP] Testing Batboy Rescue & Complete World 1 Victory at x: 10480...');
  await setPlayerPosition(cdp, 10480, 520, { cameraX: 10200 });
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
  console.log('[CDP] World 1 Complete Climax Victory State:', victoryInfo?.result?.value);
  await captureCanvas(cdp, 'expansion_beat20_world1_complete_victory.png');

  console.log('[CDP] All 4 Sections (10,800px) Complete World 1 Expansion playtests completed successfully!');
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
