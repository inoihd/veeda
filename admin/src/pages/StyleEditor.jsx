import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'

const PREVIEW_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Inter, sans-serif; padding: 24px; background: #f9fafb; }
  .button-primary { background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  .button-secondary { background: #f3f4f6; color: #374151; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-bottom: 16px; }
  .header { background: white; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px; }
  .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 12px; background: #ede9fe; color: #7c3aed; }
  .input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 14px; width: 200px; outline: none; }
  .avatar { width: 40px; height: 40px; border-radius: 9999px; background: #ede9fe; display: flex; align-items: center; justify-content: center; color: #7c3aed; font-weight: 600; }
  .modal { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,.15); max-width: 400px; }
  .sidebar { background: #1e1b2e; padding: 16px; border-radius: 12px; color: white; width: 200px; }
  .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; }
</style>
<style id="override"></style>
</head>
<body>
<div class="header"><div style="font-weight:600;color:#1e1b2e;">Veeda</div><span class="badge">preview</span></div>
<div style="padding:24px">
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div class="avatar">V</div>
      <div><strong style="font-size:14px">Usuário Teste</strong><br/><small style="color:#9ca3af">@user_test</small></div>
    </div>
    <p style="font-size:14px;color:#374151;margin-bottom:16px">Este é um card de exemplo para preview de estilos.</p>
    <div style="display:flex;gap:8px">
      <button class="button-primary">Salvar</button>
      <button class="button-secondary">Cancelar</button>
    </div>
  </div>
  <div class="card">
    <input class="input" placeholder="Campo de texto..." />
    <br/><br/>
    <div class="modal">
      <strong style="font-size:14px">Modal de exemplo</strong>
      <p style="font-size:13px;color:#6b7280;margin-top:8px">Conteúdo do modal aqui.</p>
    </div>
  </div>
</div>
<div class="footer">Veeda © 2025</div>
</body></html>`

export default function StyleEditor() {
  const [components, setComponents] = useState([])
  const [selected, setSelected] = useState(null)
  const [css, setCss] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('style_overrides').select('*').order('label')
    if (error) { toast.error('Erro ao carregar'); setLoading(false); return }
    setComponents(data ?? [])
    if (data?.length) {
      setSelected(data[0])
      setCss(data[0].css ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    injectPreviewCss()
  }, [css])

  function injectPreviewCss() {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const doc = iframe.contentDocument
      if (!doc) return
      const el = doc.getElementById('override')
      if (el) el.textContent = css
    } catch {
      // cross-origin guard
    }
  }

  function selectComponent(comp) {
    setSelected(comp)
    setCss(comp.css ?? '')
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase
      .from('style_overrides')
      .upsert({ ...selected, css, updated_at: new Date().toISOString() })
    if (error) { toast.error('Erro ao salvar'); setSaving(false); return }
    await logAction('update_style_override', { component: selected.component_key })
    toast.success('Estilo salvo')
    setComponents(prev => prev.map(c => c.id === selected.id ? { ...c, css } : c))
    setSaving(false)
  }

  return (
    <div className="space-y-4" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Editor de Estilos</h1>
          <p className="text-sm text-gray-500 mt-0.5">CSS por componente com preview em tempo real</p>
        </div>
        <button onClick={handleSave} disabled={saving || !selected} className="btn-primary text-sm">
          {saving ? 'Salvando...' : 'Salvar CSS'}
        </button>
      </div>

      <div className="flex gap-4 h-full" style={{ height: 'calc(100% - 80px)' }}>
        {/* Component list */}
        <div className="w-48 flex-shrink-0 card p-3 overflow-y-auto">
          {loading ? <p className="text-xs text-gray-400">Carregando...</p> : (
            <div className="space-y-1">
              {components.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => selectComponent(comp)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selected?.id === comp.id ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 card p-0 overflow-hidden">
          <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4">
            <span className="text-xs text-gray-500 font-mono">{selected?.component_key ?? '—'}.css</span>
          </div>
          <Editor
            height="calc(100% - 32px)"
            language="css"
            value={css}
            onChange={v => setCss(v ?? '')}
            theme="light"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 12 }
            }}
          />
        </div>

        {/* Preview */}
        <div className="flex-1 card p-0 overflow-hidden">
          <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4">
            <span className="text-xs text-gray-500">Preview</span>
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={PREVIEW_HTML}
            className="w-full"
            style={{ height: 'calc(100% - 32px)', border: 'none' }}
            onLoad={injectPreviewCss}
            title="Style Preview"
          />
        </div>
      </div>
    </div>
  )
}
