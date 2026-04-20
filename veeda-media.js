// ═══════════════════════════════════════════════════════════
// VEEDA MEDIA COMPONENTS — veeda-media.js
// Edite este arquivo para: DrawingCanvas, VoiceRecorder,
// LocationPicker, MomentCircle, MomentDetail, MusicPicker, TagPicker
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// DRAWING CANVAS (Arte)
// ═══════════════════════════════════════════════════
function DrawingCanvas({onSave,onClose}){
  const canvasRef=useRef(null);
  const [color,setColor]=useState("#3A3350");
  const [sz,setSz]=useState(5);
  const [tool,setTool]=useState("pen");
  const drawing=useRef(false);
  const last=useRef(null);

  useEffect(()=>{
    const c=canvasRef.current;c.width=1000;c.height=1000;
    const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,1000,1000);
  },[]);

  const pos=e=>{
    const c=canvasRef.current,r=c.getBoundingClientRect();
    const s=e.touches?e.touches[0]:e;
    return{x:(s.clientX-r.left)*(1000/r.width),y:(s.clientY-r.top)*(1000/r.height)};
  };
  const start=e=>{e.preventDefault();drawing.current=true;const p=pos(e);last.current=p;const ctx=canvasRef.current.getContext("2d");ctx.beginPath();ctx.arc(p.x,p.y,(tool==="eraser"?sz*3:sz)/2,0,Math.PI*2);ctx.fillStyle=tool==="eraser"?"#fff":color;ctx.fill();};
  const move=e=>{if(!drawing.current)return;e.preventDefault();const p=pos(e);const ctx=canvasRef.current.getContext("2d");ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle=tool==="eraser"?"#fff":color;ctx.lineWidth=tool==="eraser"?sz*3:sz;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();last.current=p;};
  const end=()=>{drawing.current=false;last.current=null;};

  const importImg=f=>{const r=new FileReader();r.onload=ev=>{const img=new Image();img.onload=()=>{const c=canvasRef.current,ctx=c.getContext("2d");const sc=Math.min(1000/img.width,1000/img.height);const w=img.width*sc,h=img.height*sc;ctx.drawImage(img,(1000-w)/2,(1000-h)/2,w,h);};img.src=ev.target.result;};r.readAsDataURL(f);};

  const COLORS=["#000000","#3A3350","#9000FF","#E91E8C","#5B7FA6","#1D9E75","#D4860A","#C0392B","#FF9800","#ffffff","#FDF5F0","#EDE9F6"];

  return(
    <div style={{position:"fixed",inset:0,background:"#1a1025",zIndex:400,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
      <div style={{background:"#2a1d3d",padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,color:"#fff",padding:"7px 12px",cursor:"pointer",fontSize:13}}>✕</button>
        <span style={{flex:1,color:"rgba(255,255,255,.6)",fontSize:13,fontWeight:600,textAlign:"center",fontFamily:PASSO}}>🎨 Arte Veeda</span>
        <button onClick={()=>onSave(canvasRef.current.toDataURL("image/png"))} style={{background:C.purple,border:"none",borderRadius:8,color:"#fff",padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>Salvar ✓</button>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",padding:8,background:"#13091e"}}>
        <canvas ref={canvasRef} style={{width:"100%",height:"100%",objectFit:"contain",touchAction:"none",borderRadius:10,cursor:tool==="eraser"?"cell":"crosshair"}}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}/>
      </div>
      <div style={{background:"#2a1d3d",padding:"10px 12px 22px",flexShrink:0}}>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:10}}>
          {COLORS.map(c=><button key={c} onClick={()=>{setTool("pen");setColor(c);}} style={{width:26,height:26,borderRadius:"50%",background:c,border:`3px solid ${color===c&&tool==="pen"?"#fff":"rgba(255,255,255,.15)"}`,cursor:"pointer",flexShrink:0}}/>)}
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",alignItems:"center",flexWrap:"wrap"}}>
          {[["pen","✏️ Pincel",C.purple],["eraser","⬜ Borracha",C.purpleMid]].map(([t,l,ac])=>(
            <button key={t} onClick={()=>setTool(t)} style={{padding:"5px 12px",background:tool===t?ac:"rgba(255,255,255,.1)",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>
          ))}
          {[2,5,10,20].map(s=>(
            <button key={s} onClick={()=>setSz(s)} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",background:sz===s?"rgba(255,255,255,.28)":"rgba(255,255,255,.08)",border:`2px solid ${sz===s?"#fff":"transparent"}`,borderRadius:"50%",cursor:"pointer"}}>
              <div style={{width:Math.max(3,s*.65),height:Math.max(3,s*.65),borderRadius:"50%",background:"#fff"}}/>
            </button>
          ))}
          <label style={{padding:"5px 10px",background:"rgba(255,255,255,.1)",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:12}}>
            🖼️<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)importImg(f);}}/>
          </label>
          <button onClick={()=>{const c=canvasRef.current,ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);}} style={{padding:"5px 10px",background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:12}}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// VOICE RECORDER
