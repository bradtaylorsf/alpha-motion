import { app } from 'electron';
import type Express from 'express';
import http from 'http';
import path from 'path';

let server: http.Server | null = null;

// Dynamic import to handle ESM modules
async function importApp(): Promise<Express.Application> {
  // Set environment variables for Electron before importing
  const dbPath = path.join(app.getPath('userData'), 'answer-motion.db');
  process.env.ELECTRON_DB_PATH = dbPath;
  process.env.NODE_ENV = 'production';

  // Use app.getAppPath() for reliable path resolution in packaged apps
  // This returns the path to the app's resources (e.g., /path/to/App.app/Contents/Resources/app)
  // Unlike __dirname which esbuild transforms at bundle time, this works at runtime
  const appPath = app.getAppPath();
  const serverPath = path.join(appPath, 'dist', 'server', 'index.cjs');

  // Pass the app root path so the server can find static files
  const appRootPath = path.join(appPath, 'dist');
  process.env.ELECTRON_APP_ROOT = appRootPath;

  console.log('App path:', appPath);
  console.log('Server path:', serverPath);
  console.log('App root path:', appRootPath);

  // Verify the server file exists
  const fs = require('fs');
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Server file not found at: ${serverPath}`);
  }

  // Use require for CommonJS module
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serverModule = require(serverPath);
  if (!serverModule.app) {
    throw new Error('Server module does not export an app');
  }
  return serverModule.app;
}

export async function startEmbeddedServer(): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      const expressApp = await importApp();

      // Create server and listen on port 0 for dynamic assignment
      server = http.createServer(expressApp);

      server.listen(0, 'localhost', () => {
        const address = server?.address();
        if (address && typeof address === 'object') {
          console.log(`Embedded server listening on port ${address.port}`);
          resolve(address.port);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      server.on('error', (error) => {
        console.error('Server error:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function stopEmbeddedServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Embedded server stopped');
        server = null;
        resolve();
      });

      // Force close after timeout
      setTimeout(() => {
        if (server) {
          server.closeAllConnections?.();
          server = null;
        }
        resolve();
      }, 3000);
    } else {
      resolve();
    }
  });
}
