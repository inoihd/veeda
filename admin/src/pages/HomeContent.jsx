import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import ConfirmDialog from '../components/ConfirmDialog'

const TYPES = ['youtube', 'iframe', 'html', 'image', 'gif']
const SIZES = ['small', 'medium', 'large']

const TYPE_COLORS = {
  youtube: 'bg-red-100 text-red-700',
  iframe:  'bg-blue-100 text-blue-700',
  html:    'bg-purple-100 text-purple-700',
  image:   'bg-green-100 text-green-700',
  gif:     'bg-yellow-100 text-yellow-700'
}

function BoxModal({ box, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: box?.type ?? 'html',
    title: box?.title ?? '',
    url: box?.url ?? '',
    content: box?.content ?? '',
    size: box?.size ?? 'medium',
    link_url: box?.link_url ?? '',
    enabled: box?.enabled ?? true,
    order: box?.order ?? 0
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return }
    setSaving(true)
    try {
      const row = {
        type: form.type,
        title: form.title.trim(),
        url: form.url.trim() || null,
        content: form.content.trim() || null,
        size: form.size,
        link_url: form.link_url.trim() || null,
        enabled: form.enabled,
        order: Number(form.order)
      }
      if (box) {
        const { error } = await supabase.from('home_boxes').update(row).eq('id', box.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('home_boxes').insert(row)
        if (error) throw error
      }
      await logAction(box ? 'update_home_box' : 'create_home_box', { title: form.title, type: form.type })
      toast.success('Box salvo')
      onSaved()
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const needsUrl = ['youtube', 'iframe', 'image', 'gif'].includes(form.type)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold">{box ? 'Editar box' : 'Novo box'}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tamanho</label>
            <select value={form.size} onChange={e => set('size', e.target.value)} className="input">
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Título</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="input" />
          </div>

          {needsUrl && (
            <div className="col-span-2">
              <label className="label">
                {form.type === 'youtube' ? 'YouTube URL' : form.type === 'iframe' ? 'URL do iframe' : 'URL da imagem/GIF'}
              </label>
              <input value={form.url} onChange={e => set('url', e.target.value)} className="input" placeholder="https://..." />
            </div>
          )}

          {form.type === 'html' && (
            <div className="col-span-2">
              <label className="label">Conteúdo HTML</label>
              <textarea value={form.content} onChange={e => set('content', e.target.value)} className="input h-32 resize-none font-mono text-xs" />
            </div>
          )}

          <div className="col-span-2">
            <label className="label">URL de link (clicável)</label>
            <input value={form.link_url} onChange={e => set('link_url', e.target.value)} className="input" placeholder="https://..." />
          </div>

          <div>
            <label className="label">Ordem</label>
            <input type="number" value={form.order} onChange={e => set('order', e.target.value)} className="input" min={0} />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} className="rounded border-gray-300 text-brand-600" />
              Ativo
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

function PreviewInline({ box }) {
  if (box.type === 'youtube' && box.url) {
    const embedUrl = box.url.replace('watch?v=', 'embed/')
    return (
      <iframe
        src={embedUrl}
        className="w-full rounded-lg"
        style={{ height: 180 }}
        allowFullScreen
        title={box.title}
      />
    )
  }
  if (box.type === 'iframe' && box.url) {
    return <iframe src={box.url} className="w-full rounded-lg" style={{ height: 180 }} title={box.title} />
  }
  if ((box.type === 'image' || box.type === 'gif') && box.url) {
    return <img src={box.url} alt={box.title} className="w-full max-h-40 object-contain rounded-lg bg-gray-50" />
  }
  if (box.type === 'html' && box.content) {
    return (
      <div
        className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-100 max-h-32 overflow-hidden"
        dangerouslySetInnerHTML={{ __html: box.content }}
      />
    )
  }
  return <p className="text-xs text-gray-400 italic">Sem conteúdo para visualizar</p>
}

export default function HomeContent() {
  const { rows, loading, refresh } = useRealtimeTable('home_boxes', { orderBy: 'order', ascending: true })
  const [items, setItems] = useState([])
  const [synced, setSynced] = useState(false)
  const [modal, setModal] = useState(undefined)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedPreview, setExpandedPreview] = useState(null)

  useEffect(() => {
    if (rows.length > 0) { setItems(rows); setSynced(true) }
    else if (!loading) { setItems([]); setSynced(true) }
  }, [rows, loading])

  function moveItem(index, direction) {
    const newItems = [...items]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    setItems(newItems)
  }

  async function saveOrder() {
    try {
      for (let i = 0; i < items.length; i++) {
        await supabase.from('home_boxes').update({ order: i }).eq('id', items[i].id)
      }
      await logAction('reorder_home_boxes', { count: items.length })
      toast.success('Ordem salva')
      refresh()
    } catch (err) {
      toast.error('Erro ao salvar ordem: ' + err.message)
    }
  }

  async function toggleEnabled(box) {
    const { error } = await supabase.from('home_boxes').update({ enabled: !box.enabled }).eq('id', box.id)
    if (error) { toast.error('Erro: ' + error.message); return }
    await logAction('toggle_home_box', { id: box.id, title: box.title, enabled: !box.enabled })
    toast.success(box.enabled ? 'Box desativado' : 'Box ativado')
    refresh()
    setSynced(false)
  }

  async function handleDelete(box) {
    const { error } = await supabase.from('home_boxes').delete().eq('id', box.id)
    if (error) { toast.error('Erro: ' + error.message); return }
    await logAction('delete_home_box', { title: box.title })
    toast.success('Box excluído')
    setConfirmDelete(null)
    refresh()
    setSynced(false)
  }

  const displayItems = synced ? items : rows

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Home Content</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie os blocos exibidos na home</p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveOrder} className="btn-secondary text-sm">Salvar ordem</button>
          <button onClick={() => setModal(null)} className="btn-primary text-sm">+ Novo box</button>
        </div>
      </div>

      {loading && !synced ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item, index) => (
            <div key={item.id} className="card space-y-3">
              <div className="flex items-center gap-3">
                {/* Up/Down order buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none px-1"
                    title="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === displayItems.length - 1}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none px-1"
                    title="Mover para baixo"
                  >
                    ▼
                  </button>
                </div>

                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {item.type}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.size} · ordem {item.order}</p>
                </div>

                <span className={item.enabled ? 'badge-green' : 'badge-gray'}>
                  {item.enabled ? 'Ativo' : 'Inativo'}
                </span>

                <button
                  onClick={() => setExpandedPreview(expandedPreview === item.id ? null : item.id)}
                  className="btn-secondary text-xs"
                >
                  {expandedPreview === item.id ? 'Ocultar' : 'Preview'}
                </button>
                <button onClick={() => setModal(item)} className="btn-secondary text-xs">Editar</button>
                <button onClick={() => toggleEnabled(item)} className="btn-secondary text-xs">
                  {item.enabled ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800 text-xs px-1">✕</button>
              </div>

              {expandedPreview === item.id && (
                <div className="pt-2 border-t border-gray-100">
                  <PreviewInline box={item} />
                </div>
              )}
            </div>
          ))}
          {displayItems.length === 0 && (
            <div className="card text-center py-12 text-gray-400 text-sm">Nenhum box criado.</div>
          )}
        </div>
      )}

      {modal !== undefined && (
        <BoxModal
          box={modal || null}
          onClose={() => setModal(undefined)}
          onSaved={() => { setModal(undefined); refresh(); setSynced(false) }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir box"
        message={`Excluir "${confirmDelete?.title}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
