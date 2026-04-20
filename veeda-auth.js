// ═══════════════════════════════════════════════════════════
// VEEDA AUTH SCREENS — veeda-auth.js
// Edite este arquivo para: SplashScreen, InstallGuide,
// ScreenSelect, ScreenPassword, ScreenCreate, ScreenForgot
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════
function SplashScreen({onLogin,onCreate,onGuide}){
  return(
    <div style={{minHeight:"100vh",background:C.splashBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"60px 34px 50px"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",gap:20}}>
        <p style={{fontFamily:PASSO,fontSize:64,fontWeight:700,color:C.purple,lineHeight:1,letterSpacing:"-3px",margin:0}}>Veeda</p>
        <p style={{fontFamily:PASSO,fontSize:17,color:C.purple,textAlign:"center",margin:0}}>Viva primeiro, compartilhe depois.</p>
        <p style={{fontFamily:SANS,fontSize:14,color:"#381653",textAlign:"center",lineHeight:1.65,maxWidth:300,margin:0}}>Viva experiências, registre na hora e compartilhe com quem realmente importa.</p>
      </div>
      <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:14}}>
        <Btn onClick={onCreate}>Criar a sua</Btn>
        <Btn onClick={onLogin} variant="secondary">Já tenho uma conta</Btn>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",marginTop:4}}>
          <button onClick={onGuide} style={{background:"none",border:"none",color:"#381653",fontSize:13,cursor:"pointer",fontFamily:PASSO}}>📱 Como instalar</button>
        </div>
      </div>
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

function ScreenCreate({onDone,onBack}){
  const [step,setStep]=useState(1);
  const [email,setEmail]=useState("");const [name,setName]=useState("");
  const [handle,setHandle]=useState("");const [handleManual,setHandleManual]=useState(false);const [handleErr,setHandleErr]=useState("");
  const [emoji,setEmoji]=useState("🌿");const [avatarColor,setAvatarColor]=useState(C.purpleLight);const [avatarSrc,setAvatarSrc]=useState(null);
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
      const h="@"+(handle||sanitizeHandle(name)||sanitizeHandle(email.split("@")[0]));
      if(!isHandleAvailable(h,null)){setErr("Este @handle já está em uso. Escolha outro.");setLoading(false);return;}
      const passwordHash=await hashPw(pw),recoveryHash=await hashPw(code),id=Date.now().toString();
      const profile={id,name,email,handle:h,emoji,avatarColor,avatarSrc,passwordHash,recoveryHash,createdAt:Date.now()};
      const ps=loadProfiles();ps.push(profile);saveProfiles(ps);
      registryAdd(profile);
      const enc=await encryptObj(EMPTY_DATA(),pw);
      safeLS.rawSet(`veeda_data_${id}`,enc);
      saveMonthlySnapshot(id,enc);
      onDone(profile,pw);
    }catch(e){setErr("Erro ao criar conta. Tente novamente.");setLoading(false);}
  };

  return(
    <div style={{maxWidth:400,margin:"0 auto",padding:"2rem 1.25rem",background:C.bg,minHeight:"100vh"}}>
      <Btn onClick={step===1?onBack:()=>setStep(s=>s-1)} variant="ghost" style={{width:"auto",marginBottom:20}}>‹ Voltar</Btn>
      <div style={{display:"flex",gap:6,marginBottom:24}}>{[1,2,3,4].map(n=><div key={n} style={{flex:1,height:4,borderRadius:4,background:step>=n?C.purple:C.cardBorder,transition:"background .3s"}}/>)}</div>

      {step===1&&<div style={{animation:"fadeIn .25s ease"}}>
        <p style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:4,fontFamily:PASSO}}>Crie sua conta Veeda</p>
        <p style={{fontSize:13,color:C.textMid,marginBottom:20,lineHeight:1.5}}>Seu e-mail identifica sua conta. Não enviamos e-mails, é só para identificação.</p>
        <label style={{fontSize:13,color:C.textMid,display:"block",marginBottom:6}}>E-mail</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={{marginBottom:14}}/>
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
          if(!email.includes("@")){setErr("E-mail inválido.");return;}
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
