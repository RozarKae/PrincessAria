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
  const port = 9350;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_audio_check_'));

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
      'http://localhost:5173/',
    ],
    { stdio: 'ignore' }
  );

  await new Promise(r => setTimeout(r, 2500));

  const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Runtime.enable');

  // Wait for game ready
  for (let i = 0; i < 30; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__game && window.assetManager && window.assetManager.isReady)'
    });
    if (res?.result?.value) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 1. Check Title Screen Audio State before user interaction
  const titleAudioCheck = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g?.audio;
      return {
        gameState: g?.state,
        hasAudioObj: !!a,
        hasCtx: !!a?.ctx,
        ctxState: a?.ctx?.state || 'null',
        bgmPlaying: !!a?.bgmPlaying,
        isMuted: !!a?.isMuted,
        masterGainVal: a?.masterGain?.gain?.value ?? null,
        musicGainVal: a?.musicGain?.gain?.value ?? null,
        sfxGainVal: a?.sfxGain?.gain?.value ?? null,
      };
    })()`,
    returnByValue: true
  });
  console.log('1. TITLE SCREEN AUDIO (Pre-Interaction):', titleAudioCheck.result.value);

  // 2. Simulate User Click on Title Screen to start game
  console.log('2. Simulating User Click to Start Game...');
  const clickStartRes = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      // Simulate real pointerdown on canvas
      const canvas = g.canvas;
      const evt = new MouseEvent('pointerdown', {
        clientX: 800,
        clientY: 450,
        bubbles: true
      });
      canvas.dispatchEvent(evt);
      return {
        stateAfterClick: g.state,
        hasCtx: !!g.audio.ctx,
        ctxState: g.audio.ctx?.state,
        bgmPlaying: g.audio.bgmPlaying,
        currentBiome: g.audio.currentBiome,
      };
    })()`,
    returnByValue: true
  });
  console.log('2. AFTER START GAME CLICK:', clickStartRes.result.value);

  // Wait 1 second for BGM step to trigger
  await new Promise(r => setTimeout(r, 1000));

  const bgmStatus = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g.audio;
      return {
        bgmStep: a.bgmStep,
        bgmPlaying: a.bgmPlaying,
        ctxTime: a.ctx?.currentTime,
        ctxState: a.ctx?.state
      };
    })()`,
    returnByValue: true
  });
  console.log('3. BGM RUNNING STATE (After 1s):', bgmStatus.result.value);

  // 4. Test Player & Environment SFX invocations
  const sfxTestRes = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g.audio;
      const sfxResults = {};
      const methods = [
        'playJump', 'playLand', 'playBounce', 'playDash', 'playAttack',
        'playCollect', 'playEnemyHit', 'playEnemyDefeat', 'playCheckpoint',
        'playSecretDiscovery', 'playDamage', 'playDeath', 'playLevelComplete',
        'playEnemyAlert', 'playQueenBeeAppearance', 'playQueenBeeBuzz',
        'playBatboyReveal', 'playCrumble'
      ];
      for (const m of methods) {
        try {
          if (typeof a[m] === 'function') {
            a[m]();
            sfxResults[m] = 'OK';
          } else {
            sfxResults[m] = 'MISSING_METHOD';
          }
        } catch (err) {
          sfxResults[m] = 'ERROR: ' + err.message;
        }
      }
      return sfxResults;
    })()`,
    returnByValue: true
  });
  console.log('4. SFX INVOCATION RESULTS:', sfxTestRes.result.value);

  // 5. Test Biome Switching
  const biomeSwitchRes = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g.audio;
      const biomesTested = {};
      a.setBiome('canopy');
      biomesTested.afterCanopy = a.currentBiome;
      a.setBiome('fortress');
      biomesTested.afterFortress = a.currentBiome;
      a.setBiome('glade');
      biomesTested.afterGlade = a.currentBiome;
      return biomesTested;
    })()`,
    returnByValue: true
  });
  console.log('5. BIOME MODULATION TEST:', biomeSwitchRes.result.value);

  // 6. Test Mute & Volume controls
  const muteVolumeRes = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      const a = g.audio;
      const initialMuted = a.isMuted;
      const initialGain = a.masterGain?.gain?.value;
      
      const toggleRes = a.toggleMute();
      const mutedGain = a.masterGain?.gain?.value;
      
      const untoggleRes = a.toggleMute();
      const unmutedGain = a.masterGain?.gain?.value;

      // Check if any UI element or input key exists for mute or volume
      const hasVolumeSlider = !!document.querySelector('input[type="range"], .volume-slider, #volume');
      const hasMuteButton = !!document.querySelector('.mute-btn, #mute-btn, button[aria-label="mute"]');
      const keyBindings = window.__KEY_BINDINGS || (g.input ? true : false);

      return {
        initialMuted,
        initialGain,
        toggleRes,
        mutedGain,
        untoggleRes,
        unmutedGain,
        hasVolumeSlider,
        hasMuteButton,
        hasVolumeMethod: typeof a.setVolume === 'function',
        hasSetMusicVolume: typeof a.setMusicVolume === 'function',
        hasSetSfxVolume: typeof a.setSfxVolume === 'function',
      };
    })()`,
    returnByValue: true
  });
  console.log('6. MUTE AND VOLUME CAPABILITY TEST:', muteVolumeRes.result.value);

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
}

run().catch(console.error);
