const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = process.cwd();
const deployDir = path.join(projectDir, 'electron-deploy');
const releaseDir = path.join(projectDir, 'release');
const isWindows = process.platform === 'win32';

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

// Install production dependencies
if (isWindows) {
  console.log('Installing production dependencies with pnpm (Windows)...');
  execSync('pnpm install --prod --shamefully-hoist --node-linker=hoisted', {
    cwd: deployDir,
    stdio: 'inherit',
  });
} else {
  console.log('Installing production dependencies with npm (Mac/Linux)...');
  execSync('npm install --omit=dev --legacy-peer-deps', {
    cwd: deployDir,
    stdio: 'inherit',
  });

  // Break hardlinks on Mac/Linux to avoid electron-builder EEXIST errors
  // electron-builder's FileCopier tries to create hardlinks for identical files,
  // which fails when the destination already exists
  console.log('Breaking hardlinks in node_modules...');
  const nodeModulesDir = path.join(deployDir, 'node_modules');
  const tempDir = path.join(deployDir, 'node_modules_tmp');

  function copyDirNoHardlinks(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirNoHardlinks(srcPath, destPath);
      } else if (entry.isSymbolicLink()) {
        const target = fs.readlinkSync(srcPath);
        fs.symlinkSync(target, destPath);
      } else {
        // Read and write file content to break hardlinks
        fs.writeFileSync(destPath, fs.readFileSync(srcPath));
        try { fs.chmodSync(destPath, fs.statSync(srcPath).mode); } catch {}
      }
    }
  }

  copyDirNoHardlinks(nodeModulesDir, tempDir);
  fs.rmSync(nodeModulesDir, { recursive: true });
  fs.renameSync(tempDir, nodeModulesDir);
  console.log('Hardlinks broken');
}

// Copy built files to deploy directory
console.log('Copying built files...');

// Copy dist
fs.cpSync(path.join(projectDir, 'dist'), path.join(deployDir, 'dist'), { recursive: true });

// Copy electron-dist
fs.cpSync(path.join(projectDir, 'electron-dist'), path.join(deployDir, 'electron-dist'), { recursive: true });

// Copy public
fs.cpSync(path.join(projectDir, 'public'), path.join(deployDir, 'public'), { recursive: true });

console.log('Deployment directory ready');
