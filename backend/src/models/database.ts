// Try to use better-sqlite3, fallback to JSON database if not available
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

let db: any;
let useJsonDb = false;

try {
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '../../data/todo.db');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
} catch (error) {
  console.warn('better-sqlite3 not available, using JSON database fallback');
  useJsonDb = true;
  const jsonDb = require('./json-database');
  db = jsonDb.getDb();
}

export const initializeDatabase = () => {
  if (useJsonDb) {
    // JSON database initialization
    const jsonDb = require('./json-database');
    jsonDb.initializeDatabase();
  } else {
    // SQLite database initialization
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create groups table
    db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create tasks table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        group_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        deadline DATETIME,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
      )
    `);

    // Create indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON tasks(group_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
      CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
    `);

    // Create default admin user if it doesn't exist
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!existingUser) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);
      console.log('Default admin user created (username: admin, password: admin123)');
    }
  }
};

export const getDb = () => db;

export default db;

