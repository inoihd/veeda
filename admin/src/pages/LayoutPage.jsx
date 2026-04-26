import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Editor from '@monaco-editor/react'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'

const APP_CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{
  --gradient-primary:linear-gradient(135deg,#9000FF 0%,#7B6FA0 50%,#22FCB7 100%);
  --gradient-secondary:linear-gradient(135deg,#EAFFF8 0%,#F0F6FD 50%,#FDF5F0 100%);
  --shadow-soft:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.04);
  --shadow-glow:0 0 20px rgba(144,0,255,0.3);
}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#EAFFF8 0%,#F0F6FD 50%,#FDF5F0 100%);color:#3A3350;min-height:100vh;}
button{font-family:inherit;cursor:pointer;border:none;}
[data-block]{cursor:pointer;transition:outline 0.15s;}
[data-block]:hover{outline:2px dashed rgba(144,0,255,0.5);outline-offset:2px;}
[data-block].selected{outline:2.5px solid #9000FF!important;outline-offset:2px;position:relative;}
`

const SELECTION_SCRIPT = `
<script>
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-block]');
  if(!el)return;
  document.querySelectorAll('[data-block].selected').forEach(function(x){x.classList.remove('selected');});
  el.classList.add('selected');
  window.parent.postMessage({type:'block-select',key:el.dataset.block,html:el.outerHTML},'*');
},true);
<\/script>`

const PAGE_SECTIONS = ['timeline','home','circle']

function buildPreviewDoc(blocks) {
  const body = blocks.map(b => b.enabled ? b.block_html || '' : `<div data-block="${b.section_key}" style="opacity:0.3;padding:8px 18px;border-bottom:1px dashed #ccc;font-size:11px;color:#aaa;text-align:center">${b.label} (desativado)</div>`).join('\n')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${APP_CSS}</style></head><body>${body}${SELECTION_SCRIPT}</body></html>`
}

