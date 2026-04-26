import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filters, setFilters] = useState({ action: '', dateFrom: '', dateTo: '' })
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => { load() }, [filters, page]) // eslint-disable-line

  async function load() {
    setLoading(true)
    let query = supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filters.action.trim()) {
      query = query.ilike('action', `%${filters.action.trim()}%`)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', new Date(filters.dateFrom).toISOString())
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59, 999)
      query = query.lte('created_at', to.toISOString())
    }

    const { data } = await query
    setLogs(data ?? [])
    setLoading(false)
  }

  function setFilter(k, v) {
    setFilters(f => ({ ...f, [k]: v }))
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Registro de todas as ações administrativas</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4">
        <div>
          <label className="label">Ação</label>
          <input
            value={filters.action}
            onChange={e => setFilter('action', e.target.value)}
            className="input w-48"
            placeholder="ex: update_layout"
          />
        </div>
        <div>
          <label className="label">De</label>
          <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Até</label>
          <input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} className="input" />
        </div>
        <div className="flex items-end">
          <button onClick={() => { setFilters({ action: '', dateFrom: '', dateTo: '' }); setPage(0) }} className="btn-secondary text-sm">Limpar</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-100">
                  <tr>
                    <th className="table-th">Ação</th>
                    <th className="table-th">Admin ID</th>
                    <th className="table-th">Data/hora</th>
                    <th className="table-th">Dados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map(log => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                        <td className="table-td">
                          <span className="font-mono text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded">{log.action}</span>
                        </td>
                        <td className="table-td text-xs text-gray-400 font-mono">{log.admin_id?.slice(0, 8) ?? '—'}…</td>
                        <td className="table-td text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="table-td">
                          <button className="text-brand-600 text-xs hover:underline">
                            {expanded === log.id ? '▲ Ocultar' : '▼ Ver dados'}
                          </button>
                        </td>
                      </tr>
                      {expanded === log.id && (
                        <tr key={`${log.id}-exp`}>
                          <td colSpan={4} className="px-4 pb-3">
                            <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="table-td text-center text-gray-400 py-8">Nenhum log encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Página {page + 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary text-sm disabled:opacity-40">← Anterior</button>
                <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE} className="btn-secondary text-sm disabled:opacity-40">Próxima →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
