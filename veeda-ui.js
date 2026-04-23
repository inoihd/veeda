// ═══════════════════════════════════════════════════════════
// VEEDA UI PRIMITIVES — veeda-ui.js
// Edite este arquivo para: AvatarBubble, Modal, Btn, Spinner,
// Toast, SkeletonLine, PulsingDot, CheckboxConfirm, useToast
// ═══════════════════════════════════════════════════════════

function AvatarBubble({src,emoji,color,size=38,ring=false}){
  const border=ring?`3px solid ${C.purpleMid}`:`2px solid rgba(255,255,255,0.8)`;
  const shadow = ring ? `0 4px 16px rgba(144, 0, 255, 0.3)` : `0 2px 8px rgba(0,0,0,0.1)`;

  if(src)return(
    <img
      src={src}
      alt="avatar"
      style={{
        width:size,
        height:size,
        borderRadius:"50%",
        objectFit:"cover",
        border,
        flexShrink:0,
        display:"block",
        boxShadow: shadow,
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)"
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    />
  );

  return(
    <div
      style={{
        width:size,
        height:size,
        borderRadius:"50%",
        background: color ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` : `linear-gradient(135deg, ${C.purpleLight} 0%, ${C.purpleMid} 100%)`,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        fontSize:size*.46,
        border,
        flexShrink:0,
        boxShadow: shadow,
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)"
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {emoji||"🌿"}
    </div>
  );
}

function Spinner({size=18,color=C.purple}){
  return(
    <div style={{
      width:size,
      height:size,
      border:`2px solid ${color}22`,
      borderTop:`2px solid ${color}`,
      borderRadius:"50%",
      animation:"spin 1s linear infinite",
      flexShrink:0
    }}/>
  );
}

function SkeletonLine({w="100%",h=14,r=8,mb=8}){
  return(
    <div
      className="shimmer"
      style={{
        width:w,
        height:h,
        borderRadius:r,
        marginBottom:mb,
        background: `linear-gradient(90deg, ${C.cardBorder}33 25%, ${C.purpleLight}66 50%, ${C.cardBorder}33 75%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite ease-in-out"
      }}
    />
  );
}

function Modal({onClose,title,children,fullHeight=false}){
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  return(
    <div style={{
      position:"fixed",
      inset:0,
      background:C.overlay,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display:"flex",
      alignItems:"flex-end",
      justifyContent:"center",
      zIndex:300
    }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{
        background: `linear-gradient(135deg, ${C.white} 0%, rgba(255,255,255,0.95) 100%)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid rgba(255,255,255,0.2)`,
        borderRadius:"20px 20px 0 0",
        padding:"20px 16px 40px",
        width:"100%",
        maxWidth:480,
        maxHeight:fullHeight?"95vh":"90vh",
        overflowY:"auto",
        animation:"slideUp .28s cubic-bezier(.22,1,.36,1)",
        WebkitOverflowScrolling:"touch",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.1)"
      }}>
        {title&&(
          <div style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            marginBottom:18,
            paddingBottom: 12,
            borderBottom: `1px solid ${C.headerBorder}`
          }}>
            <p style={{
              margin:0,
              fontSize:15,
              fontWeight:600,
              color:C.text,
              fontFamily:PASSO,
              background: "linear-gradient(135deg, #9000FF 0%, #22FCB7 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>{title}</p>
            <button onClick={onClose} style={{
              background:C.purpleLight,
              border:"none",
              borderRadius:"50%",
              width:32,
              height:32,
              color:C.purple,
              fontSize:18,
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              lineHeight:1,
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(144, 0, 255, 0.2)"
            }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Btn({onClick,children,style={},disabled=false,variant="primary",type="button"}){
  const tapped=useRef(false);
  const base={
    width:"100%",
    padding:"16px 0",
    border:"none",
    borderRadius:50,
    fontFamily:PASSO,
    fontWeight:600,
    fontSize:15,
    cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?.55:1,
    transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    WebkitTapHighlightColor:"transparent",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:8,
    touchAction:"manipulation",
    position:"relative",
    overflow:"hidden",
    boxShadow: disabled ? "none" : "0 4px 16px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08)",
    transform: disabled ? "none" : "translateY(0)"
  };
  const vars={
    primary:  {
      background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleMid} 100%)`,
      color:C.white,
      boxShadow: disabled ? "none" : `0 4px 16px rgba(144, 0, 255, 0.3), 0 2px 8px rgba(144, 0, 255, 0.2)`
    },
    outline:  {
      background:"transparent",
      color:C.purple,
      border:`2px solid ${C.purple}`,
      boxShadow: "none"
    },
    secondary:{
      background: `linear-gradient(135deg, ${C.purpleMid} 0%, ${C.purpleSoft} 100%)`,
      color:C.purpleSoft,
      boxShadow: disabled ? "none" : `0 4px 16px rgba(187, 125, 235, 0.2)`
    },
    ghost:    {
      background:"none",
      border:"none",
      color:C.textMid,
      fontSize:13,
      padding:"10px 0",
      fontFamily:SANS,
      borderRadius:12,
      boxShadow: "none"
    },
    danger:   {
      background: `linear-gradient(135deg, ${C.red} 0%, ${C.redMid} 100%)`,
      color:C.white,
      boxShadow: disabled ? "none" : `0 4px 16px rgba(192, 57, 43, 0.3)`
    },
    green:    {
      background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenMid} 100%)`,
      color:C.white,
      boxShadow: disabled ? "none" : `0 4px 16px rgba(29, 158, 117, 0.3)`
    },
    teal:     {
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealMid} 100%)`,
      color:C.white,
      boxShadow: disabled ? "none" : `0 4px 16px rgba(0, 151, 167, 0.3)`
    },
  };
  const fire=useCallback(e=>{
    if(disabled)return;
    if(tapped.current)return;
    tapped.current=true;
    setTimeout(()=>{tapped.current=false;},350);
    if(onClick)onClick(e);
  },[onClick,disabled]);
  return(
    <button
      type={type}
      disabled={disabled}
      style={{...base,...vars[variant],...style}}
      onTouchStart={e=>{
        if(!disabled){
          e.currentTarget.style.transform="scale(0.98) translateY(1px)";
          e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.15)";
        }
      }}
      onTouchEnd={e=>{
        if(!disabled){
          e.currentTarget.style.transform="scale(1) translateY(0)";
          e.currentTarget.style.boxShadow=vars[variant].boxShadow || base.boxShadow;
        }
        e.preventDefault();
        fire(e);
      }}
      onMouseEnter={e=>{
        if(!disabled){
          e.currentTarget.style.transform="translateY(-1px)";
          e.currentTarget.style.boxShadow=vars[variant].boxShadow ? vars[variant].boxShadow.replace('0 4px', '0 6px') : "0 6px 20px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={e=>{
        if(!disabled){
          e.currentTarget.style.transform="translateY(0)";
          e.currentTarget.style.boxShadow=vars[variant].boxShadow || base.boxShadow;
        }
      }}
      onClick={e=>{if(!tapped.current)fire(e);}}
    >
      {children}
    </button>
  );
}

function PulsingDot({onClick,color}){
  const c=color||C.purple;
  return(
    <div style={{
      position:"relative",
      width:28,
      height:28,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      cursor:"pointer",
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${c}22 0%, ${c}44 100%)`,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      border: `1px solid ${c}33`,
      transition: "all 0.3s ease"
    }} onClick={onClick}
    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{
        position:"absolute",
        width:28,
        height:28,
        borderRadius:"50%",
        background:`radial-gradient(circle, ${c}66 0%, ${c}33 70%, transparent 100%)`,
        animation:"vPulse 2s ease-out infinite"
      }}/>
      <div style={{
        position:"absolute",
        width:28,
        height:28,
        borderRadius:"50%",
        background:`radial-gradient(circle, ${c}44 0%, ${c}22 70%, transparent 100%)`,
        animation:"vPulse 2s ease-out infinite",
        animationDelay:".8s"
      }}/>
      <div style={{
        position:"relative",
        width:18,
        height:18,
        borderRadius:"50%",
        background: `linear-gradient(135deg, ${c} 0%, ${c}dd 100%)`,
        border:`2px solid ${C.white}`,
        zIndex:1,
        boxShadow: `0 2px 8px ${c}44`
      }}/>
    </div>
  );
}

