import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import {
  Login, Dashboard, Users, LayoutPage, Polls, Ads,
  Notifications, StyleEditor, HomeContent, Moderation, AuditLog, Settings
} from './pages'

function ProtectedRoute({ children }) {
  const { session, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b2e' }}>
        <div className="text-white/60 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/layout" element={<ProtectedRoute><LayoutPage /></ProtectedRoute>} />
      <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
      <Route path="/ads" element={<ProtectedRoute><Ads /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/style" element={<ProtectedRoute><StyleEditor /></ProtectedRoute>} />
      <Route path="/home-content" element={<ProtectedRoute><HomeContent /></ProtectedRoute>} />
      <Route path="/moderation" element={<ProtectedRoute><Moderation /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
