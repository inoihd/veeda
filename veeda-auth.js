// ═══════════════════════════════════════════════════════════
// VEEDA AUTH SCREENS — veeda-auth.js
// Edite este arquivo para: SplashScreen, InstallGuide,
// ScreenSelect, ScreenPassword, ScreenCreate, ScreenForgot
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// SPLASH SCREEN — v1.4: Google é o caminho principal
// ═══════════════════════════════════════════════════
function SplashScreen({onGoogle,onRecover,onGuide,loading,hasLocal}){
  return(
    <div style={{minHeight:"100vh",background:C.splashBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"60px 34px 50px"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",gap:20}}>
        <p style={{fontFamily:PASSO,fontSize:64,fontWeight:700,color:C.purple,lineHeight:1,letterSpacing:"-3px",margin:0}}>Veeda</p>
        <p style={{fontFamily:PASSO,fontSize:17,color:C.purple,textAlign:"center",margin:0}}>Viva primeiro, compartilhe depois.</p>
        <p style={{fontFamily:SANS,fontSize:14,color:"#381653",textAlign:"center",lineHeight:1.65,maxWidth:300,margin:0}}>Seus dias ficam salvos na sua conta Google — acesse de qualquer dispositivo.</p>
      </div>
      <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:12}}>
        <button onClick={onGoogle} disabled={loading} style={{width:"100%",padding:"14px 0",background:"#fff",border:"1.5px solid #dadce0",borderRadius:50,cursor:loading?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:SANS,fontSize:15,fontWeight:500,color:"#3c4043",boxShadow:"0 1px 2px rgba(60,64,67,.12)",opacity:loading?.6:1}}>
          {loading?<Spinner size={18} color={C.purple}/>:<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.88 2.7-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26a5.4 5.4 0 0 1-3.06.87 5.4 5.4 0 0 1-5.07-3.73H.95v2.34A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.93 10.7a5.41 5.41 0 0 1 0-3.4V4.96H.95a9 9 0 0 0 0 8.08l2.98-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .95 4.96l2.98 2.34A5.4 5.4 0 0 1 9 3.58z"/></svg>}
          {loading?"Conectando…":"Entrar com Google"}
        </button>
        {hasLocal&&(
          <button onClick={onRecover} style={{width:"100%",padding:"11px 0",background:"rgba(255,255,255,.55)",border:`1px solid ${C.purple}44`,borderRadius:50,cursor:"pointer",fontFamily:PASSO,fontSize:13,fontWeight:600,color:"#381653"}}>
            Recuperar conta deste dispositivo
          </button>
        )}
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",marginTop:6}}>
          <button onClick={onGuide} style={{background:"none",border:"none",color:"#381653",fontSize:13,cursor:"pointer",fontFamily:PASSO}}>📱 Como instalar</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// GOOGLE SELECT — após login, lista os perfis que já
// estão no Drive do usuário Google
// ═══════════════════════════════════════════════════
function ScreenGoogleSelect({googleUser,profiles,onSelect,onCreateNew,onImportLocal,onLogout,hasLocal}){
  return(
    <div style={{maxWidth:420,margin:"0 auto",padding:"2rem 1.25rem",background:C.bg,minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,padding:"12px 14px",background:C.white,borderRadius:14,border:`1px solid ${C.cardBorder}`}}>
        {googleUser.picture?<img src={googleUser.picture} alt="" style={{width:40,height:40,borderRadius:"50%"}}/>:<AvatarBubble emoji="👤" size={40}/>}
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:13,color:C.textMid}}>Entrou como</p>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{googleUser.email}</p>
        </div>
        <button onClick={onLogout} style={{background:"none",border:"none",color:C.textMid,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Sair</button>
      </div>

      <p style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Bem-vindo ao Veeda</p>

      {profiles.length===0?(
        <div>
          <p style={{fontSize:14,color:C.textMid,marginBottom:20,lineHeight:1.6}}>Você ainda não tem nenhum perfil na sua conta Veeda.</p>
          <Btn onClick={onCreateNew} style={{marginBottom:12}}>Criar meu primeiro perfil 🌿</Btn>
          {hasLocal&&(
            <Btn onClick={onImportLocal} variant="outline">Importar conta local deste dispositivo</Btn>
          )}
        </div>
      ):(
        <>
          <p style={{fontSize:14,color:C.textMid,marginBottom:24}}>Selecione o perfil para entrar</p>
          {profiles.map(p=>(
            <button key={p.id} onClick={()=>onSelect(p)} style={{width:"100%",background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:"16px",marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
              <AvatarBubble src={p.avatarSrc} emoji={p.emoji} color={p.avatarColor||C.purpleLight} size={50} ring/>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:15,fontWeight:600,color:C.text}}>{p.name}</p>
                <p style={{margin:0,fontSize:12,color:C.textLight}}>{p.handle||"perfil"}</p>
              </div>
              <span style={{fontSize:22,color:C.textLight}}>›</span>
            </button>
          ))}
          <Btn onClick={onCreateNew} variant="outline" style={{marginTop:8}}>+ Novo perfil</Btn>
          {hasLocal&&(
            <Btn onClick={onImportLocal} variant="ghost" style={{marginTop:6}}>Importar perfil local deste dispositivo</Btn>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// IMPORT LOCAL — migra perfis locais pro Drive
// ═══════════════════════════════════════════════════
function ScreenGoogleImport({localProfiles,onCancel,onImport,importing,result}){
  const [selected,setSelected]=useState(localProfiles.map(p=>p.id));
  const toggle=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  return(
    <div style={{maxWidth:420,margin:"0 auto",padding:"2rem 1.25rem",background:C.bg,minHeight:"100vh"}}>
      <Btn onClick={onCancel} variant="ghost" style={{width:"auto",marginBottom:16}}>‹ Voltar</Btn>
      <p style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Importar conta local</p>
      <p style={{fontSize:13,color:C.textMid,lineHeight:1.6,marginBottom:18}}>Encontramos {localProfiles.length} perfil(is) salvo(s) neste dispositivo. Escolha quais enviar pra sua conta Google. Uma cópia de segurança dos dados originais será mantida neste navegador.</p>
      {localProfiles.map(p=>(
        <label key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:selected.includes(p.id)?"#E8FBF0":C.white,border:`1.5px solid ${selected.includes(p.id)?C.green:C.cardBorder}`,borderRadius:14,marginBottom:10,cursor:"pointer"}}>
          <input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id)} style={{width:18,height:18}}/>
          <AvatarBubble src={p.avatarSrc} emoji={p.emoji||"🌿"} color={p.avatarColor||C.purpleLight} size={38}/>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{p.name||"(sem nome)"}</p>
            <p style={{margin:0,fontSize:12,color:C.textLight}}>{p.handle||p.email||"perfil local"}</p>
          </div>
        </label>
      ))}
      {result&&(
        <div style={{background:result.ok?C.greenLight:C.redLight,border:`1px solid ${result.ok?C.green:C.red}44`,borderRadius:10,padding:"10px 12px",marginTop:10}}>
          <p style={{margin:0,fontSize:13,color:result.ok?C.green:C.red}}>{result.msg}</p>
        </div>
      )}
      <Btn onClick={()=>onImport(selected)} disabled={importing||selected.length===0} style={{marginTop:16}}>
        {importing?<><Spinner size={16} color="#fff"/>Enviando {selected.length} perfil(is)…</>:`Importar ${selected.length} perfil(is)`}
      </Btn>
    </div>
  );
}

function InstallGuide({onClose}){
  const [tab,setTab]=useState("ios");
  const steps={ios:[["Safari","Acesse o Veeda no Safari do iPhone."],["Compartilhar ↑","Ícone na barra inferior do Safari."],["Adicionar à Tela de Início","Role a lista e toque."],["Confirme","Toque em Adicionar — pronto!"]],android:[["Chrome","Acesse no Google Chrome."],["Menu ⋮","Três pontos no canto superior."],["Instalar app","'Adicionar à tela inicial' ou 'Instalar'."],["Confirme","Toque em Adicionar."]]};
  return(
    <Modal title="Instalar o Veeda" onClose={onClose}>
      <div style={{display:"flex",gap:8,marginBottom:20}}>{[["ios","iPhone"],["android","Android"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"10px 0",background:tab===k?C.purple:C.purpleLight,color:tab===k?C.white:C.purple,border:"none",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:14}}>{l}</button>)}</div>
      {steps[tab].map(([t,d],i)=><div key={i} style={{display:"flex",gap:14,marginBottom:18}}><div style={{width:30,height:30,borderRadius:"50%",background:C.purple,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0}}>{i+1}</div><div><p style={{margin:"0 0 2px",fontSize:14,fontWeight:600,color:C.text}}>{t}</p><p style={{margin:0,fontSize:13,color:C.textMid,lineHeight:1.5}}>{d}</p></div></div>)}
      <div style={{background:C.purpleLight,borderRadius:12,padding:"12px 14px"}}><p style={{fontSize:13,color:C.purple,margin:0}}>🌿 Após instalar, funciona sem internet.</p></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════
// AUTH SCREENS
// ═══════════════════════════════════════════════════
function ScreenSelect({profiles,onSelect,onNew,onBack}){
  return(
    <div style={{maxWidth:420,margin:"0 auto",padding:"2rem 1.25rem",background:C.bg,minHeight:"100vh"}}>
      <Btn onClick={onBack} variant="ghost" style={{width:"auto",marginBottom:16}}>‹ Voltar</Btn>
      <p style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Bem-vindo de volta</p>
      {profiles.length===0?(
        <div style={{textAlign:"center",padding:"3rem 0"}}>
          <p style={{fontSize:14,color:C.textMid,marginBottom:24,lineHeight:1.6}}>Nenhum perfil encontrado neste dispositivo.</p>
          <Btn onClick={onNew}>Criar um perfil</Btn>
        </div>
      ):(
        <>
          <p style={{fontSize:14,color:C.textMid,marginBottom:24}}>Selecione seu perfil para entrar</p>
          {profiles.map(p=>(
            <button key={p.id} onClick={()=>onSelect(p)} style={{width:"100%",background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:"16px",marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
              <AvatarBubble src={p.avatarSrc} emoji={p.emoji} color={p.avatarColor||C.purpleLight} size={50} ring/>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:15,fontWeight:600,color:C.text}}>{p.name}</p>
                <p style={{margin:0,fontSize:12,color:C.textLight}}>{p.handle||p.email||"perfil local"}</p>
              </div>
              <span style={{fontSize:22,color:C.textLight}}>›</span>
            </button>
          ))}
          <Btn onClick={onNew} variant="outline" style={{marginTop:8}}>+ Novo perfil</Btn>
        </>
      )}
    </div>
  );
}

function ScreenPassword({profile,onSuccess,onBack,onForgot}){
  const [pw,setPw]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  const attempt=async()=>{
    if(!pw.trim())return;setLoading(true);setErr("");
    const hash=await hashPw(pw.trim());
    if(hash!==profile.passwordHash){setErr("Senha incorreta.");setPw("");setLoading(false);return;}
    onSuccess(pw.trim());
    // Autentica no Supabase para habilitar features cross-device
    if (window.VeedaSupabase?.isReady()) {
      VeedaSupabase.auth.signIn(profile.handle, hash)
        .then(({error}) => {
          if (error) return VeedaSupabase.auth.signUp(profile.handle, hash)
            .then(() => VeedaSupabase.profiles.register(profile));
          return VeedaSupabase.profiles.register(profile);
        }).catch(() => {});
    }
  };
  return(
    <div style={{maxWidth:400,margin:"0 auto",padding:"3rem 21px",background:`linear-gradient(180deg,${C.splashBg} 0%,${C.bg} 40%,${C.bgGradEnd} 100%)`,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Btn onClick={onBack} variant="ghost" style={{width:"auto",marginBottom:24}}>‹ Voltar</Btn>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
        <AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor||C.purpleLight} size={80} ring/>
        <p style={{margin:0,fontSize:19,fontWeight:700,color:C.text,textAlign:"center",fontFamily:PASSO}}>{profile.name}</p>
        {(profile.handle)&&<p style={{margin:0,fontSize:13,color:C.purple,fontWeight:600,textAlign:"center"}}>{profile.handle}</p>}
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Sua senha" autoFocus style={{border:`1.5px solid ${err?C.red:C.cardBorder}`,borderRadius:50,padding:"16px 20px",fontSize:16,width:"100%",background:C.white,outline:"none",boxShadow:err?"0 0 0 3px #f5b5b522":"none"}}/>
        {err&&<p style={{fontSize:13,color:C.red,margin:0,fontWeight:500}}>{err}</p>}
        <p onClick={onForgot} style={{margin:0,fontSize:13,color:C.purple,cursor:"pointer",alignSelf:"flex-end"}}>Esqueci minha senha →</p>
      </div>
      <Btn onClick={attempt} disabled={loading} style={{marginTop:24}}>{loading?<><Spinner size={16} color="#fff"/>Verificando…</>:"Entrar no Veeda 🌿"}</Btn>
    </div>
  );
}

function ScreenCreate({onDone,onBack,googleUser}){
  const gName=googleUser?.name||"";
  const gEmail=googleUser?.email||"";
  const [step,setStep]=useState(1);
  const [name,setName]=useState(gName);
  const [handle,setHandle]=useState(sanitizeHandle(gName||gEmail.split("@")[0]||""));
  const [handleManual,setHandleManual]=useState(false);const [handleErr,setHandleErr]=useState("");
  const [emoji,setEmoji]=useState("🌿");const [avatarColor,setAvatarColor]=useState(C.purpleLight);
  const [avatarSrc,setAvatarSrc]=useState(googleUser?.picture||null);
  const [pw,setPw]=useState("");const [pw2,setPw2]=useState("");
  const [code]=useState(genCode);const [confirmed,setConfirmed]=useState(false);const [copied,setCopied]=useState(false);
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const photoRef=useRef();const galleryRef=useRef();

  useEffect(()=>{if(!handleManual)setHandle(sanitizeHandle(name));},[name,handleManual]);

  const readFile=(f,cb)=>{const r=new FileReader();r.onload=e=>cb(e.target.result);r.readAsDataURL(f);};

  const finish=async()=>{
    if(!confirmed){setErr("Confirme que salvou o código.");return;}
    setLoading(true);
    try{
      const h="@"+(handle||sanitizeHandle(name)||sanitizeHandle(gEmail.split("@")[0]));
      if(!isHandleAvailable(h,null)){setErr("Este @handle já está em uso. Escolha outro.");setLoading(false);return;}
      const passwordHash=await hashPw(pw),recoveryHash=await hashPw(code),id=Date.now().toString();
      const profile={
        id,name,
        email:gEmail,
        googleSub:googleUser?.sub||null,
        handle:h,emoji,avatarColor,avatarSrc,
        passwordHash,recoveryHash,
        createdAt:Date.now(),
        cloud:!!googleUser
      };
      const ps=loadProfiles();ps.push(profile);saveProfiles(ps);
      registryAdd(profile);
      const enc=await encryptObj(EMPTY_DATA(),pw);
      safeLS.rawSet(`veeda_data_${id}`,enc);
      saveMonthlySnapshot(id,enc);
      onDone(profile,pw);
      // Registra no Supabase para cross-device social (fire-and-forget)
      if (window.VeedaSupabase?.isReady()) {
        VeedaSupabase.auth.signUp(profile.handle, passwordHash)
          .then(() => VeedaSupabase.profiles.register(profile))
          .catch(() => {});
      }
    }catch(e){setErr("Erro ao criar conta. Tente novamente.");setLoading(false);}
  };

  return(
    <div style={{maxWidth:400,margin:"0 auto",padding:"2rem 1.25rem",background:C.bg,minHeight:"100vh"}}>
      <Btn onClick={step===1?onBack:()=>setStep(s=>s-1)} variant="ghost" style={{width:"auto",marginBottom:20}}>‹ Voltar</Btn>
      <div style={{display:"flex",gap:6,marginBottom:24}}>{[1,2,3,4].map(n=><div key={n} style={{flex:1,height:4,borderRadius:4,background:step>=n?C.purple:C.cardBorder,transition:"background .3s"}}/>)}</div>

      {step===1&&<div style={{animation:"fadeIn .25s ease"}}>
        <p style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Crie seu perfil Veeda</p>
        <p style={{fontSize:13,color:C.textMid,marginBottom:20,lineHeight:1.5}}>{gEmail?<>Conectado como <strong>{gEmail}</strong>. Escolha um nome e um @handle únicos para o seu perfil.</>:"Escolha um nome e um @handle únicos para o seu perfil."}</p>
        <label style={{fontSize:13,color:C.textMid,display:"block",marginBottom:6}}>Nome no Veeda</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Como quer ser chamado" style={{marginBottom:14}}/>
        <label style={{fontSize:13,color:C.textMid,display:"block",marginBottom:6}}>@handle <span style={{fontWeight:400,color:C.textLight}}>(único, pode personalizar)</span></label>
        <div style={{position:"relative",marginBottom:handleErr?6:20}}>
          <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:15,color:C.purple,fontWeight:700,pointerEvents:"none"}}>@</span>
          <input value={handle} onChange={e=>{setHandleManual(true);setHandle(sanitizeHandle(e.target.value));setHandleErr("");}} placeholder="seuhandle" style={{paddingLeft:30,border:`1.5px solid ${handleErr?C.red:C.cardBorder}`}}/>
        </div>
        {handleErr&&<p style={{fontSize:12,color:C.red,margin:"-16px 0 12px",fontWeight:500}}>{handleErr}</p>}
        {handle&&!handleErr&&<p style={{fontSize:12,color:C.green,margin:"-14px 0 14px"}}>✓ @{handle}</p>}
        <Btn onClick={()=>{
          if(!name.trim()){setErr("Informe seu nome.");return;}
          const h=handle||sanitizeHandle(name);
          if(h.length<3){setHandleErr("Handle muito curto (mín. 3 car.).");return;}
          if(!isHandleAvailable("@"+h,null)){setHandleErr("Este @handle já está em uso.");return;}
          setErr("");setStep(2);
        }}>Continuar</Btn>
        {err&&<p style={{fontSize:13,color:C.red,marginTop:10,textAlign:"center"}}>{err}</p>}
      </div>}

      {step===2&&<div style={{animation:"fadeIn .25s ease"}}>
        <p style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Seu avatar</p>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input ref={photoRef} type="file" accept="image/*" capture="user" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,setAvatarSrc);}}/>
          <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f,setAvatarSrc);}}/>
          <button onClick={()=>photoRef.current.click()} style={{flex:1,padding:"10px 0",background:C.blueLight,color:C.blue,border:`1px solid ${C.blueMid}`,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:500}}>📷 Câmera</button>
          <button onClick={()=>galleryRef.current.click()} style={{flex:1,padding:"10px 0",background:C.purpleLight,color:C.purple,border:`1px solid ${C.purpleMid}`,borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:500}}>🖼️ Galeria</button>
        </div>
        {avatarSrc?<div style={{display:"flex",justifyContent:"center",marginBottom:14}}><div style={{position:"relative"}}><AvatarBubble src={avatarSrc} size={80} ring/><button onClick={()=>setAvatarSrc(null)} style={{position:"absolute",top:-4,right:-4,width:22,height:22,borderRadius:"50%",background:C.red,color:"#fff",border:"none",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div></div>
        :<div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>{AVATAR_EMOJIS.map(e=><button key={e} onClick={()=>setEmoji(e)} style={{fontSize:20,background:emoji===e?C.purpleLight:"#F5F3FB",border:`2px solid ${emoji===e?C.purple:C.cardBorder}`,borderRadius:10,width:44,height:44,cursor:"pointer"}}>{e}</button>)}</div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>{AVATAR_COLORS.map(col=><button key={col} onClick={()=>setAvatarColor(col)} style={{width:36,height:36,borderRadius:"50%",background:col,border:`3px solid ${avatarColor===col?C.purple:C.cardBorder}`,cursor:"pointer"}}/>)}</div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><AvatarBubble emoji={emoji} color={avatarColor} size={70} ring/></div>
        </div>}
        <Btn onClick={()=>setStep(3)}>Continuar</Btn>
      </div>}

      {step===3&&<div style={{animation:"fadeIn .25s ease"}}>
        <p style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Crie sua senha</p>
        <p style={{fontSize:13,color:C.textMid,marginBottom:20,lineHeight:1.5}}>Sua senha criptografa todos os seus Dias de Veeda localmente.</p>
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="Mínimo 6 caracteres" style={{marginBottom:12}}/>
        <input type="password" value={pw2} onChange={e=>{setPw2(e.target.value);setErr("");}} placeholder="Confirmar senha" style={{border:`1.5px solid ${err?C.red:C.cardBorder}`,marginBottom:err?6:14}}/>
        {err&&<p style={{fontSize:13,color:C.red,margin:"0 0 12px",fontWeight:500}}>{err}</p>}
        <Btn onClick={()=>{if(pw.length<6){setErr("Mínimo 6 caracteres.");return;}if(pw!==pw2){setErr("As senhas não coincidem.");return;}setErr("");setStep(4);}}>Continuar</Btn>
      </div>}

      {step===4&&<div style={{animation:"fadeIn .25s ease"}}>
        <p style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Código de recuperação</p>
        <p style={{fontSize:13,color:C.textMid,marginBottom:20,lineHeight:1.5}}><strong style={{color:C.text}}>Anote agora.</strong> É o único jeito de recuperar seus dados se esquecer a senha.</p>
        <div style={{background:`linear-gradient(135deg,${C.purpleLight},${C.blueLight})`,border:`2px solid ${C.purpleMid}`,borderRadius:16,padding:"22px",textAlign:"center",marginBottom:14}}>
          <p style={{margin:"0 0 6px",fontSize:10,color:C.textMid,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}>Seu código secreto</p>
          <p style={{margin:0,fontSize:20,fontWeight:700,color:C.purple,letterSpacing:"2px",fontFamily:"monospace"}}>{code}</p>
        </div>
        <button onClick={()=>{navigator.clipboard?.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),2500);}} style={{width:"100%",padding:"11px 0",marginBottom:20,background:copied?"#E8FBF0":"#fff",color:copied?C.green:C.purple,border:`2px solid ${copied?C.green:C.purple}`,borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer"}}>{copied?"✓ Copiado!":"Copiar código"}</button>
        <CheckboxConfirm checked={confirmed} hasError={!!err&&!confirmed} onChange={v=>{setConfirmed(v);if(v)setErr("");}} label="Anotei meu código de recuperação em um lugar seguro."/>
        {err&&<p style={{fontSize:13,color:C.red,margin:"-10px 0 12px",fontWeight:500}}>{err}</p>}
        <Btn onClick={finish} disabled={loading}>{loading?<><Spinner size={16} color="#fff"/>Criando conta…</>:"Entrar no Veeda 🌿"}</Btn>
      </div>}
    </div>
  );
}

function ScreenForgot({profile,onSuccess,onBack}){
  const [step,setStep]=useState(1);const [code,setCode]=useState("");const [pw,setPw]=useState("");const [pw2,setPw2]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  const verify=async()=>{setLoading(true);setErr("");const h=await hashPw(code.trim().toUpperCase());if(h!==profile.recoveryHash){setErr("Código incorreto.");setLoading(false);return;}setStep(2);setLoading(false);};
  const reset=async()=>{if(pw.length<6){setErr("Mínimo 6 caracteres.");return;}if(pw!==pw2){setErr("Não coincidem.");return;}setLoading(true);try{const stored=safeLS.raw(`veeda_data_${profile.id}`);let d=EMPTY_DATA();try{const r=await decryptObj(stored,code.trim().toUpperCase());d=r.data;}catch{}const ps=loadProfiles();const idx=ps.findIndex(p=>p.id===profile.id);if(idx>=0){ps[idx].passwordHash=await hashPw(pw);saveProfiles(ps);}const enc=await encryptObj(d,pw);safeLS.rawSet(`veeda_data_${profile.id}`,enc);onSuccess(pw);}catch{setErr("Erro ao redefinir.");setLoading(false);}};
  return(
    <div style={{maxWidth:400,margin:"0 auto",padding:"2.5rem 1.25rem",background:C.bg,minHeight:"100vh"}}>
      <Btn onClick={onBack} variant="ghost" style={{width:"auto",marginBottom:24}}>‹ Voltar</Btn>
      <div style={{textAlign:"center",marginBottom:24}}><AvatarBubble src={profile.avatarSrc} emoji={profile.emoji} color={profile.avatarColor||C.purpleLight} size={64} ring/><p style={{margin:"10px 0 0",fontSize:16,fontWeight:700,color:C.text}}>{profile.name}</p></div>
      <div style={{background:C.white,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:"20px"}}>
        {step===1&&<div><p style={{fontSize:15,fontWeight:600,color:C.text,margin:"0 0 14px"}}>Código de recuperação</p><input value={code} onChange={e=>{setCode(e.target.value);setErr("");}} placeholder="XXXX-XXXX-XXXX-XXXX" style={{fontFamily:"monospace",letterSpacing:"1px",marginBottom:err?6:14}}/>{err&&<p style={{fontSize:13,color:C.red,margin:"0 0 12px",fontWeight:500}}>{err}</p>}<Btn onClick={verify} disabled={loading}>{loading?<><Spinner/>Verificando…</>:"Verificar"}</Btn></div>}
        {step===2&&<div><p style={{fontSize:15,fontWeight:600,color:C.text,margin:"0 0 14px"}}>Nova senha</p><input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="Nova senha" style={{marginBottom:12}}/><input type="password" value={pw2} onChange={e=>{setPw2(e.target.value);setErr("");}} placeholder="Confirmar" style={{marginBottom:err?6:14}}/>{err&&<p style={{fontSize:13,color:C.red,margin:"0 0 12px",fontWeight:500}}>{err}</p>}<Btn onClick={reset} disabled={loading}>{loading?<><Spinner/>Salvando…</>:"Redefinir senha"}</Btn></div>}
      </div>
    </div>
  );
}