function Toast({msg,type="info",onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[]);
  const bg  ={info:C.purpleLight,success:C.greenLight,error:C.redLight,warn:C.amberLight}[type]||C.purpleLight;
  const col ={info:C.purple,     success:C.green,     error:C.red,    warn:C.amber}[type]||C.purple;
  return(
    <div style={{
      position:"fixed",
      top:20,
      left:"50%",
      transform:"translateX(-50%)",
      zIndex:600,
      maxWidth:360,
      width:"calc(100% - 40px)",
      animation:"notifDrop .35s cubic-bezier(.22,1,.36,1)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)"
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${bg} 0%, rgba(255,255,255,0.9) 100%)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid rgba(255,255,255,0.3)`,
        borderRadius:16,
        padding:"14px 18px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
        borderLeft: `4px solid ${col}`
      }}>
        <p style={{
          margin:0,
          fontSize:14,
          color:col,
          fontWeight:500,
          lineHeight:1.4,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span style={{
            fontSize: 16,
            opacity: 0.8
          }}>
            {type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️'}
          </span>
          {msg}
        </p>
      </div>
    </div>
  );
}

function useToast(){
  const [toasts,setToasts]=useState([]);
  const addToast=useCallback((msg,type="info")=>{const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);},[]);
  const removeToast=useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)),[]);
  const ToastContainer=()=><>{toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onDone={()=>removeToast(t.id)}/>)}</>;
  return{addToast,ToastContainer};
}

function CheckboxConfirm({checked,hasError,onChange,label}){
  return(
    <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",marginBottom:20,padding:"14px 16px",background:checked?"#E8FBF0":C.white,border:`2px solid ${checked?C.green:hasError?C.red:C.cardBorder}`,borderRadius:14,userSelect:"none"}}
      onTouchEnd={e=>{e.preventDefault();onChange(!checked);}}>
      <div style={{width:22,height:22,borderRadius:7,border:`2.5px solid ${checked?C.green:C.cardBorder}`,background:checked?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
        {checked&&<svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1 5L5 9L12 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{fontSize:14,color:checked?C.green:C.textMid,lineHeight:1.55,fontWeight:checked?500:400}}>{label}</span>
    </label>
  );
}
function Card({children,style={},onClick}){
  return(
    <div
      style={{
        background: `linear-gradient(135deg, ${C.white} 0%, rgba(255,255,255,0.95) 100%)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid rgba(255,255,255,0.2)`,
        borderRadius:16,
        padding:16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
      onClick={onClick}
      onMouseEnter={e => {
        if(onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12), 0 6px 20px rgba(0,0,0,0.08)";
        }
      }}
      onMouseLeave={e => {
        if(onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)";
        }
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({children, style={}}){
  return (
    <p style={{
      margin: 0,
      fontSize: 16,
      fontWeight: 700,
      color: C.text,
      fontFamily: PASSO,
      lineHeight: 1.35,
      ...style
    }}>
      {children}
    </p>
  );
}

function TabBar({options,value,onChange}){
  return (
    <div style={{display:'flex',gap:8,padding:'0 4px',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
      {options.map(({key,label})=> (
        <button key={key} onClick={() => onChange(key)} style={{
          padding: '10px 14px',
          fontSize: 13,
          fontWeight: value === key ? 600 : 400,
          background: 'none',
          border: 'none',
          borderBottom: `2.5px solid ${value === key ? C.tabActive : 'transparent'}`,
          color: value === key ? C.tabActive : C.textMid,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>{label}</button>
      ))}
    </div>
  );
}

function ProfileCard({profile,onClick,onRemove,status}){
  const online = status?.isOnline;
  return (
    <Card onClick={onClick} style={{display:'flex',alignItems:'center',gap:12,padding:14,marginBottom:10}}>
      <div style={{position:'relative'}}>
        <AvatarBubble src={profile.avatarSrc} emoji={profile.emoji||'🌿'} color={profile.avatarColor||C.purpleLight} size={44} />
        {status && <div style={{position:'absolute',bottom:-2,right:-2,width:12,height:12,borderRadius:'50%',background:online?C.green:C.textLight,border:`2px solid ${C.white}`}} />}
      </div>
      <div style={{flex:1}}>
        <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{profile.name}</p>
        <p style={{margin:'2px 0 0',fontSize:12,color:C.purple,fontWeight:500}}>{profile.handle}</p>
        {status && <p style={{margin:'4px 0 0',fontSize:10,color:online?C.green:C.textLight}}>{online?'Online':'Offline'}</p>}
      </div>
      {onRemove && <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{fontSize:12,color:C.textLight,background:'none',border:'none',cursor:'pointer',padding:'6px'}}>remover</button>}
    </Card>
  );
}

function InfoBadge({children, style={}}){
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,background:C.purpleLight,color:C.tabActive,fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:20,...style}}>{children}</span>
  );
}
