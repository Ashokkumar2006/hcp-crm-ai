import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../redux/slices/authSlice'
import apiClient from '../api/axiosClient'
import Button from '../components/atoms/Button'
import FormField from '../components/atoms/FormField'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('alex@repcorp.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiClient.post('/auth/login', { email, password })
      dispatch(setCredentials({ repId: res.data.rep_id, name: res.data.name, token: res.data.token }))
      navigate('/')
    } catch (err) {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="panel auth-card" onSubmit={handleSubmit}>
        <div className="panel-header">Sign in to HCP CRM</div>
        <div className="panel-body">
          {error && <div className="auth-error">{error}</div>}
          <FormField label="Email">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Password">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123 (seed default)"
              required
            />
          </FormField>
          <Button type="submit" block loading={loading}>
            Sign in
          </Button>
        </div>
      </form>
    </div>
  )
}
