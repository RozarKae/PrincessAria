// capture_hud_screenshots.js
// Usage:
// 1) Start dev server: npm run dev
// 2) In another terminal: node scripts/capture_hud_screenshots.js

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const URL = process.env.URL || 'http://localhost:5173';
const OUT_DIR = path.resolve(process.cwd(), 'reports', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const configs = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080, dpr: 1 },
  { name: 'desktop-1366x768', width: 1366, height: 768, dpr: 1 },
  { name: 'laptop-1280x800', width: 1280, height: 800, dpr: 1 },
  { name: 'tablet-1024x768', width: 1024, height: 768, dpr: 1 },
  { name: 'mobile-412x915', width: 412, height: 915, dpr: 3 },
  { name: 'mobile-360x780', width: 360, height: 780, dpr: 2 }
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const cfg of configs) {
    console.log('Capturing', cfg.name);
    await page.setViewport({ width: cfg.width, height: cfg.height, deviceScaleFactor: cfg.dpr });
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.warn('goto error', e.message));
    // small wait to let assets render
    await page.waitForTimeout(800);

    const outPath = path.join(OUT_DIR, `hud-${cfg.name}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Saved', outPath);
  }

  await browser.close();
  console.log('Done. Screenshots in', OUT_DIR);
})();
