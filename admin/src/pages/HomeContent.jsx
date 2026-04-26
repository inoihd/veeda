import { useState } from 'react'
import toast from 'react-hot-toast'
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
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import ConfirmDialog from '../components/ConfirmDialog'

const TYPES = ['youtube', 'iframe', 'html', 'image', 'gif']
const SIZES = ['small', 'medium', 'large', 'full']

function BoxModal({ box, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: box?.type ?? 'html',
    title: box?.title ?? '',
    url: box?.url ?? '',
    content: box?.content ?? '',
    size: box?.size ?? 'medium',
    link_url: box?.link_url ?? '',
    enabled: box?.enabled ?? true
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
        enabled: form.enabled
      }
      if (box) {
        await supabase.from('home_boxes').update(row).eq('id', box.id)
      } else {
        await supabase.from('home_boxes').insert(row)
      }
      await logAction(box ? 'update_home_box' : 'create_home_box', { title: form.title })
      toast.success('Box salvo')
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

          {(form.type === 'youtube' || form.type === 'iframe' || form.type === 'image' || form.type === 'gif') && (
            <div className="col-span-2">
              <label className="label">{form.type === 'youtube' ? 'YouTube URL' : form.type === 'iframe' ? 'URL do iframe' : 'URL da imagem/GIF'}</label>
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

          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} className="rounded border-gray-300 text-brand-600" id="enabled-box" />
            <label htmlFor="enabled-box" className="text-sm text-gray-700 cursor-pointer">Ativo</label>
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

function PreviewModal({ box, onClose }) {
  if (!box) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{box.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="rounded-xl overflow-hidden bg-gray-100" style={{ minHeight: 200 }}>
          {box.type === 'youtube' && box.url && (
            <iframe
              src={box.url.replace('watch?v=', 'embed/')}
              className="w-full"
              style={{ height: 300 }}
              allowFullScreen
              title="YouTube Preview"
            />
          )}
          {box.type === 'iframe' && box.url && (
            <iframe src={box.url} className="w-full" style={{ height: 300 }} title="iframe Preview" />
          )}
          {(box.type === 'image' || box.type === 'gif') && box.url && (
            <img src={box.url} alt={box.title} className="w-full object-contain max-h-80" />
          )}
          {box.type === 'html' && box.content && (
            <div className="p-4 text-sm" dangerouslySetInnerHTML={{ __html: box.content }} />
          )}
        </div>
      </div>
    </div>
  )
}

function SortableBoxRow({ item, onEdit, onPreview, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const typeColors = {
    youtube: 'bg-red-100 text-red-700',
    iframe:  'bg-blue-100 text-blue-700',
    html:    'bg-purple-100 text-purple-700',
    image:   'bg-green-100 text-green-700',
    gif:     'bg-yellow-100 text-yellow-700'
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing text-lg">⋮⋮</button>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[item.type] ?? 'bg-gray-100 text-gray-600'}`}>{item.type}</span>
      <div className="flex-1">
        <p className="font-medium text-sm text-gray-900">{item.title}</p>
        <p className="text-xs text-gray-400">{item.size} · {item.url?.slice(0, 40) ?? item.content?.slice(0, 40) ?? '—'}</p>
      </div>
      <span className={item.enabled ? 'badge-green' : 'badge-gray'}>{item.enabled ? 'Ativo' : 'Inativo'}</span>
      <button onClick={() => onPreview(item)} className="btn-secondary text-xs">Preview</button>
      <button onClick={() => onEdit(item)} className="btn-secondary text-xs">Editar</button>
      <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800 text-xs px-2">✕</button>
    </div>
  )
}

export default function HomeContent() {
  const { rows, loading, refresh } = useRealtimeTable('home_boxes', { orderBy: 'order', ascending: true })
  const [items, setItems] = useState([])
  const [synced, setSynced] = useState(false)
  const [modal, setModal] = useState(undefined)
  const [previewBox, setPreviewBox] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (!synced && rows.length > 0) { setItems(rows); setSynced(true) }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    setItems(prev => arrayMove(prev, oldIndex, newIndex))
  }

  async function saveOrder() {
    for (let i = 0; i < items.length; i++) {
      await supabase.from('home_boxes').update({ order: i }).eq('id', items[i].id)
    }
    await logAction('reorder_home_boxes', { count: items.length })
    toast.success('Ordem salva')
  }

  async function handleDelete(box) {
    await supabase.from('home_boxes').delete().eq('id', box.id)
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
          <p className="text-sm text-gray-500 mt-0.5">Arraste para reordenar blocos da home</p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveOrder} className="btn-secondary text-sm">Salvar ordem</button>
          <button onClick={() => setModal(null)} className="btn-primary text-sm">+ Novo box</button>
        </div>
      </div>

      {loading && !synced ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displayItems.map(item => (
                <SortableBoxRow
                  key={item.id}
                  item={item}
                  onEdit={setModal}
                  onPreview={setPreviewBox}
                  onDelete={setConfirmDelete}
                />
              ))}
              {displayItems.length === 0 && (
                <div className="card text-center py-12 text-gray-400 text-sm">Nenhum box criado.</div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modal !== undefined && (
        <BoxModal
          box={modal || null}
          onClose={() => setModal(undefined)}
          onSaved={() => { setModal(undefined); refresh(); setSynced(false) }}
        />
      )}

      <PreviewModal box={previewBox} onClose={() => setPreviewBox(null)} />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir box"
        message={`Excluir "${confirmDelete?.title}"?`}
        confirmLabel="Excluir" danger
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
