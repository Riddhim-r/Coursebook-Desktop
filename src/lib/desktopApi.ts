type HelpPromptPayload = {
  title: string
  tags: string[]
  steps: string[]
}

type CreateCoursePayload = {
  title: string
  description: string | null
  start_date: string
  num_days: number
  status: 'active' | 'archived'
  content_library: unknown[]
  day_plan: unknown[]
}

const ensureDesktopApi = () => {
  if (!window.coursebook) {
    throw new Error('Desktop API unavailable. Launch this app through Electron.')
  }
  return window.coursebook
}

export const desktopApi = {
  listCourses: () => ensureDesktopApi().listCourses(),
  getCourse: (id: string) => ensureDesktopApi().getCourse(id),
  createCourse: (payload: CreateCoursePayload) => ensureDesktopApi().createCourse(payload),
  archiveCourse: (courseId: string, githubUrl: string) => ensureDesktopApi().archiveCourse(courseId, githubUrl),
  getCourseLibrary: (courseId: string) => ensureDesktopApi().getCourseLibrary(courseId),
  listChecks: (courseId: string) => ensureDesktopApi().listChecks(courseId),
  addCheck: (courseId: string, dayIndex: number) => ensureDesktopApi().addCheck(courseId, dayIndex),
  listHelpbook: () => ensureDesktopApi().listHelpbook(),
  createHelpbook: (payload: HelpPromptPayload) => ensureDesktopApi().createHelpbook(payload),
  updateHelpbook: (id: string, payload: HelpPromptPayload) => ensureDesktopApi().updateHelpbook(id, payload),
  deleteHelpbook: (id: string) => ensureDesktopApi().deleteHelpbook(id),
  listPrompts: () => ensureDesktopApi().listPrompts(),
  createPrompt: (payload: HelpPromptPayload) => ensureDesktopApi().createPrompt(payload),
  updatePrompt: (id: string, payload: HelpPromptPayload) => ensureDesktopApi().updatePrompt(id, payload),
  deletePrompt: (id: string) => ensureDesktopApi().deletePrompt(id),
}
