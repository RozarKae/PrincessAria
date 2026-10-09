const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function testOutroAdvance() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9560;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome_test_outro_'));
  const shotsDir = path.resolve(__dirname, '..', 'reports', 'cinematics_pass1');
  const artifactDir = 'C:\\Users\\krato\\.gemini\\antigravity-ide\\brain\\2e162784-828c-4e45-924c-f81d571965ec';

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--window-size=1280,720',
    'http://localhost:4173/'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 1500));
  const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  const targets = JSON.parse(rawList);
  const target = targets.find(t => t.type === 'page' && t.url.includes('localhost:4173'));
  if (!target) { chrome.kill(); return; }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Runtime.enable');

  // Wait for game
  await new Promise(r => setTimeout(r, 1200));

  // Trigger outro
  console.log('[TEST] Starting Outro...');
  await send('Runtime.evaluate', {
    expression: `(function() {
      window.game.state = 'WORLD_OUTRO';
      window.game.cinematic.startOutro(window.game);
    })()`
  });

  // Fast forward or wait for sequence to complete naturally
  console.log('[TEST] Waiting for outro sequence to finish...');
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 250));
    const status = await send('Runtime.evaluate', {
      expression: '({ state: window.game.state, world: window.game.gameState.world, isFinished: window.game.cinematic.activeSequence?.isFinished })',
      returnByValue: true
    });
    const val = status?.result?.value;
    if (val && (val.world === 2 || val.state === 'WORLD_INTRO' && val.world === 2)) {
      console.log(`[TEST] Successfully advanced to World 2 after ${(i + 1) * 250}ms! Status:`, val);
      break;
    }
    if (i % 8 === 0) {
      console.log(`[TEST] Status at ${(i + 1) * 250}ms:`, val);
    }
  }

  // Take screenshot of World 2 intro
  await new Promise(r => setTimeout(r, 1000));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  fs.writeFileSync(path.join(shotsDir, 'cinematic_11_world2_intro.png'), buf);
  fs.writeFileSync(path.join(artifactDir, 'cinematic_11_world2_intro.png'), buf);
  console.log('[TEST] Saved cinematic_11_world2_intro.png:', buf.length, 'bytes');

  ws.close();
  chrome.kill();
  setTimeout(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }, 500);
}

testOutroAdvance();
