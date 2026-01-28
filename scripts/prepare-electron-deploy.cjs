const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = process.cwd();
const deployDir = path.join(projectDir, 'electron-deploy');
const releaseDir = path.join(projectDir, 'release');

console.log('Cleaning build directories...');

// Clean release directory to avoid hardlink conflicts
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true });
}

// Clean and create deploy directory
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true });
}
fs.mkdirSync(deployDir, { recursive: true });

// Copy package.json
fs.copyFileSync(
  path.join(projectDir, 'package.json'),
  path.join(deployDir, 'package.json')
);

// Use pnpm to install production dependencies
console.log('Installing production dependencies with pnpm...');
execSync('pnpm install --prod --shamefully-hoist --node-linker=hoisted', {
  cwd: deployDir,
  stdio: 'inherit',
});

// Break all hardlinks by copying files through Node.js
// This is necessary because electron-builder's FileCopier fails on hardlinked files
console.log('Breaking hardlinks in node_modules...');
function copyDirBreakHardlinks(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirBreakHardlinks(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      // Preserve symlinks as-is
      const target = fs.readlinkSync(srcPath);
      if (!fs.existsSync(destPath)) {
        fs.symlinkSync(target, destPath);
      }
    } else {
      // Copy file content (breaks hardlinks)
      const content = fs.readFileSync(srcPath);
      fs.writeFileSync(destPath, content);
      // Preserve permissions
      const stat = fs.statSync(srcPath);
      fs.chmodSync(destPath, stat.mode);
    }
  }
}

const nodeModulesDir = path.join(deployDir, 'node_modules');
const tempDir = path.join(deployDir, 'node_modules_temp');
if (fs.existsSync(nodeModulesDir)) {
  copyDirBreakHardlinks(nodeModulesDir, tempDir);
  fs.rmSync(nodeModulesDir, { recursive: true });
  fs.renameSync(tempDir, nodeModulesDir);
}
console.log('Hardlinks broken successfully');

// Copy built files to deploy directory
console.log('Copying built files...');

// Copy dist
fs.cpSync(path.join(projectDir, 'dist'), path.join(deployDir, 'dist'), { recursive: true });

// Copy electron-dist
fs.cpSync(path.join(projectDir, 'electron-dist'), path.join(deployDir, 'electron-dist'), { recursive: true });

// Copy public
fs.cpSync(path.join(projectDir, 'public'), path.join(deployDir, 'public'), { recursive: true });

console.log('Deployment directory ready');
