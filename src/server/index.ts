import express from 'express';
import path from 'path';
import ideasRouter from './routes/ideas';
import generateRouter from './routes/generate';
import componentsRouter from './routes/components';
import assetsRouter from './routes/assets';
import pendingIdeasRouter from './routes/pending-ideas';
import renderRouter from './routes/render';

export const app = express();
const PORT = process.env.PORT || 3001;

// Check if running as embedded server in Electron
const isEmbedded = !!process.env.ELECTRON_DB_PATH;

// Middleware
app.use(express.json());

// Serve generated assets
const isElectron = !!process.env.ELECTRON_DB_PATH;

if (isElectron) {
  // In Electron, serve user-generated files from userData directory
  const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH!);

  // Uploaded files (from user uploads)
  const uploadsDir = path.join(userDataDir, 'uploads');
  app.use('/assets/uploaded', express.static(uploadsDir));

  // Generated images (from AI image generation)
  const generatedDir = path.join(userDataDir, 'generated');
  app.use('/assets/generated', express.static(generatedDir));

  // Rendered videos (from video export)
  const rendersDir = path.join(userDataDir, 'renders');
  app.use('/assets/renders', express.static(rendersDir));

  // Serve other static assets from app bundle (using ELECTRON_APP_ROOT)
  const appPublicPath = process.env.ELECTRON_APP_ROOT
    ? path.join(process.env.ELECTRON_APP_ROOT, '..', 'public', 'assets')
    : path.resolve(__dirname, '../../public/assets');
  app.use('/assets', express.static(appPublicPath));
} else {
  // Development: serve from local public folder
  const publicPath = path.resolve(process.cwd(), 'public');
  app.use('/assets', express.static(path.join(publicPath, 'assets')));
}

// API Routes
app.use('/api/ideas', ideasRouter);
app.use('/api/generate', generateRouter);
app.use('/api/components', componentsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/pending-ideas', pendingIdeasRouter);
app.use('/api/render', renderRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // In Electron, use ELECTRON_APP_ROOT which is set by the main process
  // This avoids issues with esbuild transforming __dirname at bundle time
  const clientPath = process.env.ELECTRON_APP_ROOT
    ? path.join(process.env.ELECTRON_APP_ROOT, 'client')
    : path.resolve(__dirname, '../client');

  app.use(express.static(clientPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Only start listening if not embedded (i.e., running standalone)
if (!isEmbedded) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API endpoints:');
    console.log('  POST /api/ideas/random  - Generate random animation idea');
    console.log('  POST /api/ideas/expand  - Expand user idea');
    console.log('  POST /api/generate      - Start component generation');
    console.log('  GET  /api/generate/:id/status - Check generation status');
    console.log('  GET  /api/components    - List all components');
    console.log('  GET  /api/components/:id - Get single component');
    console.log('  POST /api/assets/generate - Generate image asset');
    console.log('  POST /api/assets/generate/batch - Generate multiple images');
    console.log('  GET  /api/assets        - List all assets');
    console.log('  POST /api/render        - Start video render');
    console.log('  GET  /api/render/:id/status - Check render status');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Try: lsof -ti:${PORT} | xargs kill -9`);
      process.exit(1);
    }
    throw err;
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    // Force exit after 3 seconds
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
