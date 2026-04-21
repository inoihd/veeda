// ═══════════════════════════════════════════════════════════
// NO VeedaApp, ADICIONAR NOVO STATE PARA CONVITES PENDENTES
// ═══════════════════════════════════════════════════════════

// Adicionar junto aos outros states (≈ linha 35)
const [pendingConnections, setPendingConnections] = useState([]);
const [showConnectionRequests, setShowConnectionRequests] = useState(false);

// ═══════════════════════════════════════════════════════════
// CORRIGIR ORDENAÇÃO DA TIMELINE (linha ≈ 130)
// ═══════════════════════════════════════════════════════════

const moments = useMemo(() => {
  if (!activeData) return [];
  // ALTERADO: ordenar do mais recente para o mais antigo (DESC)
  return ((activeData.moments || {})[curDay] || [])
    .slice()
    .sort((a, b) => b.ts - a.ts); // ← INVERTIDO: b - a para DESC
}, [activeData, curDay]);

// ═══════════════════════════════════════════════════════════
// ADICIONAR EFEITO PARA CARREGAR CONVITES PENDENTES
// ═══════════════════════════════════════════════════════════

useEffect(() => {
  if (!data || loading) return;
  
  const myH = (profile.handle || nameToHandle(profile.name)).replace(/^@/, '');
  const requests = getConnectionRequests(myH);
  const pending = requests.filter(r => r.status === 'pending');
  
  if (pending.length > 0) {
    setPendingConnections(pending);
    setUnreadCount(c => c + pending.length);
  }
}, [data, loading, profile]);

// ═══════════════════════════════════════════════════════════
// ADICIONAR FUNÇÕES PARA GERIR CONVITES
// ═══════════════════════════════════════════════════════════

const acceptConnection = useCallback((request) => {
  const myH = (profile.handle || nameToHandle(profile.name)).replace(/^@/, '');
  const accepted = acceptConnectionRequest(myH, request.fromId);
  
  if (accepted) {
    // Adiciona o contato ao círculo
    const newContact = {
      name: request.fromName,
      handle: request.fromHandle,
      code: request.fromHandle.replace(/^@/, ''),
      emoji: request.fromEmoji || '🌿',
      avatarColor: request.fromAvatarColor || C.purpleLight,
      avatarSrc: request.fromAvatarSrc,
      addedAt: Date.now()
    };
    
    save({
      ...data,
      contacts: [...(data.contacts || []), newContact]
    });
    
    setPendingConnections(prev => 
      prev.filter(r => r.fromId !== request.fromId)
    );
    
    addToast?.(`${request.fromName} adicionado ao seu Círculo! 🤝`, 'success');
  }
}, [data, profile, save, addToast]);

const rejectConnection = useCallback((request) => {
  const myH = (profile.handle || nameToHandle(profile.name)).replace(/^@/, '');
  rejectConnectionRequest(myH, request.fromId);
  
  setPendingConnections(prev => 
    prev.filter(r => r.fromId !== request.fromId)
  );
  
  addToast?.(`Convite de ${request.fromName} recusado.`, 'info');
}, [profile, addToast]);

// ═══════════════════════════════════════════════════════════
// ADICIONAR BANNER DE CONVITES PENDENTES NO HEADER
// ═══════════════════════════════════════════════════════════

// No return do VeedaApp, após o ToastContainer, adicionar:
{pendingConnections.length > 0 && (
  <div style={{
    position: 'fixed',
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: 440,
    zIndex: 500,
    animation: 'notifDrop .4s cubic-bezier(.22,1,.36,1)'
  }}>
    <div style={{
      background: C.white,
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(60,40,120,.22)'
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.green}, ${C.teal})`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontSize: 24 }}>🤝</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.75)' }}>
            Novo convite de conexão
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#fff' }}>
            {pendingConnections.length} convite{pendingConnections.length > 1 ? 's' : ''} pendente{pendingConnections.length > 1 ? 's' : ''}
          </p>
        </div>
        <button 
          onClick={() => setShowConnectionRequests(true)}
          style={{
            background: 'rgba(255,255,255,.18)',
            border: 'none',
            borderRadius: 20,
            padding: '8px 16px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          Ver →
        </button>
      </div>
    </div>
  </div>
)}

// ═══════════════════════════════════════════════════════════
// ADICIONAR MODAL DE CONVITES PENDENTES
// ═══════════════════════════════════════════════════════════

{showConnectionRequests && (
  <Modal title="Convites de Conexão" onClose={() => setShowConnectionRequests(false)}>
    <p style={{ fontSize: 13, color: C.textMid, marginBottom: 16 }}>
      Estas pessoas querem se conectar com você para compartilhar dias:
    </p>
    {pendingConnections.map(request => (
      <div key={request.fromId} style={{
        background: C.white,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 14,
        padding: '14px',
        marginBottom: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <AvatarBubble
            src={request.fromAvatarSrc}
            emoji={request.fromEmoji || '🌿'}
            color={request.fromAvatarColor || C.purpleLight}
            size={44}
            ring
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>
              {request.fromName}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.purple, fontWeight: 500 }}>
              {request.fromHandle}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => acceptConnection(request)} style={{ flex: 1 }}>
            Aceitar 🤝
          </Btn>
          <Btn onClick={() => rejectConnection(request)} variant="outline" style={{ flex: 1 }}>
            Recusar
          </Btn>
        </div>
      </div>
    ))}
  </Modal>
)}
