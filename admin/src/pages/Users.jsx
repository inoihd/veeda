import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [onlineIds, setOnlineIds] = useState(new Set())
  const [globalLimit, setGlobalLimit] = useState('5')
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [editLimitUser, setEditLimitUser] = useState(null)
  const [editLimitValue, setEditLimitValue] = useState('5')
  const [confirmBan, setConfirmBan] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
    loadGlobalLimit()

    const channel = supabase.channel('presence-admin-users')
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const ids = new Set(
          Object.values(state)
            .flat()
            .map(p => p.user_id)
            .filter(Boolean)
        )
        setOnlineIds(ids)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, name, created_at, status')
      .order('created_at', { ascending: false })
    if (error) { toast.error('Erro ao carregar usuários'); setLoading(false); return }

    // Fetch per-user limits
    const { data: limits } = await supabase.from('user_limits').select('user_id, circle_limit')
    const limitsMap = Object.fromEntries((limits ?? []).map(l => [l.user_id, l.circle_limit]))

    setUsers((data ?? []).map(u => ({ ...u, circle_limit: limitsMap[u.id] ?? null })))
    setLoading(false)
  }

  async function loadGlobalLimit() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'circle_limit_global').single()
    if (data) setGlobalLimit(data.value)
  }

  async function saveGlobalLimit() {
    setSavingGlobal(true)
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'circle_limit_global', value: globalLimit })
    if (error) { toast.error('Erro ao salvar'); setSavingGlobal(false); return }
    await logAction('update_global_circle_limit', { value: globalLimit })
    toast.success('Limite global atualizado')
    setSavingGlobal(false)
  }

  async function saveUserLimit(userId) {
    const val = parseInt(editLimitValue, 10)
    if (isNaN(val) || val < 1) { toast.error('Valor inválido'); return }
    const { error } = await supabase
      .from('user_limits')
      .upsert({ user_id: userId, circle_limit: val })
    if (error) { toast.error('Erro ao salvar'); return }
    await logAction('update_user_circle_limit', { user_id: userId, limit: val })
    toast.success('Limite atualizado')
    setEditLimitUser(null)
    loadUsers()
  }

  async function handleBanUser(user) {
    const newStatus = user.status === 'banned' ? 'active' : 'banned'
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', user.id)
    if (error) { toast.error('Erro ao atualizar status'); return }
    await logAction('update_user_status', { user_id: user.id, status: newStatus })
    toast.success(`Usuário ${newStatus === 'banned' ? 'banido' : 'reativado'}`)
    setConfirmBan(null)
    loadUsers()
  }

  const filtered = users.filter(u =>
    !search || u.handle?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuários registrados</p>
        </div>

        {/* Global circle limit */}
        <div className="card flex items-center gap-3 py-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Limite global de círculos:</label>
          <input
            type="number"
            min={1}
            value={globalLimit}
            onChange={e => setGlobalLimit(e.target.value)}
            className="input w-20"
          />
          <button onClick={saveGlobalLimit} disabled={savingGlobal} className="btn-primary text-sm">
            {savingGlobal ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <input
            type="search"
            placeholder="Buscar por handle ou nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input max-w-xs"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Carregando...</p>
        ) : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="table-th">Usuário</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Limite círculos</th>
                  <th className="table-th">Registrado em</th>
                  <th className="table-th">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${onlineIds.has(user.id) ? 'bg-green-400' : 'bg-gray-300'}`} />
                        <div>
                          <p className="font-medium text-gray-900">@{user.handle ?? '—'}</p>
                          <p className="text-xs text-gray-400">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={user.status === 'banned' ? 'badge-red' : user.status === 'suspended' ? 'badge-yellow' : 'badge-green'}>
                        {user.status ?? 'active'}
                      </span>
                    </td>
                    <td className="table-td">
                      {editLimitUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={editLimitValue}
                            onChange={e => setEditLimitValue(e.target.value)}
                            className="input w-20 text-xs"
                          />
                          <button onClick={() => saveUserLimit(user.id)} className="text-xs text-brand-600 font-medium hover:underline">OK</button>
                          <button onClick={() => setEditLimitUser(null)} className="text-xs text-gray-400 hover:underline">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditLimitUser(user.id); setEditLimitValue(String(user.circle_limit ?? globalLimit)) }}
                          className="text-sm text-gray-700 hover:text-brand-600 transition-colors"
                        >
                          {user.circle_limit ?? <span className="text-gray-400">global ({globalLimit})</span>}
                          <span className="ml-1 text-gray-400 text-xs">✏️</span>
                        </button>
                      )}
                    </td>
                    <td className="table-td text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="table-td">
                      <button
                        onClick={() => setConfirmBan(user)}
                        className={`text-xs font-medium px-2 py-1 rounded ${user.status === 'banned' ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-red-700 bg-red-50 hover:bg-red-100'} transition-colors`}
                      >
                        {user.status === 'banned' ? 'Reativar' : 'Banir'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">Nenhum usuário encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmBan}
        title={confirmBan?.status === 'banned' ? 'Reativar usuário' : 'Banir usuário'}
        message={`Deseja ${confirmBan?.status === 'banned' ? 'reativar' : 'banir'} @${confirmBan?.handle}?`}
        confirmLabel={confirmBan?.status === 'banned' ? 'Reativar' : 'Banir'}
        danger={confirmBan?.status !== 'banned'}
        onConfirm={() => handleBanUser(confirmBan)}
        onCancel={() => setConfirmBan(null)}
      />
    </div>
  )
}
