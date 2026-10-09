const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9556;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome_debug_'));
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + tmpDir,
    '--headless=new',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  http.get('http://127.0.0.1:' + port + '/json', res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', async () => {
      const targets = JSON.parse(d);
      const target = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
      if (!target) { chrome.kill(); return; }
      
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));
      };
      ws.onmessage = m => {
        const parsed = JSON.parse(m.data);
        if (parsed.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', JSON.stringify(parsed.params));
        } else if (parsed.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', JSON.stringify(parsed.params));
        } else if (parsed.method === 'Network.responseReceived') {
          if (parsed.params.response.url.includes('.js')) {
            console.log('[NETWORK JS]', parsed.params.response.status, parsed.params.response.url);
          }
        } else if (parsed.method === 'Network.loadingFailed') {
          console.error('[NETWORK FAIL]', parsed.params.errorText, parsed.params.requestId);
        } else if (parsed.id === 10) {
          console.log('[EVAL RESULT 10]', JSON.stringify(parsed.result));
        }
      };

      await new Promise(r => setTimeout(r, 3000));
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: {
          expression: `({
            hasGame: Boolean(window.game),
            state: window.game?.state
          })`,
          returnByValue: true
        }
      }));

      await new Promise(r => setTimeout(r, 2000));
      ws.close();
      chrome.kill();
      setTimeout(() => {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
      }, 500);
    });
  });
}
test();
