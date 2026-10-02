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

async function test() {
  const port = 9349;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_svg_test_'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--disable-gpu',
    'http://localhost:5173/'
  ]);
  await new Promise(r => setTimeout(r, 2500));
  const raw = await httpGet(`http://127.0.0.1:${port}/json`);
  const targets = JSON.parse(raw);
  const target = targets.find(t => t.type === 'page' && t.url.includes('5173'));
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  await new Promise(r => setTimeout(r, 1500));

  const expr = `(async function() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/src/assets/art/characters/aria/animation/idle/frame_0.svg';
    await new Promise(res => { img.onload = res; img.onerror = res; });

    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 200;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 20, 20, 138, 138);

    const imgData = ctx.getImageData(0, 0, 200, 200).data;
    let nonZero = 0;
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] > 10) nonZero++;
    }

    return {
      loaded: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      nonZeroPixels: nonZero,
      dataUrlSample: c.toDataURL().slice(0, 80)
    };
  })()`;

  const msgId = 10;
  ws.send(JSON.stringify({ id: msgId, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } }));
  ws.onmessage = (e) => {
    const res = JSON.parse(e.data);
    if (res.id === msgId) {
      console.log('SVG DRAW TEST RESULT:', JSON.stringify(res.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}

test().catch(console.error);
