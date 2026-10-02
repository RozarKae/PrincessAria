const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const distDir = path.resolve(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist!');
  process.exit(1);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'project_ra_ghpages_'));
console.log('Cloning project-ra gh-pages branch into', tmpDir);

try {
  execSync('git clone --branch gh-pages --single-branch https://github.com/RozarKae/project-ra.git .', {
    cwd: tmpDir,
    stdio: 'inherit'
  });

  const targetDir = path.join(tmpDir, 'PrincessAria');
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  console.log('Copying built dist into PrincessAria directory...');
  // Copy all files recursively from dist to targetDir
  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(distDir, targetDir);

  console.log('Committing PrincessAria to project-ra gh-pages...');
  execSync('git add -A', { cwd: tmpDir, stdio: 'inherit' });
  execSync('git commit -m "feat: deploy Princess Aria to batpaiyancatponnu.online/PrincessAria"', {
    cwd: tmpDir,
    stdio: 'inherit'
  });

  console.log('Pushing to project-ra gh-pages...');
  execSync('git push origin gh-pages', { cwd: tmpDir, stdio: 'inherit' });

  console.log('Successfully deployed PrincessAria to batpaiyancatponnu.online/PrincessAria!');
} finally {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
}
