import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from './components/organisms/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LogInteraction from './pages/LogInteraction'
import './styles/components.css'

function ProtectedLayout({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/log-interaction"
          element={
            <ProtectedLayout>
              <LogInteraction />
            </ProtectedLayout>
          }
        />
        <Route
          path="/interactions/:id"
          element={
            <ProtectedLayout>
              <LogInteraction />
            </ProtectedLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
