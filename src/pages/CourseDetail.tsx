import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { desktopApi } from '../lib/desktopApi'
import ConfirmDialog from '../components/ConfirmDialog'

type ContentKind = 'link' | 'playlist'

type ContentItem = {
  id: string
  url: string
  title: string
  kind: ContentKind
  totalVideos?: number
}

type AssignedItem = {
  id: string
  contentId: string
  url: string
  title: string
  kind: ContentKind
  videos?: number
}

type DayPlan = {
  dayIndex: number
  dateLabel: string
  items: AssignedItem[]
}

type CourseDetailProps = {
  role: 'admin' | 'user'
}

const CourseDetail = ({ role }: CourseDetailProps) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [course, setCourse] = useState<any>(null)
  const [checkedDays, setCheckedDays] = useState<number[]>([])
  const [githubUrl, setGithubUrl] = useState('')
  const [archiveStatus, setArchiveStatus] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [pendingCheckDay, setPendingCheckDay] = useState<number | null>(null)

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) {
        setError('Missing course id.')
        setIsLoading(false)
        return
      }

      try {
        const data = await desktopApi.getCourse(id)
        if (!data) {
          setError('Course not found.')
          setIsLoading(false)
          return
        }
        setCourse(data)
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load course.')
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }

    loadCourse()
  }, [id])

  useEffect(() => {
    if (role !== 'user' || !id) {
      return
    }

    const loadChecks = async () => {
      try {
        const indexes = await desktopApi.listChecks(id)
        setCheckedDays(indexes)
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load checklist state.')
      }
    }

    loadChecks()
  }, [id, role])

  const library = (course?.content_library ?? []) as ContentItem[]
  const dayPlan = (course?.day_plan ?? []) as DayPlan[]
  const playlistCounters = new Map<string, number>()

  const dayPlanWithRanges = dayPlan.map((day) => {
    const items = day.items.map((item) => {
      if (item.kind === 'playlist' && item.videos) {
        const start = (playlistCounters.get(item.contentId) ?? 0) + 1
        const end = start + item.videos - 1
        playlistCounters.set(item.contentId, end)
        return {
          ...item,
          rangeLabel: `${item.title} - vid no. ${start} to ${end}`,
        }
      }

      return {
        ...item,
        rangeLabel: item.title,
      }
    })

    return {
      ...day,
      items,
    }
  })

  const dayDeadline = (dayIndex: number) => {
    if (!course?.start_date) {
      return null
    }
    const base = new Date(course.start_date)
    base.setDate(base.getDate() + (dayIndex - 1))
    base.setHours(23, 59, 59, 999)
    return base
  }

  const isPastDeadline = (dayIndex: number) => {
    const deadline = dayDeadline(dayIndex)
    if (!deadline) {
      return false
    }
    return new Date() > deadline
  }

  const handleCheckDay = (dayIndex: number) => {
    setPendingCheckDay(dayIndex)
  }

  const confirmCheckDay = async () => {
    if (!id || pendingCheckDay === null) {
      return
    }

    try {
      await desktopApi.addCheck(id, pendingCheckDay)
    } catch (saveError) {
      console.error(saveError)
      setError('Unable to save checklist.')
      return
    }

    setCheckedDays((prev) => [...prev, pendingCheckDay])
    setPendingCheckDay(null)
  }

  const checkedSet = useMemo(() => new Set(checkedDays), [checkedDays])
  const allDaysChecked = dayPlan.length > 0 && dayPlan.every((day) => checkedSet.has(day.dayIndex))
  const toExternalUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) {
      return '#'
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }
    return `https://${trimmed}`
  }

  const handleArchive = async () => {
    if (!id) {
      return
    }
    if (!githubUrl.trim()) {
      setArchiveStatus('Please provide the GitHub project link before archiving.')
      return
    }

    setArchiveStatus(null)
    setIsArchiving(true)

    try {
      await desktopApi.archiveCourse(id, githubUrl.trim())
    } catch (archiveError) {
      console.error(archiveError)
      setArchiveStatus('Unable to archive course.')
      setIsArchiving(false)
      return
    }

    setIsArchiving(false)
    navigate('/user')
  }

  return (
    <div className="page">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-text">Coursebook</span>
        </div>
        <div className="nav-actions">
          <Link className="btn ghost" to={role === 'admin' ? '/admin/courses' : '/user/courses'}>
            Back
          </Link>
        </div>
      </header>

      <div className="content">
        <ConfirmDialog
          open={pendingCheckDay !== null}
          title="Mark Day Complete?"
          message="This action is permanent and cannot be reversed."
          confirmText="Mark Complete"
          cancelText="Cancel"
          onCancel={() => setPendingCheckDay(null)}
          onConfirm={confirmCheckDay}
        />

        {isLoading ? <div className="card">Loading course...</div> : null}
        {error ? <div className="card">{error}</div> : null}

        {!isLoading && !error && course ? (
          <>
            <div className="page-header">
              <div>
                <h1>{course.title}</h1>
                <p>{course.description ?? 'No description yet.'}</p>
              </div>
              <span className="pill">{course.status}</span>
            </div>

            <div className="grid">
              <div className="card">
                <h3>Start date</h3>
                <p className="metric">{course.start_date}</p>
              </div>
              <div className="card">
                <h3>Duration</h3>
                <p className="metric">{course.num_days} days</p>
              </div>
              <div className="card">
                <h3>Content items</h3>
                <p className="metric">{library.length}</p>
                {role === 'user' && id ? (
                  <div className="metric-card-footer">
                    <Link className="inline-link" to={`/user/courses/${id}/library`}>
                      Click to view the content library
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            {role === 'admin' ? (
              <div className="card">
                <h3>Content Library</h3>
                <div className="stack">
                  {library.length === 0 ? <p className="muted">No content items saved.</p> : null}
                  {library.map((item) => (
                    <div className="card compact" key={item.id}>
                      <div className="card-head">
                        <div>
                          <h4>{item.title}</h4>
                          <p className="muted">{item.url}</p>
                        </div>
                        <div className="pill-row">
                          <span className="pill">{item.kind === 'playlist' ? 'Playlist' : 'Link'}</span>
                          {item.kind === 'playlist' ? (
                            <span className="pill">{item.totalVideos} videos</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="card-actions">
                        <a
                          className="btn ghost"
                          href={toExternalUrl(item.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Link
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="stack">
              {dayPlanWithRanges.length === 0 ? (
                <div className="card">No daily plan saved.</div>
              ) : (
                dayPlanWithRanges.map((day) => {
                  const isChecked = checkedSet.has(day.dayIndex)
                  const pastDeadline = isPastDeadline(day.dayIndex)
                  const disabled = role === 'user' && (isChecked || pastDeadline)

                  return (
                    <div className={disabled ? 'card checklist-item locked' : 'card checklist-item'} key={day.dayIndex}>
                      <div className="card-head">
                        <div>
                          <h4>Day {day.dayIndex}</h4>
                          <p className="muted">{day.dateLabel}</p>
                        </div>
                        {role === 'user' ? (
                          <label className="check-toggle">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabled}
                              onChange={() => handleCheckDay(day.dayIndex)}
                            />
                            <span>{isChecked ? 'Done' : pastDeadline ? 'Missed' : 'Mark done'}</span>
                          </label>
                        ) : (
                          <span className="pill">{day.items.length} items</span>
                        )}
                      </div>
                      <div className="stack">
                        {day.items.map((item) => (
                          <div className="assigned-item" key={item.id}>
                            <div>
                              <strong>{item.rangeLabel}</strong>
                              <p className="muted">{item.url}</p>
                            </div>
                            <a
                              className="btn ghost"
                              href={toExternalUrl(item.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open Link
                            </a>
                            {item.kind === 'playlist' ? (
                              <span className="pill">{item.videos} videos</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {course.github_project_url ? (
              <div className="card archive-card">
                <h3>Final project link</h3>
                <p className="muted">{course.github_project_url}</p>
              </div>
            ) : null}

            {role === 'user' && course.status !== 'archived' && allDaysChecked ? (
              <div className="card archive-card">
                <h3>Submit final project</h3>
                <p className="muted">All days complete. Add the GitHub link to archive this course.</p>
                <label className="field">
                  <span>GitHub project link</span>
                  <input
                    type="url"
                    placeholder="https://github.com/you/project"
                    value={githubUrl}
                    onChange={(event) => setGithubUrl(event.target.value)}
                  />
                </label>
                <button className="btn primary" type="button" disabled={isArchiving} onClick={handleArchive}>
                  {isArchiving ? 'Archiving...' : 'Submit & Archive'}
                </button>
                {archiveStatus ? <p className="muted">{archiveStatus}</p> : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

export default CourseDetail



