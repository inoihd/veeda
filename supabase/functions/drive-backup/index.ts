import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const GDRIVE_CLIENT_ID     = Deno.env.get('GDRIVE_CLIENT_ID')     ?? ''
const GDRIVE_CLIENT_SECRET = Deno.env.get('GDRIVE_CLIENT_SECRET') ?? ''
const GDRIVE_REFRESH_TOKEN = Deno.env.get('GDRIVE_REFRESH_TOKEN') ?? ''
const GDRIVE_FOLDER_ID     = Deno.env.get('GDRIVE_FOLDER_ID')     ?? ''

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GDRIVE_CLIENT_ID,
      client_secret: GDRIVE_CLIENT_SECRET,
      refresh_token: GDRIVE_REFRESH_TOKEN,
      grant_type:    'refresh_token'
    })
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to get Google access token: ' + JSON.stringify(data))
  return data.access_token
}

async function uploadToDrive(accessToken: string, filename: string, content: string) {
  const metadata = {
    name: filename,
    parents: [GDRIVE_FOLDER_ID]
  }

  const boundary = '-------314159265358979323846'
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`
  ].join('\r\n')

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive upload failed: ${text}`)
  }

  return res.json()
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    // Collect tables to back up
    const [layoutRes, homeBoxesRes, styleRes, settingsRes, pollsRes, adsRes, faqRes] =
      await Promise.all([
        supabase.from('layout_config').select('*'),
        supabase.from('home_boxes').select('*'),
        supabase.from('style_overrides').select('*'),
        supabase.from('settings').select('*'),
        supabase.from('polls').select('*, poll_options(*)'),
        supabase.from('ad_boxes').select('*'),
        supabase.from('faq').select('*')
      ])

    const backup = {
      exported_at: new Date().toISOString(),
      layout_config:   layoutRes.data ?? [],
      home_boxes:      homeBoxesRes.data ?? [],
      style_overrides: styleRes.data ?? [],
      settings:        settingsRes.data ?? [],
      polls:           pollsRes.data ?? [],
      ad_boxes:        adsRes.data ?? [],
      faq:             faqRes.data ?? []
    }

    const accessToken = await getAccessToken()

    const driveFile = await uploadToDrive(
      accessToken,
      `veeda-backup-${timestamp}.json`,
      JSON.stringify(backup, null, 2)
    )

    // Log the action
    await supabase.from('admin_logs').insert({
      action: 'drive_backup',
      data: { file_id: driveFile.id, filename: driveFile.name, timestamp: new Date().toISOString() }
    })

    return new Response(
      JSON.stringify({ ok: true, file_id: driveFile.id, filename: driveFile.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
