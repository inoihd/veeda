import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface ScheduledNotification {
  id: number
  title: string
  body: string
  icon_url: string | null
  action_url: string | null
  target: string
  segment: Record<string, unknown> | null
}

async function sendPushToUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  notification: ScheduledNotification
) {
  // Fetch the user's push subscription from a push_subscriptions table if it exists
  // This is a placeholder — in production you'd query your push_subscriptions table
  // and use the Web Push Protocol or a service like Firebase Cloud Messaging.
  // For now we log the intent.
  console.log(`[push] Would send to user ${userId}:`, notification.title)
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
    // Fetch due, unsent, uncancelled notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .lte('scheduled_at', new Date().toISOString())
      .eq('sent', false)
      .eq('cancelled', false)

    if (fetchError) throw fetchError
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let processed = 0

    for (const notif of notifications as ScheduledNotification[]) {
      try {
        if (notif.target === 'all') {
          // Fetch all user IDs
          const { data: users } = await supabase.auth.admin.listUsers()
          if (users?.users) {
            for (const user of users.users) {
              await sendPushToUser(supabase, user.id, notif)
            }
          }
        } else if (notif.target === 'segment' && notif.segment) {
          // Apply segment filter — example: { status: 'active' }
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .match(notif.segment as Record<string, string>)

          if (profiles) {
            for (const profile of profiles) {
              await sendPushToUser(supabase, profile.id, notif)
            }
          }
        }

        // Mark as sent
        await supabase
          .from('scheduled_notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', notif.id)

        processed++
      } catch (innerErr) {
        console.error(`Failed to process notification ${notif.id}:`, innerErr)
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
