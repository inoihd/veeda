// ═══════════════════════════════════════════════════════════
// VEEDA MODALS — veeda-modals.js
// Edite este arquivo para: AddContactModal, ConnectionCodeModal,
// ReceivedNotif, InviteModal, ShareDayModal, EventsModal,
// RemindersModal, BackupModal, SettingsModal
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// ADD CONTACT MODAL (with cross-device support)
// ═══════════════════════════════════════════════════
function AddContactModal({contacts,myHandle,onAdd,onClose,addToast,prefillCard}){
  const [q,setQ]=useState("");
  const [cardCode,setCardCode]=useState(prefillCard||"");
  const [tab,setTab]=useState(prefillCard?"card":"search"); // search | card
  const [step,setStep]=useState(1);
  const [found,setFound]=useState(null);
  const myH=(myHandle||"").replace(/^@/,"");

  // Auto-decode prefilled code from invite link
  useEffect(()=>{
    if(!prefillCard)return;
    const parsed=parseProfileCard(prefillCard.trim());
    if(parsed){
      if(parsed.handle.replace(/^@/,"")===myH){addToast?.("Este é o seu próprio código.","warn");return;}
      if(contacts.find(c=>(c.handle||"").replace(/^@/,"")===(parsed.handle||"").replace(/^@/,""))){
        addToast?.(`${parsed.name} já está no seu Círculo.`,"info");return;
      }
      setFound(parsed);setStep(2);
    } else {
      addToast?.("Link de convite inválido ou corrompido.","error");
    }
  },[prefillCard]);

  const localResults=useMemo(()=>{
    const results=registrySearch(q).filter(p=>{
      if(p.handle.replace(/^@/,"")===myH)return false;
      if(contacts.find(c=>(c.handle||"").replace(/^@/,"")===(p.handle||"").replace(/^@/,"")))return false;
      return true;
    });
    return results;
  },[q,myH,contacts]);

  const tryParseCard=()=>{
    const parsed=parseProfileCard(cardCode.trim());
    if(!parsed){addToast("Código inválido. Peça ao contato para gerar o código novamente.","error");return;}
    setFound(parsed);setStep(2);
  };

  const confirm=()=>{
    if(!found)return;
    onAdd({name:found.name,handle:found.handle,code:found.handle.replace(/^@/,""),emoji:found.emoji||"🌿",avatarColor:found.avatarColor||C.purpleLight,avatarSrc:found.avatarSrc||null,addedAt:Date.now()});
  };

  return(
    <div>
      {step===1&&<>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[["search","🔍 Buscar"],["card","📋 Código"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"9px 0",background:tab===k?C.purple:C.purpleLight,color:tab===k?C.white:C.purple,border:"none",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:13}}>{l}</button>
          ))}
        </div>

        {tab==="search"&&<>
          <p style={{fontSize:12,color:C.textMid,marginBottom:8}}>Seu handle: <strong style={{color:C.purple}}>{myHandle}</strong></p>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nome ou @handle…" autoFocus style={{marginBottom:8}}/>
          {q.trim()&&localResults.length===0&&<p style={{fontSize:13,color:C.textLight,textAlign:"center",padding:"16px 0"}}>Nenhum usuário encontrado neste dispositivo.</p>}
          {localResults.map(p=>(
            <button key={p.id||p.handle} onClick={()=>{setFound(p);setStep(2);}} style={{width:"100%",background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
              <AvatarBubble src={p.avatarSrc} emoji={p.emoji||"🌿"} color={p.avatarColor||C.purpleLight} size={44}/>
              <div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{p.name}</p><p style={{margin:0,fontSize:12,color:C.purple,fontWeight:500}}>{p.handle}</p></div>
              <span style={{fontSize:18,color:C.textLight}}>+</span>
            </button>
          ))}
          <div style={{marginTop:12,padding:"12px 14px",background:C.amberLight,borderRadius:10,border:`1px solid ${C.amber}44`}}>
            <p style={{margin:"0 0 6px",fontSize:12,color:"#7A5800",fontWeight:600}}>Para adicionar alguém de outro dispositivo:</p>
            <p style={{margin:0,fontSize:12,color:"#7A5800",lineHeight:1.5}}>Peça que a pessoa vá em Configurações → Meu Código de Conexão, copie e envie para você. Depois cole na aba "Código" acima.</p>
          </div>
        </>}

        {tab==="card"&&<>
          <p style={{fontSize:13,color:C.textMid,marginBottom:12,lineHeight:1.6}}>Cole o <strong>Código de Conexão</strong> que o seu contato compartilhou com você.</p>
          <textarea value={cardCode} onChange={e=>setCardCode(e.target.value)} placeholder="Cole o código aqui (começa com vc2_…)" style={{marginBottom:14,minHeight:80,borderRadius:14}}/>
          <Btn onClick={tryParseCard} disabled={!cardCode.trim()}>Decodificar código</Btn>
        </>}
      </>}

      {step===2&&found&&<>
        <div style={{textAlign:"center",marginBottom:20}}>
          <AvatarBubble src={found.avatarSrc} emoji={found.emoji} color={found.avatarColor||C.purpleLight} size={64} ring/>
          <p style={{margin:"10px 0 2px",fontSize:16,fontWeight:700,color:C.text}}>{found.name}</p>
          <p style={{margin:0,fontSize:14,color:C.purple,fontWeight:600}}>{found.handle}</p>
          {found.fromCard&&<p style={{margin:"6px 0 0",fontSize:12,color:C.green}}>✓ Perfil identificado via código</p>}
        </div>
        <Btn onClick={confirm} style={{marginBottom:10}}>Adicionar ao Meu Círculo</Btn>
        <Btn onClick={()=>{setStep(1);setFound(null);}} variant="ghost">← Buscar outro</Btn>
      </>}
    </div>
  );
}

