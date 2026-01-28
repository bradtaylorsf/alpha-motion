const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
  appId: 'com.remotion.moodboard',
  productName: 'Remotion Moodboard',
  directories: {
    buildResources: 'build-resources',
    output: 'release',
    app: 'electron-deploy', // Use electron-deploy as the app directory
  },
  files: ['**/*'],
  // Disable asar to avoid native module path issues
  asar: false,
  // Rebuild native modules for Electron's Node version
  npmRebuild: true,
  nodeGypRebuild: false,
  beforePack: async (context) => {
    const projectDir = context.packager.projectDir;
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
  },
    mac: {
    category: 'public.app-category.developer-tools',
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build-resources/entitlements.mac.plist',
    entitlementsInherit: 'build-resources/entitlements.mac.plist',
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'zip', arch: ['x64'] },
    ],
  },
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
    ],
    category: 'Development',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  publish: {
    provider: 'github',
    releaseType: 'draft',
  },
};

module.exports = config;
