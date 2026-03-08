import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="page">
      <div className="content center">
        <div className="card">
          <h1>Page not found</h1>
          <p>The page you are looking for does not exist.</p>
          <Link className="btn primary" to="/">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound