// ═══════════════════════════════════════════════════════════
// VEEDA SUPABASE — Integração cross-device para features sociais
// Carregado via CDN, não requer bundler.
// Requer: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js">
// ═══════════════════════════════════════════════════════════

const VeedaSupabase = (() => {
  // ── Configuração ───────────────────────────────────────────
  // Substitua com os valores do seu projeto Supabase:
  // Project Settings → API → Project URL e anon/public key
  const SUPABASE_URL      = 'https://rkinwvdbomllztixdtar.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_eG_eU0eEuya4dOY2Y2OK6w_riRnPpD3';

  let _client = null;
  let _initialized = false;

  // ── Init ───────────────────────────────────────────────────
  function init() {
    if (_initialized) return _client !== null;
    _initialized = true;

    if (!window.supabase) {
      console.warn('[VeedaSupabase] SDK não carregado. Modo offline ativo.');
      return false;
    }
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.warn('[VeedaSupabase] URL não configurada. Modo offline ativo.');
      return false;
    }

    try {
      _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, storageKey: 'veeda_sb_session' }
      });
      console.log('[VeedaSupabase] Inicializado.');
      return true;
    } catch (e) {
      console.error('[VeedaSupabase] Falha ao inicializar:', e);
      return false;
    }
  }

  function sb() { return _client; }
  function isReady() { return _client !== null; }

  // ── Input sanitization ─────────────────────────────────────
  // Hard limits on fields sent to Supabase — prevent storage abuse and
  // oversized payloads from reaching the database.
  const MAX = {
    NAME:      80,
    HANDLE:    20,
    EMOJI:      8,
    AVATAR_SRC: 4096,   // base64 thumbnail only, never full image
    MESSAGE:   500,
    MOMENT_CONTENT: 2000,
    MOMENT_CAPTION: 200,
    MOMENTS_PER_DAY: 50,
  };
  const clamp = (v, max) => (typeof v === 'string' ? v.slice(0, max) : v);
  const safeProfile = p => ({
    id:           p.id,
    handle:       clamp((p.handle || '').replace(/^@/, ''), MAX.HANDLE),
    name:         clamp(p.name || '', MAX.NAME),
    emoji:        clamp(p.emoji || '🌿', MAX.EMOJI),
    avatarColor:  clamp(p.avatarColor || '#7B6FA0', 20),
    // Never store full data-URL avatars in Supabase — only small thumbnails
    avatarSrc:    p.avatarSrc && !p.avatarSrc.startsWith('data:')
                    ? clamp(p.avatarSrc, MAX.AVATAR_SRC) : null,
  });


  // ── AUTH ───────────────────────────────────────────────────
  // Estratégia: email = "{handle}@veeda.local", senha = passwordHash já existente
  // Isso permite login cross-device sem mudança no sistema de senhas atual.

  async function signUp(handle, passwordHash) {
    if (!isReady()) return { error: 'offline' };
    const cleanH = handle.replace(/^@/, '');
    const { data, error } = await sb().auth.signUp({
      email: `${cleanH}@veeda.local`,
      password: passwordHash,
      options: { data: { handle: cleanH } }
    });
    return { data, error };
  }

  async function signIn(handle, passwordHash) {
    if (!isReady()) return { error: 'offline' };
    const cleanH = handle.replace(/^@/, '');
    const { data, error } = await sb().auth.signInWithPassword({
      email: `${cleanH}@veeda.local`,
      password: passwordHash
    });
    return { data, error };
  }

  async function signOut() {
    if (!isReady()) return;
    await sb().auth.signOut();
  }

  async function getSession() {
    if (!isReady()) return null;
    const { data } = await sb().auth.getSession();
    return data?.session ?? null;
  }

  async function ensureAuth(handle, passwordHash) {
    if (!isReady()) return false;
    const session = await getSession();
    if (session) return true;

    const { error: signInErr } = await signIn(handle, passwordHash);
    if (!signInErr) return true;

    const { error: signUpErr } = await signUp(handle, passwordHash);
    if (!signUpErr) return true;

    console.warn('[VeedaSupabase] Falha de auth:', signUpErr);
    return false;
  }


  // ── PROFILES ───────────────────────────────────────────────

  async function registerProfile(profile) {
    if (!isReady()) return;
    const sp = safeProfile(profile);
    const { error } = await sb().from('profiles').upsert({
      id:           sp.id,
      handle:       sp.handle,
      name:         sp.name,
      emoji:        sp.emoji,
      avatar_color: sp.avatarColor,
      avatar_src:   sp.avatarSrc,
      last_active:  new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) console.warn('[VeedaSupabase] registerProfile:', error.message);
  }

  // Busca perfis por handle ou nome (usa ILIKE case-insensitive)
  async function searchProfiles(query, myHandle) {
    if (!isReady() || !query || query.trim().length < 2) return [];
    const q = query.trim().replace(/^@/, '').replace(/[%_]/g, ''); // sanitiza wildcards SQL
    const myCleanH = (myHandle || '').replace(/^@/, '');
    const { data, error } = await sb()
      .from('profiles')
      .select('id, handle, name, emoji, avatar_color, avatar_src')
      .or(`handle.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(20);
    if (error) { console.warn('[VeedaSupabase] searchProfiles:', error.message); return []; }
    return (data || [])
      .filter(p => p.handle !== myCleanH)
      .map(p => ({
        id: p.id, name: p.name, handle: '@' + p.handle,
        emoji: p.emoji, avatarColor: p.avatar_color, avatarSrc: p.avatar_src
      }));
  }

  async function lookupProfile(handle) {
    if (!isReady()) return null;
    const cleanH = handle.replace(/^@/, '');
    const { data, error } = await sb()
      .from('profiles')
      .select('*')
      .eq('handle', cleanH)
      .maybeSingle();
    if (error) console.warn('[VeedaSupabase] lookupProfile:', error.message);
    return data;
  }


  // ── CONNECTION REQUESTS ────────────────────────────────────

  async function sendConnectionRequest(fromProfile, toHandle) {
    if (!isReady()) return false;
    const sp = safeProfile(fromProfile);
    const cleanTo = clamp(toHandle.replace(/^@/, ''), MAX.HANDLE);

    const { error } = await sb().from('connection_requests').insert({
      from_id:           sp.id,
      from_name:         sp.name,
      from_handle:       sp.handle,
      from_emoji:        sp.emoji,
      from_avatar_color: sp.avatarColor,
      from_avatar_src:   sp.avatarSrc,
      to_handle:         cleanTo,
      status:            'pending'
    });

    if (error && error.code !== '23505') { // 23505 = unique_violation (já enviou)
      console.warn('[VeedaSupabase] sendConnectionRequest:', error.message);
      return false;
    }
    return true;
  }

  async function getConnectionRequests(handle) {
    if (!isReady()) return [];
    const cleanH = handle.replace(/^@/, '');
    const { data, error } = await sb()
      .from('connection_requests')
      .select('*')
      .eq('to_handle', cleanH)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });
    if (error) console.warn('[VeedaSupabase] getConnectionRequests:', error.message);
    // Mapeia para o formato local (fromId, fromName, etc.)
    return (data || []).map(r => ({
      _sbId:          r.id,
      fromId:         r.from_id,
      fromName:       r.from_name,
      fromHandle:     r.from_handle,
      fromEmoji:      r.from_emoji,
      fromAvatarColor:r.from_avatar_color,
      fromAvatarSrc:  r.from_avatar_src,
      requestedAt:    new Date(r.requested_at).getTime(),
      status:         r.status,
      _fromSupabase:  true
    }));
  }

  async function acceptConnectionRequest(sbId, myProfile, fromHandle) {
    if (!isReady()) return false;
    const cleanMyH   = (myProfile.handle || '').replace(/^@/, '');
    const cleanFromH = fromHandle.replace(/^@/, '');

    // Atualiza status do pedido
    const { error: updErr } = await sb()
      .from('connection_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', sbId);

    if (updErr) {
      console.warn('[VeedaSupabase] acceptConnectionRequest update:', updErr.message);
      return false;
    }

    // Envia confirmação de volta para o remetente
    const sp = safeProfile(myProfile);
    const { error: confErr } = await sb().from('connection_confirmations').insert({
      from_id:           sp.id,
      from_name:         sp.name,
      from_handle:       clamp(cleanMyH, MAX.HANDLE),
      from_emoji:        sp.emoji,
      from_avatar_color: sp.avatarColor,
      from_avatar_src:   sp.avatarSrc,
      to_handle:         clamp(cleanFromH, MAX.HANDLE),
      consumed:          false
    });

    if (confErr && confErr.code !== '23505') {
      console.warn('[VeedaSupabase] acceptConnectionRequest confirm:', confErr.message);
    }
    return true;
  }

  async function getConnectionConfirmations(handle) {
    if (!isReady()) return [];
    const cleanH = handle.replace(/^@/, '');
    const { data, error } = await sb()
      .from('connection_confirmations')
      .select('*')
      .eq('to_handle', cleanH)
      .eq('consumed', false);
    if (error) console.warn('[VeedaSupabase] getConnectionConfirmations:', error.message);
    return (data || []).map(c => ({
      _sbId:          c.id,
      fromId:         c.from_id,
      fromName:       c.from_name,
      fromHandle:     c.from_handle,
      fromEmoji:      c.from_emoji,
      fromAvatarColor:c.from_avatar_color,
      fromAvatarSrc:  c.from_avatar_src,
      confirmedAt:    new Date(c.confirmed_at).getTime(),
      _fromSupabase:  true
    }));
  }

  // Chamado pelo aceitante: atualiza o pedido como aceito e cria a confirmação para o remetente
  // Equivalente ao confirmConnectionToSender local, sem precisar do _sbId do pedido
  async function confirmToSender(acceptorProfile, senderProfile) {
    if (!isReady()) return false;
    const spA = safeProfile(acceptorProfile);
    const cleanSenderH = clamp((senderProfile.handle || '').replace(/^@/, ''), MAX.HANDLE);

    // Marca o pedido como aceito
    await sb().from('connection_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('from_id', senderProfile.id)
      .eq('to_handle', spA.handle)
      .eq('status', 'pending');

    // Cria confirmação para o remetente original poder processar
    const { error } = await sb().from('connection_confirmations').insert({
      from_id:           spA.id,
      from_name:         spA.name,
      from_handle:       spA.handle,
      from_emoji:        spA.emoji,
      from_avatar_color: spA.avatarColor,
      from_avatar_src:   spA.avatarSrc,
      to_handle:         cleanSenderH,
      consumed:          false
    });

    if (error && error.code !== '23505') {
      console.warn('[VeedaSupabase] confirmToSender:', error.message);
      return false;
    }
    return true;
  }

  async function markConfirmationConsumed(sbId) {
    if (!isReady()) return;
    const { error } = await sb()
      .from('connection_confirmations')
      .update({ consumed: true })
      .eq('id', sbId);
    if (error) console.warn('[VeedaSupabase] markConfirmationConsumed:', error.message);
  }


  // ── SHARED DAYS ────────────────────────────────────────────

  async function shareDay(fromProfile, toHandles, dayPayload) {
    if (!isReady() || !toHandles.length) return false;
    const sp = safeProfile(fromProfile);
    // Sanitize moments: strip media content, enforce limits
    const safeMoments = (dayPayload.moments || [])
      .slice(0, MAX.MOMENTS_PER_DAY)
      .map(m => ({
        id: m.id, ts: m.ts, type: m.type,
        content: (m.type === 'texto' || m.type === 'link' || m.type === 'videolink')
          ? clamp(m.content || '', MAX.MOMENT_CONTENT) : null,
        caption: clamp(m.caption || '', MAX.MOMENT_CAPTION),
        tags: Array.isArray(m.tags) ? m.tags.slice(0, 10) : undefined,
        _hasMedia: !['texto','link','videolink','musica'].includes(m.type)
      }));

    const rows = toHandles.slice(0, 5).map(h => ({  // max 5 recipients per call
      from_id:           sp.id,
      from_name:         sp.name,
      from_handle:       sp.handle,
      from_emoji:        sp.emoji,
      from_avatar_color: sp.avatarColor,
      from_avatar_src:   sp.avatarSrc,
      to_handle:         clamp(h.replace(/^@/, ''), MAX.HANDLE),
      date:              dayPayload.date,
      feeling:           dayPayload.feeling || null,
      message:           clamp(dayPayload.message || '', MAX.MESSAGE) || null,
      moments:           safeMoments,
      has_media:         safeMoments.some(m => m._hasMedia),
      shared_at:         new Date().toISOString()
    }));

    const { error } = await sb()
      .from('shared_days')
      .upsert(rows, { onConflict: 'from_handle,to_handle,date' });

    if (error) console.warn('[VeedaSupabase] shareDay:', error.message);
    return !error;
  }

  async function getSharedDays(handle) {
    if (!isReady()) return [];
    const cleanH = handle.replace(/^@/, '');
    const { data, error } = await sb()
      .from('shared_days')
      .select('*')
      .eq('to_handle', cleanH)
      .eq('consumed', false)
      .order('shared_at', { ascending: false });
    if (error) console.warn('[VeedaSupabase] getSharedDays:', error.message);
    // Mapeia para o formato local (igual ao payload do doShare)
    return (data || []).map(r => ({
      _sbId:       r.id,
      date:        r.date,
      author:      r.from_name,
      handle:      r.from_handle,
      emoji:       r.from_emoji,
      avatarColor: r.from_avatar_color,
      avatarSrc:   r.from_avatar_src,
      authorId:    r.from_id,
      moments:     r.moments || [],
      feeling:     r.feeling,
      message:     r.message,
      importedAt:  Date.now(),
      sharedAt:    new Date(r.shared_at).getTime(),
      _hasMedia:   r.has_media,
      _fromSupabase: true
    }));
  }

  async function markSharedDayConsumed(sbId, importedAt) {
    if (!isReady()) return;
    const { error } = await sb()
      .from('shared_days')
      .update({ consumed: true, imported_at: new Date(importedAt).toISOString() })
      .eq('id', sbId);
    if (error) console.warn('[VeedaSupabase] markSharedDayConsumed:', error.message);
  }


  // ── PRESENÇA ONLINE ────────────────────────────────────────

  async function updateOnlineStatus(handle) {
    if (!isReady()) return;
    const cleanH = handle.replace(/^@/, '');
    const { error } = await sb().from('online_status').upsert({
      handle:      cleanH,
      is_online:   true,
      last_active: new Date().toISOString()
    }, { onConflict: 'handle' });
    if (error) console.warn('[VeedaSupabase] updateOnlineStatus:', error.message);
  }

  async function getOnlineStatuses(handles) {
    if (!isReady() || !handles.length) return {};
    const cleanHandles = handles.map(h => h.replace(/^@/, ''));
    const { data, error } = await sb()
      .from('online_status')
      .select('handle, last_active')
      .in('handle', cleanHandles);
    if (error) { console.warn('[VeedaSupabase] getOnlineStatuses:', error.message); return {}; }

    const result = {};
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    (data || []).forEach(row => {
      const lastActiveMs = new Date(row.last_active).getTime();
      result[row.handle] = {
        isOnline:   lastActiveMs > fiveMinAgo,
        lastActive: lastActiveMs
      };
    });
    return result;
  }


  // ── REALTIME SUBSCRIPTIONS ─────────────────────────────────

  function subscribeToInbox(handle, onNewDay) {
    if (!isReady()) return null;
    const cleanH = handle.replace(/^@/, '');
    return sb()
      .channel(`inbox:${cleanH}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'shared_days',
        filter: `to_handle=eq.${cleanH}`
      }, payload => {
        const r = payload.new;
        onNewDay({
          _sbId:       r.id,
          date:        r.date,
          author:      r.from_name,
          handle:      r.from_handle,
          emoji:       r.from_emoji,
          avatarColor: r.from_avatar_color,
          avatarSrc:   r.from_avatar_src,
          authorId:    r.from_id,
          moments:     r.moments || [],
          feeling:     r.feeling,
          message:     r.message,
          importedAt:  Date.now(),
          sharedAt:    new Date(r.shared_at).getTime(),
          _hasMedia:   r.has_media,
          _fromSupabase: true
        });
      })
      .subscribe();
  }

  function subscribeToConnectionRequests(handle, onNewRequest) {
    if (!isReady()) return null;
    const cleanH = handle.replace(/^@/, '');
    return sb()
      .channel(`connreq:${cleanH}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'connection_requests',
        filter: `to_handle=eq.${cleanH}`
      }, payload => {
        const r = payload.new;
        onNewRequest({
          _sbId:          r.id,
          fromId:         r.from_id,
          fromName:       r.from_name,
          fromHandle:     r.from_handle,
          fromEmoji:      r.from_emoji,
          fromAvatarColor:r.from_avatar_color,
          fromAvatarSrc:  r.from_avatar_src,
          requestedAt:    new Date(r.requested_at).getTime(),
          status:         'pending',
          _fromSupabase:  true
        });
      })
      .subscribe();
  }

  function subscribeToConfirmations(handle, onConfirmation) {
    if (!isReady()) return null;
    const cleanH = handle.replace(/^@/, '');
    return sb()
      .channel(`confirm:${cleanH}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'connection_confirmations',
        filter: `to_handle=eq.${cleanH}`
      }, payload => {
        const c = payload.new;
        onConfirmation({
          _sbId:          c.id,
          fromId:         c.from_id,
          fromName:       c.from_name,
          fromHandle:     c.from_handle,
          fromEmoji:      c.from_emoji,
          fromAvatarColor:c.from_avatar_color,
          fromAvatarSrc:  c.from_avatar_src,
          confirmedAt:    new Date(c.confirmed_at).getTime(),
          _fromSupabase:  true
        });
      })
      .subscribe();
  }

  // ── Backup de dados criptografados ────────────────────────
  // O blob chega sempre cifrado (AES-256-GCM). Supabase não lê o conteúdo.
  async function pushUserData(userId, encBlob) {
    if (!isReady() || !userId || !encBlob) return false;
    const { error } = await sb()
      .from('user_data')
      .upsert({ user_id: userId, enc_blob: encBlob, updated_at: new Date().toISOString() },
               { onConflict: 'user_id' });
    if (error) console.warn('[VeedaSupabase] pushUserData:', error.message);
    return !error;
  }

  async function pullUserData(userId) {
    if (!isReady() || !userId) return null;
    const { data, error } = await sb()
      .from('user_data')
      .select('enc_blob, updated_at')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') console.warn('[VeedaSupabase] pullUserData:', error.message);
    return data ? data.enc_blob : null;
  }

  function removeChannel(channel) {
    if (isReady() && channel) sb().removeChannel(channel);
  }


  // ── API PÚBLICA ────────────────────────────────────────────
  return {
    init,
    isReady,
    auth: {
      signUp,
      signIn,
      signOut,
      getSession,
      ensureAuth
    },
    profiles: {
      register: registerProfile,
      lookup:   lookupProfile,
      search:   searchProfiles
    },
    connections: {
      sendRequest:             sendConnectionRequest,
      getRequests:             getConnectionRequests,
      accept:                  acceptConnectionRequest,
      getConfirmations:        getConnectionConfirmations,
      markConfirmationConsumed,
      confirmToSender
    },
    days: {
      share:       shareDay,
      getInbox:    getSharedDays,
      markConsumed: markSharedDayConsumed
    },
    presence: {
      update:     updateOnlineStatus,
      getStatuses: getOnlineStatuses
    },
    realtime: {
      subscribeInbox:         subscribeToInbox,
      subscribeRequests:      subscribeToConnectionRequests,
      subscribeConfirmations: subscribeToConfirmations,
      removeChannel
    },
    data: {
      push: pushUserData,
      pull: pullUserData
    }
  };
})();

// Expor explicitamente em window para o React (Babel) — const top-level
// NÃO vira propriedade de window automaticamente.
if (typeof window !== "undefined") window.VeedaSupabase = VeedaSupabase;
