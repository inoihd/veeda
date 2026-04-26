import { supabase } from './supabase'

/**
 * Log an admin action to the admin_logs table.
 * Silently ignores errors so it never blocks the main flow.
 */
export async function logAction(action, data = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('admin_logs').insert({
      admin_id: user?.id ?? null,
      action,
      data
    })
  } catch (err) {
    console.error('[audit] Failed to log action:', action, err)
  }
}
