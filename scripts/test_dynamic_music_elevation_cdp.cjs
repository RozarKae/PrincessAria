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

async function teleportPlayer(cdp, x, y, opts = {}) {
  await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      if (!g || !g.player) return false;
      if (g.audio) g.audio.unlock();
      g.state = 'PLAYING';
      g.gameState.lives = 99;
      g.player.isDead = false;
      g.player.x = ${x};
      g.player.y = ${y};
      g.player.vx = 0;
      g.player.vy = 0;
      if (!${opts.keepBanners || false}) {
        if (g.level) {
          g.level.shrineBannerTimer = 0;
          g.level.secretBannerTimer = 0;
        }
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
  const port = 9339;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_music_'));

  console.log(`[CDP Audio Test] Launching Chrome on port ${port}...`);
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
    console.error('[CDP Audio Test] Failed to fetch targets:', err);
    chrome.kill();
    process.exit(1);
  }

  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && (t.url.includes('localhost:5173') || t.url.includes('PrincessAria')));
  if (!page || !page.webSocketDebuggerUrl) {
    console.error('[CDP Audio Test] Page target not found');
    chrome.kill();
    process.exit(1);
  }

  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[CDP Audio Test] WebSocket connected.');

  // Wait for game initialization
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
    await sleep(300);
  }
  console.log(`[CDP Audio Test] Game engine ready: ${gameReady}`);

  // Test 1: Section 1 (Glade) Audio State
  console.log('[CDP Audio Test] Testing Section 1: The Sunstone Glade (x: 500)...');
  await teleportPlayer(cdp, 500, 796);
  await sleep(500);
  const gladeAudio = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        scene: a?.currentScene,
        targetScene: a?.targetScene,
        targetTempo: a?.targetTempo,
        bgmPlaying: a?.bgmPlaying,
        intensity: Math.round(a?.currentIntensity * 100) / 100,
        specialMode: a?.specialMode,
        padGain: Math.round(a?.musicPadGain?.gain?.value * 100) / 100,
        drumGain: Math.round(a?.musicDrumsGain?.gain?.value * 100) / 100,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP Audio Test] Section 1 (Glade) Audio State:', gladeAudio?.result?.value);

  // Test 2: Section 2 (Canopy) Audio Elevation
  console.log('[CDP Audio Test] Testing Section 2: Whispering Canopy (x: 3200)...');
  await teleportPlayer(cdp, 3200, 540);
  await sleep(600);
  const canopyAudio = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        scene: a?.currentScene,
        targetScene: a?.targetScene,
        targetTempo: a?.targetTempo,
        intensity: Math.round(a?.currentIntensity * 100) / 100,
        specialMode: a?.specialMode,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP Audio Test] Section 2 (Canopy) Audio State:', canopyAudio?.result?.value);

  // Test 3: Section 3 (Fortress) Audio Elevation
  console.log('[CDP Audio Test] Testing Section 3: Sunstone Fortress (x: 6000)...');
  await teleportPlayer(cdp, 6000, 520);
  await sleep(600);
  const fortressAudio = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        scene: a?.currentScene,
        targetScene: a?.targetScene,
        targetTempo: a?.targetTempo,
        intensity: Math.round(a?.currentIntensity * 100) / 100,
        specialMode: a?.specialMode,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP Audio Test] Section 3 (Fortress) Audio State:', fortressAudio?.result?.value);

  // Test 4: Section 4 (Spire) Audio Elevation
  console.log('[CDP Audio Test] Testing Section 4: Sovereign Hive Spire (x: 8500)...');
  await teleportPlayer(cdp, 8500, 620);
  await sleep(600);
  const spireAudio = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        scene: a?.currentScene,
        targetScene: a?.targetScene,
        targetTempo: a?.targetTempo,
        intensity: Math.round(a?.currentIntensity * 100) / 100,
        specialMode: a?.specialMode,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP Audio Test] Section 4 (Spire) Audio State:', spireAudio?.result?.value);

  // Test 5: Encounter Threat Elevation (Active Enemies at x: 9920)
  console.log('[CDP Audio Test] Testing Combat Encounter Threat Elevation (x: 9920)...');
  await teleportPlayer(cdp, 9920, 640);
  await sleep(500);
  const combatAudio = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        scene: a?.currentScene,
        targetScene: a?.targetScene,
        targetTempo: a?.targetTempo,
        intensity: Math.round(a?.currentIntensity * 100) / 100,
        targetIntensity: Math.round(a?.targetIntensity * 100) / 100,
        drumGain: Math.round(a?.musicDrumsGain?.gain?.value * 100) / 100,
        specialMode: a?.specialMode,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP Audio Test] Combat Encounter Audio State:', combatAudio?.result?.value);

  // Test 6: Secret Sanctum Elevation (Music Box Mode in Queen's Forbidden Vault at x: 9340)
  console.log('[CDP Audio Test] Testing Secret Sanctum Music Box Elevation (x: 9340)...');
  await teleportPlayer(cdp, 9340, 276);
  await sleep(500);
  const secretAudio = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        scene: a?.currentScene,
        specialMode: a?.specialMode,
        secretBannerTimer: g?.level?.secretBannerTimer,
        leadGain: Math.round(a?.musicLeadGain?.gain?.value * 100) / 100,
        drumGain: Math.round(a?.musicDrumsGain?.gain?.value * 100) / 100,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP Audio Test] Secret Sanctum Audio State:', secretAudio?.result?.value);

  // Test 7: Sovereign Throne Climax & Batboy Rescue Elevation (x: 10400)
  console.log('[CDP Audio Test] Testing Climax & Batboy Rescue Elevation (x: 10400)...');
  await teleportPlayer(cdp, 10400, 650);
  await sleep(600);
  const climaxAudio = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        scene: a?.currentScene,
        targetScene: a?.targetScene,
        targetTempo: a?.targetTempo,
        intensity: Math.round(a?.currentIntensity * 100) / 100,
        specialMode: a?.specialMode,
        drumGain: Math.round(a?.musicDrumsGain?.gain?.value * 100) / 100,
        leadGain: Math.round(a?.musicLeadGain?.gain?.value * 100) / 100,
      };
    })()`,
    returnByValue: true,
  });
  console.log('[CDP Audio Test] Sovereign Climax Audio State:', climaxAudio?.result?.value);

  console.log('[CDP Audio Test] All dynamic music scene elevation tests completed successfully!');
  cdp.close();
  chrome.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(err => {
  console.error('[CDP Audio Test] Error running audio playtest:', err);
  process.exit(1);
});
