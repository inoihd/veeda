// ═══════════════════════════════════════════════════════════
// SUBSTITUIR A FUNÇÃO AddContactModal INTEIRA
// ═══════════════════════════════════════════════════════════

function AddContactModal({contacts, myHandle, profile, onAdd, onClose, addToast, prefillCard}) {
  const [cardCode, setCardCode] = useState(prefillCard || '');
  const [tab, setTab] = useState('add');
  const [step, setStep] = useState(1);
  const [found, setFound] = useState(null);
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);

  const myH = (myHandle || '').replace(/^@/, '');

  const tryParseCard = () => {
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
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[
              ['add', '📋 Por código'],
              ['search', '🔍 Buscar aqui']
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  background: tab === k ? C.purple : C.purpleLight,
                  color: tab === k ? C.white : C.purple,
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 12
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
                style={{ marginBottom: 12, minHeight: 72, borderRadius: 14 }}
              />
              <Btn onClick={tryParseCard} disabled={!cardCode.trim()}>
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
                    cursor: 'pointer',
                    textAlign: 'left'
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
          <Btn onClick={sendRequest} disabled={sending} style={{ marginBottom: 10 }}>
            {sending ? <><Spinner size={16} color="#fff" /> Enviando convite…</> : 'Enviar convite'}
          </Btn>
          <Btn onClick={() => { setStep(1); setFound(null); setCardCode(''); }} variant="ghost">
            ← Voltar
          </Btn>
        </>
      )}
    </div>
  );
}
