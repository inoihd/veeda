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
    return <Navigate to="/admin/login" replace />
  }

  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />

      <Route path="/admin/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/admin/layout" element={<ProtectedRoute><LayoutPage /></ProtectedRoute>} />
      <Route path="/admin/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
      <Route path="/admin/ads" element={<ProtectedRoute><Ads /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/admin/style" element={<ProtectedRoute><StyleEditor /></ProtectedRoute>} />
      <Route path="/admin/home-content" element={<ProtectedRoute><HomeContent /></ProtectedRoute>} />
      <Route path="/admin/moderation" element={<ProtectedRoute><Moderation /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Catch-all: redirect to dashboard */}
      <Route path="*" element={<Navigate to="/admin/" replace />} />
    </Routes>
  )
}
