import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="card flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function dateFloor(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function Dashboard() {
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, year: 0, avgDuration: 0 })
  const [onlineCount, setOnlineCount] = useState(0)
  const [dailyChart, setDailyChart] = useState([])
  const [weeklyUsers, setWeeklyUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()

    // Presence channel for online users
    const channel = supabase.channel('online-users', {
      config: { presence: { key: 'admin-observer' } }
    })
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineCount(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => supabase.removeChannel(channel)
  }, [])

  async function loadStats() {
    setLoading(true)
    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
    const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 7)
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
    const yearStart  = new Date(now); yearStart.setMonth(0); yearStart.setDate(1); yearStart.setHours(0,0,0,0)

    const [todayRes, weekRes, monthRes, yearRes, avgRes, last30Res] = await Promise.all([
      supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
      supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
      supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', yearStart.toISOString()),
      supabase.from('page_views').select('duration').gte('created_at', dateFloor(30)),
      supabase.from('page_views').select('created_at').gte('created_at', dateFloor(30)).order('created_at')
    ])

    const durations = (avgRes.data ?? []).map(r => r.duration).filter(Boolean)
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

    setStats({
      today: todayRes.count ?? 0,
      week:  weekRes.count ?? 0,
      month: monthRes.count ?? 0,
      year:  yearRes.count ?? 0,
      avgDuration: avg
    })

    // Build daily chart (last 30 days)
    const byDay = {}
    ;(last30Res.data ?? []).forEach(r => {
      const d = r.created_at.slice(0, 10)
      byDay[d] = (byDay[d] ?? 0) + 1
    })
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ date: key.slice(5), visits: byDay[key] ?? 0 })
    }
    setDailyChart(days)

    // Weekly active users (last 7 days, unique user_ids per day)
    const { data: weeklyRaw } = await supabase
      .from('page_views')
      .select('created_at, user_id')
      .gte('created_at', dateFloor(7))
      .not('user_id', 'is', null)

    const byDayUsers = {}
    ;(weeklyRaw ?? []).forEach(r => {
      const d = r.created_at.slice(0, 10)
      if (!byDayUsers[d]) byDayUsers[d] = new Set()
      byDayUsers[d].add(r.user_id)
    })
    const wDays = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      wDays.push({ date: key.slice(5), users: byDayUsers[key]?.size ?? 0 })
    }
    setWeeklyUsers(wDays)

    setLoading(false)
  }

  const fmtDuration = (s) => {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do Veeda</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Visitas hoje"      value={loading ? '—' : stats.today.toLocaleString()}  icon="👁️" />
        <StatCard label="Visitas na semana" value={loading ? '—' : stats.week.toLocaleString()}   icon="📅" />
        <StatCard label="Visitas no mês"    value={loading ? '—' : stats.month.toLocaleString()}  icon="🗓️" />
        <StatCard label="Visitas no ano"    value={loading ? '—' : stats.year.toLocaleString()}   icon="📈" />
        <StatCard label="Usuários online"   value={onlineCount}                                   icon="🟢" sub="via Realtime Presence" />
        <StatCard label="Tempo médio (30d)" value={loading ? '—' : fmtDuration(stats.avgDuration)} icon="⏱️" sub="por sessão" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Visitas — últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visits" stroke="#7c3aed" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Usuários ativos — últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyUsers}>
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#7c3aed" fill="url(#gradUsers)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
