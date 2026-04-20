// ═══════════════════════════════════════════════════════════
// VEEDA UI PRIMITIVES — veeda-ui.js
// Edite este arquivo para: AvatarBubble, Modal, Btn, Spinner,
// Toast, SkeletonLine, PulsingDot, CheckboxConfirm, useToast
// ═══════════════════════════════════════════════════════════

function AvatarBubble({src,emoji,color,size=38,ring=false}){
  const border=ring?`3px solid ${C.purpleMid}`:`1.5px solid ${C.cardBorder}`;
  if(src)return<img src={src} alt="av" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border,flexShrink:0,display:"block"}}/>;
  return<div style={{width:size,height:size,borderRadius:"50%",background:color||C.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.46,border,flexShrink:0}}>{emoji||"🌿"}</div>;
}

function Spinner({size=18,color=C.purple}){
  return<div style={{width:size,height:size,border:`2.5px solid ${color}33`,borderTop:`2.5px solid ${color}`,borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",verticalAlign:"middle",marginRight:6,flexShrink:0}}/>;
}

function SkeletonLine({w="100%",h=14,r=8,mb=8}){
  return<div className="shimmer" style={{width:w,height:h,borderRadius:r,marginBottom:mb}}/>;
}

function Modal({onClose,title,children,fullHeight=false}){
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  return(
    <div style={{position:"fixed",inset:0,background:C.overlay,display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.white,borderRadius:"20px 20px 0 0",padding:"20px 16px 40px",width:"100%",maxWidth:480,maxHeight:fullHeight?"95vh":"90vh",overflowY:"auto",animation:"slideUp .28s cubic-bezier(.22,1,.36,1)",WebkitOverflowScrolling:"touch"}}>
        {title&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <p style={{margin:0,fontSize:15,fontWeight:600,color:C.text,fontFamily:PASSO}}>{title}</p>
            <button onClick={onClose} style={{background:C.purpleLight,border:"none",borderRadius:"50%",width:30,height:30,color:C.purple,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Btn({onClick,children,style={},disabled=false,variant="primary",type="button"}){
  const tapped=useRef(false);
  const base={width:"100%",padding:"15px 0",border:"none",borderRadius:50,fontFamily:PASSO,fontWeight:600,fontSize:15,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.55:1,transition:"transform .12s,opacity .12s",WebkitTapHighlightColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:6,touchAction:"manipulation"};
  const vars={
    primary:  {background:C.purple,  color:C.white},
    outline:  {background:"transparent",color:C.purple,border:`2px solid ${C.purple}`},
    secondary:{background:C.purpleMid,color:C.purpleSoft},
    ghost:    {background:"none",border:"none",color:C.textMid,fontSize:13,padding:"8px 0",fontFamily:SANS,borderRadius:8},
    danger:   {background:C.red,    color:C.white},
    green:    {background:C.green,  color:C.white},
    teal:     {background:C.teal,   color:C.white},
  };
  const fire=useCallback(e=>{
    if(disabled)return;
    if(tapped.current)return;
    tapped.current=true;
    setTimeout(()=>{tapped.current=false;},350);
    if(onClick)onClick(e);
  },[onClick,disabled]);
  return(
    <button type={type} disabled={disabled} style={{...base,...vars[variant],...style}}
      onTouchStart={e=>{if(!disabled)e.currentTarget.style.transform="scale(0.96)";}}
      onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";e.preventDefault();fire(e);}}
      onClick={e=>{if(!tapped.current)fire(e);}}>
      {children}
    </button>
  );
}

function PulsingDot({onClick,color}){
  const c=color||C.purple;
  return(
    <div style={{position:"relative",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={onClick}>
      <div style={{position:"absolute",width:24,height:24,borderRadius:"50%",background:c+"66",animation:"vPulse 1.8s ease-out infinite"}}/>
      <div style={{position:"absolute",width:24,height:24,borderRadius:"50%",background:c+"44",animation:"vPulse 1.8s ease-out infinite",animationDelay:".6s"}}/>
      <div style={{position:"relative",width:16,height:16,borderRadius:"50%",background:c,border:`3px solid ${C.white}`,zIndex:1}}/>
    </div>
  );
}

function Toast({msg,type="info",onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[]);
  const bg  ={info:C.purpleLight,success:C.greenLight,error:C.redLight,warn:C.amberLight}[type]||C.purpleLight;
  const col ={info:C.purple,     success:C.green,     error:C.red,    warn:C.amber}[type]||C.purple;
  return(
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:600,maxWidth:340,width:"calc(100% - 32px)",animation:"notifDrop .35s cubic-bezier(.22,1,.36,1)"}}>
      <div style={{background:bg,border:`1.5px solid ${col}44`,borderRadius:14,padding:"12px 16px",boxShadow:"0 8px 24px rgba(0,0,0,.14)"}}>
        <p style={{margin:0,fontSize:13,color:col,fontWeight:500,lineHeight:1.5}}>{msg}</p>
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
