import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN') ?? ''
const GITHUB_OWNER = Deno.env.get('GITHUB_OWNER') ?? ''
const GITHUB_REPO  = Deno.env.get('GITHUB_REPO')  ?? ''
const GITHUB_BRANCH = Deno.env.get('GITHUB_BRANCH') ?? 'main'

async function githubRequest(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

async function upsertFile(filePath: string, content: string, message: string) {
  // Check if file already exists to get its SHA
  const existing = await githubRequest(`/contents/${filePath}?ref=${GITHUB_BRANCH}`)
  const sha = existing?.sha

  const encoded = btoa(unescape(encodeURIComponent(content)))

  await githubRequest(`/contents/${filePath}`, 'PUT', {
    message,
    content: encoded,
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {})
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const timestamp = new Date().toISOString()

    // Collect data from tables
    const [layoutRes, homeBoxesRes, styleRes, settingsRes] = await Promise.all([
      supabase.from('layout_config').select('*').order('order'),
      supabase.from('home_boxes').select('*').order('order'),
      supabase.from('style_overrides').select('*'),
      supabase.from('settings').select('*')
    ])

    const payload = {
      layout_config: layoutRes.data ?? [],
      home_boxes: homeBoxesRes.data ?? [],
      style_overrides: styleRes.data ?? [],
      settings: settingsRes.data ?? [],
      exported_at: timestamp
    }

    const commitMessage = `chore: veeda admin export ${timestamp}`

    // Write individual files
    await upsertFile(
      'public/admin-config/layout.json',
      JSON.stringify(payload.layout_config, null, 2),
      commitMessage
    )

    await upsertFile(
      'public/admin-config/home-boxes.json',
      JSON.stringify(payload.home_boxes, null, 2),
      commitMessage
    )

    await upsertFile(
      'public/admin-config/styles.json',
      JSON.stringify(payload.style_overrides, null, 2),
      commitMessage
    )

    await upsertFile(
      'public/admin-config/settings.json',
      JSON.stringify(
        Object.fromEntries((payload.settings as { key: string; value: string }[]).map(s => [s.key, s.value])),
        null, 2
      ),
      commitMessage
    )

    // Log the action
    await supabase.from('admin_logs').insert({
      action: 'github_push',
      data: { files: 4, timestamp }
    })

    return new Response(JSON.stringify({ ok: true, pushed: 4, timestamp }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
