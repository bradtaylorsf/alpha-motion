const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = process.cwd();
const deployDir = path.join(projectDir, 'electron-deploy');

console.log('Creating deployment directory...');

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

// Use npm to install production dependencies with flat structure
console.log('Installing production dependencies with npm...');
execSync('npm install --omit=dev --legacy-peer-deps', {
  cwd: deployDir,
  stdio: 'inherit',
});

// Copy built files to deploy directory
console.log('Copying built files...');

// Copy dist
fs.cpSync(path.join(projectDir, 'dist'), path.join(deployDir, 'dist'), { recursive: true });

// Copy electron-dist
fs.cpSync(path.join(projectDir, 'electron-dist'), path.join(deployDir, 'electron-dist'), { recursive: true });

// Copy public
fs.cpSync(path.join(projectDir, 'public'), path.join(deployDir, 'public'), { recursive: true });

console.log('Deployment directory ready');
