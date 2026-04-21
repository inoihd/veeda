// ═══════════════════════════════════════════════════════════
// VEEDA MODALS — veeda-modals.js
// v1.9.0 - Sistema de convites e compartilhamento bidirecional
// ═══════════════════════════════════════════════════════════

function AddContactModal({contacts, myHandle, profile, onAdd, onClose, addToast, prefillCard}) {
  const [cardCode, setCardCode] = useState(prefillCard || '');
  const [tab, setTab] = useState('add');
  const [step, setStep] = useState(1);
  const [found, setFound] = useState(null);
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);

  const myH = (myHandle || '').replace(/^@/, '');
  const isAtLimit = contacts.length >= MAX_CONTACTS_BETA;

  useEffect(() => {
    if (!prefillCard) return;
    if (isAtLimit) {
      addToast?.(`Você atingiu o máximo de ${MAX_CONTACTS_BETA} contatos (Beta 1.0).`, 'warn');
      return;
    }
    const parsed = parseProfileCard(prefillCard.trim());
    if (parsed) {
      const targetHandle = parsed.handle.replace(/^@/, '');
      if (targetHandle === myH) {
        addToast?.('Este é o seu próprio código.', 'warn');
        return;
      }
      if (contacts.find(c => (c.handle || '').replace(/^@/, '') === targetHandle)) {
        addToast?.(`${parsed.name} já está no seu Círculo.`, 'info');
        return;
      }
      setFound(parsed);
      setStep(2);
    } else {
      addToast?.('Link de convite inválido ou corrompido.', 'error');
    }
  }, [prefillCard]);

  const tryParseCard = () => {
    if (isAtLimit) {
      addToast?.(`Você atingiu o máximo de ${MAX_CONTACTS_BETA} contatos permitidos na Beta 1.0.`, 'warn');
      return;
    }
    
    let raw = cardCode.trim();
    try {
      const u = new URL(raw);
      const p = u.searchParams.get('add');
      if (p) raw = p;
    } catch {}
    
    const parsed = parseProfileCard(raw);
    if (!parsed) {
      addToast?.('Código inválido.', 'error');
      return;
    }
    
    const targetHandle = parsed.handle.replace(/^@/, '');
    if (targetHandle === myH) {
      addToast?.('Este é o seu próprio código.', 'warn');
      return;
    }
    
    if (contacts.find(c => (c.handle || '').replace(/^@/, '') === targetHandle)) {
      addToast?.(`${parsed.name} já está no seu Círculo.`, 'info');
      return;
    }
    
    setFound(parsed);
    setStep(2);
  };

  const sendRequest = async () => {
    if (!found) return;
    if (isAtLimit) {
      addToast?.(`Limite atingido. Máximo ${MAX_CONTACTS_BETA} contatos na Beta.`, 'error');
      return;
    }
    setSending(true);
    
    const success = saveConnectionRequest(profile, found.handle);
    
    if (success) {
      addToast?.(`Convite enviado para ${found.name}! Aguarde a aceitação.`, 'success');
      setSending(false);
      onClose();
    } else {
      addToast?.('Erro ao enviar convite.', 'error');
      setSending(false);
    }
  };

  const localResults = useMemo(() => {
    return registrySearch(q).filter(p => {
      const targetH = (p.handle || '').replace(/^@/, '');
      if (targetH === myH) return false;
      if (contacts.find(c => (c.handle || '').replace(/^@/, '') === targetH)) return false;
      return true;
    });
  }, [q, myH, contacts]);

  return (
    <div>
      {step === 1 && (
        <>
          {isAtLimit && (
            <div style={{ background: C.redLight, border: `1px solid ${C.red}44`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 12, color: C.red, fontWeight: 600, lineHeight: 1.5 }}>
                🔒 Limite atingido! Você tem o máximo de {MAX_CONTACTS_BETA} contatos permitidos na Beta 1.0.
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[
              ['add', '📋 Por código'],
              ['search', '🔍 Buscar aqui']
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                disabled={isAtLimit}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  background: tab === k ? C.purple : C.purpleLight,
                  color: tab === k ? C.white : C.purple,
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: isAtLimit ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  opacity: isAtLimit ? 0.5 : 1
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === 'add' && (
            <>
              <p style={{ fontSize: 13, color: C.textMid, marginBottom: 10, lineHeight: 1.5 }}>
                Cole o <strong>link ou código</strong> que seu contato compartilhou:
              </p>
              <textarea
                value={cardCode}
                onChange={e => setCardCode(e.target.value)}
                placeholder="Cole aqui o link ou código vc2_…"
                disabled={isAtLimit}
                style={{ marginBottom: 12, minHeight: 72, borderRadius: 14, opacity: isAtLimit ? 0.6 : 1 }}
              />
              <Btn onClick={tryParseCard} disabled={!cardCode.trim() || isAtLimit}>
                Identificar perfil
              </Btn>
            </>
          )}

          {tab === 'search' && (
            <>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por nome ou @handle…"
                disabled={isAtLimit}
                autoFocus
                style={{ marginBottom: 8 }}
              />
              {q.trim() && localResults.length === 0 && (
                <div style={{ 
                  padding: '14px', 
                  background: C.amberLight, 
                  borderRadius: 10, 
                  border: `1px solid ${C.amber}44`, 
                  marginTop: 4 
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#7A5800', fontWeight: 600 }}>
                    Nenhum usuário encontrado aqui
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#7A5800', lineHeight: 1.5 }}>
                    A busca funciona apenas para perfis deste dispositivo.
                    Para adicionar alguém de outro celular, use a aba "Por código".
                  </p>
                </div>
              )}
              {localResults.map(p => (
                <button
                  key={p.id || p.handle}
                  onClick={() => {
                    setFound(p);
                    setStep(2);
                  }}
                  disabled={isAtLimit}
                  style={{
                    width: '100%',
                    background: C.white,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: isAtLimit ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    opacity: isAtLimit ? 0.5 : 1
                  }}
                >
                  <AvatarBubble
                    src={p.avatarSrc}
                    emoji={p.emoji || '🌿'}
                    color={p.avatarColor || C.purpleLight}
                    size={44}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>
                      {p.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.purple, fontWeight: 500 }}>
                      {p.handle}
                    </p>
                  </div>
                  <span style={{ fontSize: 18, color: C.textLight }}>+</span>
                </button>
              ))}
            </>
          )}
        </>
      )}

      {step === 2 && found && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <AvatarBubble
              src={found.avatarSrc}
              emoji={found.emoji}
              color={found.avatarColor || C.purpleLight}
              size={64}
              ring
            />
            <p style={{ margin: '10px 0 2px', fontSize: 16, fontWeight: 700, color: C.text }}>
              {found.name}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: C.purple, fontWeight: 600 }}>
              {found.handle}
            </p>
            <div style={{ 
              marginTop: 12, 
              padding: '12px', 
              background: C.blueLight, 
              borderRadius: 10 
            }}>
              <p style={{ margin: 0, fontSize: 12, color: C.blue, lineHeight: 1.5 }}>
                ✨ Um convite será enviado. {found.name} precisará aceitar para vocês 
                começarem a compartilhar dias.
              </p>
            </div>
          </div>
          {isAtLimit && (
            <div style={{ background: C.redLight, border: `1px solid ${C.red}44`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: C.red, fontWeight: 600 }}>
                ⚠️ Limite atingido! Máximo {MAX_CONTACTS_BETA} contatos na Beta 1.0
              </p>
            </div>
          )}
          <Btn onClick={sendRequest} disabled={sending || isAtLimit} style={{ marginBottom: 10 }}>
            {isAtLimit ? '⚠️ Limite atingido' : sending ? <><Spinner size={16} color="#fff" /> Enviando convite…</> : 'Enviar convite'}
          </Btn>
          <Btn onClick={() => { setStep(1); setFound(null); setCardCode(''); }} variant="ghost">
            ← Voltar
          </Btn>
        </>
      )}
    </div>
  );
}

