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
    this.consoleLogs = [];
    this.errors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
          this.consoleLogs.push({ type: msg.params.type, text });
          console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]`, text);
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
          this.errors.push(desc);
          console.error('[BROWSER EXCEPTION]', desc);
        }

        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(msg.error); else resolve(msg.result);
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
  const port = 9477;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_cinematic_test_'));
  const projectRoot = path.resolve(__dirname, '..');
  const reportsAfterDir = path.join(projectRoot, 'reports', 'after');
  const artifactsDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\05d223ad-bbf3-4701-b7e6-2d593980c29b';

  if (!fs.existsSync(reportsAfterDir)) {
    fs.mkdirSync(reportsAfterDir, { recursive: true });
  }

  console.log('Launching headless Chrome on port', port);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--window-size=1600,900',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  try {
    await new Promise(r => setTimeout(r, 2200));

    const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
    const targets = JSON.parse(rawList);
    const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
    if (!page) {
      throw new Error('Could not find localhost:5173 page target in Chrome');
    }

    const cdp = new CDPClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Connected to CDP. Waiting for game loop initialization...');
    for (let i = 0; i < 40; i++) {
      const res = await cdp.send('Runtime.evaluate', {
        expression: 'Boolean(window.__game && window.__game.titleScreen && window.__game.titleScreen.isActive)'
      });
      if (res?.result?.value) {
        console.log(`Cinematic Title Screen initialized after ${(i + 1) * 200}ms!`);
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // 1. Inspect initial cinematic playback
    const cinematicInfo = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const ts = window.__game?.titleScreen;
        return {
          isActive: ts?.isActive,
          isPlayingCinematic: ts?.isPlayingCinematic,
          currentShotIndex: ts?.currentShotIndex,
          shotsCount: ts?.shots?.length,
          currentShotSrc: ts?.shots?.[ts?.currentShotIndex]?.src,
          currentShotLabel: ts?.shots?.[ts?.currentShotIndex]?.label,
          display: ts?.root?.style?.display,
          subtitles: ts?.shotLabelEl?.textContent,
        };
      })()`,
      returnByValue: true
    });
    console.log('CINEMATIC STATUS:', cinematicInfo.result.value);

    // Wait 1.8 seconds for shot 01 to fade in completely and begin Ken Burns transform
    await new Promise(r => setTimeout(r, 1800));

    // Capture initial cinematic shot
    const shot01Capture = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shot01Path = path.join(reportsAfterDir, 'cinematic_playing_shot.png');
    fs.writeFileSync(shot01Path, Buffer.from(shot01Capture.data, 'base64'));
    console.log('Saved playing cinematic screenshot to', shot01Path);

    // Let it play for 2 seconds to verify cinematic animations
    await new Promise(r => setTimeout(r, 2000));

    // 2. Skip to Living Menu Loop
    console.log('Skipping to Living Menu loop...');
    await cdp.send('Runtime.evaluate', {
      expression: 'window.__game.titleScreen.skipToLivingMenu()'
    });

    // Wait 1.8 seconds for shot 09, menu UI, and golden pollen particle animation to stabilize
    await new Promise(r => setTimeout(r, 1800));

    const livingMenuInfo = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const ts = window.__game?.titleScreen;
        const buttons = Array.from(ts?.menuContainer?.querySelectorAll('button') || []).map(b => b.textContent.trim());
        return {
          isActive: ts?.isActive,
          isPlayingCinematic: ts?.isPlayingCinematic,
          currentShotIndex: ts?.currentShotIndex,
          selectedMenuIndex: ts?.selectedMenuIndex,
          menuOptions: buttons,
          titleText: ts?.titleGroup?.querySelector('h1')?.textContent,
          subtitleText: ts?.titleGroup?.querySelector('h2')?.textContent,
          motesCount: ts?.motes?.length,
        };
      })()`,
      returnByValue: true
    });
    console.log('LIVING MENU STATUS:', livingMenuInfo.result.value);

    // Capture Living Menu AFTER screenshot
    const livingMenuCapture = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const afterTitlePath = path.join(reportsAfterDir, 'title_screen_cinematic_after.png');
    fs.writeFileSync(afterTitlePath, Buffer.from(livingMenuCapture.data, 'base64'));
    fs.writeFileSync(path.join(artifactsDir, 'title_screen_cinematic_after.png'), Buffer.from(livingMenuCapture.data, 'base64'));
    console.log('Saved AFTER Living Title Screen to:', afterTitlePath);

    // 3. Test Menu Navigation (ArrowDown -> Replay Opening, ArrowUp -> Begin Journey)
    console.log('Testing Menu Keyboard Navigation...');
    await cdp.send('Runtime.evaluate', {
      expression: `window.__game.titleScreen.navigateMenu(1)`
    });
    const nav1 = await cdp.send('Runtime.evaluate', {
      expression: 'window.__game.titleScreen.selectedMenuIndex',
      returnByValue: true
    });
    console.log('Menu Index after navigating down (expect 1):', nav1.result.value);

    await cdp.send('Runtime.evaluate', {
      expression: `window.__game.titleScreen.navigateMenu(-1)`
    });
    const nav0 = await cdp.send('Runtime.evaluate', {
      expression: 'window.__game.titleScreen.selectedMenuIndex',
      returnByValue: true
    });
    console.log('Menu Index after navigating up (expect 0):', nav0.result.value);

    // 4. Test Transition into Gameplay: Trigger "BEGIN JOURNEY"
    console.log('Triggering BEGIN JOURNEY...');
    await cdp.send('Runtime.evaluate', {
      expression: 'window.__game.titleScreen.triggerStartGame()'
    });

    // Wait for the 0.55s fade-to-black and state transition to complete
    await new Promise(r => setTimeout(r, 900));

    // Inspect game state after transition
    const gameplayState = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game;
        return {
          state: g?.state, // 1 = PLAYING
          titleScreenActive: g?.titleScreen?.isActive,
          titleScreenDisplay: g?.titleScreen?.root?.style?.display,
          playerSpawned: !!g?.player,
          playerX: Math.round(g?.player?.x || 0),
          playerY: Math.round(g?.player?.y || 0),
          playerLives: g?.gameState?.lives,
          audioUnlocked: g?.audio?.unlocked,
          framesCount: g?.framesCount,
        };
      })()`,
      returnByValue: true
    });
    console.log('GAMEPLAY STATE AFTER TRANSITION:', gameplayState.result.value);

    // Wait 500ms for several frames of retro pixel gameplay to render
    await new Promise(r => setTimeout(r, 500));

    // Capture Gameplay AFTER screenshot to verify 1985 pixel-art aesthetic is preserved
    const gameplayCapture = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const afterGameplayPath = path.join(reportsAfterDir, 'gameplay_after_cinematic.png');
    fs.writeFileSync(afterGameplayPath, Buffer.from(gameplayCapture.data, 'base64'));
    fs.writeFileSync(path.join(artifactsDir, 'gameplay_after_cinematic.png'), Buffer.from(gameplayCapture.data, 'base64'));
    console.log('Saved AFTER Gameplay screenshot to:', afterGameplayPath);

    console.log('--- ERROR AUDIT ---');
    console.log('Console Errors Count:', cdp.errors.length);
    if (cdp.errors.length > 0) {
      console.error('Errors encountered:', cdp.errors);
    } else {
      console.log('Zero runtime exceptions or errors encountered!');
    }

    cdp.close();
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

run().catch(err => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
