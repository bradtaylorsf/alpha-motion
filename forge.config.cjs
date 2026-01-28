const path = require('path');

/**
 * Electron Forge Configuration
 * @type {import('@electron-forge/shared-types').ForgeConfig}
 */
const config = {
  packagerConfig: {
    appId: 'com.answer.motion',
    name: 'Answer Motion',
    executableName: 'answer-motion',
    // Icon without extension - packager will add correct extension per platform
    icon: path.resolve(__dirname, 'build-resources/icon'),
    // macOS specific
    appBundleId: 'com.answer.motion',
    appCategoryType: 'public.app-category.developer-tools',
    osxSign: false, // Disable signing for now
    osxNotarize: false,
    // Include these directories in the app
    extraResource: [],
    // Ignore patterns - exclude dev files and packages
    ignore: (file) => {
      // Always include root and electron-dist/dist/public
      if (!file) return false;
      if (file === '/package.json') return false;
      if (file.startsWith('/electron-dist')) return false;
      if (file.startsWith('/dist')) return false;
      if (file.startsWith('/public')) return false;

      // Include node_modules but exclude dev-only packages
      if (file.startsWith('/node_modules')) {
        // Exclude @types packages (dev only)
        if (file.includes('/@types/')) return true;
        // Exclude build tools
        if (file.includes('/@remotion/bundler')) return true;
        if (file.includes('/typescript')) return true;
        if (file.includes('/vite')) return true;
        if (file.includes('/esbuild')) return true;
        if (file.includes('/eslint')) return true;
        if (file.includes('/tailwindcss')) return true;
        if (file.includes('/postcss')) return true;
        if (file.includes('/autoprefixer')) return true;
        if (file.includes('/drizzle-kit')) return true;
        if (file.includes('/@electron-forge')) return true;
        if (file.includes('/electron-packager')) return true;
        // Include all other node_modules
        return false;
      }

      // Exclude source and config files
      if (file.startsWith('/electron/')) return true;
      if (file.startsWith('/src/')) return true;
      if (file.startsWith('/scripts/')) return true;
      if (file.startsWith('/.github')) return true;
      if (file.startsWith('/.git')) return true;
      if (file.startsWith('/.vscode')) return true;
      if (file.endsWith('.map')) return true;
      if (file.endsWith('.md')) return true;
      if (file.includes('tsconfig')) return true;
      if (file.includes('vite.config')) return true;
      if (file.includes('tailwind.config')) return true;
      if (file.includes('postcss.config')) return true;
      if (file.includes('drizzle.config')) return true;
      if (file.includes('forge.config')) return true;
      if (file.startsWith('/.env')) return true;

      // Include everything else
      return false;
    },
    // Disable pruning - we handle it with ignore
    prune: false,
  },
  rebuildConfig: {},
  makers: [
    // ZIP for all platforms (most reliable, avoids Windows path length issues)
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
    },
    // macOS DMG
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        format: 'ULFO',
      },
    },
    // Linux DEB
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'answer-motion',
          productName: 'Answer Motion',
          description: 'AI-powered motion design tool',
          productDescription: 'AI-powered motion design tool for generating, previewing, and organizing Remotion animation components',
          maintainer: 'Answer AI <hello@answerai.com>',
          homepage: 'https://github.com/the-answerai/answer-motion',
          icon: path.resolve(__dirname, 'build-resources/icon.png'),
          categories: ['Development'],
        },
      },
    },
    // Linux RPM
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'answer-motion',
          productName: 'Answer Motion',
          description: 'AI-powered motion design tool',
          productDescription: 'AI-powered motion design tool for generating, previewing, and organizing Remotion animation components',
          icon: path.resolve(__dirname, 'build-resources/icon.png'),
          categories: ['Development'],
        },
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: process.env.GITHUB_REPOSITORY_OWNER || 'your-username',
          name: 'remotion-moodboard',
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
  hooks: {
    // Copy built files before packaging
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      const fs = require('fs');
      const path = require('path');

      console.log(`Packaging for ${platform}-${arch}...`);

      // The built files should already be in place from the build step
      // Just verify they exist
      const distPath = path.join(buildPath, 'dist');
      const electronDistPath = path.join(buildPath, 'electron-dist');

      if (!fs.existsSync(distPath)) {
        throw new Error('dist directory not found - run build:electron first');
      }
      if (!fs.existsSync(electronDistPath)) {
        throw new Error('electron-dist directory not found - run build:electron first');
      }

      console.log('Build files verified');
    },
  },
};

module.exports = config;
