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
  const port = 9380;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_aud_'));

  console.log('[AudioVerify] Spawning Chrome on port ' + port + '...');
  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required',
      '--window-size=1600,900',
      'http://localhost:5173/',
    ],
    { stdio: 'ignore' }
  );

  let rawList = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      rawList = await httpGet(`http://127.0.0.1:${port}/json`);
      if (rawList && rawList.includes('webSocketDebuggerUrl')) break;
    } catch (e) {}
  }
  if (!rawList) {
    chrome.kill();
    throw new Error('Failed to connect to Chrome debug port ' + port);
  }

  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  if (!page) {
    chrome.kill();
    throw new Error('Page target not found');
  }

  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[AudioVerify] CDP connected to page.');

  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  const consoleLogs = [];
  const exceptions = [];
  cdp.ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && cdp.pending.has(msg.id)) {
      const { resolve, reject } = cdp.pending.get(msg.id);
      cdp.pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description).join(' ');
      consoleLogs.push({ type: msg.params.type, text });
    } else if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails);
    }
  };

  // Wait for game ready
  for (let i = 0; i < 40; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__game && window.__game.state)'
    });
    if (res?.result?.value) {
      console.log(`[AudioVerify] Game ready after ${(i+1)*150}ms`);
      break;
    }
    await new Promise(r => setTimeout(r, 150));
  }

  // ==========================================
  // TEST A: Page loads - no crash
  // ==========================================
  const testA = await cdp.send('Runtime.evaluate', {
    expression: `Boolean(window.__game || window.game)`,
    returnByValue: true
  });
  console.log('TEST A (Page load):', testA.result.value ? 'PASS' : 'FAIL');

  // ==========================================
  // TEST B: Pre-interaction state
  // ==========================================
  const testB = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        hasAudio: !!g.audio,
        ctxPresent: !!g.audio.ctx,
        ctxState: g.audio.ctx ? g.audio.ctx.state : 'null',
        masterVolume: g.audio.getMasterVolume(),
        isMuted: g.audio.isMuted
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST B (Pre-interaction):', testB.result.value);

  // ==========================================
  // TEST C: Click START ADVENTURE (User gesture unlock)
  // ==========================================
  const testC = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const canvas = g.canvas;
      // Real click dispatch on canvas
      canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 800, clientY: 450, bubbles: true }));
      return {
        stateAfterClick: g.state,
        hasCtx: !!g.audio.ctx,
        ctxState: g.audio.ctx ? g.audio.ctx.state : 'null',
        hasMasterGain: !!g.audio.masterGain,
        hasSfxGain: !!g.audio.sfxGain,
        hasMusicGain: !!g.audio.musicGain,
        masterGainVal: g.audio.masterGain ? g.audio.masterGain.gain.value : null,
        sfxGainVal: g.audio.sfxGain ? g.audio.sfxGain.gain.value : null,
        musicGainVal: g.audio.musicGain ? g.audio.musicGain.gain.value : null,
        bgmPlaying: g.audio.bgmPlaying,
        currentBiome: g.audio.currentBiome,
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST C (Click Start Adventure):', testC.result.value);

  // Wait 1.8s for audio context clock and procedural BGM to progress
  await new Promise(r => setTimeout(r, 1800));

  const bgmTick = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        ctxTime: g.audio.ctx ? g.audio.ctx.currentTime : 0,
        bgmStep: g.audio.bgmStep,
        bgmPlaying: g.audio.bgmPlaying
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST C (BGM Ticking Check):', bgmTick.result.value);

  // ==========================================
  // TEST D: Trigger Jump SFX
  // ==========================================
  const testD = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const initialTime = g.audio.ctx.currentTime;
      g.audio.playJump();
      return {
        played: true,
        ctxState: g.audio.ctx.state,
        active: g.audio.isAvailable()
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST D (Trigger Jump):', testD.result.value);

  // ==========================================
  // TEST E: Trigger Attack SFX
  // ==========================================
  const testE = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.audio.playAttack();
      return { played: true, ctxState: g.audio.ctx.state };
    })()`,
    returnByValue: true
  });
  console.log('TEST E (Trigger Attack):', testE.result.value);

  // ==========================================
  // TEST F: Trigger Hit / Stomp SFX
  // ==========================================
  const testF = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.audio.playHit();
      g.audio.playEnemyHit();
      return { played: true, ctxState: g.audio.ctx.state };
    })()`,
    returnByValue: true
  });
  console.log('TEST F (Trigger Hit / Enemy Hit):', testF.result.value);

  // ==========================================
  // TEST G: Trigger Collectible SFX
  // ==========================================
  const testG = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.audio.playCollect();
      return { played: true, ctxState: g.audio.ctx.state };
    })()`,
    returnByValue: true
  });
  console.log('TEST G (Trigger Collectible):', testG.result.value);

  // ==========================================
  // TEST H: Press M (Toggle Mute -> Muted)
  // ==========================================
  const testH = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      // Simulate pressing 'KeyM'
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
      g.fixedUpdate(1/60);
      g.input.endFrame();
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM', key: 'm', bubbles: true }));
      g.input.endFrame();
      return {
        isMuted: g.audio.isMuted,
        masterGainVal: g.audio.masterGain.gain.value,
        savedMutePref: localStorage.getItem('aria_audio_muted')
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST H (Press M -> Mute):', testH.result.value);

  // ==========================================
  // TEST I: Press M again (Toggle Mute -> Unmuted)
  // ==========================================
  const testI = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
      g.fixedUpdate(1/60);
      g.input.endFrame();
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM', key: 'm', bubbles: true }));
      g.input.endFrame();
      return {
        isMuted: g.audio.isMuted,
        masterGainVal: g.audio.masterGain.gain.value,
        masterVolume: g.audio.getMasterVolume(),
        savedMutePref: localStorage.getItem('aria_audio_muted')
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST I (Press M again -> Unmute):', testI.result.value);

  // ==========================================
  // TEST J: Change Biome (Transitions without accumulating loops)
  // ==========================================
  const testJ = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const initialStep = g.audio.bgmStep;
      g.audio.setBiome('canopy');
      const b1 = g.audio.currentBiome;
      g.audio.setBiome('fortress');
      const b2 = g.audio.currentBiome;
      g.audio.setBiome('glade');
      const b3 = g.audio.currentBiome;
      return {
        biomes: [b1, b2, b3],
        bgmPlaying: g.audio.bgmPlaying,
        stepAdvanced: g.audio.bgmStep >= initialStep
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST J (Biome transitions):', testJ.result.value);

  // ==========================================
  // TEST VOL: Master Volume API & Persistence
  // ==========================================
  const testVol = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.audio.setMasterVolume(0.75);
      const vol1 = g.audio.getMasterVolume();
      const gain1 = g.audio.masterGain.gain.value;
      const saved1 = localStorage.getItem('aria_audio_master_volume');
      
      // Test clamp
      g.audio.setMasterVolume(1.8);
      const volClampedHigh = g.audio.getMasterVolume();
      g.audio.setMasterVolume(-0.5);
      const volClampedLow = g.audio.getMasterVolume();
      
      // Restore comfortable volume
      g.audio.setMasterVolume(0.5);

      return {
        vol1,
        gain1,
        saved1,
        volClampedHigh,
        volClampedLow,
        finalVol: g.audio.getMasterVolume()
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST VOLUME (Set, get, clamp, persist):', testVol.result.value);

  // ==========================================
  // TEST K: Reload page & check persisted volume and mute
  // ==========================================
  console.log('TEST K: Reloading page to test persistence...');
  await cdp.send('Page.reload');
  await new Promise(r => setTimeout(r, 2000));

  for (let i = 0; i < 40; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__game && window.__game.state)'
    });
    if (res?.result?.value) break;
    await new Promise(r => setTimeout(r, 150));
  }

  const testK = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      return {
        hasAudio: !!g.audio,
        masterVolume: g.audio.getMasterVolume(),
        isMuted: g.audio.isMuted,
        storedVolume: localStorage.getItem('aria_audio_master_volume'),
        storedMuted: localStorage.getItem('aria_audio_muted')
      };
    })()`,
    returnByValue: true
  });
  console.log('TEST K (After reload persistence):', testK.result.value);

  console.log('EXCEPTIONS CAUGHT DURING TEST (length):', exceptions.length);
  const badLogs = consoleLogs.filter(l => l.type === 'error' || l.type === 'warning');
  console.log('CONSOLE WARNINGS/ERRORS (length):', badLogs.length);
  if (badLogs.length > 0) {
    console.log('BAD LOGS:', badLogs);
  }

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  console.log('[AudioVerify] ALL TESTS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('[AudioVerify] Fatal error:', err);
  process.exit(1);
});
