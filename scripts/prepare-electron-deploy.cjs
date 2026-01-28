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

// Use npm to install production dependencies
console.log('Installing production dependencies with npm...');
execSync('npm install --omit=dev --legacy-peer-deps', {
  cwd: deployDir,
  stdio: 'inherit',
});

// Break hardlinks by copying with rsync (which breaks hardlinks by default)
// This is needed because npm creates hardlinks for duplicate files
console.log('Breaking hardlinks in node_modules...');
const nodeModulesDir = path.join(deployDir, 'node_modules');
const tempDir = path.join(deployDir, 'node_modules_temp');
if (fs.existsSync(nodeModulesDir)) {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // On Windows, robocopy breaks hardlinks by default
    // /E = copy subdirs including empty, /MOVE = move files, /NFL /NDL /NJH /NJS = quiet output
    execSync(`robocopy "${nodeModulesDir}" "${tempDir}" /E /MOVE /NFL /NDL /NJH /NJS`, {
      stdio: 'inherit',
      // robocopy returns non-zero on success, so we ignore errors < 8
    });
    // robocopy moves, so nodeModulesDir should be empty or gone
    if (fs.existsSync(nodeModulesDir)) {
      fs.rmSync(nodeModulesDir, { recursive: true });
    }
    fs.renameSync(tempDir, nodeModulesDir);
  } else {
    // On Unix, use rsync which breaks hardlinks by default
    execSync(`rsync -a --delete "${nodeModulesDir}/" "${tempDir}/"`, { stdio: 'inherit' });
    fs.rmSync(nodeModulesDir, { recursive: true });
    fs.renameSync(tempDir, nodeModulesDir);
  }
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
