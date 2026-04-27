import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import ConfirmDialog from '../components/ConfirmDialog'

const defaultScheduled = () => {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

export default function Notifications() {
  const { rows: notifications, loading, refresh } = useRealtimeTable('scheduled_notifications', {
    orderBy: 'scheduled_at',
    ascending: false
  })

  const [form, setForm] = useState({
    title: '',
    body: '',
    target: 'all',
    target_handle: '',
    scheduled_at: defaultScheduled()
  })
  const [sending, setSending] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(null)
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSend() {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return }
    if (!form.body.trim()) { toast.error('Corpo obrigatório'); return }
    setSending(true)
    try {
      const scheduledAt = form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : new Date().toISOString()

      const target = form.target === 'specific' ? form.target_handle.trim() : form.target

      const { error } = await supabase.from('scheduled_notifications').insert({
        title: form.title.trim(),
        body: form.body.trim(),
        target,
        scheduled_at: scheduledAt,
        sent: false
      })
      if (error) throw error

      await logAction('send_notification', {
        title: form.title,
        target,
        scheduled_at: scheduledAt
      })
      toast.success(form.scheduled_at ? 'Notificação agendada' : 'Notificação enviada para a fila')
      setForm({ title: '', body: '', target: 'all', target_handle: '', scheduled_at: defaultScheduled() })
      refresh()
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleCancel(n) {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({ cancelled: true })
      .eq('id', n.id)
    if (error) { toast.error('Erro: ' + error.message); return }
    await logAction('cancel_notification', { id: n.id, title: n.title })
    toast.success('Notificação cancelada')
    setConfirmCancel(null)
    refresh()
  }

  const pending = notifications.filter(n => !n.sent && !n.cancelled)
  const sent = notifications.filter(n => n.sent)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Agende e envie notificações push</p>
      </div>

      {/* Send form */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Nova notificação</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Título</label>
            <input
              value={form.title}
              onChange={e => setF('title', e.target.value)}
              className="input"
              placeholder="Título da notificação"
            />
          </div>

          <div>
            <label className="label">Destino</label>
            <select value={form.target} onChange={e => setF('target', e.target.value)} className="input">
              <option value="all">Todos os usuários</option>
              <option value="specific">Handle específico</option>
            </select>
          </div>

          {form.target === 'specific' && (
            <div>
              <label className="label">Handle do usuário</label>
              <input
                value={form.target_handle}
                onChange={e => setF('target_handle', e.target.value)}
                className="input"
                placeholder="@usuario"
              />
            </div>
          )}

          <div>
            <label className="label">Agendar para</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setF('scheduled_at', e.target.value)}
              className="input"
            />
          </div>

          <div className="col-span-2">
            <label className="label">Corpo</label>
            <textarea
              value={form.body}
              onChange={e => setF('body', e.target.value)}
              className="input h-24 resize-none"
              placeholder="Mensagem da notificação..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSend} disabled={sending} className="btn-primary text-sm">
            {sending ? 'Enviando...' : 'Enviar agora'}
          </button>
        </div>
      </div>

      {/* Pending notifications */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Pendentes ({pending.length})</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="table-th">Título</th>
                  <th className="table-th">Destino</th>
                  <th className="table-th">Agendado para</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map(n => (
                  <tr key={n.id} className="hover:bg-gray-50/50">
                    <td className="table-td font-medium">{n.title}</td>
                    <td className="table-td">{n.target}</td>
                    <td className="table-td">{new Date(n.scheduled_at).toLocaleString('pt-BR')}</td>
                    <td className="table-td">
                      <button
                        onClick={() => setConfirmCancel(n)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-td text-center text-gray-400 py-6">Nenhuma pendente</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sent notifications */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Enviadas ({sent.length})</h2>
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="table-th">Título</th>
                <th className="table-th">Destino</th>
                <th className="table-th">Enviada em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sent.map(n => (
                <tr key={n.id} className="hover:bg-gray-50/50">
                  <td className="table-td font-medium">{n.title}</td>
                  <td className="table-td">{n.target}</td>
                  <td className="table-td">
                    {n.sent_at ? new Date(n.sent_at).toLocaleString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
              {sent.length === 0 && (
                <tr>
                  <td colSpan={3} className="table-td text-center text-gray-400 py-6">Nenhuma enviada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancelar notificação"
        message={`Cancelar "${confirmCancel?.title}"?`}
        confirmLabel="Cancelar notificação"
        danger
        onConfirm={() => handleCancel(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  )
}
