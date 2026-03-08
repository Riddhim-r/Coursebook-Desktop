const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

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

const getArgValue = (args, flag) => {
  const index = args.indexOf(flag)
  if (index === -1 || index === args.length - 1) {
    return ''
  }
  return args[index + 1]
}

const args = process.argv.slice(1)
const dbPath = resolveDbPath(getArgValue(args, '--db-path'))

if (!fs.existsSync(dbPath)) {
  throw new Error(`SQLite file not found: ${dbPath}`)
}

const db = new Database(dbPath, { readonly: true })

const counts = {
  courses: db.prepare('SELECT COUNT(*) AS count FROM courses').get().count,
  checks: db.prepare('SELECT COUNT(*) AS count FROM course_day_checks').get().count,
  helpbook: db.prepare('SELECT COUNT(*) AS count FROM helpbook_entries').get().count,
  prompts: db.prepare('SELECT COUNT(*) AS count FROM ai_prompt_entries').get().count,
}

const courses = db
  .prepare('SELECT id, title, status, start_date, num_days FROM courses ORDER BY datetime(created_at) DESC')
  .all()

const helpbookTitles = db.prepare('SELECT title FROM helpbook_entries ORDER BY datetime(created_at) DESC').all()

console.log(`SQLite file: ${dbPath}`)
console.log(`Courses: ${counts.courses}`)
console.log(`Day checks: ${counts.checks}`)
console.log(`Helpbook entries: ${counts.helpbook}`)
console.log(`AI prompts: ${counts.prompts}`)

if (courses.length > 0) {
  console.log('Course titles:')
  for (const course of courses) {
    console.log(`- ${course.title} [${course.status}] (${course.start_date}, ${course.num_days} days)`)
  }
}

if (helpbookTitles.length > 0) {
  console.log('Helpbook titles:')
  for (const entry of helpbookTitles) {
    console.log(`- ${entry.title}`)
  }
}