function ConnectionCodeModal({profile, onClose}) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const code = makeProfileCard(profile);
  const inviteLink = `${window.location.origin}${window.location.pathname}?add=${encodeURIComponent(code)}`;
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const copyLink = () => { navigator.clipboard?.writeText(inviteLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500); };
  const shareNative = () => { navigator.share?.({ title: "Veeda", text: `Olá! Sou ${profile.name} no Veeda. Me adiciona no Meu Círculo:\n${inviteLink}` }).catch(() => {}); };
  
  return (
    <Modal title="Meu Código de Conexão" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor || C.purpleLight} size={60} ring />
        <p style={{ margin: '8px 0 2px', fontSize: 15, fontWeight: 700, color: C.text }}>{profile.name}</p>
        <p style={{ margin: 0, fontSize: 12, color: C.purple }}>{profile.handle || nameToHandle(profile.name)}</p>
      </div>
      <p style={{ fontSize: 13, color: C.textMid, marginBottom: 14, lineHeight: 1.6 }}>
        Compartilhe o <strong>link</strong> abaixo com quem você quer no seu Círculo.
      </p>
      <div style={{ background: C.greenLight, borderRadius: 14, padding: '14px', marginBottom: 10, border: `1px solid ${C.green}33` }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, color: C.green, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>🔗 Link rápido</p>
        <p style={{ margin: 0, fontSize: 11, color: C.text, wordBreak: 'break-all', lineHeight: 1.5 }}>{inviteLink}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Btn onClick={copyLink} variant={linkCopied ? "green" : "primary"} style={{ flex: 1, fontSize: 13, padding: '11px 0' }}>
          {linkCopied ? "✓ Link copiado!" : "Copiar link"}
        </Btn>
        {navigator.share && <button onClick={shareNative} style={{ flex: 1, padding: '11px 0', background: C.white, color: C.purple, border: `1.5px solid ${C.purple}`, borderRadius: 50, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Compartilhar ↑</button>}
      </div>
      <details style={{ marginBottom: 4 }}>
        <summary style={{ fontSize: 12, color: C.textMid, cursor: 'pointer', padding: '6px 0' }}>Ou use o código de texto</summary>
        <div style={{ background: C.purpleLight, borderRadius: 14, padding: '14px', marginTop: 8 }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, color: C.textMid, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Seu código</p>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: C.text, wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.7 }}>{code}</p>
          <Btn onClick={copy} variant="outline" style={{ fontSize: 13, padding: '10px 0' }}>{copied ? "✓ Copiado!" : "Copiar código"}</Btn>
        </div>
      </details>
    </Modal>
  );
}

