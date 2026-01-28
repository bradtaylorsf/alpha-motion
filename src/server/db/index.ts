import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Determine database path
// In Electron, use userData path set by main process
// Otherwise, use local data directory
function getDatabasePath(): string {
  if (process.env.ELECTRON_DB_PATH) {
    // Ensure parent directory exists for Electron path
    const dir = path.dirname(process.env.ELECTRON_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return process.env.ELECTRON_DB_PATH;
  }

  // Default: local data directory
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.resolve(dataDir, 'answer-motion.db');
}

const dbPath = getDatabasePath();
const sqlite = new Database(dbPath);

// Auto-create tables if they don't exist (for first-run in Electron)
function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      prompt_used TEXT,
      idea_json TEXT,
      source_code TEXT,
      tags TEXT,
      duration_frames INTEGER DEFAULT 150,
      fps INTEGER DEFAULT 30,
      width INTEGER DEFAULT 1920,
      height INTEGER DEFAULT 1080,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      component_id TEXT REFERENCES components(id),
      name TEXT NOT NULL,
      type TEXT,
      source TEXT,
      file_path TEXT,
      prompt_used TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collection_components (
      collection_id TEXT NOT NULL REFERENCES collections(id),
      component_id TEXT NOT NULL REFERENCES components(id),
      position INTEGER,
      PRIMARY KEY (collection_id, component_id)
    );

    CREATE TABLE IF NOT EXISTS pending_ideas (
      id TEXT PRIMARY KEY,
      idea_json TEXT NOT NULL,
      settings_json TEXT NOT NULL,
      asset_ids TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initializeDatabase();

export const db = drizzle(sqlite, { schema });

export { schema };
