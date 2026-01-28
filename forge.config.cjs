const path = require('path');

/**
 * Electron Forge Configuration
 *
 * IMPORTANT: The app is bundled by esbuild/vite, so we only need:
 * - electron-dist/ (bundled electron main/preload)
 * - dist/ (bundled client and server)
 * - Native node modules that can't be bundled (better-sqlite3, keytar, sharp)
 *
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
    // Use asar for smaller package size and faster loading
    // Native modules must be unpacked from asar to work properly
    asar: {
      unpack: '**/{*.node,*.dll,*.dylib,*.so,better-sqlite3/**/*,keytar/**/*,sharp/**/*}',
    },
    // Whitelist approach: only include what's needed
    ignore: (file) => {
      // Always include root
      if (!file) return false;

      // Include package.json (required by Electron)
      if (file === '/package.json') return false;

      // Include bundled electron code
      if (file.startsWith('/electron-dist')) return false;

      // Include bundled client and server (but exclude generated user content)
      if (file.startsWith('/dist')) {
        // Exclude user-generated content to reduce package size
        if (file.includes('/assets/generated/') && !file.endsWith('.gitkeep')) return true;
        if (file.includes('/assets/uploaded/') && !file.endsWith('.gitkeep')) return true;
        return false;
      }

      // Include public assets (but exclude generated/uploaded files for smaller package)
      if (file.startsWith('/public')) {
        // Exclude user-generated content
        if (file.includes('/assets/generated/') && !file.endsWith('.gitkeep')) return true;
        if (file.includes('/assets/uploaded/') && !file.endsWith('.gitkeep')) return true;
        return false;
      }

      // Only include native modules that can't be bundled by esbuild
      if (file.startsWith('/node_modules')) {
        // Patterns for required native modules (handles both symlinks and .pnpm structure)
        const requiredPatterns = [
          // Top-level symlinks
          /^\/node_modules\/better-sqlite3(\/|$)/,
          /^\/node_modules\/keytar(\/|$)/,
          /^\/node_modules\/sharp(\/|$)/,
          // pnpm actual packages
          /^\/node_modules\/\.pnpm\/better-sqlite3@/,
          /^\/node_modules\/\.pnpm\/keytar@/,
          /^\/node_modules\/\.pnpm\/sharp@/,
          // Sharp platform-specific bindings
          /^\/node_modules\/\.pnpm\/@img\+sharp-/,
          /^\/node_modules\/@img\/sharp-/,
          // Native module dependencies
          /^\/node_modules\/\.pnpm\/bindings@/,
          /^\/node_modules\/\.pnpm\/file-uri-to-path@/,
          /^\/node_modules\/\.pnpm\/prebuild-install@/,
          /^\/node_modules\/\.pnpm\/node-addon-api@/,
          /^\/node_modules\/\.pnpm\/detect-libc@/,
          /^\/node_modules\/\.pnpm\/node-abi@/,
          /^\/node_modules\/\.pnpm\/semver@/,
          /^\/node_modules\/bindings(\/|$)/,
          /^\/node_modules\/file-uri-to-path(\/|$)/,
          /^\/node_modules\/prebuild-install(\/|$)/,
          /^\/node_modules\/node-addon-api(\/|$)/,
          /^\/node_modules\/detect-libc(\/|$)/,
          /^\/node_modules\/node-abi(\/|$)/,
          /^\/node_modules\/semver(\/|$)/,
          // Sharp dependencies
          /^\/node_modules\/\.pnpm\/color@/,
          /^\/node_modules\/\.pnpm\/color-convert@/,
          /^\/node_modules\/\.pnpm\/color-name@/,
          /^\/node_modules\/\.pnpm\/color-string@/,
          /^\/node_modules\/\.pnpm\/simple-swizzle@/,
          /^\/node_modules\/\.pnpm\/is-arrayish@/,
          /^\/node_modules\/color(\/|$)/,
          /^\/node_modules\/color-convert(\/|$)/,
          /^\/node_modules\/color-name(\/|$)/,
          /^\/node_modules\/color-string(\/|$)/,
          /^\/node_modules\/simple-swizzle(\/|$)/,
          /^\/node_modules\/is-arrayish(\/|$)/,
        ];

        // Check if this file matches any required pattern
        for (const pattern of requiredPatterns) {
          if (pattern.test(file)) return false;
        }

        // Exclude everything else in node_modules
        return true;
      }

      // Exclude everything else (source files, configs, etc.)
      return true;
    },
    // Enable pruning to remove devDependencies
    prune: true,
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