function ReceivedNotif({notif, onOpen, onDismiss}) {
  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', width: 'calc(100% - 32px)', maxWidth: 440, zIndex: 500, animation: 'notifDrop .4s cubic-bezier(.22,1,.36,1)', transform: 'translateX(-50%)' }}>
      <div style={{ background: C.white, borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 40px rgba(60,40,120,.22)' }}>
        <div style={{ background: `linear-gradient(135deg,${C.purple},${C.blue})`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AvatarBubble src={notif.avatarSrc} emoji={notif.emoji} color={notif.avatarColor || C.purpleLight} size={46} ring />
          <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.75)' }}>✨ Novo Dia de Veeda</p><p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#fff' }}><strong>{notif.author}</strong> compartilhou o dia</p></div>
          <button onClick={onDismiss} style={{ background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
        {notif.message && <div style={{ padding: '10px 16px', background: '#FAF8FF' }}><p style={{ margin: 0, fontSize: 13, color: C.textMid, fontStyle: 'italic' }}>"{notif.message}"</p></div>}
        <div style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
          <button onClick={onDismiss} style={{ flex: 1, padding: '9px 0', background: C.purpleLight, border: 'none', borderRadius: 10, color: C.purple, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Depois</button>
          <button onClick={onOpen} style={{ flex: 2, padding: '9px 0', background: C.purple, border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Abrir →</button>
        </div>
      </div>
    </div>
  );
}

function InviteModal({onClose}) {
  const url = window.location.href.split('?')[0];
  const msg = `Olá! Uso o Veeda para registrar e compartilhar meus dias com quem amo. Acessa aqui:\n\n📱 ${url}\n\nÉ gratuito e seus dados ficam só no seu celular. 🌿`;
  const [copied, setCopied] = useState(false);
  return (
    <Modal title="Convidar para o Veeda" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${C.purple},${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>🌿</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>Compartilhe o Veeda</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[{ l: "WhatsApp", e: "💬", c: "#25D366", bg: "#E8FBF0", u: `https://wa.me/?text=${encodeURIComponent(msg)}` }, { l: "E-mail", e: "✉️", c: C.purple, bg: C.purpleLight, u: `mailto:?subject=${encodeURIComponent("Venha pro Veeda 🌿")}&body=${encodeURIComponent(msg)}` }, { l: "SMS", e: "📱", c: C.blue, bg: C.blueLight, u: `sms:?body=${encodeURIComponent(msg)}` }].map(o => (
          <a key={o.l} href={o.u} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', background: o.bg, borderRadius: 14, textDecoration: 'none', border: `1px solid ${o.c}22` }}>
            <span style={{ fontSize: 24 }}>{o.e}</span><span style={{ fontSize: 12, fontWeight: 600, color: o.c }}>{o.l}</span>
          </a>
        ))}
      </div>
      <div style={{ background: C.purpleLight, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ flex: 1, margin: 0, fontSize: 11, color: C.textMid, wordBreak: 'break-all' }}>{url}</p>
        <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ flexShrink: 0, padding: '6px 12px', background: copied ? C.green : C.purple, color: '#fff', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{copied ? "✓" : "Copiar"}</button>
      </div>
    </Modal>
  );
}

function ShareDayModal({profile, data, curDay, onClose, onShared, addToast}) {
  const [tab, setTab] = useState('local');
  const [sel, setSel] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const contacts = data.contacts || [];
  const moments = (data.moments || {})[curDay] || [];
  const already = (data.sharedLog || {})[curDay] || [];
  const available = contacts.filter(c => !already.includes(c.code));
  const toggle = code => setSel(p => p.includes(code) ? p.filter(x => x !== code) : [...p, code]);
  const feeling = (data.dayFeelings || {})[curDay];

  const sharedCode = useMemo(() => encodeSharedDay(profile, moments, curDay, feeling, msg), [profile, moments, curDay, feeling, msg]);
  const sharedLink = sharedCode ? `${window.location.origin}${window.location.pathname}?day=${encodeURIComponent(sharedCode)}` : null;
  const copyShareLink = () => { if (sharedLink) { navigator.clipboard?.writeText(sharedLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500); } };

  const doShare = async () => {
    if (!sel.length) return;
    setLoading(true);
    
    const payload = {
      date: curDay,
      author: profile.name,
      handle: profile.handle || nameToHandle(profile.name),
      emoji: profile.emoji,
      avatarColor: profile.avatarColor,
      avatarSrc: profile.avatarSrc || null,
      moments,
      feeling,
      message: msg.trim(),
      importedAt: Date.now()
    };
    
    let sharedCount = 0;
    
    sel.forEach(contactHandle => {
      const cleanHandle = contactHandle.replace(/^@/, '');
      const inboxKey = `veeda_inbox_${cleanHandle}`;
      const inbox = safeLS.get(inboxKey, null);
      
      if (inbox !== null) {
        inbox.push(payload);
        safeLS.set(inboxKey, inbox);
        sharedCount++;
      }
    });
    
    if (sharedCount > 0) {
      showNativeNotif('Veeda', `${profile.name} compartilhou o dia com você! 🌿`);
      await onShared({ ...(data.sharedLog || {}), [curDay]: [...already, ...sel] });
      addToast?.(`Dia compartilhado com ${sharedCount} pessoa(s)! 🌿`, 'success');
      setDone(true);
    } else {
      addToast?.('Nenhum contato disponível para receber.', 'warn');
    }
    
    setLoading(false);
  };

  if (done) return <Modal title="" onClose={onClose}><div style={{ textAlign: 'center', padding: '16px 0' }}><div style={{ fontSize: 52, marginBottom: 14 }}>🌿</div><p style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>Dia compartilhado!</p><Btn onClick={onClose}>Fechar</Btn></div></Modal>;

  return (
    <Modal title="Compartilhar meu Dia de Veeda" onClose={onClose}>
      {moments.length === 0 ? <p style={{ fontSize: 14, color: C.textMid, textAlign: 'center', padding: '20px 0' }}>Nenhum momento registrado hoje ainda.</p> : (
        <>
          <p style={{ fontSize: 13, color: C.textMid, marginBottom: 12 }}>{moments.length} momento{moments.length !== 1 ? "s" : ""} · {fmtFull(curDay)}</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['local', '👥 Meu Círculo'], ['link', '🔗 Via link']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px 0', background: tab === k ? C.purple : C.purpleLight, color: tab === k ? C.white : C.purple, border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>{l}</button>
            ))}
          </div>

          {tab === 'local' && (
            <>
              {available.length === 0 ? (
                <div style={{ background: C.amberLight, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: '#7A5800', margin: 0 }}>Você já compartilhou hoje com todos os seus contatos. Use "Via link" para compartilhar com alguém de outro dispositivo.</p>
                </div>
              ) : available.map(c => (
                <button key={c.code} onClick={() => toggle(c.code)} style={{ width: '100%', background: sel.includes(c.code) ? C.purpleLight : C.white, border: `2px solid ${sel.includes(c.code) ? C.purple : C.cardBorder}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
                  <AvatarBubble src={c.avatarSrc} emoji={c.emoji || '🌿'} color={c.avatarColor || C.purpleLight} size={38} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.text, flex: 1 }}>{c.name}</span>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${sel.includes(c.code) ? C.purple : C.cardBorder}`, background: sel.includes(c.code) ? C.purple : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>{sel.includes(c.code) ? '✓' : ''}</div>
                </button>
              ))}
              <div style={{ marginTop: 12, marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Mensagem (opcional)</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Uma frase sobre o seu dia…" style={{ width: '100%', minHeight: 64, borderRadius: 12 }} />
              </div>
              <Btn onClick={doShare} disabled={loading || !sel.length}>{loading ? <><Spinner size={16} color="#fff" />Compartilhando…</> : "Compartilhar linha do tempo"}</Btn>
            </>
          )}

          {tab === 'link' && (
            <>
              <div style={{ background: C.purpleLight, borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: C.purple }}>Como funciona:</p>
                <p style={{ margin: 0, fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>Gere um link com os momentos do dia e envie para qualquer pessoa. Fotos e vídeos não são incluídos no link.</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Mensagem (opcional)</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Uma frase sobre o seu dia…" style={{ width: '100%', minHeight: 64, borderRadius: 12 }} />
              </div>
              {sharedLink && (
                <div style={{ background: C.greenLight, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${C.green}33` }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: '1px' }}>🔗 Link gerado</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMid, wordBreak: 'break-all', lineHeight: 1.5 }}>{sharedLink.slice(0, 80)}…</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Btn onClick={copyShareLink} variant={linkCopied ? "green" : "primary"} style={{ flex: 1, fontSize: 13, padding: '11px 0' }}>{linkCopied ? "✓ Copiado!" : "Copiar link"}</Btn>
                {navigator.share && sharedLink && <button onClick={() => navigator.share({ title: "Meu dia no Veeda 🌿", text: `${profile.name} quer compartilhar o dia ${fmtFull(curDay)} com você no Veeda 🌿\n\n${sharedLink}` }).catch(() => {})} style={{ flex: 1, padding: '11px 0', background: C.white, color: C.purple, border: `1.5px solid ${C.purple}`, borderRadius: 50, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Compartilhar ↑</button>}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

function AcceptSharedDayModal({shared, onAccept, onClose}) {
  if (!shared) return null;
  const { author, handle, emoji, avatarColor, feeling, moments, message, date } = shared;
  const textMoments = (moments || []).filter(m => m.type === "texto" || m.type === "link" || m.type === "videolink" || m.type === "musica");
  const mediaMoments = (moments || []).filter(m => m._hasMedia);
  return (
    <Modal title="Dia compartilhado com você 🌿" onClose={onClose} fullHeight>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: C.purpleLight, borderRadius: 14, marginBottom: 16 }}>
        <AvatarBubble emoji={emoji || '🌿'} color={avatarColor || C.purpleLight} size={48} ring />
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{author}</p>
          <p style={{ margin: 0, fontSize: 12, color: C.purple, fontWeight: 600 }}>{handle}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.textLight, marginTop: 2 }}>{fmtFull(date)}</p>
        </div>
        {feeling && <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span style={{ fontSize: 20 }}>{feeling.emoji}</span><span style={{ fontSize: 10, color: C.textMid }}>{feeling.label}</span></div>}
      </div>
      {message && <div style={{ background: C.white, borderRadius: 12, padding: '12px 14px', marginBottom: 14, border: `1px solid ${C.cardBorder}` }}><p style={{ margin: 0, fontSize: 13, color: C.textMid, fontStyle: 'italic' }}>"{message}"</p></div>}
      {textMoments.length > 0 && <div style={{ marginBottom: 14 }}><p style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 8 }}>Momentos do dia</p>{textMoments.slice(0, 5).map((m, i) => <div key={i} style={{ background: C.white, borderRadius: 12, padding: '10px 12px', marginBottom: 8, border: `1px solid ${C.cardBorder}` }}><span style={{ fontSize: 11, color: C.textLight, marginRight: 6 }}>{TYPE_META[m.type]?.icon || "✏️"}</span><span style={{ fontSize: 13, color: C.text }}>{m.type === "texto" ? m.content : m.type === "musica" ? `🎵 ${m.content}` : m.content}</span></div>)}</div>}
      {mediaMoments.length > 0 && <div style={{ background: C.blueLight, borderRadius: 12, padding: '10px 14px', marginBottom: 14, border: `1px solid ${C.blueMid}44` }}><p style={{ margin: 0, fontSize: 12, color: C.blue }}>📷 Este dia tem {mediaMoments.length} foto/vídeo(s) — não incluídos no link.</p></div>}
      <Btn onClick={onAccept} style={{ marginBottom: 8 }}>Aceitar dia 🌿</Btn>
      <Btn onClick={onClose} variant="ghost">Recusar</Btn>
    </Modal>
  );
}

function EventsModal({data, profile, onSave, onClose}) {
  const [tab, setTab] = useState('list');
  const [title, setTitle] = useState('');
  const [evType, setEvType] = useState('outro');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const events = (data.events || []).sort((a, b) => a.date.localeCompare(b.date));
  const add = () => { if (!title.trim() || !date) return; onSave([...events, { id: Date.now(), title: title.trim(), type: evType, date, time, notes: notes.trim(), createdBy: profile.name }]); setTitle(''); setDate(''); setTime(''); setNotes(''); setTab('list'); };
  return (
    <Modal title="Eventos futuros" onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>{[['list', '📋 Próximos'], ['new', '+ Novo']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px 0', background: tab === k ? C.purple : C.purpleLight, color: tab === k ? C.white : C.purple, border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>{l}</button>)}</div>
      {tab === 'list' && (events.length === 0 ? <p style={{ textAlign: 'center', fontSize: 14, color: C.textLight, padding: '24px 0' }}>Nenhum evento programado.</p> : events.map(ev => { const t2 = EVENT_TYPES.find(t => t.id === ev.type) || EVENT_TYPES[4]; return <div key={ev.id} style={{ background: C.white, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 10 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t2.emoji}</div><div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>{ev.title}</p><p style={{ margin: 0, fontSize: 12, color: C.textMid }}>{fmtLabel(ev.date)}{ev.time ? ` às ${ev.time}` : ''}</p></div><button onClick={() => onSave(events.filter(e => e.id !== ev.id))} style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontSize: 12 }}>remover</button></div>{ev.notes && <p style={{ margin: '8px 0 0', fontSize: 13, color: C.textMid }}>{ev.notes}</p>}</div>; }))}
      {tab === 'new' && <div><div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>{EVENT_TYPES.map(et => <button key={et.id} onClick={() => setEvType(et.id)} style={{ padding: '6px 12px', background: evType === et.id ? C.amberLight : C.white, border: `1.5px solid ${evType === et.id ? C.amber : C.cardBorder}`, borderRadius: 20, cursor: 'pointer', fontSize: 12, color: evType === et.id ? C.amber : C.textMid }}>{et.emoji} {et.label}</button>)}</div><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do evento" style={{ marginBottom: 12 }} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}><input type="date" value={date} onChange={e => setDate(e.target.value)} /><input type="time" value={time} onChange={e => setTime(e.target.value)} /></div><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações…" style={{ marginBottom: 14, minHeight: 60 }} /><Btn onClick={add} disabled={!title.trim() || !date}>Adicionar evento</Btn></div>}
    </Modal>
  );
}

function RemindersModal({reminders, onSave, onClose}) {
  const [list, setList] = useState(reminders || []);
  const [newTime, setNewTime] = useState('20:00');
  const req = () => { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); };
  return (
    <Modal title="Lembretes" onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ flex: 1 }} /><button onClick={() => { if (!list.includes(newTime)) setList(p => [...p, newTime].sort()); }} style={{ padding: '0 16px', background: C.purple, color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Adicionar</button></div>
      {list.length === 0 ? <p style={{ fontSize: 13, color: C.textLight, textAlign: 'center', padding: '12px 0' }}>Nenhum lembrete.</p> : <div style={{ marginBottom: 14 }}>{list.map(t => <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.purpleLight, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}><span style={{ fontSize: 16, fontWeight: 600, color: C.purple }}>{t}</span><button onClick={() => setList(p => p.filter(x => x !== t))} style={{ background: 'none', border: 'none', color: C.textLight, cursor: 'pointer', fontSize: 13 }}>remover</button></div>)}</div>}
      <div style={{ background: C.amberLight, borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 12, color: '#7A5800', margin: 0 }}>Permita notificações para receber lembretes. <button onClick={req} style={{ background: 'none', border: 'none', color: C.amber, cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>Permitir →</button></p></div>
      <Btn onClick={() => { onSave(list); onClose(); }}>Salvar lembretes</Btn>
    </Modal>
  );
}

function BackupModal({data, profile, password, onClose, addToast, zIndex = 400}) {
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const [driveToken, setDriveToken] = useState(safeLS.get(GDRIVE_KEY)?.access_token || null);
  const fileRef = useRef();

  const snapshots = getMonthlySnapshots(profile.id);
  const totalDays = Object.keys(data.moments || {}).filter(d => (data.moments[d] || []).length > 0).length;
  const totalMoments = Object.values(data.moments || {}).reduce((s, m) => s + (m || []).length, 0);

  const connectDrive = async () => { setStatus('connecting'); try { const t = await gdriveAuth(); setDriveToken(t); setStatus('idle'); addToast?.('Google Drive conectado!', 'success'); } catch (e) { setStatus('error'); setMsg(e.message); } };
  const uploadDrive = async () => { setStatus('uploading'); try { await gdriveUpload(await encryptObj(data, password), driveToken); setStatus('done'); addToast?.('Backup salvo no Google Drive!', 'success'); setMsg('Salvo!'); } catch (e) { setStatus('error'); setMsg('Erro: ' + e.message); } };
  const exportLocal = async () => { const enc = await encryptObj(data, password); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([enc], { type: 'text/plain' })); a.download = `veeda-backup-${todayStr()}.veeda`; a.click(); addToast?.('Arquivo baixado!', 'success'); };
  const importLocal = file => { const r = new FileReader(); r.onload = async e => { try { const { data: d } = await decryptObj(e.target.result, password); addToast?.('Backup verificado com sucesso!', 'success'); setMsg('Backup verificado!'); } catch { addToast?.('Arquivo inválido ou senha incorreta.', 'error'); } }; r.readAsText(file); };

  return (
    <Modal title="Backup dos Dados" onClose={onClose} fullHeight zIndex={zIndex}>
      <div style={{ background: `linear-gradient(135deg,${C.purpleLight},${C.blueLight})`, borderRadius: 14, padding: 16, textAlign: 'center', marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 28 }}>🌿</p>
        <p style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 700, color: C.text }}>{profile.name}</p>
        <p style={{ margin: 0, fontSize: 12, color: C.textMid }}>{totalDays} Dias · {totalMoments} momentos</p>
      </div>

      {snapshots.length > 0 && (
        <div style={{ background: C.greenLight, borderRadius: 12, padding: '12px 14px', marginBottom: 16, border: `1px solid ${C.green}44` }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: C.green }}>✅ Histórico protegido automaticamente</p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMid }}>Você tem snapshots mensais de: {snapshots.map(s => s.ym).join(', ')}</p>
        </div>
      )}

      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>☁️ Google Drive</p>
      {!driveToken && <Btn onClick={connectDrive} disabled={status === 'connecting'} style={{ marginBottom: 10 }}>{status === 'connecting' ? <><Spinner size={16} color="#fff" />Conectando…</> : "Conectar Google Drive"}</Btn>}
      {driveToken && <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><Btn onClick={uploadDrive} disabled={status === 'uploading'} style={{ flex: 1, fontSize: 13, padding: '11px 0' }}>{status === 'uploading' ? <><Spinner size={14} color="#fff" />Salvando…</> : "↑ Salvar"}</Btn><button onClick={() => { safeLS.del(GDRIVE_KEY); setDriveToken(null); }} style={{ padding: '0 12px', background: 'none', border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.textLight, cursor: 'pointer', fontSize: 12 }}>Sair</button></div>}

      <div style={{ height: 1, background: C.cardBorder, margin: '16px 0' }} />
      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>📁 Arquivo local</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Btn onClick={exportLocal} style={{ flex: 1, fontSize: 13, padding: '11px 0' }}>↓ Exportar .veeda</Btn>
        <Btn onClick={() => fileRef.current.click()} variant="outline" style={{ flex: 1, fontSize: 13, padding: '11px 0' }}>↑ Importar .veeda</Btn>
      </div>
      <input ref={fileRef} type="file" accept=".veeda,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) importLocal(f); e.target.value = ''; }} />
    </Modal>
  );
}

function SettingsModal({profile, data, password, onUpdateProfile, onSave, onLogout, onClose, addToast}) {
  const [showBackup, setShowBackup] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showHandle, setShowHandle] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [handleInput, setHandleInput] = useState((profile.handle || nameToHandle(profile.name)).replace(/^@/, ''));
  const [handleErr, setHandleErr] = useState('');
  const [tab, setTab] = useState('conta');

  const saveHandle = () => {
    const h = sanitizeHandle(handleInput);
    if (h.length < 3) { setHandleErr('Mínimo 3 caracteres.'); return; }
    if (!/^[a-z0-9_]+$/.test(h)) { setHandleErr('Use apenas letras, números e _.'); return; }
    if (!isHandleAvailable('@' + h, profile.id)) { setHandleErr('Este @handle já está em uso.'); return; }
    const ps = loadProfiles(); const idx = ps.findIndex(p => p.id === profile.id);
    if (idx >= 0) { ps[idx].handle = '@' + h; saveProfiles(ps); registryUpdate({ ...ps[idx] }); onUpdateProfile({ ...profile, handle: '@' + h }); }
    addToast?.('@handle atualizado!', 'success');
    setShowHandle(false);
  };

  const totalDays = Object.keys(data.moments || {}).filter(d => (data.moments[d] || []).length > 0).length;
  const totalMoments = Object.values(data.moments || {}).reduce((s, m) => s + (m || []).length, 0);

  return (
    <>
      {showBackup && <BackupModal data={data} profile={profile} password={password} onClose={() => setShowBackup(false)} addToast={addToast} />}
      {showCode && <ConnectionCodeModal profile={profile} onClose={() => setShowCode(false)} />}
      {showVersions && <VersionsModal onClose={() => setShowVersions(false)} />}

      <Modal title="Configurações" onClose={onClose} fullHeight>
        <div style={{ textAlign: 'center', paddingBottom: 20, marginBottom: 16, borderBottom: `1px solid ${C.headerBorder}` }}>
          <AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor || C.purpleLight} size={68} ring />
          <p style={{ margin: '10px 0 2px', fontSize: 16, fontWeight: 700, color: C.text, fontFamily: PASSO }}>{profile.name}</p>
          <p style={{ margin: '0 0 2px', fontSize: 13, color: C.purple, fontWeight: 600 }}>{profile.handle || nameToHandle(profile.name)}</p>
          {profile.email && <p style={{ margin: 0, fontSize: 12, color: C.textLight }}>{profile.email}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', background: C.purpleLight, borderRadius: 20, fontSize: 11, color: C.purple }}>{totalDays} dias</span>
            <span style={{ padding: '3px 10px', background: C.greenLight, borderRadius: 20, fontSize: 11, color: C.green }}>{totalMoments} momentos</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {[['conta', 'Conta'], ['dados', 'Meus Dados'], ['notif', 'Notif.'], ['sobre', 'Sobre']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 14px', background: tab === k ? C.purple : C.purpleLight, color: tab === k ? C.white : C.purple, border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>{l}</button>
          ))}
        </div>

        {tab === 'conta' && <div>
          {(profile.cloud || getCachedUser()) && <div style={{ background: C.white, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              {getCachedUser()?.picture ? <img src={getCachedUser().picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>☁️</div>}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 11, color: C.textMid, fontWeight: 600, letterSpacing: '.3px', textTransform: 'uppercase' }}>Conta Google {profile.cloud ? '· Nuvem ativa' : ''}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: C.text, fontWeight: 500 }}>{getCachedUser()?.email || profile.email || '—'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.cloud && <button onClick={async () => { const t = await cloudSync.tokenOrNull(); if (!t) { addToast?.('Faça login no Google novamente.', 'error'); return; } await cloudSync.flushAll(); const enc = safeLS.raw(`veeda_data_${profile.id}`); if (enc) { try { await cloudData.save(profile.id, enc, t); addToast?.('Sincronizado com a nuvem ☁️', 'success'); } catch { addToast?.('Falha ao sincronizar.', 'error'); } } }} style={{ flex: 1, minWidth: 120, padding: '9px 12px', background: C.purpleLight, color: C.purple, border: `1px solid ${C.purple}44`, borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>☁️ Sincronizar agora</button>}
              <button onClick={() => { clearGoogleAuth(); addToast?.('Google desconectado. Seus dados locais continuam salvos.', 'info'); onLogout(); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '9px 12px', background: '#fff', color: C.textMid, border: `1px solid ${C.cardBorder}`, borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Sair do Google</button>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 11, color: C.textLight, lineHeight: 1.5 }}>{profile.cloud ? 'Seus dias são enviados cifrados ao Google Drive (pasta privada do app). Só você, com sua senha, consegue ler.' : 'Este perfil é local. Entre com o Google para habilitar a nuvem.'}</p>
          </div>}

          {showHandle ? (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.textMid, display: 'block', marginBottom: 6 }}>Novo @handle</label>
              <div style={{ position: 'relative', marginBottom: handleErr ? 6 : 12 }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: C.purple, fontWeight: 700, pointerEvents: 'none' }}>@</span>
                <input value={handleInput} onChange={e => { setHandleInput(sanitizeHandle(e.target.value)); setHandleErr(''); }} style={{ paddingLeft: 28 }} autoFocus />
              </div>
              {handleErr && <p style={{ fontSize: 12, color: C.red, margin: '0 0 10px' }}>{handleErr}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={saveHandle} style={{ flex: 1, fontSize: 13, padding: '10px 0' }}>Salvar</Btn>
                <Btn onClick={() => setShowHandle(false)} variant="ghost" style={{ flex: 1 }}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <div>
              {[{ label: '@handle', val: profile.handle || nameToHandle(profile.name), action: () => setShowHandle(true) }, { label: 'E-mail', val: profile.email || '—' }, { label: 'Código de Conexão', val: 'Compartilhar', action: () => setShowCode(true) }, { label: 'Backup / Restaurar', val: '→', action: () => setShowBackup(true) }].map((row, i, arr) => (
                <div key={row.label}>
                  <button onClick={row.action} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: C.white, border: `1px solid ${C.cardBorder}`, borderRadius: i === 0 ? '14px 14px 0 0' : i === arr.length - 1 ? '0 0 14px 14px' : '0', borderTop: i > 0 ? 'none' : '', cursor: row.action ? 'pointer' : 'default', textAlign: 'left' }}>
                    <span style={{ fontSize: 14, color: C.text }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: row.action ? C.purple : C.textLight }}>{row.val}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Btn onClick={() => { onLogout(); onClose(); }} variant="danger">Sair da conta</Btn>
          </div>
        </div>}

        {tab === 'dados' && <div>
          <div style={{ background: C.purpleLight, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: C.text }}>Histórico do mês atual</p>
            <p style={{ margin: 0, fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>Seus dados são salvos automaticamente a cada ação e protegidos por snapshots mensais.</p>
          </div>
          <div style={{ background: C.greenLight, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${C.green}44` }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: C.green }}>✅ Dados protegidos {profile.cloud ? 'local + nuvem' : 'localmente'}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>Todos os seus {totalMoments} momentos estão seguros.</p>
          </div>
          {(() => { const bkps = listPreservedBackups(); if (!bkps.length) return null; return (<div style={{ background: C.amberLight, borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${C.amber}44` }}><p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: C.amber }}>📦 {bkps.length} backup(s) preservado(s)</p>{bkps.slice(0, 3).map(b => (<div key={b.key} style={{ fontSize: 11, color: C.textMid, padding: '4px 0', borderTop: `1px dashed ${C.amber}33` }}>{new Date(b.ts).toLocaleString('pt-BR')} · {b.label}</div>))}</div>); })()}
          <Btn onClick={() => setShowBackup(true)}>Gerenciar Backup</Btn>
        </div>}

        {tab === 'notif' && <div>
          <div style={{ background: C.purpleLight, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: C.text }}>Notificações</p>
            <Btn onClick={async () => { const ok = await requestNotifPermission(); addToast?.(ok ? 'Notificações ativadas! 🔔' : 'Permissão negada.', ok ? 'success' : 'error'); }}>🔔 Ativar notificações</Btn>
          </div>
          <Btn onClick={() => { onSave({ ...data, reminders: [] }); addToast?.('Lembretes limpos.', 'info'); }} variant="outline">Limpar lembretes</Btn>
        </div>}

        {tab === 'sobre' && <div>
          <div style={{ background: `linear-gradient(135deg,${C.purpleLight},${C.blueLight})`, borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontFamily: PASSO, fontSize: 32, fontWeight: 700, color: C.purple, margin: '0 0 4px' }}>Veeda</p>
            <p style={{ fontSize: 12, color: C.textMid, margin: 0 }}>v{APP_VERSION} — Dias de Vida</p>
          </div>
          <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, marginBottom: 16 }}>Veeda nasce da crença de que a vida não cabe em um feed. Viva primeiro, registre, compartilhe depois.</p>
          <Btn onClick={() => setShowVersions(true)}>📋 Ver histórico de atualizações</Btn>
        </div>}
      </Modal>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// VERSIONS MODAL — Histórico de atualizações
// ═══════════════════════════════════════════════════════════
function VersionsModal({onClose}) {
  return (
    <Modal title="📋 Histórico de atualizações" onClose={onClose} fullHeight>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {VERSION_HISTORY.map((v, idx) => (
          <div key={v.version} style={{ 
            background: idx === 0 ? C.purpleLight : C.white,
            border: `1px solid ${idx === 0 ? C.purple + '33' : C.cardBorder}`,
            borderRadius: 14,
            padding: 14,
            position: 'relative'
          }}>
            {idx === 0 && <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, background: C.purple, color: C.white, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>Atual</span>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, fontFamily: PASSO }}>v{v.version}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.textLight }}>{new Date(v.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
              {v.changes.map((change, cidx) => (
                <li key={cidx} style={{ marginBottom: cidx < v.changes.length - 1 ? 6 : 0 }}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.headerBorder}`, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: C.textLight, lineHeight: 1.6 }}>
          Veeda está sempre evoluindo para oferecer a melhor experiência possível. 
          Obrigado por acompanhar esta jornada!
        </p>
      </div>
    </Modal>
  );
}

function ProfileModal({profile: viewedProfile, myProfile, contacts, receivedDays, onClose, addToast}) {
  // Verificar se o perfil visualizado está no círculo de contatos
  const isInCircle = contacts.some(c => c.handle === viewedProfile.handle || c.id === viewedProfile.id);

  if (!isInCircle) {
    return (
      <Modal title="Perfil Privado" onClose={onClose}>
        <div style={{textAlign: 'center', padding: '40px 20px'}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>🔒</div>
          <p style={{margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: C.text}}>
            Perfil Privado
          </p>
          <p style={{margin: 0, fontSize: '14px', color: C.textMid, lineHeight: 1.5}}>
            Este perfil só pode ser visualizado por pessoas do círculo.
            Adicione {viewedProfile.name} ao seu Meu Círculo para ver o perfil completo.
          </p>
        </div>
        <Btn onClick={onClose} style={{marginTop: '20px'}}>Entendi</Btn>
      </Modal>
    );
  }

  // Calcular estatísticas do perfil
  const totalDaysShared = receivedDays.filter(d => d.handle === viewedProfile.handle).length;
  const totalMoments = receivedDays
    .filter(d => d.handle === viewedProfile.handle)
    .reduce((sum, d) => sum + (d.moments?.length || 0), 0);

  const lastSharedDate = receivedDays
    .filter(d => d.handle === viewedProfile.handle)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date;

  return (
    <Modal title={`Perfil de ${viewedProfile.name}`} onClose={onClose} fullHeight>
      <div style={{paddingBottom: '20px'}}>
        {/* Header do perfil */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 0',
          borderBottom: `1px solid ${C.headerBorder}`,
          marginBottom: '24px'
        }}>
          <AvatarBubble
            src={viewedProfile.avatarSrc}
            emoji={viewedProfile.emoji || '🌿'}
            color={viewedProfile.avatarColor || C.purpleLight}
            size={80}
            ring
          />
          <h2 style={{
            margin: '16px 0 4px',
            fontSize: '20px',
            fontWeight: '700',
            color: C.text,
            fontFamily: PASSO,
            textAlign: 'center'
          }}>
            {viewedProfile.name}
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: C.purple,
            fontWeight: '500'
          }}>
            @{viewedProfile.handle || nameToHandle(viewedProfile.name)}
          </p>
        </div>

        {/* Estatísticas */}
        <div style={{marginBottom: '24px'}}>
          <h3 style={{
            margin: '0 0 16px',
            fontSize: '16px',
            fontWeight: '600',
            color: C.text,
            fontFamily: PASSO
          }}>
            Estatísticas
          </h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
            <Card style={{textAlign: 'center', padding: '16px'}}>
              <div style={{fontSize: '24px', marginBottom: '4px'}}>📅</div>
              <div style={{fontSize: '18px', fontWeight: '700', color: C.purple}}>{totalDaysShared}</div>
              <div style={{fontSize: '12px', color: C.textMid}}>Dias compartilhados</div>
            </Card>
            <Card style={{textAlign: 'center', padding: '16px'}}>
              <div style={{fontSize: '24px', marginBottom: '4px'}}>💭</div>
              <div style={{fontSize: '18px', fontWeight: '700', color: C.purple}}>{totalMoments}</div>
              <div style={{fontSize: '12px', color: C.textMid}}>Momentos registrados</div>
            </Card>
          </div>
        </div>

        {/* Última atividade */}
        {lastSharedDate && (
          <div style={{marginBottom: '24px'}}>
            <h3 style={{
              margin: '0 0 12px',
              fontSize: '16px',
              fontWeight: '600',
              color: C.text,
              fontFamily: PASSO
            }}>
              Última atividade
            </h3>
            <Card style={{padding: '16px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{fontSize: '20px'}}>🌱</div>
                <div>
                  <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: C.text}}>
                    Compartilhou um dia
                  </p>
                  <p style={{margin: '2px 0 0', fontSize: '12px', color: C.textMid}}>
                    {fmtFull(lastSharedDate)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Dias compartilhados recentes */}
        {totalDaysShared > 0 && (
          <div style={{marginBottom: '24px'}}>
            <h3 style={{
              margin: '0 0 12px',
              fontSize: '16px',
              fontWeight: '600',
              color: C.text,
              fontFamily: PASSO
            }}>
              Dias compartilhados
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {receivedDays
                .filter(d => d.handle === viewedProfile.handle)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map((day, index) => (
                  <Card key={index} style={{padding: '12px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <AvatarBubble
                        emoji={day.emoji || '🌿'}
                        color={day.avatarColor || C.purpleLight}
                        size={32}
                      />
                      <div style={{flex: 1}}>
                        <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: C.text}}>
                          {fmtLabel(day.date)}
                        </p>
                        <p style={{margin: '2px 0 0', fontSize: '12px', color: C.textMid}}>
                          {day.moments?.length || 0} momento{day.moments?.length !== 1 ? 's' : ''}
                          {day.feeling && ` · ${day.feeling.emoji}`}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div style={{
          paddingTop: '20px',
          borderTop: `1px solid ${C.headerBorder}`,
          display: 'flex',
          gap: '12px'
        }}>
          <Btn
            variant="outline"
            style={{flex: 1}}
            onClick={() => {
              // Implementar compartilhamento do perfil
              addToast?.('Funcionalidade em breve! 🌱', 'info');
            }}
          >
            Compartilhar perfil
          </Btn>
          <Btn
            variant="ghost"
            style={{flex: 1}}
            onClick={onClose}
          >
            Fechar
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