function SortableBlock({ block, selected, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const isSelected = selected?.key === block.section_key
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all ${
        isSelected ? 'border-violet-500 bg-violet-50 shadow-md' :
        block.enabled ? 'bg-white border-violet-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing text-base flex-shrink-0">⋮⋮</button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{block.label}</p>
        <p className="text-[10px] text-gray-400 font-mono">{block.section_key}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(block) }}
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${block.enabled ? 'bg-violet-600' : 'bg-gray-300'}`}
      >
        <span className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
          style={{ transform: block.enabled ? 'translateX(14px)' : 'translateX(2px)' }} />
      </button>
    </div>
  )
}

export default function LayoutPage() {
  const [allBlocks, setAllBlocks] = useState({})
  const [allSections, setAllSections] = useState([])
  const [activeSection, setActiveSection] = useState('timeline')
  const [activeTab, setActiveTab] = useState('pages')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState(null) // {key, html}
  const [editHtml, setEditHtml] = useState('')
  const [previewKey, setPreviewKey] = useState(0)
  const iframeRef = useRef(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => { load() }, [])

  // Listen for block selection from iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type !== 'block-select') return
      setSelectedBlock({ key: e.data.key, html: e.data.html })
      setEditHtml(e.data.html)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('layout_config').select('*').order('order')
    if (error) { toast.error('Erro ao carregar'); setLoading(false); return }
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

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    setAllBlocks(prev => {
      const list = prev[activeSection] ?? []
      const next = { ...prev, [activeSection]: arrayMove(list, list.findIndex(b => b.id === active.id), list.findIndex(b => b.id === over.id)) }
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

  // Apply inline HTML edit to the block data
  function applyHtmlEdit() {
    if (!selectedBlock || !editHtml) return
    setAllBlocks(prev => {
      const list = prev[activeSection] ?? []
      const next = { ...prev, [activeSection]: list.map(b => b.section_key === selectedBlock.key ? { ...b, block_html: editHtml } : b) }
      setPreviewKey(k => k + 1)
      return next
    })
    toast.success('Preview atualizado — clique em Salvar para persistir')
  }

  async function handleSave() {
    setSaving(true)
    const blockRows = Object.values(allBlocks).flat().map(b => ({
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
    await logAction('update_layout_config', { blocks: blockRows.length })
    toast.success('Layout salvo e publicado')
    setSaving(false)
  }

  const currentBlocks = allBlocks[activeSection] ?? []
  const previewDoc = useMemo(() => buildPreviewDoc(currentBlocks), [previewKey, activeSection, currentBlocks])

  const tabSections = {
    pages: allSections.filter(s => s.category === 'page'),
    modals: allSections.filter(s => s.category === 'modal'),
    components: allSections.filter(s => s.category === 'component'),
  }
  const isPageWithBlocks = PAGE_SECTIONS.includes(activeSection) && activeTab === 'pages'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Layout</h1>
          <p className="text-sm text-gray-500 mt-0.5">Arraste blocos, clique no preview para editar HTML inline</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
          {saving ? 'Salvando...' : 'Salvar e publicar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3 flex-shrink-0">
        {[['pages','📄 Páginas'],['modals','🪟 Modais'],['components','🧩 Componentes']].map(([tab, label]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); const first = tabSections[tab]?.[0]; if(first) setActiveSection(first.section_key) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'}`}>
            {label} <span className="ml-1 opacity-60 text-xs">({tabSections[tab]?.length ?? 0})</span>
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-400">Carregando...</p> : (
        <div className="flex gap-3 flex-1 min-h-0">

          {/* Col 1: section list */}
          <div className="w-36 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">Seções</p>
            {(tabSections[activeTab] ?? []).map(s => (
              <button key={s.id}
                onClick={() => { setActiveSection(s.section_key); setSelectedBlock(null) }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all border ${
                  activeSection === s.section_key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'
                }`}>
                <span className="font-medium truncate flex-1">{s.label}</span>
                <span onClick={e => { e.stopPropagation(); setAllSections(prev => prev.map(x => x.id === s.id ? {...x, enabled:!x.enabled} : x)) }}
                  className={`ml-1.5 w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-[8px] ${s.enabled ? 'bg-green-400 border-green-400 text-white' : 'border-gray-300'}`}>●</span>
              </button>
            ))}
          </div>

          {/* Col 2: blocks DnD */}
          {isPageWithBlocks && (
            <div className="w-48 flex-shrink-0 flex flex-col min-h-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5">Blocos</p>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={currentBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    {currentBlocks.map(block => (
                      <SortableBlock key={block.id} block={block} selected={selectedBlock} onToggle={handleToggleBlock} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          {/* Col 3: mobile preview */}
          <div className="w-64 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
            <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-3 flex-shrink-0">
              <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
              <span className="text-[10px] text-gray-400">clique no preview para editar</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isPageWithBlocks ? (
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  srcDoc={previewDoc}
                  className="w-full border-none"
                  style={{ minHeight: '100%', height: '600px', display: 'block' }}
                  title="preview"
                />
              ) : (
                <iframe
                  srcDoc={(() => {
                    const s = allSections.find(x => x.section_key === activeSection)
                    return s?.preview_html ? `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${APP_CSS}</style></head><body>${s.preview_html}</body></html>` : `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;min-height:300px;color:#aaa;font-family:system-ui;font-size:13px">Sem preview</body></html>`
                  })()}
                  className="w-full border-none"
                  style={{ minHeight: '100%', height: '600px', display: 'block' }}
                  title="preview"
                />
              )}
            </div>
          </div>

          {/* Col 4: HTML/CSS editor */}
          <div className="flex-1 min-w-0 flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
              <span className="text-xs font-mono text-gray-500">
                {selectedBlock ? `${selectedBlock.key}.html` : '← clique em um bloco no preview'}
              </span>
              {selectedBlock && (
                <button onClick={applyHtmlEdit} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 transition-colors">
                  Aplicar preview
                </button>
              )}
            </div>
            <div className="flex-1">
              {selectedBlock ? (
                <Editor
                  height="100%"
                  language="html"
                  value={editHtml}
                  onChange={v => setEditHtml(v ?? '')}
                  theme="light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 12 },
                    formatOnPaste: true,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm flex-col gap-3">
                  <span className="text-4xl">👆</span>
                  <p>Clique em qualquer elemento no preview</p>
                  <p className="text-xs text-gray-200">O HTML do bloco aparece aqui para edição</p>
                </div>
              )}
            </div>
            {selectedBlock && (
              <div className="h-10 border-t border-gray-100 bg-gray-50 flex items-center justify-between px-4 flex-shrink-0">
                <span className="text-[10px] text-gray-400">Edite o HTML → Aplicar preview → Salvar e publicar</span>
                <button onClick={() => { setSelectedBlock(null); setEditHtml('') }} className="text-[10px] text-gray-400 hover:text-gray-600">✕ fechar</button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
