const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

const DEFAULT_SUPABASE_URL = 'https://zwfhkgijtagpzuqvusfu.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZmhrZ2lqdGFncHp1cXZ1c2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTM1OTgsImV4cCI6MjA4NTY4OTU5OH0.zQYf7YpmvrVZMpVOQ_Jfd5OdIIpvOWrInVRlSt54YcE'

const parseArgs = () => {
  const args = process.argv.slice(2)
  return {
    reset: args.includes('--reset'),
    dbPath: getArgValue(args, '--db-path'),
    url: getArgValue(args, '--supabase-url') || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey:
      getArgValue(args, '--supabase-anon-key') ||
      process.env.SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_ANON_KEY,
  }
}

const getArgValue = (args, flag) => {
  const index = args.indexOf(flag)
  if (index === -1 || index === args.length - 1) {
    return ''
  }
  return args[index + 1]
}

const resolveDbPath = (explicitDbPath) => {
  if (explicitDbPath) {
    return path.resolve(explicitDbPath)
  }

  const appData = process.env.APPDATA
  if (!appData) {
    throw new Error('APPDATA is not available. Pass --db-path explicitly.')
  }

  const candidates = [
    path.join(appData, 'Coursebook', 'coursebook.db'),
    path.join(appData, 'coursebook', 'coursebook.db'),
  ]

  const existing = candidates.find((candidate) => fs.existsSync(candidate))
  return existing || candidates[0]
}

const ensureSchema = (db) => {
  db.pragma('foreign_keys = ON')
  db.exec(`
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

const fetchAllRows = async (baseUrl, anonKey, table) => {
  const pageSize = 1000
  let offset = 0
  const allRows = []

  while (true) {
    const url = new URL(`/rest/v1/${table}`, baseUrl)
    url.searchParams.set('select', '*')
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('limit', String(pageSize))

    const response = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Supabase fetch failed for ${table}: ${response.status} ${body}`)
    }

    const rows = await response.json()
    allRows.push(...rows)

    if (rows.length < pageSize) {
      break
    }
    offset += pageSize
  }

  return allRows
}

const resetTables = (db) => {
  db.exec(`
    DELETE FROM course_day_checks;
    DELETE FROM courses;
    DELETE FROM helpbook_entries;
    DELETE FROM ai_prompt_entries;
  `)
}

const migrate = async () => {
  const options = parseArgs()
  const dbPath = resolveDbPath(options.dbPath)
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  const db = new Database(dbPath)
  ensureSchema(db)

  if (options.reset) {
    resetTables(db)
  }

  console.log(`Using SQLite file: ${dbPath}`)
  console.log(`Reading Supabase data from: ${options.url}`)

  const [courses, checks, helpbookEntries, promptEntries] = await Promise.all([
    fetchAllRows(options.url, options.anonKey, 'courses'),
    fetchAllRows(options.url, options.anonKey, 'course_day_checks'),
    fetchAllRows(options.url, options.anonKey, 'helpbook_entries'),
    fetchAllRows(options.url, options.anonKey, 'ai_prompt_entries'),
  ])

  const upsertCourse = db.prepare(`
    INSERT INTO courses (
      id, title, description, start_date, num_days, status, content_library, day_plan, github_project_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      start_date = excluded.start_date,
      num_days = excluded.num_days,
      status = excluded.status,
      content_library = excluded.content_library,
      day_plan = excluded.day_plan,
      github_project_url = excluded.github_project_url,
      created_at = excluded.created_at
  `)

  const insertCheck = db.prepare(`
    INSERT OR IGNORE INTO course_day_checks (course_id, day_index, created_at)
    VALUES (?, ?, ?)
  `)

  const upsertHelpbook = db.prepare(`
    INSERT INTO helpbook_entries (id, title, tags, steps, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      tags = excluded.tags,
      steps = excluded.steps,
      created_at = excluded.created_at
  `)

  const upsertPrompt = db.prepare(`
    INSERT INTO ai_prompt_entries (id, title, tags, steps, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      tags = excluded.tags,
      steps = excluded.steps,
      created_at = excluded.created_at
  `)

  const migrateTransaction = db.transaction(() => {
    for (const course of courses) {
      upsertCourse.run(
        String(course.id),
        course.title,
        course.description ?? null,
        course.start_date,
        Number(course.num_days),
        course.status ?? 'active',
        JSON.stringify(course.content_library ?? []),
        JSON.stringify(course.day_plan ?? []),
        course.github_project_url ?? null,
        course.created_at ?? new Date().toISOString(),
      )
    }

    for (const check of checks) {
      insertCheck.run(String(check.course_id), Number(check.day_index), check.created_at ?? new Date().toISOString())
    }

    for (const entry of helpbookEntries) {
      upsertHelpbook.run(
        String(entry.id),
        entry.title,
        JSON.stringify(entry.tags ?? []),
        JSON.stringify(entry.steps ?? []),
        entry.created_at ?? new Date().toISOString(),
      )
    }

    for (const entry of promptEntries) {
      upsertPrompt.run(
        String(entry.id),
        entry.title,
        JSON.stringify(entry.tags ?? []),
        JSON.stringify(entry.steps ?? []),
        entry.created_at ?? new Date().toISOString(),
      )
    }
  })

  migrateTransaction()

  console.log(`Migrated courses: ${courses.length}`)
  console.log(`Migrated day checks: ${checks.length}`)
  console.log(`Migrated helpbook entries: ${helpbookEntries.length}`)
  console.log(`Migrated AI prompts: ${promptEntries.length}`)
  console.log('Migration complete.')
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})
