import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import ConfirmDialog from '../components/ConfirmDialog'

// ─── FAQ ────────────────────────────────────────────────────────────────────

function FaqModal({ faq, onClose, onSaved }) {
  const [question, setQuestion] = useState(faq?.question ?? '')
  const [answer, setAnswer] = useState(faq?.answer ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!question.trim() || !answer.trim()) { toast.error('Pergunta e resposta obrigatórias'); return }
    setSaving(true)
    try {
      if (faq) {
        await supabase.from('faq').update({ question, answer }).eq('id', faq.id)
      } else {
        await supabase.from('faq').insert({ question, answer })
      }
      await logAction(faq ? 'update_faq' : 'create_faq', { question: question.slice(0, 60) })
      toast.success('FAQ salvo')
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
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4">
        <h3 className="text-lg font-semibold">{faq ? 'Editar FAQ' : 'Novo FAQ'}</h3>
        <div><label className="label">Pergunta</label><input value={question} onChange={e => setQuestion(e.target.value)} className="input" /></div>
        <div><label className="label">Resposta</label><textarea value={answer} onChange={e => setAnswer(e.target.value)} className="input h-28 resize-none" /></div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

function SortableFaqRow({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing text-lg">⋮⋮</button>
      <div className="flex-1">
        <p className="font-medium text-sm text-gray-900">{item.question}</p>
        <p className="text-xs text-gray-400 line-clamp-1">{item.answer}</p>
      </div>
      <button onClick={() => onEdit(item)} className="btn-secondary text-xs">Editar</button>
      <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800 text-xs px-2">✕</button>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

// ─── Beta Invites ────────────────────────────────────────────────────────────

function BetaInvites() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(null)

  useEffect(() => { loadInvites() }, [])

  async function loadInvites() {
    setLoading(true)
    const { data } = await supabase
      .from('beta_invites')
      .select('*')
      .order('created_at', { ascending: false })
    setInvites(data ?? [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newEmail.trim()) { toast.error('Informe um e-mail'); return }
    setAdding(true)
    try {
      const { error } = await supabase.from('beta_invites').insert({
        email: newEmail.trim().toLowerCase(),
        invited_by: 'admin',
        used: false,
        revoked: false,
      })
      if (error) throw error
      await logAction('add_beta_invite', { email: newEmail.trim() })
      toast.success('Convite adicionado')
      setNewEmail('')
      loadInvites()
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleRevoke(invite) {
    await supabase.from('beta_invites').update({ revoked: true }).eq('id', invite.id)
    await logAction('revoke_beta_invite', { email: invite.email })
    toast.success('Convite revogado')
    setConfirmRevoke(null)
    loadInvites()
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Convites Beta</h2>
        <span className="text-xs text-gray-400">{invites.filter(i => !i.revoked && !i.used).length} ativos</span>
      </div>

      <div className="flex gap-2">
        <input
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="email@exemplo.com"
          className="input flex-1 text-sm"
        />
        <button onClick={handleAdd} disabled={adding} className="btn-primary text-sm whitespace-nowrap">
          {adding ? 'Adicionando...' : '+ Convidar'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
      ) : invites.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum convite criado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                <th className="text-left py-2 pr-3 font-medium">E-mail</th>
                <th className="text-left py-2 pr-3 font-medium">Convidado por</th>
                <th className="text-left py-2 pr-3 font-medium">Status</th>
                <th className="text-left py-2 pr-3 font-medium">Data</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invites.map(inv => (
                <tr key={inv.id}>
                  <td className="py-2 pr-3 text-gray-800 font-mono text-xs">{inv.email}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">{inv.invited_by}</td>
                  <td className="py-2 pr-3">
                    {inv.revoked
                      ? <span className="text-xs text-red-500 font-medium">Revogado</span>
                      : inv.used
                        ? <span className="text-xs text-green-600 font-medium">Usado</span>
                        : <span className="text-xs text-blue-600 font-medium">Pendente</span>}
                  </td>
                  <td className="py-2 pr-3 text-gray-400 text-xs whitespace-nowrap">
                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="py-2 text-right">
                    {!inv.revoked && (
                      <button
                        onClick={() => setConfirmRevoke(inv)}
                        className="text-xs text-red-500 hover:text-red-700 px-2"
                      >
                        Revogar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revogar convite"
        message={`Revogar convite de "${confirmRevoke?.email}"? O usuário não poderá mais criar conta com este e-mail.`}
        confirmLabel="Revogar"
        danger
        onConfirm={() => handleRevoke(confirmRevoke)}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  )
}

export default function Settings() {
  const [maintenance, setMaintenance] = useState(false)
  const [termsText, setTermsText] = useState('')
  const [privacyText, setPrivacyText] = useState('')
  const [backupSchedule, setBackupSchedule] = useState('0 3 * * *')
  const [loading, setLoading] = useState(true)
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [savingTerms, setSavingTerms] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [runningBackup, setRunningBackup] = useState(false)

  const [faqs, setFaqs] = useState([])
  const [faqItems, setFaqItems] = useState([])
  const [faqSynced, setFaqSynced] = useState(false)
  const [faqModal, setFaqModal] = useState(undefined)
  const [confirmDeleteFaq, setConfirmDeleteFaq] = useState(null)
  const [confirmMaintenance, setConfirmMaintenance] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [settingsRes, faqRes] = await Promise.all([
      supabase.from('settings').select('*'),
      supabase.from('faq').select('*').order('order')
    ])

    const settings = Object.fromEntries((settingsRes.data ?? []).map(s => [s.key, s.value]))
    setMaintenance(settings.maintenance_mode === 'true')
    setTermsText(settings.terms_text ?? '')
    setPrivacyText(settings.privacy_text ?? '')
    setBackupSchedule(settings.backup_schedule ?? '0 3 * * *')

    setFaqs(faqRes.data ?? [])
    setFaqItems(faqRes.data ?? [])
    setFaqSynced(true)
    setLoading(false)
  }

  async function saveSetting(key, value) {
    await supabase.from('settings').upsert({ key, value: String(value) })
    await logAction('update_setting', { key, value: String(value).slice(0, 100) })
  }

  async function handleToggleMaintenance() {
    setConfirmMaintenance(false)
    setSavingMaintenance(true)
    const next = !maintenance
    await saveSetting('maintenance_mode', next)
    setMaintenance(next)
    toast.success(`Modo manutenção ${next ? 'ATIVADO' : 'desativado'}`)
    setSavingMaintenance(false)
  }

  async function handleSaveTerms() {
    setSavingTerms(true)
    await saveSetting('terms_text', termsText)
    toast.success('Termos salvos')
    setSavingTerms(false)
  }

  async function handleSavePrivacy() {
    setSavingPrivacy(true)
    await saveSetting('privacy_text', privacyText)
    toast.success('Política salva')
    setSavingPrivacy(false)
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true)
    await saveSetting('backup_schedule', backupSchedule)
    toast.success('Agendamento salvo')
    setSavingSchedule(false)
  }

  async function handleRunBackup() {
    setRunningBackup(true)
    const toastId = toast.loading('Executando backup...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('drive-backup', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      if (res.error) throw res.error
      toast.success('Backup concluído!', { id: toastId })
    } catch (err) {
      toast.error('Erro no backup: ' + (err.message ?? String(err)), { id: toastId })
    } finally {
      setRunningBackup(false)
    }
  }

  function handleFaqDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = faqItems.findIndex(i => i.id === active.id)
    const newIndex = faqItems.findIndex(i => i.id === over.id)
    setFaqItems(prev => arrayMove(prev, oldIndex, newIndex))
  }

  async function saveFaqOrder() {
    for (let i = 0; i < faqItems.length; i++) {
      await supabase.from('faq').update({ order: i }).eq('id', faqItems[i].id)
    }
    await logAction('reorder_faq', { count: faqItems.length })
    toast.success('Ordem do FAQ salva')
  }

  async function handleDeleteFaq(faq) {
    await supabase.from('faq').delete().eq('id', faq.id)
    await logAction('delete_faq', { question: faq.question.slice(0, 60) })
    toast.success('FAQ excluído')
    setConfirmDeleteFaq(null)
    load()
  }

  if (loading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configurações globais do Veeda</p>
      </div>

      {/* Maintenance mode */}
      <div className={`card border-2 ${maintenance ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Modo Manutenção</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {maintenance
                ? '⚠️ ATIVO — O app está em manutenção para usuários.'
                : 'O app está online para todos os usuários.'}
            </p>
          </div>
          <button
            onClick={() => setConfirmMaintenance(true)}
            disabled={savingMaintenance}
            className={maintenance ? 'btn-danger text-sm' : 'btn-primary text-sm'}
          >
            {maintenance ? 'Desativar manutenção' : 'Ativar manutenção'}
          </button>
        </div>
      </div>

      {/* Terms */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Termos de Uso</h2>
          <button onClick={handleSaveTerms} disabled={savingTerms} className="btn-primary text-sm">
            {savingTerms ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <ReactQuill theme="snow" value={termsText} onChange={setTermsText} style={{ height: 200 }} />
        <div style={{ marginTop: '42px' }} />
      </div>

      {/* Privacy */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Política de Privacidade</h2>
          <button onClick={handleSavePrivacy} disabled={savingPrivacy} className="btn-primary text-sm">
            {savingPrivacy ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <ReactQuill theme="snow" value={privacyText} onChange={setPrivacyText} style={{ height: 200 }} />
        <div style={{ marginTop: '42px' }} />
      </div>

      {/* FAQ */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">FAQ</h2>
          <div className="flex gap-2">
            <button onClick={saveFaqOrder} className="btn-secondary text-sm">Salvar ordem</button>
            <button onClick={() => setFaqModal(null)} className="btn-primary text-sm">+ Novo</button>
          </div>
        </div>

        {faqSynced && faqItems.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFaqDragEnd}>
            <SortableContext items={faqItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {faqItems.map(item => (
                  <SortableFaqRow
                    key={item.id}
                    item={item}
                    onEdit={setFaqModal}
                    onDelete={setConfirmDeleteFaq}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum FAQ criado.</p>
        )}
      </div>

      {/* Beta Invites */}
      <BetaInvites />

      {/* Backup */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Backup para Google Drive</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1">
            <label className="label">Agendamento (cron)</label>
            <input
              value={backupSchedule}
              onChange={e => setBackupSchedule(e.target.value)}
              className="input font-mono text-sm"
              placeholder="0 3 * * *"
            />
            <p className="text-xs text-gray-400 mt-1">Formato cron — configure também via pg_cron no Supabase.</p>
          </div>
          <button onClick={handleSaveSchedule} disabled={savingSchedule} className="btn-secondary text-sm">
            {savingSchedule ? 'Salvando...' : 'Salvar agendamento'}
          </button>
        </div>
        <button
          onClick={handleRunBackup}
          disabled={runningBackup}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <span>💾</span>
          {runningBackup ? 'Executando backup...' : 'Backup agora'}
        </button>
      </div>

      {/* Modals / Confirms */}
      <ConfirmDialog
        open={confirmMaintenance}
        title={maintenance ? 'Desativar modo manutenção?' : 'Ativar modo manutenção?'}
        message={maintenance
          ? 'O app voltará a ser acessível para todos os usuários.'
          : 'O app ficará inacessível para usuários normais. Confirme antes de ativar.'}
        confirmLabel={maintenance ? 'Desativar' : 'Ativar manutenção'}
        danger={!maintenance}
        onConfirm={handleToggleMaintenance}
        onCancel={() => setConfirmMaintenance(false)}
      />

      {faqModal !== undefined && (
        <FaqModal
          faq={faqModal || null}
          onClose={() => setFaqModal(undefined)}
          onSaved={() => { setFaqModal(undefined); load() }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeleteFaq}
        title="Excluir FAQ"
        message={`Excluir "${confirmDeleteFaq?.question}"?`}
        confirmLabel="Excluir" danger
        onConfirm={() => handleDeleteFaq(confirmDeleteFaq)}
        onCancel={() => setConfirmDeleteFaq(null)}
      />
    </div>
  )
}
