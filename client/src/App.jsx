import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import SessionSummary from './pages/SessionSummary'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  const { initAuthListener } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from persisted token
    initAuthListener()
  }, [initAuthListener])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          <Route path="dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          
          <Route path="interview/:sessionId" element={
            <PrivateRoute><Interview /></PrivateRoute>
          } />
          
          <Route path="session/:sessionId/summary" element={
            <PrivateRoute><SessionSummary /></PrivateRoute>
          } />
          
          <Route path="analytics" element={
            <PrivateRoute><Analytics /></PrivateRoute>
          } />

          <Route path="profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />

          {/* Preferences redirect - show modal on dashboard */}
          <Route path="preferences" element={
            <Navigate to="/dashboard" />
          } />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
