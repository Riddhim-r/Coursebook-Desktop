import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import LogoutButton from '../components/LogoutButton'
import PageHeader from '../components/PageHeader'
import { desktopApi } from '../lib/desktopApi'

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

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const isPlaylistUrl = (url: string) => {
  const lowered = url.toLowerCase()
  return lowered.includes('youtube.com/playlist') || lowered.includes('list=')
}

const formatDateLabel = (baseDate: string, offset: number) => {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const CreateCourse = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [numDays, setNumDays] = useState(30)

  const [contentUrl, setContentUrl] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  const [playlistTotal, setPlaylistTotal] = useState('')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])

  const [days, setDays] = useState<DayPlan[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [assignTargetByContent, setAssignTargetByContent] = useState<Record<string, number>>({})
  const [assignVideosByContent, setAssignVideosByContent] = useState<Record<string, number>>({})
  const lastScheduleKey = useRef('')

  const playlistTotals = useMemo(() => {
    const totals = new Map<string, number>()
    contentItems.forEach((item) => {
      if (item.kind === 'playlist' && item.totalVideos) {
        totals.set(item.id, item.totalVideos)
      }
    })
    return totals
  }, [contentItems])

  const playlistAssigned = useMemo(() => {
    const assigned = new Map<string, number>()
    days.forEach((day) => {
      day.items.forEach((item) => {
        if (item.kind === 'playlist' && item.videos) {
          assigned.set(item.contentId, (assigned.get(item.contentId) ?? 0) + item.videos)
        }
      })
    })
    return assigned
  }, [days])

  const getPlaylistRemaining = (contentId: string) => {
    const total = playlistTotals.get(contentId) ?? 0
    const used = playlistAssigned.get(contentId) ?? 0
    return Math.max(total - used, 0)
  }

  const isLinkAssigned = (contentId: string) =>
    days.some((day) => day.items.some((item) => item.contentId === contentId))

  const visibleContentItems = useMemo(
    () =>
      contentItems.filter((item) =>
        item.kind === 'playlist' ? getPlaylistRemaining(item.id) > 0 : !isLinkAssigned(item.id),
      ),
    [contentItems, days, playlistAssigned, playlistTotals],
  )

  useEffect(() => {
    if (!isDragging) {
      return
    }

    const handleDragOver = (event: DragEvent) => {
      const threshold = 110
      const scrollSpeed = 22
      if (event.clientY < threshold) {
        window.scrollBy(0, -scrollSpeed)
      } else if (window.innerHeight - event.clientY < threshold) {
        window.scrollBy(0, scrollSpeed)
      }
    }

    window.addEventListener('dragover', handleDragOver)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
    }
  }, [isDragging])

  const resetSchedule = () => {
    const key = `${startDate}|${numDays}`
    if (!startDate || numDays < 1) {
      setDays([])
      return
    }

    if (lastScheduleKey.current && lastScheduleKey.current !== key) {
      setDays([])
    }

    lastScheduleKey.current = key
    const nextDays: DayPlan[] = Array.from({ length: numDays }, (_, index) => ({
      dayIndex: index + 1,
      dateLabel: formatDateLabel(startDate, index),
      items: [],
    }))
    setDays(nextDays)
  }

  const handleAddContent = () => {
    setStatus(null)
    const trimmedUrl = contentUrl.trim()
    const trimmedTitle = contentTitle.trim() || 'Untitled resource'

    if (!trimmedUrl) {
      setStatus('Add a URL before saving.')
      return
    }

    const playlist = isPlaylistUrl(trimmedUrl)
    if (playlist) {
      const total = Number(playlistTotal)
      if (!total || total < 1) {
        setStatus('Enter the total number of videos for this playlist.')
        return
      }

      setContentItems((prev) => [
        ...prev,
        {
          id: makeId(),
          url: trimmedUrl,
          title: trimmedTitle,
          kind: 'playlist',
          totalVideos: total,
        },
      ])
    } else {
      setContentItems((prev) => [
        ...prev,
        {
          id: makeId(),
          url: trimmedUrl,
          title: trimmedTitle,
          kind: 'link',
        },
      ])
    }

    setContentUrl('')
    setContentTitle('')
    setPlaylistTotal('')
  }

  const handleRemoveContent = (contentId: string) => {
    setContentItems((prev) => prev.filter((item) => item.id !== contentId))
    setDays((prev) =>
      prev.map((day) => ({
        ...day,
        items: day.items.filter((item) => item.contentId !== contentId),
      })),
    )
  }

  const assignContentToDay = (dayIndex: number, contentId: string, requestedVideos?: number) => {
    setStatus(null)
    const content = contentItems.find((item) => item.id === contentId)
    if (!content) {
      return
    }

    setDays((prev) =>
      prev.map((day) => {
        if (day.dayIndex !== dayIndex) {
          return day
        }
        if (day.items.length >= 2) {
          setStatus('Each day can only have 2 URLs. Remove one to add another.')
          return day
        }

        if (content.kind === 'link' && isLinkAssigned(content.id)) {
          setStatus('This link is already assigned to a day.')
          return day
        }

        if (content.kind === 'playlist' && getPlaylistRemaining(content.id) === 0) {
          setStatus('This playlist is already fully allocated.')
          return day
        }

        const remainingPlaylistVideos = content.kind === 'playlist' ? getPlaylistRemaining(content.id) : 0
        const safeRequestedVideos =
          content.kind === 'playlist'
            ? Math.min(Math.max(requestedVideos ?? 1, 1), Math.max(remainingPlaylistVideos, 1))
            : undefined

        const newItem: AssignedItem = {
          id: makeId(),
          contentId: content.id,
          url: content.url,
          title: content.title,
          kind: content.kind,
          videos: safeRequestedVideos,
        }

        return {
          ...day,
          items: [...day.items, newItem],
        }
      }),
    )
  }

  const getDefaultAssignDay = (contentId: string) => {
    const savedTarget = assignTargetByContent[contentId]
    if (savedTarget && days.some((day) => day.dayIndex === savedTarget)) {
      return savedTarget
    }

    const firstAvailableDay = days.find((day) => day.items.length < 2)
    return firstAvailableDay?.dayIndex ?? days[0]?.dayIndex ?? 1
  }

  const getDefaultAssignVideos = (contentId: string, maxAllowed: number) => {
    const selected = assignVideosByContent[contentId]
    if (!selected) {
      return 1
    }
    return Math.min(Math.max(selected, 1), Math.max(maxAllowed, 1))
  }

  const updatePlaylistVideos = (dayIndex: number, itemId: string, nextValue: number) => {
    setDays((prev) =>
      prev.map((day) => {
        if (day.dayIndex !== dayIndex) {
          return day
        }

        return {
          ...day,
          items: day.items.map((item) => {
            if (item.id !== itemId) {
              return item
            }
            return {
              ...item,
              videos: nextValue,
            }
          }),
        }
      }),
    )
  }

  const removeAssignedItem = (dayIndex: number, itemId: string) => {
    setDays((prev) =>
      prev.map((day) => {
        if (day.dayIndex !== dayIndex) {
          return day
        }
        return {
          ...day,
          items: day.items.filter((item) => item.id !== itemId),
        }
      }),
    )
  }

  const allDaysPlanned = days.length > 0 && days.every((day) => day.items.length > 0)
  const playlistRemainingTotal = Array.from(playlistTotals.keys()).reduce(
    (acc, id) => acc + getPlaylistRemaining(id),
    0,
  )

  const canProceedToStep2 = title.trim() && startDate && numDays > 0 && contentItems.length > 0
  const canSave = allDaysPlanned && playlistRemainingTotal === 0

  const handleSaveCourse = async () => {
    setIsSaving(true)
    setStatus(null)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate,
      num_days: numDays,
      status: 'active' as const,
      content_library: contentItems,
      day_plan: days,
    }

    try {
      await desktopApi.createCourse(payload)
    } catch (saveError) {
      console.error(saveError)
      setStatus('Could not save course.')
      setIsSaving(false)
      return
    }

    setStatus('Course saved. Redirecting to admin dashboard...')
    setIsSaving(false)
    navigate('/admin')
  }

  return (
    <div className="page">
      <TopNav
        title="Coursebook"
        subtitle="Admin control"
        rightSlot={
          <>
            <Link className="btn ghost" to="/admin">
              Back
            </Link>
            <LogoutButton />
          </>
        }
      />
      <div className="content">
        <PageHeader
          title="Create Course"
          description="Two steps: define the course and then assign day-by-day goals."
        />

        <div className="stepper">
          <button type="button" className={step === 1 ? 'step active' : 'step'} onClick={() => setStep(1)}>
            Step 1 - Course Setup
          </button>
          <button
            type="button"
            className={step === 2 ? 'step active' : 'step'}
            onClick={() => {
              if (!canProceedToStep2) {
                setStatus('Complete course details and add at least one URL before continuing.')
                return
              }
              resetSchedule()
              setStep(2)
            }}
          >
            Step 2 - Daily Goals
          </button>
        </div>

        {step === 1 ? (
          <div className="card form-grid">
            <label className="field">
              <span>Course title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="React Course" />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Focus, tools, and outcome."
              />
            </label>

            <div className="two-col">
              <label className="field">
                <span>Start date</span>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>

              <label className="field">
                <span>Number of days</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={numDays}
                  onChange={(event) => setNumDays(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="card nested">
              <h3>Course Content Library</h3>
              <p className="muted">Add URLs now, then drag them into each day in step 2.</p>

              <div className="three-col">
                <label className="field">
                  <span>Resource title</span>
                  <input
                    value={contentTitle}
                    onChange={(event) => setContentTitle(event.target.value)}
                    placeholder="Intro to React docs"
                  />
                </label>
                <label className="field">
                  <span>Resource URL</span>
                  <input
                    value={contentUrl}
                    onChange={(event) => setContentUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </label>
                {isPlaylistUrl(contentUrl) ? (
                  <label className="field">
                    <span>Total playlist videos</span>
                    <input
                      type="number"
                      min={1}
                      value={playlistTotal}
                      onChange={(event) => setPlaylistTotal(event.target.value)}
                    />
                  </label>
                ) : (
                  <div className="field placeholder">
                    <span>Playlist total</span>
                    <p className="muted">Add a YouTube playlist to unlock.</p>
                  </div>
                )}
              </div>

              <button type="button" className="btn ghost" onClick={handleAddContent}>
                Add URL
              </button>

              <div className="stack">
                {contentItems.length === 0 ? (
                  <p className="muted">No content yet. Add URLs above.</p>
                ) : (
                  contentItems.map((item) => (
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
                      <button className="btn danger" type="button" onClick={() => handleRemoveContent(item.id)}>
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn primary"
              disabled={!canProceedToStep2}
              onClick={() => {
                resetSchedule()
                if (!canProceedToStep2) {
                  setStatus('Complete course details and add at least one URL before continuing.')
                  return
                }
                setStep(2)
              }}
            >
              Create everyday goals
            </button>
            {status ? <p className="muted">{status}</p> : null}
          </div>
        ) : (
          <div className="card form-grid">
            <div className="two-col">
              <div>
                <h3>Step 2 - Assign daily goals</h3>
                <p className="muted">Drag content into each day. Max 2 URLs per day.</p>
              </div>
              <div className="header-actions">
                <button type="button" className="btn ghost" onClick={() => setStep(1)}>
                  Back to Step 1
                </button>
              </div>
            </div>

            <div className="planner-grid">
              <section className="card compact">
                <h4>Content Library</h4>
                <p className="muted">Use Add-to-Day for quick planning or drag into a day if you prefer.</p>
                <div className="stack">
                  {visibleContentItems.length === 0 ? (
                    <p className="muted">Everything in this library is assigned.</p>
                  ) : null}
                  {visibleContentItems.map((item) => {
                    const remaining = item.kind === 'playlist' ? getPlaylistRemaining(item.id) : null
                    const maxAssignableVideos = item.kind === 'playlist' ? Math.max(remaining ?? 1, 1) : 1
                    return (
                      <div
                        key={item.id}
                        className={remaining === 0 ? 'drag-item disabled' : 'drag-item'}
                        draggable={remaining === 0 ? false : true}
                        onDragStart={(event) => {
                          setIsDragging(true)
                          event.dataTransfer.setData('text/plain', item.id)
                          if (item.kind === 'playlist') {
                            event.dataTransfer.setData(
                              'application/x-coursebook-videos',
                              String(getDefaultAssignVideos(item.id, maxAssignableVideos)),
                            )
                          }
                        }}
                        onDragEnd={() => setIsDragging(false)}
                      >
                        <strong>{item.title}</strong>
                        <span className="muted">{item.url}</span>
                        <div className="pill-row">
                          <span className="pill">{item.kind === 'playlist' ? 'Playlist' : 'Link'}</span>
                          {item.kind === 'playlist' ? (
                            <span className="pill">Remaining: {remaining}</span>
                          ) : null}
                        </div>
                        <div className="quick-assign">
                          <label className="field inline">
                            <span>Assign to</span>
                            <select
                              value={getDefaultAssignDay(item.id)}
                              onChange={(event) =>
                                setAssignTargetByContent((prev) => ({
                                  ...prev,
                                  [item.id]: Number(event.target.value),
                                }))
                              }
                            >
                              {days.map((day) => (
                                <option key={day.dayIndex} value={day.dayIndex}>
                                  Day {day.dayIndex}
                                </option>
                              ))}
                            </select>
                          </label>
                          {item.kind === 'playlist' ? (
                            <label className="field inline">
                              <span>Videos</span>
                              <input
                                type="number"
                                min={1}
                                max={maxAssignableVideos}
                                value={getDefaultAssignVideos(item.id, maxAssignableVideos)}
                                onChange={(event) =>
                                  setAssignVideosByContent((prev) => ({
                                    ...prev,
                                    [item.id]: Number(event.target.value),
                                  }))
                                }
                              />
                            </label>
                          ) : null}
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() =>
                              assignContentToDay(
                                getDefaultAssignDay(item.id),
                                item.id,
                                item.kind === 'playlist'
                                  ? getDefaultAssignVideos(item.id, maxAssignableVideos)
                                  : undefined,
                              )
                            }
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="stack">
                {days.map((day) => (
                  <div
                    key={day.dayIndex}
                    className="card drop-zone"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const contentId = event.dataTransfer.getData('text/plain')
                      const draggedVideos = Number(event.dataTransfer.getData('application/x-coursebook-videos'))
                      if (contentId) {
                        assignContentToDay(
                          day.dayIndex,
                          contentId,
                          Number.isFinite(draggedVideos) && draggedVideos > 0 ? draggedVideos : undefined,
                        )
                      }
                    }}
                  >
                    <div className="card-head">
                      <div>
                        <h4>Day {day.dayIndex}</h4>
                        <p className="muted">{day.dateLabel}</p>
                      </div>
                      <span className="pill">{day.items.length}/2 slots</span>
                    </div>

                    {day.items.length === 0 ? (
                      <p className="muted">Drag URLs here.</p>
                    ) : (
                      <div className="stack">
                        {day.items.map((item) => {
                          const remaining =
                            item.kind === 'playlist'
                              ? getPlaylistRemaining(item.contentId) + (item.videos ?? 0)
                              : null

                          return (
                            <div key={item.id} className="assigned-item">
                              <div>
                                <strong>{item.title}</strong>
                                <p className="muted">{item.url}</p>
                              </div>
                              {item.kind === 'playlist' ? (
                                <label className="field inline">
                                  <span>Videos</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={remaining ?? 1}
                                    value={item.videos ?? 1}
                                    onChange={(event) => {
                                      const nextValue = Number(event.target.value)
                                      const safeValue = Math.min(Math.max(nextValue, 1), remaining ?? 1)
                                      updatePlaylistVideos(day.dayIndex, item.id, safeValue)
                                    }}
                                  />
                                  <span className="muted">Max {remaining}</span>
                                </label>
                              ) : null}
                              <button
                                className="btn ghost"
                                type="button"
                                onClick={() => removeAssignedItem(day.dayIndex, item.id)}
                              >
                                Remove
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            </div>

            <div className="form-actions">
              <button type="button" className="btn ghost" onClick={() => setStep(1)}>
                Back to Step 1
              </button>
              <button type="button" className="btn primary" disabled={!canSave || isSaving} onClick={handleSaveCourse}>
                {isSaving ? 'Saving...' : 'Create Course (Locked)'}
              </button>
            </div>
            <p className="muted">
              {canSave
                ? 'All days assigned and playlist videos allocated. You can lock the course now.'
                : 'Assign at least one URL per day and fully allocate playlist videos to unlock saving.'}
            </p>
            {status ? <p className="muted">{status}</p> : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateCourse


