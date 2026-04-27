import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const now = new Date().toISOString()

    const { data: notifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_at', now)

    if (fetchError) throw fetchError

    if (!notifications || notifications.length === 0) {
      console.log('[process-notifications] No pending notifications to process.')
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let processed = 0

    for (const notif of notifications) {
      try {
        console.log(`[process-notifications] Processing notification id=${notif.id} title="${notif.title}" target="${notif.target}"`)

        const { error: updateError } = await supabase
          .from('scheduled_notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', notif.id)

        if (updateError) {
          console.error(`[process-notifications] Failed to mark notification ${notif.id} as sent:`, updateError)
          continue
        }

        console.log(`[process-notifications] Marked notification ${notif.id} as sent.`)
        processed++
      } catch (innerErr) {
        console.error(`[process-notifications] Unexpected error for notification ${notif.id}:`, innerErr)
      }
    }

    console.log(`[process-notifications] Done. Processed ${processed} of ${notifications.length} notifications.`)

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[process-notifications] Fatal error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
