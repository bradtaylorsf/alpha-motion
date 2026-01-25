import express from 'express';
import path from 'path';
import ideasRouter from './routes/ideas';
import generateRouter from './routes/generate';
import componentsRouter from './routes/components';
import assetsRouter from './routes/assets';
import pendingIdeasRouter from './routes/pending-ideas';
import renderRouter from './routes/render';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Serve generated assets
const publicPath = path.resolve(process.cwd(), 'public');
app.use('/assets', express.static(path.join(publicPath, 'assets')));

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
  const clientPath = path.resolve(__dirname, '../client');
  app.use(express.static(clientPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

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