// Connection Code Modal
function ConnectionCodeModal({profile,onClose}){
  const [copied,setCopied]=useState(false);
  const [linkCopied,setLinkCopied]=useState(false);
  const code=makeProfileCard(profile);
  // Link "mágico" — quem abrir este link no celular é convidado a adicionar
  // este perfil ao Meu Círculo automaticamente (sem precisar copiar/colar código).
  const inviteLink=`${window.location.origin}${window.location.pathname}?add=${code}`;
  const whatsMsg=`Olá! Sou ${profile.name} no Veeda. Me adiciona no Meu Círculo:\n${inviteLink}`;
  const copy=()=>{navigator.clipboard?.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),2500);};
  const copyLink=()=>{navigator.clipboard?.writeText(inviteLink);setLinkCopied(true);setTimeout(()=>setLinkCopied(false),2500);};
  const shareNative=()=>{navigator.share?.({title:"Veeda",text:whatsMsg}).catch(()=>{});};
  return(
    <Modal title="Meu Código de Conexão" onClose={onClose}>
      <div style={{textAlign:"center",marginBottom:16}}>
        <AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor||C.purpleLight} size={60} ring/>
        <p style={{margin:"8px 0 2px",fontSize:15,fontWeight:700,color:C.text}}>{profile.name}</p>
        <p style={{margin:0,fontSize:12,color:C.purple}}>{profile.handle}</p>
      </div>
      <p style={{fontSize:13,color:C.textMid,marginBottom:14,lineHeight:1.6}}>Compartilhe o <strong>link</strong> abaixo com quem você quer no seu Círculo — quando a pessoa tocar, ela já vai poder te adicionar direto.</p>
      <div style={{background:C.greenLight,borderRadius:14,padding:"14px",marginBottom:10,border:`1px solid ${C.green}33`}}>
        <p style={{margin:"0 0 6px",fontSize:10,color:C.green,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px"}}>🔗 Link rápido</p>
        <p style={{margin:0,fontSize:11,color:C.text,wordBreak:"break-all",lineHeight:1.5}}>{inviteLink}</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <Btn onClick={copyLink} variant={linkCopied?"green":"primary"} style={{flex:1,fontSize:13,padding:"11px 0"}}>{linkCopied?"✓ Link copiado!":"Copiar link"}</Btn>
        {navigator.share&&<button onClick={shareNative} style={{flex:1,padding:"11px 0",background:C.white,color:C.purple,border:`1.5px solid ${C.purple}`,borderRadius:50,fontWeight:600,fontSize:13,cursor:"pointer"}}>Compartilhar ↑</button>}
      </div>
      <details style={{marginBottom:4}}>
        <summary style={{fontSize:12,color:C.textMid,cursor:"pointer",padding:"6px 0"}}>Ou use o código de texto (para colar manualmente)</summary>
        <div style={{background:C.purpleLight,borderRadius:14,padding:"14px",marginTop:8}}>
          <p style={{margin:"0 0 8px",fontSize:10,color:C.textMid,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px"}}>Seu código</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:C.text,wordBreak:"break-all",fontFamily:"monospace",lineHeight:1.7}}>{code}</p>
          <Btn onClick={copy} variant="outline" style={{fontSize:13,padding:"10px 0"}}>{copied?"✓ Copiado!":"Copiar código"}</Btn>
        </div>
      </details>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// RECEIVED NOTIF BANNER
// ═══════════════════════════════════════════════════
function ReceivedNotif({notif,onOpen,onDismiss}){
  return(
    <div style={{position:"fixed",top:16,left:"50%",width:"calc(100% - 32px)",maxWidth:440,zIndex:500,animation:"notifDrop .4s cubic-bezier(.22,1,.36,1)",transform:"translateX(-50%)"}}>
      <div style={{background:C.white,borderRadius:18,overflow:"hidden",boxShadow:"0 12px 40px rgba(60,40,120,.22)"}}>
        <div style={{background:`linear-gradient(135deg,${C.purple},${C.blue})`,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <AvatarBubble src={notif.avatarSrc} emoji={notif.emoji} color={notif.avatarColor||C.purpleLight} size={46} ring/>
          <div style={{flex:1}}><p style={{margin:0,fontSize:12,color:"rgba(255,255,255,.75)"}}>✨ Novo Dia de Veeda</p><p style={{margin:"2px 0 0",fontSize:14,fontWeight:600,color:"#fff"}}><strong>{notif.author}</strong> compartilhou o dia</p></div>
          <button onClick={onDismiss} style={{background:"rgba(255,255,255,.18)",border:"none",borderRadius:"50%",width:28,height:28,color:"#fff",fontSize:16,cursor:"pointer"}}>×</button>
        </div>
        {notif.message&&<div style={{padding:"10px 16px",background:"#FAF8FF"}}><p style={{margin:0,fontSize:13,color:C.textMid,fontStyle:"italic"}}>"{notif.message}"</p></div>}
        <div style={{padding:"10px 16px",display:"flex",gap:8}}>
          <button onClick={onDismiss} style={{flex:1,padding:"9px 0",background:C.purpleLight,border:"none",borderRadius:10,color:C.purple,cursor:"pointer",fontSize:13,fontWeight:500}}>Depois</button>
          <button onClick={onOpen} style={{flex:2,padding:"9px 0",background:C.purple,border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>Abrir →</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// INVITE APP MODAL
// ═══════════════════════════════════════════════════
function InviteModal({onClose}){
  const url=window.location.href.split("?")[0];
  const msg=`Olá! Uso o Veeda para registrar e compartilhar meus dias com quem amo. Acessa aqui:\n\n📱 ${url}\n\nÉ gratuito e seus dados ficam só no seu celular. 🌿`;
  const [copied,setCopied]=useState(false);
  return(
    <Modal title="Convidar para o Veeda" onClose={onClose}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 12px"}}>🌿</div>
        <p style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:4}}>Compartilhe o Veeda</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{l:"WhatsApp",e:"💬",c:"#25D366",bg:"#E8FBF0",u:`https://wa.me/?text=${encodeURIComponent(msg)}`},{l:"E-mail",e:"✉️",c:C.purple,bg:C.purpleLight,u:`mailto:?subject=${encodeURIComponent("Venha pro Veeda 🌿")}&body=${encodeURIComponent(msg)}`},{l:"Signal",e:"🔒",c:"#3A76F0",bg:"#EAF0FD",u:`https://signal.me/#composetextlink=${encodeURIComponent(msg)}`},{l:"SMS",e:"📱",c:C.blue,bg:C.blueLight,u:`sms:?body=${encodeURIComponent(msg)}`}].map(o=>(
          <a key={o.l} href={o.u} target="_blank" rel="noopener noreferrer" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"16px 8px",background:o.bg,borderRadius:14,textDecoration:"none",border:`1px solid ${o.c}22`}}>
            <span style={{fontSize:24}}>{o.e}</span><span style={{fontSize:12,fontWeight:600,color:o.c}}>{o.l}</span>
          </a>
        ))}
      </div>
      <div style={{background:C.purpleLight,borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
        <p style={{flex:1,margin:0,fontSize:11,color:C.textMid,wordBreak:"break-all"}}>{url}</p>
        <button onClick={()=>{navigator.clipboard?.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{flexShrink:0,padding:"6px 12px",background:copied?C.green:C.purple,color:"#fff",border:"none",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer"}}>{copied?"✓":"Copiar"}</button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// SHARE DAY MODAL
// ═══════════════════════════════════════════════════
function ShareDayModal({profile,data,curDay,onClose,onShared,addToast}){
  const [sel,setSel]=useState([]);const [msg,setMsg]=useState("");const [loading,setLoading]=useState(false);const [done,setDone]=useState(false);
  const contacts=data.contacts||[];
  const moments=(data.moments||{})[curDay]||[];
  const already=(data.sharedLog||{})[curDay]||[];
  const available=contacts.filter(c=>!already.includes(c.code));
  const toggle=code=>setSel(p=>p.includes(code)?p.filter(x=>x!==code):[...p,code]);

  const doShare=async()=>{
    if(!sel.length)return;setLoading(true);
    const payload={date:curDay,author:profile.name,handle:profile.handle||nameToHandle(profile.name),emoji:profile.emoji,avatarColor:profile.avatarColor,avatarSrc:profile.avatarSrc||null,moments,feeling:(data.dayFeelings||{})[curDay],message:msg.trim(),importedAt:Date.now()};
    sel.forEach(handle=>{
      const k=`veeda_inbox_${handle.replace(/^@/,"")}`;
      const ex=safeLS.get(k,[]);
      ex.push(payload);
      safeLS.set(k,ex);
    });
    // Show native notification if on same device
    showNativeNotif("Veeda",`${profile.name} compartilhou o dia com você! 🌿`);
    await onShared({...(data.sharedLog||{}),[curDay]:[...already,...sel]});
    addToast?.("Dia compartilhado com sucesso! 🌿","success");
    setDone(true);setLoading(false);
  };

  if(done)return<Modal title="" onClose={onClose}><div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:52,marginBottom:14}}>🌿</div><p style={{fontSize:18,fontWeight:600,color:C.text,marginBottom:8}}>Dia compartilhado!</p><Btn onClick={onClose}>Fechar</Btn></div></Modal>;

  return(
    <Modal title="Compartilhar meu Dia de Veeda" onClose={onClose}>
      {moments.length===0?<p style={{fontSize:14,color:C.textMid,textAlign:"center",padding:"20px 0"}}>Nenhum momento registrado hoje ainda.</p>:(
        <>
          <p style={{fontSize:13,color:C.textMid,marginBottom:14}}>{moments.length} momento{moments.length!==1?"s":""} · {fmtFull(curDay)}</p>
          {available.length===0&&<div style={{background:C.amberLight,borderRadius:12,padding:"12px 14px",marginBottom:14}}><p style={{fontSize:13,color:"#7A5800",margin:0}}>Você já compartilhou hoje com todos os seus contatos.</p></div>}
          {available.map(c=>(
            <button key={c.code} onClick={()=>toggle(c.code)} style={{width:"100%",background:sel.includes(c.code)?C.purpleLight:C.white,border:`2px solid ${sel.includes(c.code)?C.purple:C.cardBorder}`,borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
              <AvatarBubble src={c.avatarSrc} emoji={c.emoji||"🌿"} color={c.avatarColor||C.purpleLight} size={38}/>
              <span style={{fontSize:14,fontWeight:500,color:C.text,flex:1}}>{c.name}</span>
              <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${sel.includes(c.code)?C.purple:C.cardBorder}`,background:sel.includes(c.code)?C.purple:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>{sel.includes(c.code)?"✓":""}</div>
            </button>
          ))}
          <div style={{marginTop:16,marginBottom:16}}>
            <label style={{fontSize:13,fontWeight:600,color:C.text,display:"block",marginBottom:8}}>Mensagem (opcional)</label>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Uma frase sobre o seu dia…" style={{width:"100%",minHeight:72,borderRadius:12}}/>
          </div>
          <Btn onClick={doShare} disabled={loading||!sel.length}>{loading?<><Spinner size={16} color="#fff"/>Compartilhando…</>:"Compartilhar linha do tempo"}</Btn>
        </>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// EVENTS MODAL
// ═══════════════════════════════════════════════════
function EventsModal({data,profile,onSave,onClose}){
  const [tab,setTab]=useState("list");const [title,setTitle]=useState("");const [evType,setEvType]=useState("outro");const [date,setDate]=useState("");const [time,setTime]=useState("");const [notes,setNotes]=useState("");
  const events=(data.events||[]).sort((a,b)=>a.date.localeCompare(b.date));
  const add=()=>{if(!title.trim()||!date)return;onSave([...events,{id:Date.now(),title:title.trim(),type:evType,date,time,notes:notes.trim(),createdBy:profile.name}]);setTitle("");setDate("");setTime("");setNotes("");setTab("list");};
  return(
    <Modal title="Eventos futuros" onClose={onClose}>
      <div style={{display:"flex",gap:8,marginBottom:18}}>{[["list","📋 Próximos"],["new","+ Novo"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"9px 0",background:tab===k?C.purple:C.purpleLight,color:tab===k?C.white:C.purple,border:"none",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:13}}>{l}</button>)}</div>
      {tab==="list"&&(events.length===0?<p style={{textAlign:"center",fontSize:14,color:C.textLight,padding:"24px 0"}}>Nenhum evento programado.</p>:events.map(ev=>{const t2=EVENT_TYPES.find(t=>t.id===ev.type)||EVENT_TYPES[4];return<div key={ev.id} style={{background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:14,marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:C.amberLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{t2.emoji}</div><div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{ev.title}</p><p style={{margin:0,fontSize:12,color:C.textMid}}>{fmtLabel(ev.date)}{ev.time?` às ${ev.time}`:""}</p></div><button onClick={()=>onSave(events.filter(e=>e.id!==ev.id))} style={{background:"none",border:"none",color:C.textLight,cursor:"pointer",fontSize:12}}>remover</button></div>{ev.notes&&<p style={{margin:"8px 0 0",fontSize:13,color:C.textMid}}>{ev.notes}</p>}</div>}))}
      {tab==="new"&&<div><div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{EVENT_TYPES.map(et=><button key={et.id} onClick={()=>setEvType(et.id)} style={{padding:"6px 12px",background:evType===et.id?C.amberLight:C.white,border:`1.5px solid ${evType===et.id?C.amber:C.cardBorder}`,borderRadius:20,cursor:"pointer",fontSize:12,color:evType===et.id?C.amber:C.textMid}}>{et.emoji} {et.label}</button>)}</div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nome do evento" style={{marginBottom:12}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><input type="time" value={time} onChange={e=>setTime(e.target.value)}/></div><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observações…" style={{marginBottom:14,minHeight:60}}/><Btn onClick={add} disabled={!title.trim()||!date}>Adicionar evento</Btn></div>}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// REMINDERS
// ═══════════════════════════════════════════════════
function RemindersModal({reminders,onSave,onClose}){
  const [list,setList]=useState(reminders||[]);const [newTime,setNewTime]=useState("20:00");
  const req=()=>{if("Notification" in window&&Notification.permission==="default")Notification.requestPermission();};
  return(
    <Modal title="Lembretes" onClose={onClose}>
      <div style={{display:"flex",gap:8,marginBottom:14}}><input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)} style={{flex:1}}/><button onClick={()=>{if(!list.includes(newTime))setList(p=>[...p,newTime].sort());}} style={{padding:"0 16px",background:C.purple,color:"#fff",border:"none",borderRadius:50,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Adicionar</button></div>
      {list.length===0?<p style={{fontSize:13,color:C.textLight,textAlign:"center",padding:"12px 0"}}>Nenhum lembrete.</p>:<div style={{marginBottom:14}}>{list.map(t=><div key={t} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.purpleLight,borderRadius:10,padding:"10px 14px",marginBottom:8}}><span style={{fontSize:16,fontWeight:600,color:C.purple}}>{t}</span><button onClick={()=>setList(p=>p.filter(x=>x!==t))} style={{background:"none",border:"none",color:C.textLight,cursor:"pointer",fontSize:13}}>remover</button></div>)}</div>}
      <div style={{background:C.amberLight,borderRadius:12,padding:"10px 14px",marginBottom:14}}><p style={{fontSize:12,color:"#7A5800",margin:0}}>Permita notificações para receber lembretes. <button onClick={req} style={{background:"none",border:"none",color:C.amber,cursor:"pointer",fontWeight:600,fontSize:12,padding:0}}>Permitir →</button></p></div>
      <Btn onClick={()=>{onSave(list);onClose();}}>Salvar lembretes</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// BACKUP MODAL
// ═══════════════════════════════════════════════════
function BackupModal({data,profile,password,onClose,addToast}){
  const [status,setStatus]=useState("idle");const [msg,setMsg]=useState("");
  const [driveToken,setDriveToken]=useState(safeLS.get(GDRIVE_KEY)?.access_token||null);
  const fileRef=useRef();

  const snapshots=getMonthlySnapshots(profile.id);
  const totalDays=Object.keys(data.moments||{}).filter(d=>(data.moments[d]||[]).length>0).length;
  const totalMoments=Object.values(data.moments||{}).reduce((s,m)=>s+(m||[]).length,0);

  const connectDrive=async()=>{setStatus("connecting");try{const t=await gdriveAuth();setDriveToken(t);setStatus("idle");addToast?.("Google Drive conectado!","success");}catch(e){setStatus("error");setMsg(e.message);}};
  const uploadDrive=async()=>{setStatus("uploading");try{await gdriveUpload(await encryptObj(data,password),driveToken);setStatus("done");addToast?.("Backup salvo no Google Drive!","success");setMsg("Salvo!");}catch(e){setStatus("error");setMsg("Erro: "+e.message);}};
  const exportLocal=async()=>{const enc=await encryptObj(data,password);const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([enc],{type:"text/plain"}));a.download=`veeda-backup-${todayStr()}.veeda`;a.click();addToast?.("Arquivo baixado!","success");};
  const importLocal=file=>{const r=new FileReader();r.onload=async e=>{try{const{data:d}=await decryptObj(e.target.result,password);addToast?.("Backup verificado com sucesso!","success");setMsg("Backup verificado!");}catch{addToast?.("Arquivo inválido ou senha incorreta.","error");}};r.readAsText(file);};

  return(
    <Modal title="Backup dos Dados" onClose={onClose} fullHeight>
      <div style={{background:`linear-gradient(135deg,${C.purpleLight},${C.blueLight})`,borderRadius:14,padding:16,textAlign:"center",marginBottom:20}}>
        <p style={{margin:0,fontSize:28}}>🌿</p>
        <p style={{margin:"6px 0 2px",fontSize:15,fontWeight:700,color:C.text}}>{profile.name}</p>
        <p style={{margin:0,fontSize:12,color:C.textMid}}>{totalDays} Dias · {totalMoments} momentos</p>
      </div>

      {snapshots.length>0&&(
        <div style={{background:C.greenLight,borderRadius:12,padding:"12px 14px",marginBottom:16,border:`1px solid ${C.green}44`}}>
          <p style={{margin:"0 0 4px",fontSize:13,fontWeight:600,color:C.green}}>✅ Histórico protegido automaticamente</p>
          <p style={{margin:0,fontSize:12,color:C.textMid}}>Você tem snapshots mensais de: {snapshots.map(s=>s.ym).join(", ")}</p>
        </div>
      )}

      <p style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:10}}>☁️ Google Drive</p>
      {!driveToken&&<Btn onClick={connectDrive} disabled={status==="connecting"} style={{marginBottom:10}}>{status==="connecting"?<><Spinner size={16} color="#fff"/>Conectando…</>:"Conectar Google Drive"}</Btn>}
      {driveToken&&<div style={{display:"flex",gap:8,marginBottom:10}}><Btn onClick={uploadDrive} disabled={status==="uploading"} style={{flex:1,fontSize:13,padding:"11px 0"}}>{status==="uploading"?<><Spinner size={14} color="#fff"/>Salvando…</>:"↑ Salvar"}</Btn><button onClick={()=>{safeLS.del(GDRIVE_KEY);setDriveToken(null);}} style={{padding:"0 12px",background:"none",border:`1px solid ${C.cardBorder}`,borderRadius:10,color:C.textLight,cursor:"pointer",fontSize:12}}>Sair</button></div>}

      <div style={{height:1,background:C.cardBorder,margin:"16px 0"}}/>
      <p style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:10}}>📁 Arquivo local</p>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <Btn onClick={exportLocal} style={{flex:1,fontSize:13,padding:"11px 0"}}>↓ Exportar .veeda</Btn>
        <Btn onClick={()=>fileRef.current.click()} variant="outline" style={{flex:1,fontSize:13,padding:"11px 0"}}>↑ Importar .veeda</Btn>
      </div>
      <input ref={fileRef} type="file" accept=".veeda,.txt" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)importLocal(f);e.target.value="";}}/>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// SETTINGS / DASHBOARD
// ═══════════════════════════════════════════════════
function SettingsModal({profile,data,password,onUpdateProfile,onSave,onLogout,onClose,addToast}){
  const [showBackup,setShowBackup]=useState(false);
  const [showCode,setShowCode]=useState(false);
  const [showHandle,setShowHandle]=useState(false);
  const [handleInput,setHandleInput]=useState((profile.handle||nameToHandle(profile.name)).replace(/^@/,""));
  const [handleErr,setHandleErr]=useState("");
  const [tab,setTab]=useState("conta");

  const saveHandle=()=>{
    const h=sanitizeHandle(handleInput);
    if(h.length<3){setHandleErr("Mínimo 3 caracteres.");return;}
    if(!/^[a-z0-9_]+$/.test(h)){setHandleErr("Use apenas letras, números e _.");return;}
    if(!isHandleAvailable("@"+h,profile.id)){setHandleErr("Este @handle já está em uso.");return;}
    const ps=loadProfiles();const idx=ps.findIndex(p=>p.id===profile.id);
    if(idx>=0){ps[idx].handle="@"+h;saveProfiles(ps);registryUpdate({...ps[idx]});onUpdateProfile({...profile,handle:"@"+h});}
    addToast?.("@handle atualizado!","success");
    setShowHandle(false);
  };

  const totalDays=Object.keys(data.moments||{}).filter(d=>(data.moments[d]||[]).length>0).length;
  const totalMoments=Object.values(data.moments||{}).reduce((s,m)=>s+(m||[]).length,0);

  return(
    <>
      {showBackup&&<BackupModal data={data} profile={profile} password={password} onClose={()=>setShowBackup(false)} addToast={addToast}/>}
      {showCode&&<ConnectionCodeModal profile={profile} onClose={()=>setShowCode(false)}/>}

      <Modal title="Configurações" onClose={onClose} fullHeight>
        {/* Profile Card */}
        <div style={{textAlign:"center",paddingBottom:20,marginBottom:16,borderBottom:`1px solid ${C.headerBorder}`}}>
          <AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor||C.purpleLight} size={68} ring/>
          <p style={{margin:"10px 0 2px",fontSize:16,fontWeight:700,color:C.text,fontFamily:PASSO}}>{profile.name}</p>
          <p style={{margin:"0 0 2px",fontSize:13,color:C.purple,fontWeight:600}}>{profile.handle||nameToHandle(profile.name)}</p>
          {profile.email&&<p style={{margin:0,fontSize:12,color:C.textLight}}>{profile.email}</p>}
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:10,flexWrap:"wrap"}}>
            <span style={{padding:"3px 10px",background:C.purpleLight,borderRadius:20,fontSize:11,color:C.purple}}>{totalDays} dias</span>
            <span style={{padding:"3px 10px",background:C.greenLight,borderRadius:20,fontSize:11,color:C.green}}>{totalMoments} momentos</span>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
          {[["conta","Conta"],["dados","Meus Dados"],["notif","Notif."],["sobre","Sobre"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 14px",background:tab===k?C.purple:C.purpleLight,color:tab===k?C.white:C.purple,border:"none",borderRadius:20,fontWeight:600,cursor:"pointer",fontSize:12,flexShrink:0}}>{l}</button>
          ))}
        </div>

        {tab==="conta"&&<div>
          {/* ── Conta Google / Nuvem ── */}
          {(profile.cloud||getCachedUser())&&<div style={{background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"14px 16px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              {getCachedUser()?.picture?<img src={getCachedUser().picture} alt="" style={{width:36,height:36,borderRadius:"50%"}}/>:<div style={{width:36,height:36,borderRadius:"50%",background:C.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>☁️</div>}
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:11,color:C.textMid,fontWeight:600,letterSpacing:".3px",textTransform:"uppercase"}}>Conta Google {profile.cloud?"· Nuvem ativa":""}</p>
                <p style={{margin:"2px 0 0",fontSize:13,color:C.text,fontWeight:500}}>{getCachedUser()?.email||profile.email||"—"}</p>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {profile.cloud&&<button onClick={async()=>{
                const t=await cloudSync.tokenOrNull();
                if(!t){addToast?.("Faça login no Google novamente.","error");return;}
                await cloudSync.flushAll();
                const enc=safeLS.raw(`veeda_data_${profile.id}`);
                if(enc){try{await cloudData.save(profile.id,enc,t);addToast?.("Sincronizado com a nuvem ☁️","success");}catch{addToast?.("Falha ao sincronizar.","error");}}
              }} style={{flex:1,minWidth:120,padding:"9px 12px",background:C.purpleLight,color:C.purple,border:`1px solid ${C.purple}44`,borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600}}>☁️ Sincronizar agora</button>}
              <button onClick={()=>{
                clearGoogleAuth();
                addToast?.("Google desconectado. Seus dados locais continuam salvos.","info");
                onLogout();onClose();
              }} style={{flex:1,minWidth:120,padding:"9px 12px",background:"#fff",color:C.textMid,border:`1px solid ${C.cardBorder}`,borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600}}>Sair do Google</button>
            </div>
            <p style={{margin:"10px 0 0",fontSize:11,color:C.textLight,lineHeight:1.5}}>{profile.cloud?"Seus dias são enviados cifrados ao Google Drive (pasta privada do app). Só você, com sua senha, consegue ler.":"Este perfil é local. Entre com o Google para habilitar a nuvem."}</p>
          </div>}

          {showHandle?(
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:C.textMid,display:"block",marginBottom:6}}>Novo @handle</label>
              <div style={{position:"relative",marginBottom:handleErr?6:12}}>
                <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",color:C.purple,fontWeight:700,pointerEvents:"none"}}>@</span>
                <input value={handleInput} onChange={e=>{setHandleInput(sanitizeHandle(e.target.value));setHandleErr("");}} style={{paddingLeft:28}} autoFocus/>
              </div>
              {handleErr&&<p style={{fontSize:12,color:C.red,margin:"0 0 10px"}}>{handleErr}</p>}
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={saveHandle} style={{flex:1,fontSize:13,padding:"10px 0"}}>Salvar</Btn>
                <Btn onClick={()=>setShowHandle(false)} variant="ghost" style={{flex:1}}>Cancelar</Btn>
              </div>
            </div>
          ):(
            <div>
              {[{label:"@handle",val:profile.handle||nameToHandle(profile.name),action:()=>setShowHandle(true)},{label:"E-mail",val:profile.email||"—"},{label:"Código de Conexão",val:"Compartilhar",action:()=>setShowCode(true)},{label:"Backup / Restaurar",val:"→",action:()=>setShowBackup(true)}].map((row,i,arr)=>(
                <div key={row.label}>
                  <button onClick={row.action} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:i===0?"14px 14px 0 0":i===arr.length-1?"0 0 14px 14px":"0",borderTop:i>0?"none":"",cursor:row.action?"pointer":"default",textAlign:"left"}}>
                    <span style={{fontSize:14,color:C.text}}>{row.label}</span>
                    <span style={{fontSize:13,color:row.action?C.purple:C.textLight}}>{row.val}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{marginTop:16}}>
            <Btn onClick={()=>{onLogout();onClose();}} variant="danger">Sair da conta</Btn>
          </div>
        </div>}

        {tab==="dados"&&<div>
          <div style={{background:C.purpleLight,borderRadius:14,padding:16,marginBottom:16}}>
            <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:C.text}}>Histórico do mês atual</p>
            <p style={{margin:0,fontSize:12,color:C.textMid,lineHeight:1.6}}>Seus dados são salvos automaticamente a cada ação e protegidos por snapshots mensais. Nenhum dado do mês atual é perdido sem confirmação.</p>
          </div>
          <div style={{background:C.greenLight,borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.green}44`}}>
            <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:C.green}}>✅ Dados protegidos {profile.cloud?"local + nuvem":"localmente"}</p>
            <p style={{margin:0,fontSize:12,color:C.textMid,lineHeight:1.6}}>Todos os seus {totalMoments} momentos estão seguros{profile.cloud?" no seu dispositivo e na sua conta Google (cifrados).":" no seu dispositivo. Use o Backup para proteger também em caso de troca de celular."}</p>
          </div>
          {/* Backups preservados (regra de ouro: nunca apagamos sem confirmação) */}
          {(()=>{const bkps=listPreservedBackups();if(!bkps.length)return null;return(
            <div style={{background:C.amberLight,borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${C.amber}44`}}>
              <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:C.amber}}>📦 {bkps.length} backup(s) preservado(s) de versões anteriores</p>
              <p style={{margin:"0 0 10px",fontSize:12,color:C.textMid,lineHeight:1.6}}>Toda vez que o app fez uma migração importante (ex.: ativação da nuvem), uma cópia dos dados antigos foi guardada localmente. Estes backups nunca são apagados automaticamente.</p>
              {bkps.slice(0,3).map(b=>(
                <div key={b.key} style={{fontSize:11,color:C.textMid,padding:"4px 0",borderTop:`1px dashed ${C.amber}33`}}>{new Date(b.ts).toLocaleString("pt-BR")} · {b.label} · {b.size} chave(s)</div>
              ))}
            </div>
          );})()}
          <Btn onClick={()=>setShowBackup(true)}>Gerenciar Backup</Btn>
        </div>}

        {tab==="notif"&&<div>
          <div style={{background:C.purpleLight,borderRadius:14,padding:16,marginBottom:16}}>
            <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:C.text}}>Notificações</p>
            <p style={{margin:"0 0 12px",fontSize:12,color:C.textMid,lineHeight:1.6}}>Receba alertas quando alguém compartilhar o dia com você e para seus lembretes.</p>
            <Btn onClick={async()=>{const ok=await requestNotifPermission();addToast?.(ok?"Notificações ativadas! 🔔":"Permissão negada.",ok?"success":"error");}}>🔔 Ativar notificações</Btn>
          </div>
          <Btn onClick={()=>{onSave({...data,reminders:[]});addToast?.("Lembretes limpos.","info");}} variant="outline">Limpar lembretes</Btn>
        </div>}

        {tab==="sobre"&&<div>
          <div style={{background:`linear-gradient(135deg,${C.purpleLight},${C.blueLight})`,borderRadius:14,padding:20,textAlign:"center",marginBottom:16}}>
            <p style={{fontFamily:PASSO,fontSize:32,fontWeight:700,color:C.purple,margin:"0 0 4px"}}>Veeda</p>
            <p style={{fontSize:12,color:C.textMid,margin:0}}>v{APP_VERSION} — Dias de Vida</p>
          </div>
          <p style={{fontSize:13,color:C.textMid,lineHeight:1.7,marginBottom:16}}>Veeda nasce da crença de que a vida não cabe em um feed. Viva primeiro, registre, compartilhe depois com quem realmente importa. Seus dados ficam sempre no seu dispositivo.</p>
        </div>}
      </Modal>
    </>
  );
}
