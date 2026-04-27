import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Editor from '@monaco-editor/react'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'

const RAW_BASE = 'https://raw.githubusercontent.com/inoihd/veeda/main/'

const INJECT_PREVIEW = `<script>
window._ADMIN_PREVIEW = true;
// Element selection: click any element → send outerHTML + computed styles via postMessage
document.addEventListener('DOMContentLoaded', function() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;';
  document.body.appendChild(overlay);

  var highlight = document.createElement('div');
  highlight.style.cssText = 'position:absolute;border:2px solid #9000FF;background:rgba(144,0,255,0.08);pointer-events:none;display:none;transition:all 0.1s;border-radius:4px;';
  overlay.appendChild(highlight);

  document.addEventListener('mouseover', function(e) {
    var r = e.target.getBoundingClientRect();
    highlight.style.display = 'block';
    highlight.style.top = (r.top + window.scrollY) + 'px';
    highlight.style.left = r.left + 'px';
    highlight.style.width = r.width + 'px';
    highlight.style.height = r.height + 'px';
  }, true);

  document.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    var el = e.target;
    var computed = window.getComputedStyle(el);
    var styles = {};
    ['color','background','backgroundColor','fontSize','fontWeight','padding','margin',
     'borderRadius','border','display','flexDirection','gap','width','height','lineHeight',
     'fontFamily','letterSpacing','boxShadow','opacity','alignItems','justifyContent'].forEach(function(p) {
      styles[p] = computed[p];
    });
    window.parent.postMessage({
      type: 'element-select',
      html: el.outerHTML,
      tag: el.tagName.toLowerCase(),
      style: el.getAttribute('style') || '',
      computedStyles: styles,
      className: el.className
    }, '*');
  }, true);
});
<\/script>`

