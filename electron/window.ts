import { app, BrowserWindow, shell } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

export interface WindowOptions {
  serverPort: number;
  isDev: boolean;
}

export function createMainWindow(options: WindowOptions): BrowserWindow {
  const { serverPort, isDev } = options;

  // Use app.getAppPath() for reliable path resolution in packaged apps
  // In dev mode, __dirname works fine, but in production we need the app path
  const preloadPath = isDev
    ? path.join(__dirname, 'preload.cjs')
    : path.join(app.getAppPath(), 'electron-dist', 'preload.cjs');

  console.log('Preload path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Answer Motion',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for keytar
    },
    show: false, // Show when ready to prevent visual flash
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load from built files
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
