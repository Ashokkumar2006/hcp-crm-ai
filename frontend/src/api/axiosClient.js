import axios from 'axios'

// In production (Vercel), set VITE_API_BASE_URL to your deployed backend URL.
// Falls back to localhost for local development.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
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
