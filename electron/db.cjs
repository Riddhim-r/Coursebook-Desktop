const path = require('node:path')
const fs = require('node:fs')
const { app } = require('electron')
const Database = require('better-sqlite3')

let db

const ensureDatabase = () => {
  if (db) {
    return db
  }

  const userDataPath = app.getPath('userData')
  fs.mkdirSync(userDataPath, { recursive: true })

  const dbPath = path.join(userDataPath, 'coursebook.db')
  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  return db
}

const runMigrations = (database) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      num_days INTEGER NOT NULL CHECK (num_days > 0),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
      content_library TEXT NOT NULL DEFAULT '[]',
      day_plan TEXT NOT NULL DEFAULT '[]',
      github_project_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS course_day_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id TEXT NOT NULL,
      day_index INTEGER NOT NULL CHECK (day_index > 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (course_id, day_index),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS helpbook_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_prompt_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

module.exports = { ensureDatabase }