async function fetchRealApp() {
  const res = await fetch(RAW_BASE + 'index.html?t=' + Date.now())
  let html = await res.text()
  // Fix relative URLs → absolute GitHub raw
  html = html
    .replace(/src="(?!http|\/\/)(\.\/)?/g, `src="${RAW_BASE}`)
    .replace(/href="(?!http|\/\/|#)(\.\/)?/g, `href="${RAW_BASE}`)
  // Inject preview script right after <head>
  html = html.replace('<head>', '<head>' + INJECT_PREVIEW)
  return html
}

function SortableBlock({ block, selected, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const isSelected = selected?.section_key === block.section_key
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all ${
        isSelected ? 'border-violet-500 bg-violet-50 shadow-md' :
        block.enabled ? 'bg-white border-violet-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'
      }`}>
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0">⋮⋮</button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{block.label}</p>
        <p className="text-[10px] text-gray-400 font-mono">{block.section_key}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); onToggle(block) }}
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${block.enabled ? 'bg-violet-600' : 'bg-gray-300'}`}>
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
  const [appHtml, setAppHtml] = useState('')
  const [appLoading, setAppLoading] = useState(true)
  const [selected, setSelected] = useState(null) // {html, style, computedStyles, tag}
  const [editStyle, setEditStyle] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => { loadData(); loadApp() }, [])

  useEffect(() => {
    const handler = e => {
      if (e.data?.type !== 'element-select') return
      setSelected(e.data)
      setEditStyle(e.data.style)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  async function loadApp() {
    setAppLoading(true)
    try {
      const html = await fetchRealApp()
      setAppHtml(html)
    } catch {
      toast.error('Erro ao carregar o app')
    }
    setAppLoading(false)
  }

  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase.from('layout_config').select('*').order('order')
    if (error) { toast.error('Erro ao carregar'); setLoading(false); return }
    setAllSections((data ?? []).filter(r => !r.parent_section))
    const blocks = {}
    for (const r of (data ?? []).filter(r => r.parent_section)) {
      if (!blocks[r.parent_section]) blocks[r.parent_section] = []
      blocks[r.parent_section].push(r)
    }
    setAllBlocks(blocks)
    setLoading(false)
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    setAllBlocks(prev => {
      const list = prev[activeSection] ?? []
      return { ...prev, [activeSection]: arrayMove(list, list.findIndex(b => b.id === active.id), list.findIndex(b => b.id === over.id)) }
    })
  }

  function handleToggle(block) {
    setAllBlocks(prev => ({
      ...prev,
      [block.parent_section]: (prev[block.parent_section] ?? []).map(b => b.id === block.id ? { ...b, enabled: !b.enabled } : b)
    }))
  }

  async function handleSave() {
    setSaving(true)
    const rows = [...allSections.map((s, i) => ({ ...s, order: i, updated_at: new Date().toISOString() })),
      ...Object.values(allBlocks).flat().map(b => ({
        ...b, order: (allBlocks[b.parent_section] ?? []).findIndex(x => x.id === b.id), updated_at: new Date().toISOString()
      }))]
    const { error } = await supabase.from('layout_config').upsert(rows)
    if (error) { toast.error('Erro ao salvar'); setSaving(false); return }
    await logAction('update_layout_config', { rows: rows.length })
    toast.success('Layout salvo')
    setSaving(false)
  }

  const tabSections = {
    pages: allSections.filter(s => s.category === 'page'),
    modals: allSections.filter(s => s.category === 'modal'),
    components: allSections.filter(s => s.category === 'component'),
  }
  const currentBlocks = allBlocks[activeSection] ?? []

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Layout</h1>
          <p className="text-sm text-gray-500 mt-0.5">Preview renderiza o app real. Clique em qualquer elemento para editar.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadApp} className="text-sm border border-gray-200 px-3 py-1.5 rounded-xl hover:border-violet-300 bg-white">↺ Recarregar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Salvando...' : 'Salvar e publicar'}</button>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-shrink-0">
        {[['pages','📄 Páginas'],['modals','🪟 Modais'],['components','🧩 Componentes']].map(([tab, label]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); const f = tabSections[tab]?.[0]; if (f) setActiveSection(f.section_key) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'}`}>
            {label} <span className="ml-1 opacity-60 text-xs">({tabSections[tab]?.length ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Seções */}
        <div className="w-36 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">Seções</p>
          {(tabSections[activeTab] ?? []).map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.section_key); setSelected(null) }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all ${activeSection === s.section_key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}>
              <span className="font-medium truncate flex-1">{s.label}</span>
              <span onClick={e => { e.stopPropagation(); setAllSections(prev => prev.map(x => x.id === s.id ? { ...x, enabled: !x.enabled } : x)) }}
                className={`ml-1.5 w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-[8px] ${s.enabled ? 'bg-green-400 border-green-400 text-white' : 'border-gray-300'}`}>●</span>
            </button>
          ))}
        </div>

        {/* Blocos */}
        {activeTab === 'pages' && (
          <div className="w-48 flex-shrink-0 flex flex-col min-h-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5">Blocos</p>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  {currentBlocks.map(block => (
                    <SortableBlock key={block.id} block={block} selected={selected} onToggle={handleToggle} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}

        {/* Preview real do app */}
        <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-200">
          <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-3 flex-shrink-0">
            <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
            <span className="text-[10px] text-gray-400">{appLoading ? 'Carregando app...' : 'App real — clique para selecionar'}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {appLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Carregando...</div>
            ) : (
              <iframe srcDoc={appHtml} className="w-full border-none" style={{ height: '100%', minHeight: 600, display: 'block' }} title="Veeda Preview" sandbox="allow-scripts allow-same-origin" />
            )}
          </div>
        </div>

        {/* Editor inline */}
        <div className="flex-1 min-w-0 flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
            <span className="text-xs font-mono text-gray-500">{selected ? `<${selected.tag}> — edite o style="" inline` : '← clique em um elemento no preview'}</span>
            {selected && <button onClick={() => setSelected(null)} className="text-[10px] text-gray-400 hover:text-gray-600">✕</button>}
          </div>
          <div className="flex-1">
            {selected ? (
              <Editor height="100%" language="css"
                value={`/* Elemento: <${selected.tag}> */\n/* Estilos inline atuais: */\n${editStyle}\n\n/* Estilos computados (referência): */\n${Object.entries(selected.computedStyles || {}).map(([k,v])=>`/* ${k}: ${v}; */`).join('\n')}`}
                onChange={v => setEditStyle((v ?? '').split('\n').filter(l => !l.startsWith('/*')).join('\n').trim())}
                theme="light"
                options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: 'on', scrollBeyondLastLine: false, padding: { top: 12 } }}
              />
            ) : (
              <div className="flex items-center justify-center h-full flex-col gap-3 text-gray-300">
                <span className="text-4xl">👆</span>
                <p className="text-sm">Clique em qualquer elemento no preview</p>
                <p className="text-xs">O style inline e estilos computados aparecem aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
