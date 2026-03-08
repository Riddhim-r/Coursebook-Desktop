export type CourseStatus = 'active' | 'archived'

export type Course = {
  id: string
  title: string
  description?: string
  startDate: string
  numDays: number
  status: CourseStatus
  createdAt?: string
}