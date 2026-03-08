export {}

declare global {
  interface Window {
    coursebook?: {
      listCourses: () => Promise<any[]>
      getCourse: (id: string) => Promise<any | null>
      createCourse: (payload: any) => Promise<{ id: string }>
      archiveCourse: (courseId: string, githubUrl: string) => Promise<{ ok: true }>
      getCourseLibrary: (courseId: string) => Promise<any | null>
      listChecks: (courseId: string) => Promise<number[]>
      addCheck: (courseId: string, dayIndex: number) => Promise<{ ok: true }>
      listHelpbook: () => Promise<any[]>
      createHelpbook: (payload: any) => Promise<{ id: string }>
      updateHelpbook: (id: string, payload: any) => Promise<{ ok: true }>
      deleteHelpbook: (id: string) => Promise<{ ok: true }>
      listPrompts: () => Promise<any[]>
      createPrompt: (payload: any) => Promise<{ id: string }>
      updatePrompt: (id: string, payload: any) => Promise<{ ok: true }>
      deletePrompt: (id: string) => Promise<{ ok: true }>
    }
  }
}
