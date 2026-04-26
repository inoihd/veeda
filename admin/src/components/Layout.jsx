import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ConfirmDialog from './ConfirmDialog'

const NAV = [
  { to: '/',              label: 'Dashboard',       icon: '📊' },
  { to: '/users',         label: 'Usuários',        icon: '👥' },
  { to: '/layout',        label: 'Layout',          icon: '🧩' },
  { to: '/home-content',  label: 'Home Content',    icon: '🏠' },
  { to: '/polls',         label: 'Enquetes',        icon: '🗳️' },
  { to: '/ads',           label: 'Anúncios',        icon: '📢' },
  { to: '/notifications', label: 'Notificações',    icon: '🔔' },
  { to: '/style',         label: 'Estilos',         icon: '🎨' },
  { to: '/moderation',    label: 'Moderação',       icon: '🛡️' },
  { to: '/audit',         label: 'Audit Log',       icon: '📋' },
  { to: '/settings',      label: 'Configurações',   icon: '⚙️' }
]

export default function Layout({ children }) {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [pushing, setPushing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handlePush = async () => {
    setConfirmOpen(false)
    setPushing(true)
    const toastId = toast.loading('Enviando alterações para o GitHub...')
    try {
      const { data: { session: s } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('github-push', {
        headers: { Authorization: `Bearer ${s?.access_token}` }
      })
      if (res.error) throw res.error
      toast.success('Alterações enviadas com sucesso!', { id: toastId })
    } catch (err) {
      toast.error('Erro ao enviar: ' + (err.message ?? String(err)), { id: toastId })
    } finally {
      setPushing(false)
    }
  }

  const email = session?.user?.email ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 flex-shrink-0
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#1e1b2e' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="text-white font-semibold text-lg">Veeda Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors duration-150 ` +
                (isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10')
              }
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white/40 text-xs truncate mb-2">{email}</p>
          <button
            onClick={signOut}
            className="text-white/60 hover:text-white text-xs flex items-center gap-2 transition-colors"
          >
            <span>↩</span> Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={pushing}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <span>🚀</span>
            {pushing ? 'Enviando...' : 'Enviar alterações'}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Enviar alterações para o GitHub"
        message="Isso irá fazer commit e push de layout, home content, estilos e configurações para o repositório GitHub. Deseja continuar?"
        confirmLabel="Enviar"
        onConfirm={handlePush}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
