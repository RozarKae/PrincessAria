const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const distDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist!');
  process.exit(1);
}

// Remove any existing git folder inside dist
const distGit = path.join(distDir, '.git');
if (fs.existsSync(distGit)) {
  fs.rmSync(distGit, { recursive: true, force: true });
}

console.log('Initializing git in dist...');
execSync('git init', { cwd: distDir, stdio: 'inherit' });
execSync('git checkout -B gh-pages', { cwd: distDir, stdio: 'inherit' });
execSync('git add -A', { cwd: distDir, stdio: 'inherit' });
execSync('git commit -m "deploy: release World 6 (The Clockwork Kingdom) to aria.batpaiyancatponnu.online"', { cwd: distDir, stdio: 'inherit' });
execSync('git remote add origin https://github.com/RozarKae/PrincessAria.git', { cwd: distDir, stdio: 'inherit' });

console.log('Pushing gh-pages branch to origin...');
execSync('git push -f origin gh-pages', { cwd: distDir, stdio: 'inherit' });

console.log('Successfully pushed dist to gh-pages branch!');

// Clean up .git from dist
fs.rmSync(distGit, { recursive: true, force: true });