// ═══════════════════════════════════════════════════
function VoiceRecorder({onSave,onClose}){
  const [state,setState]=useState("idle"); // idle|recording|recorded|saving
  const [duration,setDuration]=useState(0);
  const [audioUrl,setAudioUrl]=useState(null);
  const recRef=useRef(null);
  const streamRef=useRef(null);
  const chunksRef=useRef([]);
  const timerRef=useRef(null);
  const MAX=120;

  const start=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      streamRef.current=stream;
      const rec=new MediaRecorder(stream,{mimeType:"audio/webm;codecs=opus"});
      chunksRef.current=[];
      rec.ondataavailable=e=>chunksRef.current.push(e.data);
      rec.onstop=()=>{
        const blob=new Blob(chunksRef.current,{type:"audio/webm"});
        const url=URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");
        streamRef.current?.getTracks().forEach(t=>t.stop());
      };
      rec.start(100);
      recRef.current=rec;
      setState("recording");
      setDuration(0);
      timerRef.current=setInterval(()=>{
        setDuration(d=>{if(d>=MAX-1){stop();return d;}return d+1;});
      },1000);
    }catch{onClose();}
  };

  const stop=()=>{
    clearInterval(timerRef.current);
    recRef.current?.stop();
  };

  const save=async()=>{
    setState("saving");
    const blob=new Blob(chunksRef.current,{type:"audio/webm"});
    const reader=new FileReader();
    reader.onload=e=>onSave(e.target.result,duration);
    reader.readAsDataURL(blob);
  };

  useEffect(()=>()=>{clearInterval(timerRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());},[]);

  const fmtDur=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return(
    <div style={{padding:"8px 0"}}>
      <div style={{textAlign:"center",padding:"24px 0"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:state==="recording"?C.redLight:C.tealLight,border:`3px solid ${state==="recording"?C.red:C.teal}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:32,animation:state==="recording"?"pulse 1s ease infinite":"none"}}>
          {state==="recording"?"🔴":"🎙️"}
        </div>
        {(state==="recording"||state==="recorded")&&(
          <p style={{fontSize:28,fontWeight:700,color:C.text,fontFamily:"monospace",marginBottom:4}}>{fmtDur(duration)}</p>
        )}
        {state==="idle"&&<p style={{fontSize:14,color:C.textMid,marginBottom:0}}>Toque para gravar uma nota de voz</p>}
        {state==="recording"&&<p style={{fontSize:12,color:C.red,marginBottom:0}}>Gravando… max {fmtDur(MAX)}</p>}
      </div>
      {state==="recorded"&&audioUrl&&(
        <audio controls src={audioUrl} style={{width:"100%",marginBottom:16}}/>
      )}
      <div style={{display:"flex",gap:10,flexDirection:"column"}}>
        {state==="idle"&&<Btn onClick={start} variant="teal">🎙️ Iniciar gravação</Btn>}
        {state==="recording"&&<Btn onClick={stop} variant="danger">⏹ Parar gravação</Btn>}
        {state==="recorded"&&<><Btn onClick={save}>✓ Adicionar à timeline</Btn><Btn onClick={start} variant="outline">Regravar</Btn></>}
        {state==="saving"&&<Btn disabled>Salvando… <Spinner/></Btn>}
        <Btn onClick={onClose} variant="ghost">Cancelar</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// LOCATION PICKER
// ═══════════════════════════════════════════════════
function LocationPicker({value,onChange}){
  const [loading,setLoading]=useState(false);
  const [manual,setManual]=useState(false);
  const [text,setText]=useState(value?.name||"");

  const detect=async()=>{
    setLoading(true);
    try{
      const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
      const{latitude:lat,longitude:lng}=pos.coords;
      let name=`${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`);
        const d=await r.json();
        name=d.address?.city||d.address?.town||d.address?.village||d.display_name?.split(",")[0]||name;
      }catch{}
      onChange({lat,lng,name});
      setText(name);
    }catch{setManual(true);}
    setLoading(false);
  };

  if(value&&!manual){
    return(
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#E8F8F4",border:`1px solid ${C.greenMid}44`,borderRadius:12,marginBottom:14}}>
        <span style={{fontSize:18}}>📍</span>
        <span style={{flex:1,fontSize:13,color:C.green,fontWeight:500}}>{value.name}</span>
        <button onClick={()=>{onChange(null);setText("");}} style={{background:"none",border:"none",color:C.textLight,cursor:"pointer",fontSize:16}}>×</button>
      </div>
    );
  }

  if(manual){
    return(
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",gap:8}}>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Ex: Florianópolis, SC" style={{flex:1,borderRadius:50}}/>
          <button onClick={()=>{if(text.trim())onChange({lat:null,lng:null,name:text.trim()});setManual(false);}} style={{padding:"0 14px",background:C.green,color:"#fff",border:"none",borderRadius:50,cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0}}>OK</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <button onClick={detect} disabled={loading} style={{flex:1,padding:"10px 0",background:"#E8F8F4",color:C.green,border:`1px solid ${C.greenMid}55`,borderRadius:50,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        {loading?<><Spinner size={14} color={C.green}/>Detectando...</>:"📍 Adicionar local"}
      </button>
      <button onClick={()=>setManual(true)} style={{padding:"10px 14px",background:C.white,color:C.textMid,border:`1px solid ${C.cardBorder}`,borderRadius:50,cursor:"pointer",fontSize:13}}>✏️</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MOMENT CIRCLE
// ═══════════════════════════════════════════════════
function MomentCircle({m,isNew,onTap,size=52}){
  const meta=TYPE_META[m.type]||TYPE_META.texto;
  const isImg=m.type==="foto"||m.type==="arte";
  const isVid=m.type==="video";
  return(
    <div onClick={onTap} style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",cursor:"pointer",flexShrink:0,border:`2.5px solid ${isNew?C.purpleMid:C.white}`,boxShadow:"0 2px 10px rgba(0,0,0,.13)",animation:isNew?"momentPop .4s cubic-bezier(.22,1,.36,1)":"none",position:"relative",background:meta.bg}}>
      {isImg&&m.content?<img src={m.content} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
       :isVid&&m.content?<video src={m.content} style={{width:"100%",height:"100%",objectFit:"cover"}} muted playsInline/>
       :m.type==="musica"&&m.albumArt?<img src={m.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
       :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.42}}>{meta.icon}</div>
      }
      {m.location&&<div style={{position:"absolute",bottom:2,right:2,fontSize:9,background:"rgba(0,0,0,.45)",borderRadius:4,padding:"1px 3px",color:"#fff"}}>📍</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MOMENT DETAIL
// ═══════════════════════════════════════════════════
function MomentDetail({m,onClose,onDelete}){
  const [playing,setPlaying]=useState(false);
  const [saving,setSaving]=useState(false);
  const audioRef=useRef(null);
  const embed=m.type==="videolink"?getVideoEmbed(m.content):null;
  const allTags=[...DEFAULT_TAGS];
  // Permitir salvar mesmo quando o conteúdo está no IndexedDB (prefixo "IDB:")
  const canSave=(m.type==="foto"||m.type==="arte"||m.type==="video"||m.type==="voz")&&!!m.content;

  const saveToDevice=async()=>{
    if(!m.content)return;
    setSaving(true);
    try{
      let src=m.content;
      // Se o conteúdo está no IndexedDB, resolve primeiro
      if(src.startsWith("IDB:")){
        const loaded=await idbLoad(src.slice(4));
        if(!loaded){setSaving(false);return;}
        src=loaded;
      }
      const ext=m.type==="video"?"mp4":m.type==="voz"?"webm":"png";
      const a=document.createElement("a");
      a.href=src;
      a.download=`veeda-${m.id}.${ext}`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
    }finally{setSaving(false);}
  };

  return(
    <Modal title="" onClose={onClose}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:(TYPE_META[m.type]||TYPE_META.texto).bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{(TYPE_META[m.type]||TYPE_META.texto).icon}</div>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:12,color:C.textLight}}>{fmt(m.ts)}</p>
          {m.location&&<p style={{margin:0,fontSize:11,color:C.green}}>📍 {m.location.name}</p>}
        </div>
        <button onClick={onClose} style={{background:C.purpleLight,border:"none",borderRadius:"50%",width:30,height:30,color:C.purple,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {(m.type==="foto"||m.type==="arte")&&m.content&&<img src={m.content} alt="" style={{width:"100%",borderRadius:12,display:"block",marginBottom:12}}/>}
      {m.type==="video"&&m.content&&<video src={m.content} controls style={{width:"100%",borderRadius:12,display:"block",maxHeight:320,marginBottom:12}}/>}
      {m.type==="videolink"&&embed&&<div style={{position:"relative",paddingBottom:"56.25%",height:0,borderRadius:12,overflow:"hidden",marginBottom:12}}><iframe src={embed} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}} allowFullScreen title="v"/></div>}
      {m.type==="link"&&<a href={m.content} target="_blank" rel="noopener noreferrer" style={{display:"block",color:C.blue,fontSize:14,wordBreak:"break-all",marginBottom:12,padding:"10px 14px",background:C.blueLight,borderRadius:10}}>{m.content}</a>}
      {m.type==="texto"&&<p style={{fontSize:15,color:C.text,lineHeight:1.75,marginBottom:12}}>{m.content}</p>}

      {m.type==="voz"&&m.content&&(
        <div style={{background:C.tealLight,borderRadius:14,padding:14,marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28,flexShrink:0}}>🎙️</span>
          <div style={{flex:1}}>
            <audio ref={audioRef} src={m.content} onEnded={()=>setPlaying(false)} style={{width:"100%"}} controls/>
          </div>
        </div>
      )}

      {m.type==="musica"&&(
        <div style={{background:C.greenLight,borderRadius:14,padding:14,marginBottom:12}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            {m.albumArt&&<img src={m.albumArt} alt="" style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
            <div style={{flex:1,overflow:"hidden"}}>
              <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.trackTitle||m.content}</p>
              <p style={{margin:"2px 0 0",fontSize:12,color:C.textMid}}>{m.trackArtist||""}</p>
            </div>
          </div>
          {m.previewUrl&&(
            <div style={{marginTop:10}}>
              <audio ref={audioRef} src={m.previewUrl} onEnded={()=>setPlaying(false)}/>
              <button onClick={()=>{playing?audioRef.current?.pause():audioRef.current?.play();setPlaying(p=>!p);}} style={{width:"100%",padding:"9px 0",background:C.green,border:"none",borderRadius:10,color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer"}}>{playing?"⏸ Pausar":"▶ Ouvir prévia (30s)"}</button>
            </div>
          )}
        </div>
      )}

      {m.caption&&<p style={{fontSize:13,color:C.textMid,marginBottom:12,fontStyle:"italic",padding:"8px 12px",background:"#FAF9FD",borderRadius:8}}>"{m.caption}"</p>}

      {m.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {m.tags.map(tid=>{const t=allTags.find(x=>x.id===tid);return t?<span key={tid} style={{padding:"3px 10px",background:t.bg,color:t.color,borderRadius:20,fontSize:12,fontWeight:500}}>{t.emoji} {t.label}</span>:null;})}
      </div>}

      {canSave&&<Btn onClick={saveToDevice} disabled={saving} variant="outline" style={{marginBottom:8,fontSize:13,padding:"11px 0"}}>{saving?<><Spinner size={14} color={C.purple}/>Preparando…</>:"↓ Salvar no dispositivo"}</Btn>}
      <Btn onClick={()=>{onDelete();onClose();}} variant="ghost" style={{color:C.red,fontSize:13}}>Remover momento</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// MUSIC PICKER
// ═══════════════════════════════════════════════════
function MusicPicker({onSelect,onClose}){
  const [q,setQ]=useState("");const [res,setRes]=useState([]);const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const search=async()=>{
    if(!q.trim())return;setLoading(true);setErr("");setRes([]);
    try{const r=await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=8`);const d=await r.json();if(!d.results?.length){setErr("Nenhum resultado.");return;}setRes(d.results.map(r=>({id:r.trackId,title:r.trackName,artist:r.artistName,album:r.collectionName,art:r.artworkUrl100,preview:r.previewUrl,appleMusicUrl:r.trackViewUrl})));}
    catch{setErr("Erro ao buscar. Verifique sua conexão.");}
    setLoading(false);
  };
  return(
    <Modal title="Buscar música" onClose={onClose}>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Nome da música ou artista…" style={{flex:1}}/>
        <button onClick={search} disabled={loading} style={{padding:"0 16px",background:C.purple,color:"#fff",border:"none",borderRadius:50,cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>{loading?<Spinner size={14} color="#fff"/>:"Buscar"}</button>
      </div>
      {err&&<p style={{fontSize:13,color:C.red,marginBottom:10}}>{err}</p>}
      <div style={{maxHeight:340,overflowY:"auto"}}>
        {res.map(r=>(
          <div key={r.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.cardBorder}`,alignItems:"center"}}>
            {r.art&&<img src={r.art} alt="" style={{width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
            <div style={{flex:1,overflow:"hidden"}}>
              <p style={{margin:0,fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</p>
              <p style={{margin:0,fontSize:12,color:C.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.artist}</p>
            </div>
            <button onClick={()=>onSelect(r)} style={{padding:"7px 12px",background:C.green,color:"#fff",border:"none",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>Adicionar</button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// TAG PICKER
// ═══════════════════════════════════════════════════
function TagPicker({selectedTags,onChange,customTags=[]}){
  const [newTag,setNewTag]=useState("");const [adding,setAdding]=useState(false);
  const all=[...DEFAULT_TAGS,...customTags];
  const toggle=id=>onChange(selectedTags.includes(id)?selectedTags.filter(x=>x!==id):[...selectedTags,id]);
  return(
    <div>
      <label style={{fontSize:13,fontWeight:600,color:C.text,display:"block",marginBottom:8}}>🏷️ Tags <span style={{fontWeight:400,color:C.textLight}}>(opcional)</span></label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
        {all.map(t=>{const s=selectedTags.includes(t.id);return<button key={t.id} onClick={()=>toggle(t.id)} style={{padding:"5px 12px",background:s?t.bg:C.white,border:`1.5px solid ${s?t.color:C.cardBorder}`,borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:s?600:400,color:s?t.color:C.textMid}}>{t.emoji} {t.label}</button>;})}
        <button onClick={()=>setAdding(a=>!a)} style={{padding:"5px 12px",background:"none",border:`1.5px dashed ${C.cardBorder}`,borderRadius:20,cursor:"pointer",fontSize:12,color:C.textLight}}>+ Nova tag</button>
      </div>
      {adding&&<div style={{display:"flex",gap:8}}><input value={newTag} onChange={e=>setNewTag(e.target.value)} placeholder="Nome da tag" onKeyDown={e=>{if(e.key==="Enter"&&newTag.trim()){const id="c_"+Date.now();onChange([...selectedTags,id]);setNewTag("");setAdding(false);}}} style={{flex:1}}/><button onClick={()=>{if(!newTag.trim())return;const id="c_"+Date.now();onChange([...selectedTags,id]);setNewTag("");setAdding(false);}} style={{padding:"0 14px",background:C.purple,color:"#fff",border:"none",borderRadius:50,cursor:"pointer",fontSize:13,fontWeight:600}}>OK</button></div>}
    </div>
  );
}
