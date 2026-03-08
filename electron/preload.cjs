const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('coursebook', {
  listCourses: () => ipcRenderer.invoke('courses:list'),
  getCourse: (id) => ipcRenderer.invoke('courses:get', id),
  createCourse: (payload) => ipcRenderer.invoke('courses:create', payload),
  archiveCourse: (courseId, githubUrl) => ipcRenderer.invoke('courses:archive', courseId, githubUrl),
  getCourseLibrary: (courseId) => ipcRenderer.invoke('courses:library', courseId),
  listChecks: (courseId) => ipcRenderer.invoke('checks:list', courseId),
  addCheck: (courseId, dayIndex) => ipcRenderer.invoke('checks:add', courseId, dayIndex),
  listHelpbook: () => ipcRenderer.invoke('helpbook:list'),
  createHelpbook: (payload) => ipcRenderer.invoke('helpbook:create', payload),
  updateHelpbook: (id, payload) => ipcRenderer.invoke('helpbook:update', id, payload),
  deleteHelpbook: (id) => ipcRenderer.invoke('helpbook:delete', id),
  listPrompts: () => ipcRenderer.invoke('prompts:list'),
  createPrompt: (payload) => ipcRenderer.invoke('prompts:create', payload),
  updatePrompt: (id, payload) => ipcRenderer.invoke('prompts:update', id, payload),
  deletePrompt: (id) => ipcRenderer.invoke('prompts:delete', id),
})
