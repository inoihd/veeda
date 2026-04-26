import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import ConfirmDialog from '../components/ConfirmDialog'

const STATUS_FILTERS = ['all', 'open', 'resolved', 'dismissed']

export default function Moderation() {
  const { rows: reports, loading, refresh } = useRealtimeTable('reports', { orderBy: 'created_at', ascending: false })
  const [statusFilter, setStatusFilter] = useState('open')
  const [confirmAction, setConfirmAction] = useState(null)

  const filtered = statusFilter === 'all'
    ? reports
    : reports.filter(r => r.status === statusFilter)

  async function handleResolve(report, newStatus) {
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus, resolved_at: new Date().toISOString() })
      .eq('id', report.id)

    if (error) { toast.error('Erro ao atualizar'); return }
    await logAction('resolve_report', { report_id: report.id, status: newStatus })
    toast.success(`Report ${newStatus}`)
    setConfirmAction(null)
    refresh()
  }

  async function handleBanUser(report) {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'banned' })
      .eq('handle', report.reporter_handle)

    if (error) { toast.error('Erro ao banir'); return }
    await logAction('ban_user_from_report', { report_id: report.id, handle: report.reporter_handle })
    toast.success('Usuário banido')
    setConfirmAction(null)
    refresh()
  }

  const statusBadge = (s) => {
    if (s === 'open')     return <span className="badge-yellow">Aberto</span>
    if (s === 'resolved') return <span className="badge-green">Resolvido</span>
    return <span className="badge-gray">Descartado</span>
  }

  const typeIcon = (t) => {
    if (t === 'user')    return '👤'
    if (t === 'post')    return '📝'
    if (t === 'comment') return '💬'
    return '⚠️'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Moderação</h1>
        <p className="text-sm text-gray-500 mt-0.5">{reports.filter(r => r.status === 'open').length} denúncias abertas</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'open' ? 'Abertos' : f === 'resolved' ? 'Resolvidos' : 'Descartados'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="table-th">Denunciante</th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th">Motivo</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Data</th>
                  <th className="table-th">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="table-td">
                      <span className="font-medium">@{report.reporter_handle ?? '—'}</span>
                    </td>
                    <td className="table-td">
                      <span className="flex items-center gap-1">
                        {typeIcon(report.target_type)}
                        <span className="text-xs">{report.target_type}</span>
                      </span>
                    </td>
                    <td className="table-td max-w-xs">
                      <p className="truncate text-sm text-gray-600">{report.reason}</p>
                      <p className="text-xs text-gray-400 font-mono">id: {report.target_id?.slice(0, 16)}</p>
                    </td>
                    <td className="table-td">{statusBadge(report.status)}</td>
                    <td className="table-td text-gray-400 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="table-td">
                      {report.status === 'open' && (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => setConfirmAction({ type: 'resolve', report })}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded transition-colors"
                          >
                            Resolver
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'dismiss', report })}
                            className="text-xs px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            Descartar
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'ban', report })}
                            className="text-xs px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded transition-colors"
                          >
                            Banir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-gray-400 py-8">
                      Nenhuma denúncia {statusFilter !== 'all' ? `com status "${statusFilter}"` : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.type === 'ban' ? 'Banir usuário' :
          confirmAction?.type === 'resolve' ? 'Resolver denúncia' :
          'Descartar denúncia'
        }
        message={
          confirmAction?.type === 'ban'
            ? `Banir @${confirmAction?.report?.reporter_handle}? Esta ação pode ser revertida na página de Usuários.`
            : confirmAction?.type === 'resolve'
            ? 'Marcar esta denúncia como resolvida?'
            : 'Descartar esta denúncia?'
        }
        confirmLabel={confirmAction?.type === 'ban' ? 'Banir' : confirmAction?.type === 'resolve' ? 'Resolver' : 'Descartar'}
        danger={confirmAction?.type === 'ban'}
        onConfirm={() => {
          if (confirmAction.type === 'ban') handleBanUser(confirmAction.report)
          else if (confirmAction.type === 'resolve') handleResolve(confirmAction.report, 'resolved')
          else handleResolve(confirmAction.report, 'dismissed')
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
