const { randomUUID } = require('node:crypto')
const { ipcMain } = require('electron')
const { ensureDatabase } = require('./db.cjs')

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const mapCourseRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  startDate: row.start_date,
  numDays: row.num_days,
  status: row.status,
  createdAt: row.created_at ?? undefined,
})

const registerIpcHandlers = () => {
  const db = ensureDatabase()

  ipcMain.handle('courses:list', async () => {
    const rows = db
      .prepare(
        `
        SELECT id, title, description, start_date, num_days, status, created_at
        FROM courses
        ORDER BY datetime(created_at) DESC
      `,
      )
      .all()

    return rows.map(mapCourseRow)
  })

  ipcMain.handle('courses:get', async (_event, id) => {
    const row = db
      .prepare(
        `
        SELECT id, title, description, start_date, num_days, status, content_library, day_plan, github_project_url
        FROM courses
        WHERE id = ?
      `,
      )
      .get(id)

    if (!row) {
      return null
    }

    return {
      ...row,
      content_library: safeJsonParse(row.content_library, []),
      day_plan: safeJsonParse(row.day_plan, []),
    }
  })

  ipcMain.handle('courses:create', async (_event, payload) => {
    const id = randomUUID()
    db.prepare(
      `
      INSERT INTO courses (id, title, description, start_date, num_days, status, content_library, day_plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      payload.title.trim(),
      payload.description ?? null,
      payload.start_date,
      payload.num_days,
      payload.status ?? 'active',
      JSON.stringify(payload.content_library ?? []),
      JSON.stringify(payload.day_plan ?? []),
    )

    return { id }
  })

  ipcMain.handle('courses:archive', async (_event, courseId, githubUrl) => {
    db.prepare(`UPDATE courses SET status = 'archived', github_project_url = ? WHERE id = ?`).run(
      githubUrl,
      courseId,
    )
    return { ok: true }
  })

  ipcMain.handle('courses:library', async (_event, courseId) => {
    const row = db.prepare(`SELECT title, content_library FROM courses WHERE id = ?`).get(courseId)
    if (!row) {
      return null
    }
    return {
      title: row.title,
      content_library: safeJsonParse(row.content_library, []),
    }
  })

  ipcMain.handle('checks:list', async (_event, courseId) => {
    const rows = db.prepare(`SELECT day_index FROM course_day_checks WHERE course_id = ?`).all(courseId)
    return rows.map((row) => row.day_index)
  })

  ipcMain.handle('checks:add', async (_event, courseId, dayIndex) => {
    db.prepare(`INSERT OR IGNORE INTO course_day_checks (course_id, day_index) VALUES (?, ?)`).run(
      courseId,
      dayIndex,
    )
    return { ok: true }
  })

  ipcMain.handle('helpbook:list', async () => {
    const rows = db
      .prepare(`SELECT id, title, tags, steps FROM helpbook_entries ORDER BY datetime(created_at) DESC`)
      .all()
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      tags: safeJsonParse(row.tags, []),
      steps: safeJsonParse(row.steps, []),
    }))
  })

  ipcMain.handle('helpbook:create', async (_event, payload) => {
    const id = randomUUID()
    db.prepare(`INSERT INTO helpbook_entries (id, title, tags, steps) VALUES (?, ?, ?, ?)`).run(
      id,
      payload.title.trim(),
      JSON.stringify(payload.tags ?? []),
      JSON.stringify(payload.steps ?? []),
    )
    return { id }
  })

  ipcMain.handle('helpbook:update', async (_event, id, payload) => {
    db.prepare(`UPDATE helpbook_entries SET title = ?, tags = ?, steps = ? WHERE id = ?`).run(
      payload.title.trim(),
      JSON.stringify(payload.tags ?? []),
      JSON.stringify(payload.steps ?? []),
      id,
    )
    return { ok: true }
  })

  ipcMain.handle('helpbook:delete', async (_event, id) => {
    db.prepare(`DELETE FROM helpbook_entries WHERE id = ?`).run(id)
    return { ok: true }
  })

  ipcMain.handle('prompts:list', async () => {
    const rows = db
      .prepare(`SELECT id, title, tags, steps FROM ai_prompt_entries ORDER BY datetime(created_at) DESC`)
      .all()
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      tags: safeJsonParse(row.tags, []),
      steps: safeJsonParse(row.steps, []),
    }))
  })

  ipcMain.handle('prompts:create', async (_event, payload) => {
    const id = randomUUID()
    db.prepare(`INSERT INTO ai_prompt_entries (id, title, tags, steps) VALUES (?, ?, ?, ?)`).run(
      id,
      payload.title.trim(),
      JSON.stringify(payload.tags ?? []),
      JSON.stringify(payload.steps ?? []),
    )
    return { id }
  })

  ipcMain.handle('prompts:update', async (_event, id, payload) => {
    db.prepare(`UPDATE ai_prompt_entries SET title = ?, tags = ?, steps = ? WHERE id = ?`).run(
      payload.title.trim(),
      JSON.stringify(payload.tags ?? []),
      JSON.stringify(payload.steps ?? []),
      id,
    )
    return { ok: true }
  })

  ipcMain.handle('prompts:delete', async (_event, id) => {
    db.prepare(`DELETE FROM ai_prompt_entries WHERE id = ?`).run(id)
    return { ok: true }
  })
}

module.exports = { registerIpcHandlers }
