import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, invited_by } = await req.json();

    if (!email || !invited_by) {
      return new Response(JSON.stringify({ error: "email and invited_by are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    // Check if email already invited and not revoked
    const { data: existing } = await db
      .from("beta_invites")
      .select("id, revoked")
      .eq("email", email)
      .eq("revoked", false)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "already invited" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check invite limits for invited_by
    const { data: limitRow } = await db
      .from("invite_limits")
      .select("used_invites, max_invites")
      .eq("user_handle", invited_by)
      .maybeSingle();

    const used = limitRow?.used_invites ?? 0;
    const max = limitRow?.max_invites ?? 2;

    if (used >= max) {
      return new Response(JSON.stringify({ error: "limit reached" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert invite
    const { error: insertErr } = await db.from("beta_invites").insert({
      email,
      invited_by,
      used: false,
      revoked: false,
    });

    if (insertErr) throw insertErr;

    // Upsert invite_limits
    if (limitRow) {
      await db
        .from("invite_limits")
        .update({ used_invites: used + 1 })
        .eq("user_handle", invited_by);
    } else {
      await db.from("invite_limits").insert({
        user_handle: invited_by,
        used_invites: 1,
        max_invites: 2,
      });
    }

    console.log(`[process-beta-invite] ${invited_by} invited ${email}`);

    return new Response(JSON.stringify({ success: true, email, invited_by }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[process-beta-invite] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
