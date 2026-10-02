const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function test() {
  const port = 9356;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbee_'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--disable-gpu',
    'http://localhost:5173/'
  ]);
  await new Promise(r => setTimeout(r, 2500));
  const raw = await httpGet(`http://127.0.0.1:${port}/json`);
  const target = JSON.parse(raw).find(t => t.type === 'page' && t.url.includes('5173'));
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  await new Promise(r => setTimeout(r, 2500));

  const expr = `(function() {
    const am = window.assetManager;
    const img = am ? am.getImage('worlds/honeywood/effects/queen_bee_monarch') : null;
    const eye = am ? am.getImage('worlds/honeywood/effects/queen_bee_eyes') : null;
    return {
      hasAm: !!am,
      hasMonarch: !!img,
      monarchComplete: img?.complete,
      monarchWidth: img?.naturalWidth,
      monarchSrc: img?.src,
      hasEye: !!eye,
      eyeComplete: eye?.complete,
      eyeWidth: eye?.naturalWidth,
    };
  })()`;

  const msgId = 2;
  ws.send(JSON.stringify({ id: msgId, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
  ws.onmessage = (e) => {
    const res = JSON.parse(e.data);
    if (res.id === msgId) {
      console.log('QUEEN BEE ASSET INFO:', JSON.stringify(res.result.value, null, 2));
      chrome.kill();
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (err) {}
      process.exit(0);
    }
  };
}

test().catch(console.error);
