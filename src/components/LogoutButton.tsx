import { useNavigate } from 'react-router-dom'
import { logout } from '../lib/fakeAuth'

const LogoutButton = () => {
  const navigate = useNavigate()
  return (
    <button
      className="btn ghost"
      onClick={() => {
        logout()
        navigate('/')
      }}
      type="button"
    >
      Log out
    </button>
  )
}

export default LogoutButton