// ═══════════════════════════════════════════════════════════
// MODIFICAR ShareDayModal - VALIDAR SE CONTATO ESTÁ CONECTADO
// ═══════════════════════════════════════════════════════════

function ShareDayModal({profile, data, curDay, onClose, onShared, addToast}) {
  // ... código existente ...
  
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
      feeling: (data.dayFeelings || {})[curDay],
      message: msg.trim(),
      importedAt: Date.now()
    };
    
    let sharedCount = 0;
    
    sel.forEach(contactHandle => {
      const cleanHandle = contactHandle.replace(/^@/, '');
      
      // VERIFICAR SE O INBOX EXISTE (contato aceitou a conexão)
      const inboxKey = `veeda_inbox_${cleanHandle}`;
      const inbox = safeLS.get(inboxKey, null);
      
      if (inbox !== null) {
        // Contato está conectado - pode receber
        inbox.push(payload);
        safeLS.set(inboxKey, inbox);
        sharedCount++;
      } else {
        console.warn(`Inbox não encontrado para ${cleanHandle}`);
      }
    });
    
    if (sharedCount > 0) {
      showNativeNotif('Veeda', `${profile.name} compartilhou o dia com você! 🌿`);
      await onShared({
        ...(data.sharedLog || {}),
        [curDay]: [...already, ...sel]
      });
      addToast?.(`Dia compartilhado com ${sharedCount} pessoa(s)! 🌿`, 'success');
      setDone(true);
    } else {
      addToast?.('Nenhum contato disponível para receber.', 'warn');
    }
    
    setLoading(false);
  };
  
  // ... resto do código ...
}
