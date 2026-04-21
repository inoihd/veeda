// ═══════════════════════════════════════════════════════════
// ADICIONAR APÓS A LINHA DO REGISTRY (≈ linha 180)
// ═══════════════════════════════════════════════════════════

// ── Connection Requests (convites pendentes) ─────────────────
const saveConnectionRequest = (fromProfile, toHandle) => {
  const key = `veeda_conn_requests_${toHandle.replace(/^@/, '')}`;
  const requests = safeLS.get(key, []);
  
  // Evita duplicatas
  if (!requests.find(r => r.fromId === fromProfile.id)) {
    requests.push({
      fromId: fromProfile.id,
      fromName: fromProfile.name,
      fromHandle: fromProfile.handle,
      fromEmoji: fromProfile.emoji,
      fromAvatarColor: fromProfile.avatarColor,
      fromAvatarSrc: fromProfile.avatarSrc || null,
      requestedAt: Date.now(),
      status: 'pending'
    });
    safeLS.set(key, requests);
    return true;
  }
  return false;
};

const getConnectionRequests = (handle) => {
  return safeLS.get(`veeda_conn_requests_${handle.replace(/^@/, '')}`, []);
};

const acceptConnectionRequest = (handle, fromId) => {
  const key = `veeda_conn_requests_${handle.replace(/^@/, '')}`;
  const requests = safeLS.get(key, []);
  const request = requests.find(r => r.fromId === fromId);
  
  if (request) {
    // Marca como aceito
    request.status = 'accepted';
    request.acceptedAt = Date.now();
    safeLS.set(key, requests);
    
    // Cria inbox para receber dias
    const inboxKey = `veeda_inbox_${handle.replace(/^@/, '')}`;
    if (!safeLS.get(inboxKey)) {
      safeLS.set(inboxKey, []);
    }
    
    return request;
  }
  return null;
};

const rejectConnectionRequest = (handle, fromId) => {
  const key = `veeda_conn_requests_${handle.replace(/^@/, '')}`;
  const requests = safeLS.get(key, []);
  const filtered = requests.filter(r => r.fromId !== fromId);
  safeLS.set(key, filtered);
};

// ── Atualizar registryAdd para também criar inbox ───────────
const registryAdd = (profile) => {
  const reg = safeLS.get(REGISTRY_KEY, []);
  if (!reg.find(p => p.handle === profile.handle)) {
    reg.push({
      id: profile.id, 
      name: profile.name, 
      handle: profile.handle, 
      emoji: profile.emoji, 
      avatarColor: profile.avatarColor, 
      avatarSrc: profile.avatarSrc || null, 
      ts: Date.now()
    });
    safeLS.set(REGISTRY_KEY, reg);
    
    // Cria inbox para este perfil (para receber dias)
    const inboxKey = `veeda_inbox_${profile.handle.replace(/^@/, '')}`;
    if (!safeLS.get(inboxKey)) {
      safeLS.set(inboxKey, []);
    }
  }
};
