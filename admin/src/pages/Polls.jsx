import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import ConfirmDialog from '../components/ConfirmDialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function PollModal({ poll, onClose, onSaved }) {
  const [question, setQuestion] = useState(poll?.question ?? '')
  const [active, setActive] = useState(poll?.active ?? true)
  const [endsAt, setEndsAt] = useState(poll?.ends_at ? poll.ends_at.slice(0, 16) : '')
  const [options, setOptions] = useState(poll?.poll_options?.map(o => o.text) ?? ['', ''])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!question.trim()) { toast.error('Pergunta obrigatória'); return }
    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) { toast.error('Mínimo 2 opções'); return }

    setSaving(true)
    try {
      let pollId = poll?.id
      if (poll) {
        await supabase.from('polls').update({ question, active, ends_at: endsAt || null }).eq('id', poll.id)
        // Remove old options and re-insert
        await supabase.from('poll_options').delete().eq('poll_id', poll.id)
      } else {
        const { data, error } = await supabase
          .from('polls')
          .insert({ question, active, ends_at: endsAt || null })
          .select()
          .single()
        if (error) throw error
        pollId = data.id
      }

      await supabase.from('poll_options').insert(
        validOptions.map((text, i) => ({ poll_id: pollId, text, order: i }))
      )

      await logAction(poll ? 'update_poll' : 'create_poll', { poll_id: pollId, question })
      toast.success(poll ? 'Enquete atualizada' : 'Enquete criada')
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
        <h3 className="text-lg font-semibold">{poll ? 'Editar enquete' : 'Nova enquete'}</h3>

        <div>
          <label className="label">Pergunta</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} className="input" placeholder="Qual sua cor favorita?" />
        </div>

        <div>
          <label className="label">Opções</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o) }}
                  className="input"
                  placeholder={`Opção ${i + 1}`}
                />
                {options.length > 2 && (
                  <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 px-2">✕</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setOptions([...options, ''])} className="text-brand-600 text-sm mt-2 hover:underline">+ Adicionar opção</button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="label">Encerra em</label>
            <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="input" />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded border-gray-300 text-brand-600" />
              Ativa
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Polls() {
  const { rows: polls, loading, refresh } = useRealtimeTable('polls', {
    select: '*, poll_options(*)',
    orderBy: 'created_at',
    ascending: false
  })
  const [voteCounts, setVoteCounts] = useState({})
  const [modalPoll, setModalPoll] = useState(undefined)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedPoll, setExpandedPoll] = useState(null)

  async function loadVoteCounts(pollId) {
    const { data } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)

    const counts = {}
    ;(data ?? []).forEach(v => { counts[v.option_id] = (counts[v.option_id] ?? 0) + 1 })
    setVoteCounts(prev => ({ ...prev, [pollId]: counts }))
  }

  async function handleDelete(poll) {
    await supabase.from('polls').delete().eq('id', poll.id)
    await logAction('delete_poll', { poll_id: poll.id })
    toast.success('Enquete excluída')
    setConfirmDelete(null)
    refresh()
  }

  function toggleExpand(pollId) {
    if (expandedPoll !== pollId) {
      setExpandedPoll(pollId)
      loadVoteCounts(pollId)
    } else {
      setExpandedPoll(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Enquetes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{polls.length} enquetes</p>
        </div>
        <button onClick={() => setModalPoll(null)} className="btn-primary text-sm">+ Nova enquete</button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => {
            const counts = voteCounts[poll.id] ?? {}
            const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0)
            const chartData = (poll.poll_options ?? []).map(opt => ({
              name: opt.text.slice(0, 20),
              votes: counts[opt.id] ?? 0
            }))

            return (
              <div key={poll.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{poll.question}</h3>
                      <span className={poll.active ? 'badge-green' : 'badge-gray'}>
                        {poll.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {poll.poll_options?.length ?? 0} opções · {totalVotes} votos
                      {poll.ends_at && ` · Encerra ${new Date(poll.ends_at).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleExpand(poll.id)} className="btn-secondary text-xs">
                      {expandedPoll === poll.id ? 'Ocultar' : 'Resultados'}
                    </button>
                    <button onClick={() => setModalPoll(poll)} className="btn-secondary text-xs">Editar</button>
                    <button onClick={() => setConfirmDelete(poll)} className="btn-danger text-xs">Excluir</button>
                  </div>
                </div>

                {expandedPoll === poll.id && chartData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="votes" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )
          })}
          {polls.length === 0 && (
            <div className="card text-center py-12 text-gray-400 text-sm">Nenhuma enquete ainda.</div>
          )}
        </div>
      )}

      {modalPoll !== undefined && (
        <PollModal
          poll={modalPoll || null}
          onClose={() => setModalPoll(undefined)}
          onSaved={() => { setModalPoll(undefined); refresh() }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir enquete"
        message={`Excluir "${confirmDelete?.question}"? Todos os votos serão removidos.`}
        confirmLabel="Excluir"
        danger
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
