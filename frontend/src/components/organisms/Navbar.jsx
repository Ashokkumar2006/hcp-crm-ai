import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { name } = useSelector((state) => state.auth)

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-brand-mark">HC</span>
        HCP CRM
      </div>
      <NavLink to="/" end className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
        Dashboard
      </NavLink>
      <NavLink to="/log-interaction" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
        Log Interaction
      </NavLink>
      <div className="navbar-spacer" />
      {name && <span className="navbar-user">{name}</span>}
      <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
        Sign out
      </button>
    </nav>
  )
}
