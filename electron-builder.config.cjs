/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
  appId: 'com.answer.motion',
  productName: 'Answer Motion',
  directories: {
    buildResources: 'build-resources',
    output: 'release',
    app: 'electron-deploy',
  },
  files: ['**/*'],
  asar: false,
  npmRebuild: true,
  nodeGypRebuild: false,
    // Artifact naming for cleaner release files
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
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
    artifactName: '${productName}-${version}-mac-${arch}.${ext}',
  },
  dmg: {
    artifactName: '${productName}-${version}-mac-${arch}.${ext}',
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'zip', arch: ['x64'] },
    ],
    artifactName: '${productName}-${version}-win-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    artifactName: '${productName}-Setup-${version}.${ext}',
  },
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
    ],
    category: 'Development',
    artifactName: '${productName}-${version}-linux-${arch}.${ext}',
  },
  publish: {
    provider: 'github',
    releaseType: 'release',
  },
};

module.exports = config;
