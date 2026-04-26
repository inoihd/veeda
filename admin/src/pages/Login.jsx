import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1b2e' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">V</div>
          <h1 className="text-white text-2xl font-bold">Veeda Admin</h1>
          <p className="text-white/50 text-sm mt-1">Painel de administração</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="admin@veeda.app"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
