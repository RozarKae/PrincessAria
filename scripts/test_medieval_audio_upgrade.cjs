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
  const port = 9390;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_med_aud_'));

  console.log('[MedievalAudioTest] Launching Chrome on port ' + port + '...');
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
  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[MedievalAudioTest] CDP connected.');

  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  const exceptions = [];
  const errors = [];
  cdp.ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && cdp.pending.has(msg.id)) {
      const { resolve, reject } = cdp.pending.get(msg.id);
      cdp.pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map(a => a.value || a.description).join(' '));
    }
  };

  // Wait for game ready
  for (let i = 0; i < 40; i++) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__game && window.__game.state)'
    });
    if (res?.result?.value) {
      console.log(`[MedievalAudioTest] Game ready after ${(i + 1) * 150}ms`);
      break;
    }
    await new Promise(r => setTimeout(r, 150));
  }

  // Unlock audio
  const unlockRes = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const g = window.__game || window.game;
      g.audio.unlock();
      return {
        hasCtx: !!g.audio.ctx,
        ctxState: g.audio.ctx ? g.audio.ctx.state : 'null',
        masterVol: g.audio.getMasterVolume(),
        isMuted: g.audio.isMuted
      };
    })()`,
    returnByValue: true
  });
  console.log('1. AUDIO UNLOCK:', unlockRes.result.value);

  // Test every single SFX in the mature medieval sound palette
  const sfxTest = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const a = (window.__game || window.game).audio;
      const sfxList = [
        'playJump', 'playDoubleJump', 'playLand', 'playBounce', 'playDash',
        'playAttack', 'playHeavyAttack', 'playDeflect', 'playStarshot', 'playStarHit',
        'playCollect', 'playCoin', 'playTreasureOpen', 'playEnemyHit', 'playStomp',
        'playHit', 'playEnemyDefeat', 'playBossDefeat', 'playBossDefeatSting',
        'playCheckpoint', 'playSecretDiscovery', 'playSecret', 'playDamage',
        'playHurt', 'playEnemyHurt', 'playDeath', 'playLevelComplete', 'playVictory',
        'playStart', 'playMenuHover', 'playHover', 'playMenuSelect', 'playSelect',
        'playEnemyAlert', 'playQueenBeeAppearance', 'playBossEntrance',
        'playQueenBeeBuzz', 'playQueenBeeAttack', 'playBossAttack',
        'playBatboyReveal', 'playCrumble', 'playExplosion', 'playGeyser', 'playPortal'
      ];
      const results = {};
      for (const fn of sfxList) {
        try {
          if (typeof a[fn] === 'function') {
            a[fn]();
            results[fn] = 'PASS';
          } else {
            results[fn] = 'MISSING_METHOD';
          }
        } catch (err) {
          results[fn] = 'ERROR: ' + err.message;
        }
      }
      return results;
    })()`,
    returnByValue: true
  });
  console.log('2. MATURE MEDIEVAL SFX PALETTE TEST:');
  const sfxResults = sfxTest.result.value;
  let allSfxPass = true;
  for (const [fn, status] of Object.entries(sfxResults)) {
    if (status !== 'PASS') {
      console.error(`   ${fn}: ${status}`);
      allSfxPass = false;
    }
  }
  if (allSfxPass) {
    console.log(`   All ${Object.keys(sfxResults).length} SFX methods PASSED cleanly!`);
  }

  // Test all 27 scene/world themes and their modal voicings
  const themeTest = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const a = (window.__game || window.game).audio;
      const scenes = [
        'title', 'glade', 'canopy', 'fortress', 'spire', 'climax',
        'forest', 'fungal', 'briar', 'forest_king',
        'castle', 'portrait_hall', 'library', 'slam_a_lot',
        'volcano', 'lava_rapids', 'boiling_crater', 'honey_dragon',
        'desert_dunes', 'cheese_canyon', 'mustard_rapids', 'sandwich_king',
        'clockwork', 'escapement_bridge', 'steam_conduit', 'time_tinker'
      ];
      const results = {};
      for (const s of scenes) {
        try {
          a.updateDynamicBGM(s, 0.4, 'normal');
          const t = a.sceneThemes[s];
          results[s] = {
            hasTheme: !!t,
            tempo: t?.tempo,
            targetTempo: a.targetTempo,
            hasChords: t?.chords?.length === 4,
            hasBass: t?.bass?.length === 4,
            hasMelody: t?.melody?.length === 4
          };
        } catch (e) {
          results[s] = { error: e.message };
        }
      }
      return results;
    })()`,
    returnByValue: true
  });
  console.log('3. MEDIEVAL MODAL SCENE THEMES TEST (26 scenes across all worlds):');
  const themeResults = themeTest.result.value;
  let allThemesPass = true;
  for (const [s, data] of Object.entries(themeResults)) {
    if (!data.hasTheme || !data.hasChords || !data.hasBass || !data.hasMelody) {
      console.error(`   ${s}: FAILED`, data);
      allThemesPass = false;
    }
  }
  if (allThemesPass) {
    console.log(`   All ${Object.keys(themeResults).length} Scene Themes PASSED with full modal voicings, basslines, and melodies!`);
  }

  // Test live procedural scheduler step ticking & audio layers
  const liveTickTest = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const a = (window.__game || window.game).audio;
      a.startProceduralMusic('glade');
      return {
        bgmPlaying: a.bgmPlaying,
        currentScene: a.currentScene,
        tempo: a.currentTempo
      };
    })()`,
    returnByValue: true
  });
  console.log('4. PROCEDURAL MUSIC ENGINE START:', liveTickTest.result.value);

  // Let procedural scheduler tick for 1.5 seconds
  await new Promise(r => setTimeout(r, 1500));

  const liveTickCheck = await cdp.send('Runtime.evaluate', {
    expression: `(function() {
      const a = (window.__game || window.game).audio;
      return {
        bgmPlaying: a.bgmPlaying,
        stepIndex: a.stepIndex,
        bgmStep: a.bgmStep,
        currentTime: a.ctx ? a.ctx.currentTime : 0,
        padGain: a.musicPadGain?.gain?.value,
        bassGain: a.musicBassGain?.gain?.value,
        leadGain: a.musicLeadGain?.gain?.value,
        arpGain: a.musicArpGain?.gain?.value,
        drumGain: a.musicDrumsGain?.gain?.value
      };
    })()`,
    returnByValue: true
  });
  console.log('5. PROCEDURAL ENGINE TICKING VERIFICATION:', liveTickCheck.result.value);

  // Stop procedural music
  await cdp.send('Runtime.evaluate', {
    expression: `(window.__game || window.game).audio.stopProceduralMusic()`
  });

  console.log('6. EXCEPTIONS COUNT:', exceptions.length);
  console.log('7. CONSOLE ERRORS COUNT:', errors.length);

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}

  if (exceptions.length > 0 || errors.length > 0 || !allSfxPass || !allThemesPass) {
    console.error('[MedievalAudioTest] SOME CHECKS FAILED!');
    process.exit(1);
  }

  console.log('[MedievalAudioTest] ALL MEDIEVAL AUDIO UPGRADE CHECKS PASSED!');
}

run().catch(err => {
  console.error('[MedievalAudioTest] Fatal error:', err);
  process.exit(1);
});
