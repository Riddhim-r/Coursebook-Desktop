import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getRole, login } from '../lib/fakeAuth'
import type { Role } from '../lib/fakeAuth'

const LoginPage = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    const currentRole = getRole()
    if (currentRole) {
      navigate(currentRole === 'admin' ? '/admin' : '/user', { replace: true })
    }
  }, [navigate])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const success = login(role, password)
    if (!success) {
      setError('Incorrect password. Try again.')
      return
    }

    navigate(role === 'admin' ? '/admin' : '/user')
  }

  return (
    <div className="page login-page">
      <TopNav title="Coursebook" hideMark />

      {!showLogin ? (
        <div className="login-hero">
          <div className="hero-image" role="img" aria-label="Coursebook hero" />
          <button className="hi-text" type="button" onClick={() => setShowLogin(true)}>
            Hi!
          </button>
        </div>
      ) : (
        <div className="panel">
          <form className="card login-card" onSubmit={handleSubmit}>
            <div className="role-toggle">
              <button
                type="button"
                className={role === 'admin' ? 'btn active' : 'btn ghost'}
                onClick={() => {
                  setRole('admin')
                  setPassword('')
                  setShowPassword(false)
                  setError('')
                }}
              >
                Bread-winner
              </button>
              <button
                type="button"
                className={role === 'user' ? 'btn active' : 'btn ghost'}
                onClick={() => {
                  setRole('user')
                  setPassword('')
                  setShowPassword(false)
                  setError('')
                }}
              >
                Bread-eater
              </button>
            </div>

            <label className="field">
              <span>Input your not-so-secret code here:</span>
              <div className="password-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={role === 'admin' ? 'admin123' : 'user123'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error ? <p className="error">{error}</p> : null}

            <button type="submit" className="btn primary">
              Let's Go!
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default LoginPage
