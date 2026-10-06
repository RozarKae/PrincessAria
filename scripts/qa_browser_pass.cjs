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
  constructor(wsUrl) { this.wsUrl = wsUrl; this.ws = null; this.id = 1; this.pending = new Map(); this.listeners = new Map(); }
  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method && this.listeners.has(msg.method)) {
          this.listeners.get(msg.method).forEach(fn => fn(msg.params));
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(msg.error); else resolve(msg.result);
        }
      };
    });
  }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.pending.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  close() { if (this.ws) this.ws.close(); }
}

async function runQA() {
  console.log('===========================================================');
  console.log('STARTING CDP BROWSER AUTOMATED QA FOR WORLDS 4, 5 & 6');
  console.log('===========================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9625;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aria_qa_pass_'));

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1600,900',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const rawList = await httpGet(`http://127.0.0.1:${port}/json`);
  const targets = JSON.parse(rawList);
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  const cdp = new CDPClient(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Console.enable');

  const consoleLogs = [];
  const runtimeExceptions = [];

  cdp.on('Console.messageAdded', (params) => {
    if (params.message && params.message.level === 'error') {
      consoleLogs.push(params.message.text);
    }
  });

  cdp.on('Runtime.exceptionThrown', (params) => {
    const text = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || 'Exception';
    runtimeExceptions.push(text);
  });

  const report = {};

  for (const w of [4, 5, 6]) {
    console.log(`\n========================================`);
    console.log(`TESTING WORLD ${w}...`);
    console.log(`========================================`);

    consoleLogs.length = 0;
    runtimeExceptions.length = 0;

    await cdp.send('Page.navigate', { url: `http://localhost:5173/?world=${w}&play=true` });
    
    // Wait for window.game to be ready
    let isReady = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const checkRes = await cdp.send('Runtime.evaluate', {
        expression: 'Boolean((window.__game || window.game)?.level && (window.__game || window.game)?.player)'
      });
      if (checkRes?.result?.value) {
        isReady = true;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    if (!isReady) {
      console.error(`World ${w} failed to initialize window.game!`);
      report[w] = { error: 'Game failed to initialize' };
      continue;
    }

    // Evaluate World Initial State
    const evalRes = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        if (!g) return { error: 'Game object not found' };
        const level = g.level;
        const player = g.player;
        const gameState = g.gameState;
        const enemies = level?.enemies || [];
        const checkpoints = level?.checkpoints || [];
        const platforms = level?.platforms || [];

        // Check enemy plane/layer alignment
        const enemyIssues = [];
        enemies.forEach((e, idx) => {
          if (e.x < 0 || e.x > level.width || e.y < 0 || e.y > level.height) {
            enemyIssues.push(\`Enemy #\${idx} (\${e.type}) out of level bounds at x:\${e.x}, y:\${e.y}\`);
          }
          if (['magma_grub', 'lava_beetle', 'mustard_mummy', 'cheese_scorpion', 'spring_knight'].includes(e.type)) {
            // Find ground platform beneath enemy
            const ground = platforms.find(p => p.type !== 'lava' && p.type !== 'mustard_river' && p.type !== 'clock_pendulum' && 
              e.x >= p.x - 40 && e.x <= p.x + p.width + 40 && Math.abs(p.y - e.y) < 140);
            if (!ground) {
              enemyIssues.push(\`Ground enemy #\${idx} (\${e.type}) at x:\${Math.round(e.x)}, y:\${Math.round(e.y)} has no supporting platform!\`);
            }
          }
        });

        // Check Checkpoints alignment
        const cpIssues = [];
        checkpoints.forEach(cp => {
          const ground = platforms.find(p => p.type !== 'lava' && p.type !== 'mustard_river' && p.type !== 'clock_pendulum' &&
            cp.x + cp.width/2 >= p.x && cp.x + cp.width/2 <= p.x + p.width && Math.abs(p.y - (cp.y + cp.height)) < 40);
          if (!ground) {
            cpIssues.push(\`Checkpoint #\${cp.id} at x:\${cp.x}, y:\${cp.y} is missing solid ground support!\`);
          }
        });

        return {
          world: gameState?.world,
          levelWidth: level?.width,
          enemiesCount: enemies.length,
          checkpointsCount: checkpoints.length,
          playerX: player?.x,
          playerY: player?.y,
          enemyIssues,
          cpIssues,
          bossPresent: !!(level?.honeyDragon || level?.sandwichKing || level?.timeTinker)
        };
      })()`,
      returnByValue: true
    });

    const initialStats = evalRes?.result?.value;
    console.log(`World ${w} Initial Stats:`, initialStats);

    // TEST CHECKPOINT ACTIVATION & RESPAWN BEHAVIOR
    console.log(`Testing all checkpoints & respawns for World ${w}...`);
    const cpTestRes = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const level = g.level;
        const player = g.player;
        const gameState = g.gameState;
        const checkpoints = level?.checkpoints || [];
        const results = [];

        checkpoints.forEach(cp => {
          // 1. Move player to checkpoint trigger
          player.x = cp.x;
          player.y = cp.y;
          // Step update
          level.update(player, gameState, null, null, 1/60);
          
          const activatedCp = gameState.lastCheckpoint || level.currentCheckpoint;
          const activatedId = activatedCp ? activatedCp.id : null;

          // 2. Kill player and trigger respawn
          player.isDead = true;
          player.respawn(level.spawnPoint.x, level.spawnPoint.y);

          // 3. Verify respawn position
          const respawnedNearCp = Math.abs(player.x - cp.x) < 100;
          results.push({
            cpId: cp.id,
            cpX: cp.x,
            cpY: cp.y,
            activatedId,
            respawnX: Math.round(player.x),
            respawnY: Math.round(player.y),
            respawnValid: respawnedNearCp
          });
        });

        return results;
      })()`,
      returnByValue: true
    });

    console.log(`World ${w} Checkpoint & Respawn Test Results:`, cpTestRes?.result?.value);

    // FULL LEVEL CONTINUUM TRAVERSAL & SOFT-LOCK SIMULATION
    console.log(`Traversing World ${w} from x:0 to x:10,800...`);
    const traversalRes = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const g = window.__game || window.game;
        const level = g.level;
        const player = g.player;

        let freezes = 0;
        let nanPos = false;

        for (let x = 100; x <= 10600; x += 300) {
          player.x = x;
          player.y = 700;
          player.isGrounded = true;
          player.vy = 0;

          // Simulate 10 fixed updates per step using the engine's fixedUpdate
          for (let f = 0; f < 10; f++) {
            try {
              g.fixedUpdate(1/60);
            } catch (err) {
              freezes++;
            }
          }

          if (isNaN(player.x) || isNaN(player.y)) {
            nanPos = true;
          }
        }

        return {
          finalPlayerX: Math.round(player.x),
          finalPlayerY: Math.round(player.y),
          freezes,
          nanPos
        };
      })()`,
      returnByValue: true
    });

    console.log(`World ${w} Traversal Results:`, traversalRes?.result?.value);

    report[w] = {
      initialStats,
      checkpointTest: cpTestRes?.result?.value,
      traversal: traversalRes?.result?.value,
      consoleErrors: [...consoleLogs],
      runtimeExceptions: [...runtimeExceptions]
    };
  }

  cdp.close();
  chrome.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}

  console.log('\n===========================================================');
  console.log('FINAL BROWSER QA AUDIT REPORT');
  console.log('===========================================================');
  console.log(JSON.stringify(report, null, 2));
}

runQA().catch(console.error);
