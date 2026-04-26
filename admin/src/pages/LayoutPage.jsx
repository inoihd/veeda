import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'

function SortableRow({ item, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-lg">⋮⋮</button>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{item.label}</p>
        <p className="text-xs text-gray-400 font-mono">{item.section_key}</p>
      </div>
      <button
        onClick={() => onToggle(item)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.enabled ? 'bg-brand-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${item.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} style={{ transform: item.enabled ? 'translateX(18px)' : 'translateX(2px)' }} />
      </button>
    </div>
  )
}

export default function LayoutPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('layout_config')
      .select('*')
      .order('order')
    if (error) { toast.error('Erro ao carregar layout'); setLoading(false); return }
    setItems(data ?? [])
    setLoading(false)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    setItems(prev => arrayMove(prev, oldIndex, newIndex))
  }

  function handleToggle(item) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, enabled: !i.enabled } : i))
  }

  async function handleSave() {
    setSaving(true)
    const rows = items.map((item, index) => ({
      id: item.id,
      section_key: item.section_key,
      label: item.label,
      enabled: item.enabled,
      order: index,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase.from('layout_config').upsert(rows)
    if (error) { toast.error('Erro ao salvar'); setSaving(false); return }

    await logAction('update_layout_config', { sections: rows.length })
    toast.success('Layout salvo com sucesso')
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Layout</h1>
          <p className="text-sm text-gray-500 mt-0.5">Arraste para reordenar, toggle para ativar/desativar seções</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
          {saving ? 'Salvando...' : 'Salvar ordem'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">Nenhuma seção de layout configurada.</p>
          <p className="text-gray-400 text-xs mt-1">Insira registros em <code>layout_config</code> no banco.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map(item => (
                <SortableRow key={item.id} item={item} onToggle={handleToggle} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
