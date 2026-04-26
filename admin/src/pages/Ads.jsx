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

const SIZES = ['banner', 'rectangle', 'leaderboard', 'halfpage', 'custom']

function AdModal({ ad, onClose, onSaved }) {
  const [form, setForm] = useState({
    slot_name: ad?.slot_name ?? '',
    size: ad?.size ?? 'banner',
    adsense_code: ad?.adsense_code ?? '',
    restricted_categories: (ad?.restricted_categories ?? []).join(', '),
    enabled: ad?.enabled ?? true
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.slot_name.trim()) { toast.error('Nome do slot obrigatório'); return }
    setSaving(true)
    const row = {
      slot_name: form.slot_name.trim(),
      size: form.size,
      adsense_code: form.adsense_code.trim() || null,
      restricted_categories: form.restricted_categories.split(',').map(s => s.trim()).filter(Boolean),
      enabled: form.enabled
    }
    try {
      if (ad) {
        await supabase.from('ad_boxes').update(row).eq('id', ad.id)
      } else {
        await supabase.from('ad_boxes').insert(row)
      }
      await logAction(ad ? 'update_ad' : 'create_ad', { slot: form.slot_name })
      toast.success(ad ? 'Anúncio atualizado' : 'Anúncio criado')
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
        <h3 className="text-lg font-semibold">{ad ? 'Editar anúncio' : 'Novo anúncio'}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome do slot</label>
            <input value={form.slot_name} onChange={e => set('slot_name', e.target.value)} className="input" placeholder="home-top-banner" />
          </div>
          <div>
            <label className="label">Tamanho</label>
            <select value={form.size} onChange={e => set('size', e.target.value)} className="input">
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} className="rounded border-gray-300 text-brand-600" />
              Ativo
            </label>
          </div>
          <div className="col-span-2">
            <label className="label">Código AdSense</label>
            <textarea
              value={form.adsense_code}
              onChange={e => set('adsense_code', e.target.value)}
              className="input h-28 resize-none font-mono text-xs"
              placeholder="<ins class='adsbygoogle' ..."
            />
          </div>
          <div className="col-span-2">
            <label className="label">Categorias restritas (separadas por vírgula)</label>
            <input
              value={form.restricted_categories}
              onChange={e => set('restricted_categories', e.target.value)}
              className="input"
              placeholder="adult, violence"
            />
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

function SortableAdRow({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing text-lg">⋮⋮</button>
      <div className="flex-1">
        <p className="font-medium text-sm text-gray-900">{item.slot_name}</p>
        <p className="text-xs text-gray-400">{item.size} · {item.restricted_categories?.length ? `restrições: ${item.restricted_categories.join(', ')}` : 'sem restrições'}</p>
      </div>
      <span className={item.enabled ? 'badge-green' : 'badge-gray'}>{item.enabled ? 'Ativo' : 'Inativo'}</span>
      <button onClick={() => onEdit(item)} className="btn-secondary text-xs">Editar</button>
      <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800 text-xs px-2">✕</button>
    </div>
  )
}

export default function Ads() {
  const { rows, loading, refresh } = useRealtimeTable('ad_boxes', { orderBy: 'order', ascending: true })
  const [items, setItems] = useState([])
  const [synced, setSynced] = useState(false)
  const [modal, setModal] = useState(undefined)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Sync rows → items on first load
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
    const updates = items.map((item, idx) => ({ id: item.id, order: idx }))
    for (const u of updates) {
      await supabase.from('ad_boxes').update({ order: u.order }).eq('id', u.id)
    }
    await logAction('reorder_ads', { count: updates.length })
    toast.success('Ordem salva')
  }

  async function handleDelete(ad) {
    await supabase.from('ad_boxes').delete().eq('id', ad.id)
    await logAction('delete_ad', { slot: ad.slot_name })
    toast.success('Anúncio excluído')
    setConfirmDelete(null)
    refresh()
    setSynced(false)
  }

  const displayItems = synced ? items : rows

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Anúncios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{displayItems.length} slots configurados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveOrder} className="btn-secondary text-sm">Salvar ordem</button>
          <button onClick={() => setModal(null)} className="btn-primary text-sm">+ Novo slot</button>
        </div>
      </div>

      {loading && !synced ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displayItems.map(item => (
                <SortableAdRow
                  key={item.id}
                  item={item}
                  onEdit={setModal}
                  onDelete={setConfirmDelete}
                />
              ))}
              {displayItems.length === 0 && (
                <div className="card text-center py-12 text-gray-400 text-sm">Nenhum anúncio configurado.</div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modal !== undefined && (
        <AdModal
          ad={modal || null}
          onClose={() => setModal(undefined)}
          onSaved={() => { setModal(undefined); refresh(); setSynced(false) }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir anúncio"
        message={`Excluir o slot "${confirmDelete?.slot_name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
