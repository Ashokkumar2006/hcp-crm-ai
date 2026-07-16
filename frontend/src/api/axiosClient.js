import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request once auth is wired up (Phase F)
apiClient.interceptors.request.use((config) => {
  const token = window.__AUTH_TOKEN__ // set by authSlice, kept in memory only (never localStorage)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
