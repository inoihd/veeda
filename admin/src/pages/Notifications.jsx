import { useState } from 'react'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import ConfirmDialog from '../components/ConfirmDialog'

function TemplateModal({ template, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: template?.name ?? '',
    title: template?.title ?? '',
    body: template?.body ?? '',
    icon_url: template?.icon_url ?? '',
    action_url: template?.action_url ?? ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name.trim() || !form.title.trim()) { toast.error('Nome e título obrigatórios'); return }
    setSaving(true)
    try {
      const row = { ...form, icon_url: form.icon_url || null, action_url: form.action_url || null }
      if (template) {
        await supabase.from('notification_templates').update(row).eq('id', template.id)
      } else {
        await supabase.from('notification_templates').insert(row)
      }
      await logAction(template ? 'update_notification_template' : 'create_notification_template', { name: form.name })
      toast.success('Template salvo')
      onSaved()
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold">{template ? 'Editar template' : 'Novo template'}</h3>
        <div><label className="label">Nome interno</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="Boas-vindas" /></div>
        <div><label className="label">Título da notificação</label><input value={form.title} onChange={e => set('title', e.target.value)} className="input" /></div>
        <div>
          <label className="label">Corpo</label>
          <ReactQuill theme="snow" value={form.body} onChange={v => set('body', v)} style={{ height: 150 }} />
          <div style={{ marginTop: '42px' }} />
        </div>
        <div><label className="label">URL do ícone</label><input value={form.icon_url} onChange={e => set('icon_url', e.target.value)} className="input" placeholder="https://..." /></div>
        <div><label className="label">URL de ação</label><input value={form.action_url} onChange={e => set('action_url', e.target.value)} className="input" placeholder="https://veeda.app/..." /></div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Notifications() {
  const { rows: templates, loading: tLoading, refresh: refreshTemplates } = useRealtimeTable('notification_templates', { orderBy: 'created_at', ascending: false })
  const { rows: scheduled, loading: sLoading, refresh: refreshScheduled } = useRealtimeTable('scheduled_notifications', { orderBy: 'scheduled_at', ascending: true })

  const [templateModal, setTemplateModal] = useState(undefined)
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null)

  // Send form state
  const [sendForm, setSendForm] = useState({
    template_id: '',
    title: '',
    body: '',
    target: 'all',
    scheduled_at: ''
  })
  const [sending, setSending] = useState(false)
  const setF = (k, v) => setSendForm(f => ({ ...f, [k]: v }))

  // Auto-fill from template
  function applyTemplate(id) {
    setF('template_id', id)
    const t = templates.find(t => String(t.id) === String(id))
    if (t) {
      setF('title', t.title)
      setF('body', t.body)
    }
  }

  async function handleSend() {
    if (!sendForm.title.trim() || !sendForm.body.trim()) { toast.error('Título e corpo obrigatórios'); return }
    setSending(true)
    try {
      const scheduledAt = sendForm.scheduled_at
        ? new Date(sendForm.scheduled_at).toISOString()
        : new Date().toISOString()

      await supabase.from('scheduled_notifications').insert({
        template_id: sendForm.template_id || null,
        title: sendForm.title,
        body: sendForm.body,
        target: sendForm.target,
        scheduled_at: scheduledAt
      })

      await logAction('schedule_notification', { title: sendForm.title, target: sendForm.target, scheduled_at: scheduledAt })
      toast.success(sendForm.scheduled_at ? 'Notificação agendada' : 'Notificação enviada para a fila')
      setSendForm({ template_id: '', title: '', body: '', target: 'all', scheduled_at: '' })
      refreshScheduled()
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteTemplate(t) {
    await supabase.from('notification_templates').delete().eq('id', t.id)
    await logAction('delete_notification_template', { name: t.name })
    toast.success('Template excluído')
    setConfirmDeleteTemplate(null)
    refreshTemplates()
  }

  async function handleCancelScheduled(n) {
    await supabase.from('scheduled_notifications').update({ cancelled: true }).eq('id', n.id)
    await logAction('cancel_scheduled_notification', { id: n.id, title: n.title })
    toast.success('Notificação cancelada')
    setConfirmCancel(null)
    refreshScheduled()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Templates e envio de notificações push</p>
      </div>

      {/* Templates */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Templates</h2>
          <button onClick={() => setTemplateModal(null)} className="btn-primary text-sm">+ Novo template</button>
        </div>

        {tLoading ? <p className="text-sm text-gray-400">Carregando...</p> : (
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.title}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setTemplateModal(t)} className="btn-secondary text-xs">Editar</button>
                  <button onClick={() => setConfirmDeleteTemplate(t)} className="text-red-600 hover:text-red-800 text-xs px-2">✕</button>
                </div>
              </div>
            ))}
            {templates.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum template criado.</p>}
          </div>
        )}
      </div>

      {/* Send form */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Enviar notificação</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Template (opcional)</label>
            <select value={sendForm.template_id} onChange={e => applyTemplate(e.target.value)} className="input">
              <option value="">— Custom —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Destino</label>
            <select value={sendForm.target} onChange={e => setF('target', e.target.value)} className="input">
              <option value="all">Todos os usuários</option>
              <option value="segment">Segmento</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Título</label>
            <input value={sendForm.title} onChange={e => setF('title', e.target.value)} className="input" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Agendar para (vazio = agora)</label>
            <input type="datetime-local" value={sendForm.scheduled_at} onChange={e => setF('scheduled_at', e.target.value)} className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">Corpo</label>
            <textarea value={sendForm.body} onChange={e => setF('body', e.target.value)} className="input h-20 resize-none" />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSend} disabled={sending} className="btn-primary text-sm">
            {sending ? 'Enviando...' : sendForm.scheduled_at ? 'Agendar' : 'Enviar agora'}
          </button>
        </div>
      </div>

      {/* Scheduled queue */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Fila agendada</h2>
        {sLoading ? <p className="text-sm text-gray-400">Carregando...</p> : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="table-th">Título</th>
                  <th className="table-th">Destino</th>
                  <th className="table-th">Agendado para</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {scheduled.map(n => (
                  <tr key={n.id} className="hover:bg-gray-50/50">
                    <td className="table-td font-medium">{n.title}</td>
                    <td className="table-td">{n.target}</td>
                    <td className="table-td">{new Date(n.scheduled_at).toLocaleString('pt-BR')}</td>
                    <td className="table-td">
                      {n.cancelled ? <span className="badge-red">Cancelado</span>
                        : n.sent ? <span className="badge-green">Enviado</span>
                        : <span className="badge-yellow">Pendente</span>}
                    </td>
                    <td className="table-td">
                      {!n.sent && !n.cancelled && (
                        <button onClick={() => setConfirmCancel(n)} className="text-red-600 hover:text-red-800 text-xs">Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {scheduled.length === 0 && (
                  <tr><td colSpan={5} className="table-td text-center text-gray-400 py-6">Fila vazia</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {templateModal !== undefined && (
        <TemplateModal
          template={templateModal || null}
          onClose={() => setTemplateModal(undefined)}
          onSaved={() => { setTemplateModal(undefined); refreshTemplates() }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeleteTemplate}
        title="Excluir template"
        message={`Excluir o template "${confirmDeleteTemplate?.name}"?`}
        confirmLabel="Excluir" danger
        onConfirm={() => handleDeleteTemplate(confirmDeleteTemplate)}
        onCancel={() => setConfirmDeleteTemplate(null)}
      />

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancelar notificação"
        message={`Cancelar "${confirmCancel?.title}"?`}
        confirmLabel="Cancelar notificação" danger
        onConfirm={() => handleCancelScheduled(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  )
}
