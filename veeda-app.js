// ═══════════════════════════════════════════════════════════
// VEEDA MAIN APP — veeda-app.js
// Edite este arquivo para: VeedaApp (componente principal),
// Veeda root, ReactDOM.createRoot, Service Worker PWA
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
function VeedaApp({profile,password,onLogout,onUpdateProfile}){
  const {addToast,ToastContainer}=useToast();
  const dataKey=`veeda_data_${profile.id}`;

  // ── State ──────────────────────────────────────
  const [data,setData]=useState(null);
  const [hydratedData,setHydratedData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("hoje");
  const [dayOffset,setDayOffset]=useState(0);
  const [addType,setAddType]=useState("texto");
  const [addContent,setAddContent]=useState("");
  const [addCaption,setAddCaption]=useState("");
  const [addMedia,setAddMedia]=useState(null);
  const [addTags,setAddTags]=useState([]);
  const [addLocation,setAddLocation]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [showMusicPicker,setShowMusicPicker]=useState(false);
  const [showDrawing,setShowDrawing]=useState(false);
  const [showVoice,setShowVoice]=useState(false);
  const [showEditDay,setShowEditDay]=useState(false);
  const [showFeeling,setShowFeeling]=useState(false);
  const [showAvatar,setShowAvatar]=useState(false);
  const [showInvite,setShowInvite]=useState(false);
  const [showInviteApp,setShowInviteApp]=useState(false);
  const [showGroupName,setShowGroupName]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const [showReminders,setShowReminders]=useState(false);
  const [showEvents,setShowEvents]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [viewRec,setViewRec]=useState(null);
  const [pendingNotif,setPendingNotif]=useState(null);
  const [expandedMoment,setExpandedMoment]=useState(null);
  const [newGroup,setNewGroup]=useState("");
  const [lastId,setLastId]=useState(null);
  const [now,setNow]=useState(new Date());
  const [unreadCount,setUnreadCount]=useState(0);
  const [pendingAddCode,setPendingAddCode]=useState(null);

  const sessionKey=useRef(null);
  const sessionSalt=useRef(null);
  const vidRef=useRef(),photoRef=useRef(),galleryRef=useRef(),lastRef=useRef(null),touchX=useRef(null);

  // ── Data load ──────────────────────────────────
  useEffect(()=>{
    (async()=>{
      try{
        const raw=safeLS.raw(dataKey);
        if(raw){
          try{
            const{key,salt,data:d}=await decryptObj(raw,password);
            sessionKey.current=key;sessionSalt.current=salt;
            setData(migrateData(d));
          }catch(decErr){
            const snap=await loadLatestSnapshot(profile.id,password);
            if(snap){
              sessionKey.current=snap.key;sessionSalt.current=snap.salt;
              setData(migrateData(snap.data));
              addToast?.("Dados recuperados do snapshot mensal ✅","success");
            } else { throw decErr; }
          }
        } else {
          const d=EMPTY_DATA();
          const enc=await encryptObj(d,password);
          const{key,salt}=await decryptObj(enc,password);
          sessionKey.current=key;sessionSalt.current=salt;
          setData(d);
          safeLS.rawSet(dataKey,enc);
          saveMonthlySnapshot(profile.id,enc);
        }
      }catch{setData(EMPTY_DATA());}
      setLoading(false);
    })();
    const t=setInterval(()=>setNow(new Date()),30000);
    // Listen for cross-tab inbox updates
    const onStorage=e=>{
      const myH=(profile.handle||nameToHandle(profile.name)).replace(/^@/,"");
      if(e.key===`veeda_inbox_${myH}`||e.key===`veeda_inbox_${profile.id}`){checkInbox();}
    };
    window.addEventListener("storage",onStorage);
    return()=>{clearInterval(t);window.removeEventListener("storage",onStorage);};
  },[]);

  const checkInbox=useCallback(()=>{
    if(!data)return;
    const myH=(profile.handle||nameToHandle(profile.name)).replace(/^@/,"");
    for(const k of[`veeda_inbox_${myH}`,`veeda_inbox_${profile.id}`]){
      const inbox=safeLS.get(k,[]);
      if(inbox.length>0){
        const notif=inbox[0];
        if(!(data.received||[]).find(r=>r.date===notif.date&&r.author===notif.author&&r.importedAt===notif.importedAt)){
          setPendingNotif(notif);
          setUnreadCount(c=>c+1);
          showNativeNotif("Veeda",`${notif.author} compartilhou o dia com você! 🌿`);
          break;
        }
      }
    }
  },[data,profile]);

  useEffect(()=>{if(data&&!loading)checkInbox();},[data,loading]);

  // Pending add from invite link (?add=vc2_…)
  useEffect(()=>{
    if(!data||loading)return;
    const pending=sessionStorage.getItem("veeda_pending_add");
    if(pending){
      sessionStorage.removeItem("veeda_pending_add");
      setPendingAddCode(pending);
      setShowInvite(true);
    }
  },[data,loading]);

  // Monthly snapshot on every save
  const save=useCallback(async d=>{
    const lightweight={...d,moments:{}};
    Object.keys(d.moments||{}).forEach(day=>{
      lightweight.moments[day]=(d.moments[day]||[]).map(m=>{
        if((m.type==="foto"||m.type==="video"||m.type==="arte")&&m.content?.startsWith("data:")){
          idbSave(`${m.id}`,m.content);
          return{...m,content:"IDB:"+m.id};
        }
        return m;
      });
    });
    setData(d);
    let enc;
    if(sessionKey.current&&sessionSalt.current){
      enc=await encryptFast(lightweight,sessionKey.current,sessionSalt.current);
    } else {
      enc=await encryptObj(lightweight,password);
    }
    safeLS.rawSet(dataKey,enc);
    saveMonthlySnapshot(profile.id,enc);
  },[dataKey,password,profile.id]);

  // Hydrate IDB media
  useEffect(()=>{
    if(!data)return;
    let cancelled=false;
    (async()=>{
      const hd={...data,moments:{}};
      for(const day of Object.keys(data.moments||{})){
        hd.moments[day]=await Promise.all((data.moments[day]||[]).map(async m=>{
          if(m.content?.startsWith("IDB:")){const u=await idbLoad(m.content.slice(4));return u?{...m,content:u}:m;}
          return m;
        }));
      }
      if(!cancelled)setHydratedData(hd);
    })();
    return()=>{cancelled=true;};
  },[data]);

  const activeData=hydratedData||data;

  // ── ALL hooks before any early return ──────────
  const curDay=useMemo(()=>offsetDay(todayStr(),-dayOffset),[dayOffset]);
  const isToday=dayOffset===0;
  const nowKey=useMemo(()=>`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,[now]);

  const moments=useMemo(()=>{
    if(!activeData)return[];
    return((activeData.moments||{})[curDay]||[]).slice().sort((a,b)=>a.ts-b.ts);
  },[activeData,curDay]);

  const upcoming=useMemo(()=>{
    if(!activeData)return[];
    return(activeData.events||[]).filter(e=>e.date>=todayStr()).sort((a,b)=>a.date.localeCompare(b.date));
  },[activeData]);

  const slots=useMemo(()=>{
    const by={};
    moments.forEach(m=>{const k=fmt(m.ts);if(!by[k])by[k]=[];by[k].push(m);});
    const times=new Set(Object.keys(by));
    if(isToday)times.add(nowKey);
    return Array.from(times).sort().map(t=>({time:t,moments:by[t]||[],isNow:isToday&&t===nowKey}));
  },[moments,isToday,nowKey]);

  const dayColor=useMemo(()=>DAY_COLORS.find(c=>c.label===(activeData?.dayColors||{})[curDay])||DAY_COLORS[0],[activeData,curDay]);
  const feeling=useMemo(()=>(activeData?.dayFeelings||{})[curDay],[activeData,curDay]);
  const group=activeData?.groupName||"Meu Círculo";
  const lastMId=moments.length>0?moments[moments.length-1].id:null;

  const resetModal=useCallback(()=>{setAddContent("");setAddCaption("");setAddMedia(null);setAddTags([]);setAddLocation(null);setShowModal(false);setShowMusicPicker(false);},[]);
  const readFile=(f,cb)=>{const r=new FileReader();r.onload=e=>cb(e.target.result);r.readAsDataURL(f);};

  const clearInbox=useCallback(notif=>{
    const myH=(profile.handle||nameToHandle(profile.name)).replace(/^@/,"");
    [`veeda_inbox_${myH}`,`veeda_inbox_${profile.id}`].forEach(k=>{
      const inbox=safeLS.get(k,[]);
      safeLS.set(k,inbox.filter(x=>!(x.date===notif.date&&x.author===notif.author&&x.importedAt===notif.importedAt)));
    });
  },[profile]);

  const acceptNotif=useCallback(async()=>{
    if(!pendingNotif||!data)return;
    clearInbox(pendingNotif);
    await save({...data,received:[...(data.received||[]),pendingNotif]});
    setPendingNotif(null);setUnreadCount(0);
    setView("recebidos");setViewRec(pendingNotif);
  },[pendingNotif,data,clearInbox,save]);

  const dismissNotif=useCallback(()=>{if(!pendingNotif)return;clearInbox(pendingNotif);setPendingNotif(null);},[pendingNotif,clearInbox]);

  const addMoment=useCallback((extra={})=>{
    if(!data)return;
    const isMedia=addType==="foto"||addType==="video";
    if(isMedia&&!addMedia)return;
    if(addType==="musica"&&!extra.trackTitle&&!addContent.trim())return;
    if(!isMedia&&addType!=="musica"&&addType!=="arte"&&addType!=="voz"&&!addContent.trim())return;
    let type=addType,content=isMedia?addMedia:addContent.trim();
    if(type==="link"&&isVideoLink(content))type="videolink";
    const id=Date.now();
    const m={id,ts:id,type,content,caption:addCaption.trim()||undefined,tags:addTags.length?addTags:undefined,location:addLocation||undefined,...extra};
    save({...data,moments:{...(data.moments||{}),[todayStr()]:[...((data.moments||{})[todayStr()]||[]),m]}});
    resetModal();setLastId(id);
  },[addType,addMedia,addContent,addCaption,addTags,addLocation,data,save,resetModal]);

  const delMoment=useCallback((day,id)=>{
    if(!data)return;
    save({...data,moments:{...(data.moments||{}),[day]:((data.moments||{})[day]||[]).filter(m=>m.id!==id)}});
  },[data,save]);

  const updateAv=useCallback(updated=>{
    const ps=loadProfiles();const idx=ps.findIndex(p=>p.id===updated.id);
    if(idx>=0){ps[idx]={...ps[idx],...updated};saveProfiles(ps);registryUpdate(ps[idx]);onUpdateProfile(updated);}
  },[onUpdateProfile]);

  // Scroll to last added moment
  useEffect(()=>{
    if(lastId&&lastRef.current){setTimeout(()=>lastRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),150);setLastId(null);}
  },[lastId,data]);

  // ── Early return after all hooks ──────────────
  if(loading||!activeData){
    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg}}>
        <Spinner size={32} color={C.purple}/>
        <p style={{marginTop:16,fontSize:13,color:C.textMid}}>Carregando seus dias…</p>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────
  return(
    <div style={{maxWidth:480,margin:"0 auto",background:`linear-gradient(180deg,${dayColor.bg} 0%,${C.bgGradEnd} 100%)`,minHeight:"100vh",fontFamily:SANS}}>
      <ToastContainer/>
      {pendingNotif&&<ReceivedNotif notif={pendingNotif} onOpen={acceptNotif} onDismiss={dismissNotif}/>}
      {showDrawing&&<DrawingCanvas onClose={()=>setShowDrawing(false)} onSave={dataUrl=>{setShowDrawing(false);const id=Date.now();const m={id,ts:id,type:"arte",content:dataUrl,caption:addCaption.trim()||undefined,location:addLocation||undefined};save({...data,moments:{...(data.moments||{}),[todayStr()]:[...((data.moments||{})[todayStr()]||[]),m]}});setLastId(id);setAddCaption("");setAddLocation(null);}}/>}
      {expandedMoment&&<MomentDetail m={expandedMoment} onClose={()=>setExpandedMoment(null)} onDelete={()=>{delMoment(curDay,expandedMoment.id);setExpandedMoment(null);}}/>}

      {/* ── Header ── */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.headerBorder}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px 6px"}}>
          <span style={{fontFamily:PASSO,fontSize:18,fontWeight:700,color:C.purple}}>🌿 Veeda</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setShowInviteApp(true)} style={{background:C.purpleLight,border:"none",borderRadius:20,padding:"5px 12px",fontSize:12,color:C.tabActive,fontWeight:600,cursor:"pointer"}}>+ Convidar</button>
            <button onClick={()=>setShowSettings(true)} style={{background:"none",border:"none",fontSize:20,color:C.textLight,cursor:"pointer",lineHeight:1}}>⚙️</button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0 10px",borderBottom:`1px solid ${C.headerBorder}`,cursor:"pointer"}} onClick={()=>view==="hoje"&&setShowAvatar(true)}>
          <AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor||C.purpleLight} size={64} ring/>
          <p style={{margin:"8px 0 0",fontSize:14,fontWeight:600,color:C.text,fontFamily:PASSO}}>{profile.name}</p>
          <p style={{margin:"2px 0 0",fontSize:12,color:C.purple,fontWeight:600}}>{profile.handle||nameToHandle(profile.name)}</p>
          {feeling&&<div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:6,background:C.purpleLight,borderRadius:20,padding:"3px 12px"}}><span style={{fontSize:13}}>{feeling.emoji}</span><span style={{fontSize:11,color:C.tabActive,fontWeight:500}}>{feeling.label}</span></div>}
          {view==="hoje"&&<span style={{fontSize:11,color:C.textLight,marginTop:4}}>toque para editar perfil</span>}
        </div>
        <div style={{display:"flex",padding:"0 4px",overflowX:"auto"}}>
          {[["hoje","Hoje"],["grupo",group],["recebidos",unreadCount>0?`Recebidos (${unreadCount})`:"Recebidos"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setView(v);if(v==="recebidos")setUnreadCount(0);}} style={{padding:"10px 14px",fontSize:13,fontWeight:view===v?600:400,background:"none",border:"none",borderBottom:`2.5px solid ${view===v?C.tabActive:"transparent"}`,color:view===v?C.tabActive:C.textMid,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{paddingBottom:120}}>
        {/* HOJE */}
        {view==="hoje"&&(
          <div onTouchStart={e=>{touchX.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touchX.current==null)return;const dx=touchX.current-e.changedTouches[0].clientX;if(Math.abs(dx)>55){dx>0?setDayOffset(o=>o+1):setDayOffset(o=>Math.max(0,o-1));}touchX.current=null;}}>
            {/* Day nav */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 4px 2px"}}>
              <button onClick={()=>setDayOffset(o=>o+1)} style={{background:"none",border:"none",fontSize:24,color:C.textMid,cursor:"pointer",padding:"4px 12px",fontFamily:PASSO}}>‹</button>
              <p style={{margin:0,fontSize:12,color:C.textLight,textAlign:"center"}}>{fmtFull(curDay)}</p>
              <button onClick={()=>setDayOffset(o=>Math.max(0,o-1))} style={{background:"none",border:"none",fontSize:24,color:dayOffset===0?"transparent":C.textMid,cursor:dayOffset===0?"default":"pointer",padding:"4px 12px",pointerEvents:dayOffset===0?"none":"auto",fontFamily:PASSO}}>›</button>
            </div>
            {/* Day pills */}
            <div style={{display:"flex",gap:6,padding:"6px 16px 10px",justifyContent:"center",flexWrap:"wrap"}}>
              {[["🎨 cor",()=>setShowEditDay(true),""],["",()=>setShowFeeling(true),feeling?`${feeling.emoji} ${feeling.label}`:"😊 sentimento"],["🔔",()=>setShowReminders(true),""],["📅",()=>setShowEvents(true),upcoming.length>0?`📅 (${upcoming.length})`:"📅"]].map(([icon,action,label],i)=>(
                <button key={i} onClick={action} style={{fontSize:12,padding:"4px 12px",background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:20,color:C.textMid,cursor:"pointer",fontFamily:SANS}}>{label||icon}</button>
              ))}
            </div>
            {isToday&&<p style={{textAlign:"center",fontSize:11,color:C.textLight,margin:"0 0 4px"}}>← deslize para dias anteriores</p>}
            {isToday&&upcoming[0]&&<div style={{margin:"0 16px 10px",background:C.amberLight,border:`1px solid ${C.amber}44`,borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>{EVENT_TYPES.find(t=>t.id===upcoming[0].type)?.emoji||"📅"}</span>
              <div><p style={{margin:0,fontSize:13,fontWeight:600,color:C.amber}}>{upcoming[0].title}</p><p style={{margin:0,fontSize:11,color:C.textMid}}>{fmtLabel(upcoming[0].date)}{upcoming[0].time?` às ${upcoming[0].time}`:""}</p></div>
            </div>}

            {/* TIMELINE */}
            <div style={{position:"relative",padding:"16px 0 24px"}}>
              {slots.length>0&&<div style={{position:"absolute",left:"50%",top:0,bottom:0,width:3,borderRadius:3,background:`linear-gradient(to bottom,${dayColor.dot}44,${dayColor.dot} 30%,${C.blueMid} 70%,${C.blueLight})`,transform:"translateX(-50%)",zIndex:0}}/>}
              {slots.length===0&&<div style={{textAlign:"center",padding:"3rem 1.5rem"}}><div style={{fontSize:48,marginBottom:12}}>🌿</div><p style={{fontSize:14,color:C.textLight,margin:0}}>{isToday?"Registre o primeiro momento do seu dia.":"Nenhum momento registrado neste dia."}</p></div>}
              {slots.map((slot,i)=>{
                const isLeft=i%2===0;
                return(
                  <div key={slot.time} style={{position:"relative",display:"flex",alignItems:"flex-start",marginBottom:30,zIndex:1}}>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"flex-end",paddingRight:20,paddingLeft:10,gap:6}}>
                      {isLeft&&(slot.isNow
                        ?<button onClick={()=>setShowModal(true)} style={{background:C.white,border:`2px solid ${dayColor.dot}`,borderRadius:20,padding:"10px 16px",fontSize:12,color:C.purple,cursor:"pointer",fontWeight:600,lineHeight:1.45,textAlign:"center",maxWidth:148}}>registrar<br/>acontecimento</button>
                        :slot.moments.map(m=><div key={m.id} ref={m.id===lastMId&&lastId===null?lastRef:null}><MomentCircle m={m} isNew={m.id===lastMId&&lastId===null} onTap={()=>setExpandedMoment(m)}/><span style={{display:"block",textAlign:"right",fontSize:10,color:C.textLight,marginTop:2}}>{fmt(m.ts)}</span></div>)
                      )}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,zIndex:2}}>
                      {slot.isNow?<PulsingDot onClick={()=>setShowModal(true)} color={dayColor.dot}/>:<div style={{width:12,height:12,borderRadius:"50%",background:dayColor.dot,border:`2.5px solid ${C.white}`,boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}/>}
                      <span style={{fontSize:9,color:C.textLight,marginTop:3,whiteSpace:"nowrap"}}>{slot.time}</span>
                    </div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"flex-start",paddingLeft:20,paddingRight:10,gap:6}}>
                      {!isLeft&&(slot.isNow
                        ?<button onClick={()=>setShowModal(true)} style={{background:C.white,border:`2px solid ${dayColor.dot}`,borderRadius:20,padding:"10px 16px",fontSize:12,color:C.purple,cursor:"pointer",fontWeight:600,lineHeight:1.45,textAlign:"center",maxWidth:148}}>registrar<br/>acontecimento</button>
                        :slot.moments.map(m=><div key={m.id} ref={m.id===lastMId&&lastId===null?lastRef:null}><MomentCircle m={m} isNew={m.id===lastMId&&lastId===null} onTap={()=>setExpandedMoment(m)}/><span style={{display:"block",fontSize:10,color:C.textLight,marginTop:2}}>{fmt(m.ts)}</span></div>)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MEU CÍRCULO */}
        {view==="grupo"&&<div style={{padding:"20px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <p style={{margin:0,fontSize:16,fontWeight:700,color:C.text,fontFamily:PASSO}}>{group}</p>
            <button onClick={()=>{setNewGroup(group);setShowGroupName(true);}} style={{fontSize:12,color:C.purple,background:"none",border:"none",cursor:"pointer"}}>renomear</button>
          </div>
          <Btn onClick={()=>setShowInvite(true)} style={{marginBottom:20}}>+ Adicionar ao Círculo</Btn>
          {(!activeData.contacts||activeData.contacts.length===0)
            ?<div style={{textAlign:"center",padding:"2rem 0"}}><div style={{fontSize:52,marginBottom:12}}>👥</div><p style={{fontSize:14,color:C.textLight,marginBottom:16}}>Nenhum contato ainda.</p><button onClick={()=>setShowInviteApp(true)} style={{background:"none",border:`1.5px solid ${C.purple}`,borderRadius:20,padding:"9px 20px",color:C.purple,cursor:"pointer",fontSize:13,fontWeight:600}}>Convidar para o Veeda</button></div>
            :activeData.contacts.map((c,i)=>(
              <div key={i} style={{background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"14px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
                <AvatarBubble src={c.avatarSrc} emoji={c.emoji||"🌿"} color={c.avatarColor||C.purpleLight} size={44}/>
                <div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{c.name}</p><p style={{margin:0,fontSize:12,color:C.purple,fontWeight:500}}>{c.handle}</p></div>
                <button onClick={()=>{const nc=[...activeData.contacts];nc.splice(i,1);save({...data,contacts:nc});}} style={{fontSize:12,color:C.textLight,background:"none",border:"none",cursor:"pointer",padding:"6px"}}>remover</button>
              </div>
            ))
          }
        </div>}

        {/* RECEBIDOS */}
        {view==="recebidos"&&!viewRec&&<div style={{padding:"20px 16px"}}>
          <p style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16,fontFamily:PASSO}}>Dias recebidos</p>
          {(activeData.received||[]).length===0
            ?<div style={{textAlign:"center",padding:"2rem 0"}}><div style={{fontSize:52,marginBottom:12}}>💌</div><p style={{fontSize:14,color:C.textLight}}>Nenhum Dia de Veeda recebido ainda.</p></div>
            :(activeData.received||[]).slice().sort((a,b)=>b.importedAt-a.importedAt).map((r,i)=>(
              <div key={i} onClick={()=>setViewRec(r)} style={{background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                <AvatarBubble src={r.avatarSrc} emoji={r.emoji||"🌿"} color={r.avatarColor||C.purpleLight} size={44} ring/>
                <div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{r.author}</p><p style={{margin:0,fontSize:12,color:C.textMid}}>{fmtLabel(r.date)} · {r.moments.length} momento{r.moments.length!==1?"s":""}{r.feeling?` · ${r.feeling.emoji}`:""}</p></div>
                <span style={{color:C.textLight,fontSize:22}}>›</span>
              </div>
            ))
          }
        </div>}

        {view==="recebidos"&&viewRec&&(
          <div style={{paddingBottom:20}}>
            <div style={{background:C.white,borderBottom:`1px solid ${C.headerBorder}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"18px 16px 14px"}}>
              <AvatarBubble src={viewRec.avatarSrc} emoji={viewRec.emoji||"🌿"} color={viewRec.avatarColor||C.purpleLight} size={70} ring/>
              <p style={{margin:"10px 0 2px",fontSize:16,fontWeight:700,color:C.text,fontFamily:PASSO}}>{viewRec.author}</p>
              <p style={{margin:0,fontSize:12,color:C.textLight}}>Dia de Veeda · {fmtFull(viewRec.date)}</p>
              {viewRec.feeling&&<div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,background:C.purpleLight,borderRadius:20,padding:"4px 12px"}}><span>{viewRec.feeling.emoji}</span><span style={{fontSize:11,color:C.tabActive,fontWeight:500}}>{viewRec.feeling.label}</span></div>}
              {viewRec.message&&<div style={{margin:"12px 0 0",background:C.purpleLight,borderRadius:12,padding:"12px 16px",width:"100%",boxSizing:"border-box"}}><p style={{margin:0,fontSize:14,color:C.purple,fontStyle:"italic",lineHeight:1.6}}>"{viewRec.message}"</p></div>}
              <button onClick={()=>setViewRec(null)} style={{marginTop:12,fontSize:13,color:C.textMid,background:"none",border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"6px 18px",cursor:"pointer"}}>‹ Voltar</button>
            </div>
            <div style={{padding:16,display:"flex",flexWrap:"wrap",gap:12}}>
              {(viewRec.moments||[]).slice().sort((a,b)=>a.ts-b.ts).map(m=>(
                <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <MomentCircle m={m} onTap={()=>setExpandedMoment(m)} size={58}/>
                  <span style={{fontSize:10,color:C.textLight}}>{fmt(m.ts)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FAB Buttons ── */}
      {view==="hoje"&&moments.length>0&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"12px 28px 32px",background:`linear-gradient(to top,${dayColor.bg} 60%,transparent)`,pointerEvents:"none"}}>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowModal(true)} style={{width:52,height:52,borderRadius:"50%",background:C.white,border:`1.5px solid ${C.cardBorder}`,fontSize:22,cursor:"pointer",pointerEvents:"auto",boxShadow:"0 4px 16px rgba(0,0,0,.1)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            <button onClick={()=>setShowShare(true)} style={{flex:1,height:52,background:C.purple,color:"#fff",border:"none",borderRadius:50,fontWeight:600,fontSize:14,cursor:"pointer",pointerEvents:"auto",boxShadow:"0 6px 24px rgba(144,0,255,.32)",fontFamily:PASSO}}>Compartilhar meu Dia 🌿</button>
          </div>
        </div>
      )}
      {view==="hoje"&&isToday&&moments.length===0&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"12px 28px 32px",background:`linear-gradient(to top,${dayColor.bg} 60%,transparent)`,pointerEvents:"none"}}>
          <button onClick={()=>setShowModal(true)} style={{width:"100%",padding:"16px 0",background:C.purple,color:"#fff",border:"none",borderRadius:50,fontWeight:600,fontSize:15,cursor:"pointer",pointerEvents:"auto",boxShadow:"0 6px 24px rgba(144,0,255,.32)",fontFamily:PASSO}}>+ Registrar primeiro momento</button>
        </div>
      )}

      {/* ── Modals ── */}
      {showShare&&<ShareDayModal profile={profile} data={activeData} curDay={curDay} onClose={()=>setShowShare(false)} onShared={async log=>{await save({...data,sharedLog:log});}} addToast={addToast}/>}
      {showEvents&&<EventsModal data={activeData} profile={profile} onSave={events=>save({...data,events})} onClose={()=>setShowEvents(false)}/>}
      {showReminders&&<RemindersModal reminders={activeData.reminders||[]} onSave={list=>save({...data,reminders:list})} onClose={()=>setShowReminders(false)}/>}
      {showInviteApp&&<InviteModal onClose={()=>setShowInviteApp(false)}/>}
      {showSettings&&<SettingsModal profile={profile} data={activeData} password={password} onUpdateProfile={p=>{updateAv(p);onUpdateProfile(p);}} onSave={save} onLogout={onLogout} onClose={()=>setShowSettings(false)} addToast={addToast}/>}
      {showMusicPicker&&<MusicPicker onClose={()=>setShowMusicPicker(false)} onSelect={r=>{setShowMusicPicker(false);const id=Date.now();const m={id,ts:id,type:"musica",content:r.title,trackTitle:r.title,trackArtist:r.artist,trackAlbum:r.album,albumArt:r.art,previewUrl:r.preview,appleMusicUrl:r.appleMusicUrl,caption:addCaption.trim()||undefined,location:addLocation||undefined};save({...data,moments:{...(data.moments||{}),[todayStr()]:[...((data.moments||{})[todayStr()]||[]),m]}});setLastId(id);resetModal();}}/>}

      {/* ADD MOMENT MODAL */}
      {showModal&&(
        <Modal title="Registrar acontecimento" onClose={resetModal} fullHeight>
          <div style={{display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
            {[["texto","✏️","texto"],["foto","📷","foto"],["video","🎬","vídeo"],["link","🔗","link"],["musica","🎵","música"],["arte","🎨","arte"],["voz","🎙️","voz"]].map(([t,icon,label])=>{
              const meta=TYPE_META[t];
              return(
                <button key={t} onClick={()=>{setAddType(t);setAddMedia(null);setAddContent("");}}
                  style={{padding:"6px 11px",fontSize:12,background:addType===t?(meta?.bg||C.purpleLight):"#F5F3FB",border:`1.5px solid ${addType===t?(meta?.fill||C.purple):C.cardBorder}`,borderRadius:20,cursor:"pointer",color:addType===t?(meta?.fill||C.purple):C.textMid,fontWeight:addType===t?600:400}}>
                  {icon} {label}
                </button>
              );
            })}
          </div>

          {addType==="foto"&&(!addMedia
            ?<div style={{display:"flex",gap:8,marginBottom:12}}>
              <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,setAddMedia);}}/>
              <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,setAddMedia);}}/>
              <button onClick={()=>photoRef.current.click()} style={{flex:1,padding:"12px 0",background:C.blueLight,color:C.blue,border:`1px solid ${C.blueMid}`,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:500}}>📷 Câmera</button>
              <button onClick={()=>galleryRef.current.click()} style={{flex:1,padding:"12px 0",background:C.purpleLight,color:C.purple,border:`1px solid ${C.purpleMid}`,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:500}}>🖼️ Galeria</button>
            </div>
            :<div style={{marginBottom:12,position:"relative"}}><img src={addMedia} alt="" style={{width:"100%",borderRadius:12,display:"block"}}/><button onClick={()=>setAddMedia(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.5)",border:"none",borderRadius:"50%",width:30,height:30,color:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>
          )}

          {addType==="video"&&(!addMedia
            ?<div style={{display:"flex",gap:8,marginBottom:12}}>
              <input ref={vidRef} type="file" accept="video/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,setAddMedia);}}/>
              <input type="file" accept="video/*" id="gvid_up" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,setAddMedia);}}/>
              <button onClick={()=>vidRef.current.click()} style={{flex:1,padding:"12px 0",background:C.blueLight,color:C.blue,border:`1px solid ${C.blueMid}`,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:500}}>🎥 Gravar</button>
              <button onClick={()=>document.getElementById("gvid_up").click()} style={{flex:1,padding:"12px 0",background:C.purpleLight,color:C.purple,border:`1px solid ${C.purpleMid}`,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:500}}>📁 Galeria</button>
            </div>
            :<div style={{marginBottom:12,position:"relative"}}><video src={addMedia} controls style={{width:"100%",borderRadius:12,maxHeight:240,display:"block"}}/><button onClick={()=>setAddMedia(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.5)",border:"none",borderRadius:"50%",width:30,height:30,color:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>
          )}

          {addType==="musica"&&<div style={{marginBottom:12}}>
            <button onClick={()=>setShowMusicPicker(true)} style={{width:"100%",padding:"14px 0",background:C.greenLight,color:C.green,border:`1px solid ${C.green}44`,borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:600}}>🎵 Buscar música no Apple Music…</button>
          </div>}

          {addType==="arte"&&<div style={{marginBottom:12}}>
            <button onClick={()=>{setShowModal(false);setShowDrawing(true);}} style={{width:"100%",padding:"16px 0",background:C.pinkLight,color:C.pink,border:`1.5px solid ${C.pink}55`,borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:PASSO}}>🎨 Abrir tela de desenho</button>
            <p style={{fontSize:11,color:C.textLight,textAlign:"center",marginTop:6}}>Pincéis, cores, colagem de imagens. Salva como arte na timeline.</p>
          </div>}

          {addType==="voz"&&<div style={{marginBottom:12}}>
            {showVoice
              ?<VoiceRecorder onClose={()=>setShowVoice(false)} onSave={(dataUrl,dur)=>{setShowVoice(false);const id=Date.now();const m={id,ts:id,type:"voz",content:dataUrl,duration:dur,caption:addCaption.trim()||undefined,location:addLocation||undefined};save({...data,moments:{...(data.moments||{}),[todayStr()]:[...((data.moments||{})[todayStr()]||[]),m]}});setLastId(id);resetModal();}}/>
              :<Btn onClick={()=>setShowVoice(true)} variant="teal">🎙️ Iniciar gravação de voz</Btn>
            }
          </div>}

          {(addType==="texto"||addType==="link")&&<textarea value={addContent} onChange={e=>setAddContent(e.target.value)} placeholder={addType==="link"?"Cole o link (YouTube, Vimeo, URL)…":"O que aconteceu? Descreva o momento…"} style={{width:"100%",minHeight:90,marginBottom:12,borderRadius:12,padding:"12px 14px",border:`1px solid ${C.cardBorder}`,fontSize:16,boxSizing:"border-box",fontFamily:SANS}}/>}

          {/* Location picker — for all types except drawing/voice (those save directly) */}
          {addType!=="arte"&&!showVoice&&<LocationPicker value={addLocation} onChange={setAddLocation}/>}

          {addType!=="arte"&&addType!=="musica"&&!showVoice&&<>
            <input value={addCaption} onChange={e=>setAddCaption(e.target.value)} placeholder="Legenda (opcional)" style={{marginBottom:14}}/>
            <div style={{marginBottom:16}}><TagPicker selectedTags={addTags} onChange={setAddTags} customTags={activeData.customTags||[]}/></div>
            <Btn onClick={()=>addMoment()}>Adicionar momento</Btn>
          </>}
        </Modal>
      )}

      {showEditDay&&<Modal title="Cor do dia" onClose={()=>setShowEditDay(false)}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",padding:"8px 0"}}>
          {DAY_COLORS.map(col=><button key={col.label} onClick={()=>{save({...data,dayColors:{...(data.dayColors||{}),[curDay]:col.label}});setShowEditDay(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:8}}><div style={{width:52,height:52,borderRadius:"50%",background:col.bg,border:`3px solid ${col.dot}`,outline:dayColor.label===col.label?`3px solid ${C.purple}`:"none",outlineOffset:2}}/><span style={{fontSize:11,color:C.textMid,fontWeight:500}}>{col.label}</span></button>)}
        </div>
      </Modal>}

      {showFeeling&&<Modal title="Como foi este Dia de Veeda?" onClose={()=>setShowFeeling(false)}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",padding:"8px 0"}}>
          {FEELINGS.map(f=><button key={f.label} onClick={()=>{save({...data,dayFeelings:{...(data.dayFeelings||{}),[curDay]:f}});setShowFeeling(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:feeling?.label===f.label?C.purpleLight:"#F5F3FB",border:`2px solid ${feeling?.label===f.label?C.purple:C.cardBorder}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",minWidth:72}}><span style={{fontSize:30}}>{f.emoji}</span><span style={{fontSize:11,color:C.textMid,fontWeight:500}}>{f.label}</span></button>)}
        </div>
      </Modal>}

      {showAvatar&&<Modal title="Editar perfil" onClose={()=>setShowAvatar(false)}>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input ref={photoRef} type="file" accept="image/*" capture="user" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,src=>updateAv({...profile,avatarSrc:src}));}}/>
          <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,src=>updateAv({...profile,avatarSrc:src}));}}/>
          <button onClick={()=>photoRef.current.click()} style={{flex:1,padding:"10px 0",background:C.blueLight,color:C.blue,border:`1px solid ${C.blueMid}`,borderRadius:10,cursor:"pointer",fontSize:13}}>📷 Câmera</button>
          <button onClick={()=>galleryRef.current.click()} style={{flex:1,padding:"10px 0",background:C.purpleLight,color:C.purple,border:`1px solid ${C.purpleMid}`,borderRadius:10,cursor:"pointer",fontSize:13}}>🖼️ Galeria</button>
          {profile.avatarSrc&&<button onClick={()=>updateAv({...profile,avatarSrc:null})} style={{padding:"10px 12px",background:C.redLight,color:C.red,border:`1px solid ${C.red}44`,borderRadius:10,cursor:"pointer",fontSize:13}}>×</button>}
        </div>
        {!profile.avatarSrc&&<>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>{AVATAR_EMOJIS.map(e=><button key={e} onClick={()=>updateAv({...profile,emoji:e})} style={{fontSize:20,background:profile.emoji===e?C.purpleLight:"#F5F3FB",border:`2px solid ${profile.emoji===e?C.purple:C.cardBorder}`,borderRadius:10,width:44,height:44,cursor:"pointer"}}>{e}</button>)}</div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>{AVATAR_COLORS.map(col=><button key={col} onClick={()=>updateAv({...profile,avatarColor:col})} style={{width:36,height:36,borderRadius:"50%",background:col,border:`3px solid ${profile.avatarColor===col?C.purple:C.cardBorder}`,cursor:"pointer"}}/>)}</div>
        </>}
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor||C.purpleLight} size={64} ring/></div>
        <Btn onClick={()=>setShowAvatar(false)}>Salvar</Btn>
      </Modal>}

      {showInvite&&<Modal title="Adicionar ao Meu Círculo" onClose={()=>{setShowInvite(false);setPendingAddCode(null);}}>
        <AddContactModal contacts={activeData.contacts||[]} myHandle={profile.handle||nameToHandle(profile.name)} prefillCard={pendingAddCode} onAdd={c=>{save({...data,contacts:[...(data.contacts||[]),c]});setShowInvite(false);setPendingAddCode(null);addToast?.(`${c.name} adicionado ao Meu Círculo! 🤝`,"success");}} onClose={()=>{setShowInvite(false);setPendingAddCode(null);}} addToast={addToast}/>
      </Modal>}

      {showGroupName&&<Modal title="Renomear" onClose={()=>setShowGroupName(false)}>
        <input value={newGroup} onChange={e=>setNewGroup(e.target.value)} placeholder="Nome do grupo" style={{marginBottom:16}}/>
        <Btn onClick={()=>{if(newGroup.trim()){save({...data,groupName:newGroup.trim()});setShowGroupName(false);}}}>Salvar</Btn>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════
function Veeda(){
  const [screen,setScreen]=useState("loading");
  const [profiles,setProfiles]=useState([]);
  const [selProfile,setSelProfile]=useState(null);
  const [activeProfile,setActiveProfile]=useState(null);
  const [activePw,setActivePw]=useState(null);
  const [forgotProfile,setForgotProfile]=useState(null);
  const [showGuide,setShowGuide]=useState(false);

  useEffect(()=>{
    // Check URL for add contact intent (?add=vc2_...)
    const params=new URLSearchParams(window.location.search);
    const addCode=params.get("add");
    if(addCode){
      sessionStorage.setItem("veeda_pending_add",addCode);
      window.history.replaceState({},"",window.location.pathname);
    }
    // Load persistent session
    const session=loadSession();
    const ps=loadProfiles();
    setProfiles(ps);
    if(session?.profileId&&session?.pw){
      const p=ps.find(x=>x.id===session.profileId);
      if(p){setActiveProfile(p);setActivePw(session.pw);setScreen("app");return;}
    }
    setScreen("splash");
  },[]);

  const refresh=()=>{const ps=loadProfiles();setProfiles(ps);return ps;};

  const updateProfile=updated=>{
    const ps=loadProfiles(),idx=ps.findIndex(p=>p.id===updated.id);
    if(idx>=0){ps[idx]={...ps[idx],...updated};saveProfiles(ps);registryUpdate(ps[idx]);setActiveProfile(prev=>({...prev,...updated}));}
  };

  if(screen==="loading")return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.splashBg}}><Spinner size={36} color={C.purple}/></div>;

  if(screen==="app"&&activeProfile&&activePw)return(
    <VeedaApp
      profile={activeProfile}
      password={activePw}
      onLogout={()=>{clearSession();setActiveProfile(null);setActivePw(null);setScreen("splash");}}
      onUpdateProfile={updateProfile}
    />
  );
  if(screen==="forgot"&&forgotProfile)return<ScreenForgot profile={forgotProfile} onBack={()=>setScreen("password")} onSuccess={pw=>{const ps=loadProfiles();const p=ps.find(x=>x.id===forgotProfile.id);saveSession(p.id,pw);setActiveProfile(p);setActivePw(pw);setForgotProfile(null);setScreen("app");}}/>;
  if(screen==="password"&&selProfile)return<ScreenPassword profile={selProfile} onBack={()=>setScreen("select")} onForgot={()=>{setForgotProfile(selProfile);setScreen("forgot");}} onSuccess={pw=>{saveSession(selProfile.id,pw);setActiveProfile(selProfile);setActivePw(pw);setScreen("app");}}/>;
  if(screen==="create")return<ScreenCreate onBack={()=>setScreen("splash")} onDone={(profile,pw)=>{refresh();saveSession(profile.id,pw);setActiveProfile(profile);setActivePw(pw);setScreen("app");}}/>;
  if(screen==="select")return<ScreenSelect profiles={profiles} onSelect={p=>{setSelProfile(p);setScreen("password");}} onNew={()=>setScreen("create")} onBack={()=>setScreen("splash")}/>;

  return(
    <>
      {showGuide&&<InstallGuide onClose={()=>setShowGuide(false)}/>}
      <SplashScreen onLogin={()=>setScreen("select")} onCreate={()=>setScreen("create")} onGuide={()=>setShowGuide(true)}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Veeda/>);

// ═══════════════════════════════════════════════════
// SERVICE WORKER (for PWA offline support)
// ═══════════════════════════════════════════════════
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    const swCode=`
const CACHE_NAME = "veeda-v9";
const URLS_TO_CACHE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(URLS_TO_CACHE)).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  const isNav = e.request.mode === "navigate" ||
                (e.request.destination === "document") ||
                (e.request.headers.get("accept") || "").includes("text/html");
  if(isNav){
    e.respondWith(
      fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && resp.type === "basic"){
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && resp.type === "basic") {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || "Veeda", {
    body: data.body || "Você tem uma nova mensagem.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
  }));
});
    `.trim();
    const blob=new Blob([swCode],{type:"application/javascript"});
    const url=URL.createObjectURL(blob);
    navigator.serviceWorker.register(url).catch(()=>{});
  });
}
</script>
