const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(os.tmpdir(), 'chrome_diag_' + Date.now());

  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5173/',
  ]);

  await new Promise(r => setTimeout(r, 1200));

  const json = await httpGet('http://127.0.0.1:9223/json/list');
  const target = JSON.parse(json)[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  };

  setTimeout(async () => {
    ws.send(JSON.stringify({
      id: 99,
      method: 'Runtime.evaluate',
      params: { expression: 'Boolean(window.game)' }
    }));
  }, 2000);

  setTimeout(() => {
    ws.close();
    proc.kill();
    process.exit(0);
  }, 4000);
}

main().catch(console.error);
