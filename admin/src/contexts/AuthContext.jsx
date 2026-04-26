import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const isAdmin = (sess) => {
    if (!sess) return false
    const meta = sess.user?.user_metadata ?? {}
    const appMeta = sess.user?.app_metadata ?? {}
    return meta.app_role === 'admin' || appMeta.app_role === 'admin'
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
      if (s && !isAdmin(s) && location.pathname !== '/admin/login') {
        navigate('/admin/login', { replace: true })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) {
        navigate('/admin/login', { replace: true })
      } else if (!isAdmin(s)) {
        supabase.auth.signOut()
        navigate('/admin/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!isAdmin(data.session)) {
      await supabase.auth.signOut()
      throw new Error('Acesso negado. Você não tem permissão de administrador.')
    }
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut, isAdmin: isAdmin(session) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
