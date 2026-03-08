import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Course } from '../lib/types'
import { desktopApi } from '../lib/desktopApi'

type CoursesListProps = {
  role: 'admin' | 'user'
}

const CoursesList = ({ role }: CoursesListProps) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  const statusFilter = searchParams.get('status') === 'archived' ? 'archived' : 'active'

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const items = await desktopApi.listCourses()
        setCourses(items)
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load courses.')
      }
      setIsLoading(false)
    }

    loadCourses()
  }, [])

  const visibleCourses = useMemo(() => {
    if (role === 'admin') {
      return courses
    }
    return courses.filter((course) => course.status === statusFilter)
  }, [courses, role, statusFilter])

  const headerTitle = role === 'admin' ? 'All Courses' : statusFilter === 'archived' ? 'Archived Courses' : 'Active Courses'

  return (
    <div className="page">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-text">Coursebook</span>
        </div>
        <div className="nav-actions">
          {role === 'user' ? (
            <Link
              className="btn ghost"
              to={statusFilter === 'archived' ? '/user/courses' : '/user/courses?status=archived'}
            >
              {statusFilter === 'archived' ? 'Active Courses' : 'Archived Courses'}
            </Link>
          ) : null}
          <Link className="btn ghost" to={role === 'admin' ? '/admin' : '/user'}>
            Back
          </Link>
        </div>
      </header>
      <div className="content">
        <div className="page-header">
          <div>
            <h1>{headerTitle}</h1>
            <p>Active, archived, and upcoming courses will appear here.</p>
          </div>
          {role === 'admin' ? (
            <Link className="btn primary" to="/admin/create-course">
              Create Course
            </Link>
          ) : null}
        </div>

        {isLoading ? <div className="card">Loading courses...</div> : null}
        {error ? <div className="card">{error}</div> : null}

        {!isLoading && !error && visibleCourses.length === 0 ? (
          <div className="card empty-state">
            <h3>No courses yet</h3>
            <p>Once a course is created, this view will show its daily units and progress.</p>
          </div>
        ) : null}

        {!isLoading && !error && visibleCourses.length > 0 ? (
          <div className="stack">
            {visibleCourses.map((course) =>
              role === 'admin' ? (
                <div className="card link-card" key={course.id}>
                  <div className="card-head">
                    <div>
                      <h3>{course.title}</h3>
                      <p>{course.description ?? 'No description yet.'}</p>
                    </div>
                    <span className="pill">{course.status}</span>
                  </div>
                  <div className="pill-row">
                    <span className="pill">Start: {course.startDate}</span>
                    <span className="pill">{course.numDays} days</span>
                  </div>
                  <div className="card-actions">
                    <Link className="btn ghost" to={`/admin/courses/${course.id}`}>
                      View
                    </Link>
                  </div>
                </div>
              ) : (
                <Link className="card link-card" key={course.id} to={`/${role}/courses/${course.id}`}>
                  <div className="card-head">
                    <div>
                      <h3>{course.title}</h3>
                      <p>{course.description ?? 'No description yet.'}</p>
                    </div>
                    <span className="pill">{course.status}</span>
                  </div>
                  <div className="pill-row">
                    <span className="pill">Start: {course.startDate}</span>
                    <span className="pill">{course.numDays} days</span>
                  </div>
                </Link>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CoursesList
