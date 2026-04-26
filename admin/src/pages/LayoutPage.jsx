import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'

const CATEGORIES = [
  { key: 'page',      label: '📄 Páginas' },
  { key: 'modal',     label: '🪟 Modais' },
  { key: 'component', label: '🧩 Componentes' },
]

function SortableRow({ item, selected, onSelect, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={() => onSelect(item)}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer border transition-all ${
        selected?.id === item.id
          ? 'border-violet-400 bg-violet-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-violet-200'
      }`}
    >
      <button {...attributes} {...listeners} onClick={e => e.stopPropagation()} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-lg">⋮⋮</button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
        <p className="text-xs text-gray-400 font-mono">{item.section_key}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onToggle(item) }}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${item.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
      >
        <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" style={{ transform: item.enabled ? 'translateX(18px)' : 'translateX(2px)' }} />
      </button>
    </div>
  )
}

function PreviewPanel({ item }) {
  if (!item) return (
    <div className="flex-1 card flex items-center justify-center text-gray-400 text-sm">
      Selecione uma seção para visualizar
    </div>
  )
  return (
    <div className="flex-1 card p-0 overflow-hidden flex flex-col">
      <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4">
        <span className="text-xs font-medium text-gray-700">{item.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {item.enabled ? 'Ativo' : 'Desativado'}
        </span>
      </div>
      {item.preview_html ? (
        <iframe
          srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif}</style></head><body>${item.preview_html}</body></html>`}
          className="flex-1 w-full border-none"
          title={item.label}
          style={{ minHeight: 200 }}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Sem preview disponível
        </div>
      )}
      <div className="h-10 bg-gray-50 border-t border-gray-100 flex items-center px-4 gap-2">
        <span className="text-xs text-gray-500">Categoria:</span>
        <span className="text-xs font-mono text-violet-600">{item.category}</span>
        <span className="text-xs text-gray-500 ml-4">Ordem:</span>
        <span className="text-xs font-mono text-violet-600">{item.order}</span>
      </div>
    </div>
  )
}

export default function LayoutPage() {
  const [itemsByCategory, setItemsByCategory] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('page')

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('layout_config').select('*').order('order')
    if (error) { toast.error('Erro ao carregar layout'); setLoading(false); return }
    const grouped = {}
    for (const cat of CATEGORIES) {
      grouped[cat.key] = (data ?? []).filter(i => (i.category ?? 'page') === cat.key)
    }
    setItemsByCategory(grouped)
    setLoading(false)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItemsByCategory(prev => {
      const cat = activeCategory
      const list = prev[cat] ?? []
      const oldIdx = list.findIndex(i => i.id === active.id)
      const newIdx = list.findIndex(i => i.id === over.id)
      return { ...prev, [cat]: arrayMove(list, oldIdx, newIdx) }
    })
  }

  function handleToggle(item) {
    const cat = item.category ?? 'page'
    setItemsByCategory(prev => ({
      ...prev,
      [cat]: prev[cat].map(i => i.id === item.id ? { ...i, enabled: !i.enabled } : i)
    }))
    if (selected?.id === item.id) setSelected(s => ({ ...s, enabled: !s.enabled }))
  }

  async function handleSave() {
    setSaving(true)
    const allItems = Object.values(itemsByCategory).flat().map((item, _, arr) => ({
      id: item.id,
      section_key: item.section_key,
      label: item.label,
      enabled: item.enabled,
      category: item.category,
      order: (itemsByCategory[item.category ?? 'page'] ?? []).findIndex(i => i.id === item.id),
      updated_at: new Date().toISOString()
    }))
    const { error } = await supabase.from('layout_config').upsert(allItems)
    if (error) { toast.error('Erro ao salvar'); setSaving(false); return }
    await logAction('update_layout_config', { total: allItems.length })
    toast.success('Layout salvo')
    setSaving(false)
  }

  const currentList = itemsByCategory[activeCategory] ?? []

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Layout</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie seções por categoria. Clique para visualizar.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
            }`}
          >
            {cat.label}
            <span className="ml-2 text-xs opacity-70">({(itemsByCategory[cat.key] ?? []).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="flex gap-4" style={{ height: 'calc(100vh - 240px)' }}>
          {/* List */}
          <div className="w-72 flex-shrink-0 overflow-y-auto space-y-2 pr-1">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentList.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {currentList.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhuma seção nesta categoria</p>
                ) : currentList.map(item => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    selected={selected}
                    onSelect={setSelected}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Preview */}
          <PreviewPanel item={selected} />
        </div>
      )}
    </div>
  )
}
