import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'

const PAGE_SECTIONS = [
  { key: 'timeline', label: '📅 Linha do Tempo' },
  { key: 'home',     label: '🏠 Home' },
  { key: 'circle',   label: '👥 Meu Círculo' },
]

const SECTION_BG = {
  timeline: '#faf8ff',
  home: '#f0fdf4',
  circle: '#fff7ed',
}

function buildPreviewDoc(blocks) {
  const body = blocks
    .filter(b => b.enabled)
    .map(b => b.block_html || '')
    .join('\n')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0ff;min-height:100%}</style>
</head><body>${body}</body></html>`
}

function SortableBlock({ block, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all ${
        block.enabled ? 'bg-white border-violet-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing text-base flex-shrink-0">⋮⋮</button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{block.label}</p>
        <p className="text-[10px] text-gray-400 font-mono truncate">{block.section_key}</p>
      </div>
      <button
        onClick={() => onToggle(block)}
        title={block.enabled ? 'Desativar' : 'Ativar'}
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${block.enabled ? 'bg-violet-600' : 'bg-gray-300'}`}
      >
        <span className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
          style={{ transform: block.enabled ? 'translateX(14px)' : 'translateX(2px)' }} />
      </button>
    </div>
  )
}

export default function LayoutPage() {
  const [allBlocks, setAllBlocks] = useState({}) // { section_key: [...blocks] }
  const [allSections, setAllSections] = useState([]) // top-level pages/modals
  const [activeSection, setActiveSection] = useState('timeline')
  const [activeTab, setActiveTab] = useState('pages') // 'pages' | 'modals' | 'components'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('layout_config').select('*').order('order')
    if (error) { toast.error('Erro ao carregar'); setLoading(false); return }

    // Separate top-level sections from blocks
    const sections = (data ?? []).filter(r => !r.parent_section)
    const blocks = {}
    for (const r of (data ?? []).filter(r => r.parent_section)) {
      if (!blocks[r.parent_section]) blocks[r.parent_section] = []
      blocks[r.parent_section].push(r)
    }
    setAllSections(sections)
    setAllBlocks(blocks)
    setLoading(false)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setAllBlocks(prev => {
      const list = prev[activeSection] ?? []
      const oldIdx = list.findIndex(b => b.id === active.id)
      const newIdx = list.findIndex(b => b.id === over.id)
      const next = { ...prev, [activeSection]: arrayMove(list, oldIdx, newIdx) }
      setPreviewKey(k => k + 1)
      return next
    })
  }

  function handleToggleBlock(block) {
    setAllBlocks(prev => {
      const list = prev[block.parent_section] ?? []
      const next = { ...prev, [block.parent_section]: list.map(b => b.id === block.id ? { ...b, enabled: !b.enabled } : b) }
      setPreviewKey(k => k + 1)
      return next
    })
  }

  function handleToggleSection(section) {
    setAllSections(prev => prev.map(s => s.id === section.id ? { ...s, enabled: !s.enabled } : s))
  }

  async function handleSave() {
    setSaving(true)
    const blockRows = Object.values(allBlocks).flat().map((b, _, arr) => ({
      id: b.id, section_key: b.section_key, label: b.label, enabled: b.enabled,
      category: b.category, parent_section: b.parent_section, block_html: b.block_html,
      order: (allBlocks[b.parent_section] ?? []).findIndex(x => x.id === b.id),
      updated_at: new Date().toISOString()
    }))
    const sectionRows = allSections.map((s, i) => ({
      id: s.id, section_key: s.section_key, label: s.label, enabled: s.enabled,
      category: s.category, order: i, updated_at: new Date().toISOString()
    }))
    const { error } = await supabase.from('layout_config').upsert([...sectionRows, ...blockRows])
    if (error) { toast.error('Erro ao salvar'); setSaving(false); return }
    await logAction('update_layout_config', { sections: sectionRows.length, blocks: blockRows.length })
    toast.success('Layout salvo')
    setSaving(false)
  }

  const currentBlocks = allBlocks[activeSection] ?? []
  const previewDoc = useMemo(() => buildPreviewDoc(currentBlocks), [previewKey, activeSection])

  const tabSections = {
    pages: allSections.filter(s => s.category === 'page'),
    modals: allSections.filter(s => s.category === 'modal'),
    components: allSections.filter(s => s.category === 'component'),
  }

  const hasBlocks = PAGE_SECTIONS.some(p => p.key === activeSection)

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Layout</h1>
          <p className="text-sm text-gray-500 mt-0.5">Reordene blocos e veja o preview em tempo real</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
          {saving ? 'Salvando...' : 'Salvar layout'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        {[['pages','📄 Páginas'],['modals','🪟 Modais'],['components','🧩 Componentes']].map(([tab, label]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setActiveSection(tabSections[tab]?.[0]?.section_key ?? '') }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'}`}>
            {label} <span className="ml-1 opacity-60 text-xs">({tabSections[tab]?.length ?? 0})</span>
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-400">Carregando...</p> : (
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Column 1: section list */}
          <div className="w-44 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">Seções</p>
            {(tabSections[activeTab] ?? []).map(s => (
              <button key={s.id}
                onClick={() => setActiveSection(s.section_key)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all border ${
                  activeSection === s.section_key
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'
                }`}>
                <span className="font-medium truncate">{s.label}</span>
                <span onClick={e => { e.stopPropagation(); handleToggleSection(s) }}
                  className={`ml-2 w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-[9px] ${
                    s.enabled ? 'bg-green-400 border-green-400 text-white' : 'border-gray-300 text-gray-300'
                  }`}>●</span>
              </button>
            ))}
          </div>

          {/* Column 2: blocks DnD (only for pages with blocks) */}
          {hasBlocks && activeTab === 'pages' && (
            <div className="w-52 flex-shrink-0 flex flex-col min-h-0">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Blocos</p>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {currentBlocks.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Nenhum bloco</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={currentBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      {currentBlocks.map(block => (
                        <SortableBlock key={block.id} block={block} onToggle={handleToggleBlock} />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          )}

          {/* Column 3: live preview */}
          <div className="flex-1 min-w-0 flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"/>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"/>
                  <div className="w-3 h-3 rounded-full bg-green-400"/>
                </div>
                <span className="text-xs text-gray-500 font-medium ml-2">
                  {allSections.find(s => s.section_key === activeSection)?.label ?? activeSection}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">{currentBlocks.filter(b => b.enabled).length}/{currentBlocks.length} blocos ativos</span>
            </div>
            {/* Mobile frame */}
            <div className="flex-1 bg-gray-200 flex items-start justify-center py-4 overflow-y-auto">
              <div className="w-72 bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-300" style={{ minHeight: 500 }}>
                {activeTab === 'pages' && hasBlocks ? (
                  <iframe
                    key={previewKey}
                    srcDoc={previewDoc}
                    className="w-full border-none"
                    style={{ minHeight: 500, display: 'block' }}
                    title="preview"
                  />
                ) : (
                  <iframe
                    srcDoc={(() => {
                      const s = allSections.find(x => x.section_key === activeSection)
                      return s?.preview_html
                        ? `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif}</style></head><body>${s.preview_html}</body></html>`
                        : `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;min-height:200px;color:#aaa;font-family:system-ui;font-size:13px">Sem preview</body></html>`
                    })()}
                    className="w-full border-none"
                    style={{ minHeight: 500, display: 'block' }}
                    title="preview"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
