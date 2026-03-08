import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { desktopApi } from '../lib/desktopApi'

type ContentKind = 'link' | 'playlist'

type ContentItem = {
  id: string
  url: string
  title: string
  kind: ContentKind
  totalVideos?: number
}

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

const UserCourseLibrary = () => {
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [library, setLibrary] = useState<ContentItem[]>([])

  useEffect(() => {
    const loadLibrary = async () => {
      if (!id) {
        setError('Missing course id.')
        setIsLoading(false)
        return
      }

      try {
        const data = await desktopApi.getCourseLibrary(id)
        if (!data) {
          setError('Course not found.')
          setIsLoading(false)
          return
        }

        setCourseTitle((data.title as string) ?? 'Course')
        setLibrary(((data.content_library as ContentItem[]) ?? []).filter(Boolean))
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load content library.')
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }

    loadLibrary()
  }, [id])

  return (
    <div className="page">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-text">Coursebook</span>
        </div>
        <div className="nav-actions">
          <Link className="btn ghost" to={`/user/courses/${id}`}>
            Go back to the course
          </Link>
        </div>
      </header>

      <div className="content">
        <div className="page-header">
          <div>
            <h1>Content Library</h1>
            <p>{courseTitle}</p>
          </div>
        </div>

        {isLoading ? <div className="card">Loading content library...</div> : null}
        {error ? <div className="card">{error}</div> : null}

        {!isLoading && !error ? (
          <div className="card">
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
                      {item.kind === 'playlist' ? <span className="pill">{item.totalVideos} videos</span> : null}
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
      </div>
    </div>
  )
}

export default UserCourseLibrary

