import express from 'express';
import path from 'path';
import ideasRouter from './routes/ideas';
import generateRouter from './routes/generate';
import componentsRouter from './routes/components';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// API Routes
app.use('/api/ideas', ideasRouter);
app.use('/api/generate', generateRouter);
app.use('/api/components', componentsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(__dirname, '../client');
  app.use(express.static(clientPath));

  app.get('*', (req, res) => {
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
