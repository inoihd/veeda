// ═══════════════════════════════════════════════════════════
// VEEDA CORE — veeda-core.js
// Edite este arquivo para: constantes, tokens, crypto, storage,
// helpers de data/handle, Google Drive, IndexedDB, notificações
// ═══════════════════════════════════════════════════════════
const {useState,useEffect,useRef,useCallback,useMemo} = React;

// ── App metadata ───────────────────────────────────────────
const APP_VERSION  = "1.3.0";
const DATA_VERSION = 3; // bump quando o schema mudar (aciona migração)

// ── LocalStorage keys ──────────────────────────────────────
const PROFILES_KEY = "veeda_profiles_v2";
const SESSION_KEY  = "veeda_session_v2"; // persiste entre aberturas de app
const REGISTRY_KEY = "veeda_public_registry";
const GDRIVE_KEY   = "veeda_gdrive_token";
const GOOGLE_CLIENT_ID = "377556817223-t88d5ejs7sopv5fftg96j0bq9gdpt18f.apps.googleusercontent.com";
const GDRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GDRIVE_FILE  = "veeda-backup-v2.enc";

// ── Design Tokens ──────────────────────────────────────────
const C = {
  purple:"#9000FF", purpleLight:"#EDE9F6", purpleMid:"#BB7DEB", purpleSoft:"#F9F1FF",
  blue:"#5B7FA6",   blueLight:"#E6EEF8",   blueMid:"#A8C0DA",
  amber:"#D4860A",  amberLight:"#FFF3DC",
  green:"#1D9E75",  greenLight:"#EAFFF8",  greenMid:"#4DB896",
  red:"#C0392B",    redLight:"#FDE8E8",
  pink:"#E91E8C",   pinkLight:"#FDE8F4",
  teal:"#0097A7",   tealLight:"#E0F7FA",
  cardBorder:"#CBC0D3", headerBorder:"#DDD8EE",
  bg:"#EAFFF8",  bgGradEnd:"#FEFEFC", splashBg:"#22FCB7",
  text:"#3A3350", textMid:"#7A7090", textLight:"#ADA8C0",
  white:"#FFFFFF", tabActive:"#7B6FA0",
  overlay:"rgba(40,30,60,0.52)",
};
const PASSO = "'Passo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const SANS  = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Inject Passo font (graceful: fallback to system if unavailable)
(()=>{
  if(document.getElementById("passo-font"))return;
  const l=document.createElement("link");
  l.id="passo-font"; l.rel="stylesheet";
  l.href="https://fonts.googleapis.com/css2?family=Passo:wght@400;600;700&display=swap";
  document.head.appendChild(l);
})();

// ── Data constants ─────────────────────────────────────────
const DAY_COLORS=[
  {label:"Lavanda",bg:"#F7F5FC",dot:"#B8AEDD"},{label:"Pêssego",bg:"#FDF5F0",dot:"#E8B89A"},
  {label:"Menta",bg:"#F0FAF5",dot:"#8FD1B0"},{label:"Céu",bg:"#F0F6FD",dot:"#9ABEDD"},
  {label:"Rosa",bg:"#FDF0F5",dot:"#DDA8C0"},{label:"Baunilha",bg:"#FDFAF0",dot:"#D4C48A"},
  {label:"Cinza",bg:"#F5F5F7",dot:"#ACACBC"},
];
const FEELINGS=[
  {emoji:"😊",label:"Feliz"},{emoji:"😌",label:"Tranquilo"},{emoji:"🥰",label:"Grato"},
  {emoji:"😔",label:"Triste"},{emoji:"😤",label:"Frustrado"},{emoji:"😴",label:"Cansado"},
  {emoji:"🤩",label:"Animado"},{emoji:"😶",label:"Neutro"},
];
const AVATAR_EMOJIS=["🌿","🌸","🌊","🌙","⭐","🦋","🍀","🎵","🌻","🦉","🐾","🌈","🦊","🐬","🌺","🎯","🧩","🪴","🦚","🌵"];
const AVATAR_COLORS=["#EDE9F6","#E6EEF8","#FDF5F0","#F0FAF5","#FDF0F5","#FDFAF0","#F5F5F7"];
const EVENT_TYPES=[
  {id:"show",emoji:"🎵",label:"Show"},{id:"encontro",emoji:"🤝",label:"Encontro"},
  {id:"viagem",emoji:"✈️",label:"Viagem"},{id:"aniversario",emoji:"🎂",label:"Aniversário"},
  {id:"outro",emoji:"📅",label:"Outro"},
];
const DEFAULT_TAGS=[
  {id:"viagem",emoji:"🏖️",label:"Viagem",bg:"#E6F0FD",color:"#5B7FA6"},
  {id:"trabalho",emoji:"💼",label:"Trabalho",bg:"#EDE9F6",color:"#7B6FA0"},
  {id:"gastronomia",emoji:"🍽️",label:"Gastronomia",bg:"#E8FBF0",color:"#1D9E75"},
  {id:"cultura",emoji:"🎵",label:"Cultura",bg:"#FFF3DC",color:"#D4860A"},
  {id:"familia",emoji:"❤️",label:"Família",bg:"#FDE8F0",color:"#C0396A"},
  {id:"natureza",emoji:"🌿",label:"Natureza",bg:"#E8FBF0",color:"#1D9E75"},
  {id:"saude",emoji:"🏃",label:"Saúde",bg:"#E6F0FD",color:"#5B7FA6"},
  {id:"amigos",emoji:"🤝",label:"Amigos",bg:"#EDE9F6",color:"#7B6FA0"},
];
const TYPE_META={
  texto:   {icon:"✏️",fill:C.purple,bg:C.purpleLight},
  foto:    {icon:"📷",fill:C.blue,  bg:C.blueLight},
  video:   {icon:"🎬",fill:C.blue,  bg:C.blueLight},
  link:    {icon:"🔗",fill:C.blue,  bg:C.blueLight},
  videolink:{icon:"▶️",fill:C.blue, bg:C.blueLight},
  musica:  {icon:"🎵",fill:C.green, bg:C.greenLight},
  arte:    {icon:"🎨",fill:C.pink,  bg:C.pinkLight},
  voz:     {icon:"🎙️",fill:C.teal,  bg:C.tealLight},
  evento:  {icon:"📅",fill:C.amber, bg:C.amberLight},
};

// ── Crypto (PBKDF2 key caching) ────────────────────────────
const _keyCache=new Map();
const _deriveKey=async(pw,salt)=>{
  const km=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
};
const _getCachedKey=async(pw,salt)=>{
  const k=pw+"|"+Array.from(salt.slice(0,4)).join("-");
  if(_keyCache.has(k))return _keyCache.get(k);
  const key=await _deriveKey(pw,salt);
  _keyCache.set(k,key);
  return key;
};
const encryptFast=async(obj,key,salt)=>{
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const buf=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(obj)));
  return btoa(JSON.stringify({v:2,salt:Array.from(salt),iv:Array.from(iv),data:Array.from(new Uint8Array(buf))}));
};
const encryptObj=async(obj,pw)=>{
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await _getCachedKey(pw,salt);
  return encryptFast(obj,key,salt);
};
const decryptObj=async(ct,pw)=>{
  const {salt,iv,data}=JSON.parse(atob(ct));
  const saltArr=new Uint8Array(salt);
  const key=await _getCachedKey(pw,saltArr);
  const buf=await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(iv)},key,new Uint8Array(data));
  return {key,salt:saltArr,data:JSON.parse(new TextDecoder().decode(buf))};
};
const hashPw=async pw=>{
  const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("veeda:"+pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
};
const genCode=()=>{
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand=crypto.getRandomValues(new Uint8Array(16));
  const s=Array.from(rand).map(b=>chars[b%chars.length]).join("");
  return `${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}-${s.slice(12,16)}`;
};

// ── Safe localStorage wrapper ──────────────────────────────
const safeLS={
  get:(k,fb=null)=>{try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):fb;}catch{return fb;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}},
  raw:(k)=>{try{return localStorage.getItem(k);}catch{return null;}},
  rawSet:(k,v)=>{try{localStorage.setItem(k,v);return true;}catch{return false;}},
  del:(k)=>{try{localStorage.removeItem(k);}catch{}},
};

// ── Profiles ───────────────────────────────────────────────
const loadProfiles=()=>safeLS.get(PROFILES_KEY,[]);
const saveProfiles=ps=>safeLS.set(PROFILES_KEY,ps);

// ── Session (persiste entre fechamentos do app) ─────────────
const loadSession=()=>safeLS.get(SESSION_KEY,null);
const saveSession=(id,pw)=>safeLS.set(SESSION_KEY,{profileId:id,pw,ts:Date.now()});
const clearSession=()=>safeLS.del(SESSION_KEY);

// ── Monthly snapshot ──────────────────────────────────────
// Sobrescreve o snapshot do mês corrente a cada save (para refletir o estado
// mais recente), mas NUNCA toca em snapshots de meses anteriores — assim
// o usuário nunca perde o histórico do mês atual até fazer backup, e nada
// do passado é apagado.
const saveMonthlySnapshot=(profileId,encBlob)=>{
  const ym=new Date().toISOString().slice(0,7);
  const k=`veeda_snap_${profileId}_${ym}`;
  safeLS.rawSet(k,encBlob);
};
const getMonthlySnapshots=(profileId)=>{
  const out=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(`veeda_snap_${profileId}_`)){out.push({key:k,ym:k.split("_").pop()});}
  }
  return out.sort((a,b)=>b.ym.localeCompare(a.ym));
};
// Recovery: tenta decifrar snapshots (mais recentes primeiro) até achar um válido
const loadLatestSnapshot=async(profileId,password)=>{
  const snaps=getMonthlySnapshots(profileId);
  for(const s of snaps){
    try{
      const raw=safeLS.raw(s.key);
      if(!raw)continue;
      const{key,salt,data}=await decryptObj(raw,password);
      return{key,salt,data,ym:s.ym};
    }catch(e){continue;}
  }
  return null;
};

// ── Public registry (busca local cross-profile) ────────────
const registryAdd=(profile)=>{
  const reg=safeLS.get(REGISTRY_KEY,[]);
  if(!reg.find(p=>p.handle===profile.handle)){
    reg.push({id:profile.id,name:profile.name,handle:profile.handle,emoji:profile.emoji,avatarColor:profile.avatarColor,avatarSrc:profile.avatarSrc||null,ts:Date.now()});
    safeLS.set(REGISTRY_KEY,reg);
  }
};
const registryUpdate=(profile)=>{
  const reg=safeLS.get(REGISTRY_KEY,[]);
  const idx=reg.findIndex(p=>p.id===profile.id);
  if(idx>=0){reg[idx]={...reg[idx],...profile,ts:Date.now()};safeLS.set(REGISTRY_KEY,reg);}
  else registryAdd(profile);
};
const registrySearch=(q)=>{
  if(!q.trim())return[];
  const clean=q.toLowerCase().replace(/^@/,"");
  return safeLS.get(REGISTRY_KEY,[]).filter(p=>p.name.toLowerCase().includes(clean)||(p.handle||"").replace(/^@/,"").includes(clean));
};

// ── Profile card (código cross-device) ────────────────────
const makeProfileCard=(profile)=>{
  const pub={n:profile.name,h:(profile.handle||"").replace(/^@/,""),e:profile.emoji||"🌿",c:profile.avatarColor||C.purpleLight};
  return "vc2_"+btoa(unescape(encodeURIComponent(JSON.stringify(pub))));
};
const parseProfileCard=(code)=>{
  try{
    const t=code.trim();
    if(!t.startsWith("vc2_"))return null;
    const pub=JSON.parse(decodeURIComponent(escape(atob(t.slice(4)))));
    if(!pub.h||!pub.n)return null;
    return{name:pub.n,handle:"@"+pub.h,emoji:pub.e||"🌿",avatarColor:pub.c||C.purpleLight,avatarSrc:null,fromCard:true};
  }catch{return null;}
};

// ── Data schema ────────────────────────────────────────────
const EMPTY_DATA=()=>({
  _v:DATA_VERSION,moments:{},received:[],contacts:[],
  groupName:"Meu Círculo",dayColors:{},dayFeelings:{},
  reminders:[],sharedLog:{},events:[],customTags:[],
  suggestions:[],notifications:[],
  settings:{locationEnabled:false,notificationsEnabled:false},
});
const migrateData=(d)=>{
  if(!d)return EMPTY_DATA();
  let out={...EMPTY_DATA(),...d,_v:DATA_VERSION};
  if((d._v||1)<2&&out.groupName==="Família & Amigos")out.groupName="Meu Círculo";
  if((d._v||1)<3){out.notifications=[];out.settings={locationEnabled:false,notificationsEnabled:false,...(out.settings||{})};}
  return out;
};

// ── Handle utils ───────────────────────────────────────────
const sanitizeHandle=str=>str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_]/g,"").slice(0,20);
const nameToHandle=name=>"@"+sanitizeHandle(name);
const isHandleAvailable=(handle,excludeId)=>{
  const h=handle.replace(/^@/,"");
  return!loadProfiles().find(p=>p.id!==excludeId&&(p.handle||"").replace(/^@/,"")==h);
};

// ── Google Drive ───────────────────────────────────────────
const gdriveAuth=()=>new Promise((res,rej)=>{
  const params=new URLSearchParams({client_id:GOOGLE_CLIENT_ID,redirect_uri:window.location.origin+window.location.pathname,response_type:"token",scope:GDRIVE_SCOPE,state:Math.random().toString(36).slice(2)});
  const popup=window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`,"gauth","width=500,height=600");
  const t=setInterval(()=>{try{if(!popup||popup.closed){clearInterval(t);rej(new Error("Janela fechada."));return;}const hash=popup.location.hash;if(hash&&hash.includes("access_token")){clearInterval(t);popup.close();const p=new URLSearchParams(hash.slice(1));const token={access_token:p.get("access_token"),ts:Date.now()};safeLS.set(GDRIVE_KEY,token);res(token.access_token);}}catch{}},500);
});
const gdriveFindFile=async t=>{const r=await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${GDRIVE_FILE}'&fields=files(id)`,{headers:{Authorization:`Bearer ${t}`}});const d=await r.json();return d.files?.[0]?.id||null;};
const gdriveUpload=async(enc,t)=>{const id=await gdriveFindFile(t);const meta=JSON.stringify({name:GDRIVE_FILE,parents:["appDataFolder"]}),b="vb";const body=`--${b}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: text/plain\r\n\r\n${enc}\r\n--${b}--`;await fetch(id?`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=multipart`:`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,{method:id?"PATCH":"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":`multipart/related; boundary=${b}`},body});};
const gdriveDownload=async t=>{const id=await gdriveFindFile(t);if(!id)return null;const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`,{headers:{Authorization:`Bearer ${t}`}});return r.ok?r.text():null;};

// ── IndexedDB for media blobs ──────────────────────────────
const _idb={db:null};
const openIDB=()=>new Promise((res,rej)=>{
  if(_idb.db){res(_idb.db);return;}
  const req=indexedDB.open("veeda_media_v2",1);
  req.onupgradeneeded=e=>e.target.result.createObjectStore("media",{keyPath:"id"});
  req.onsuccess=e=>{_idb.db=e.target.result;res(e.target.result);};
  req.onerror=()=>rej();
});
const idbSave=async(id,dataUrl)=>{try{const db=await openIDB();db.transaction("media","readwrite").objectStore("media").put({id,dataUrl});}catch{}};
const idbLoad=async id=>{try{const db=await openIDB();return new Promise(res=>{const req=db.transaction("media","readonly").objectStore("media").get(id);req.onsuccess=()=>res(req.result?.dataUrl||null);req.onerror=()=>res(null);});}catch{return null;}};

// ── Notifications ──────────────────────────────────────────
const requestNotifPermission=async()=>{
  if(!("Notification" in window))return false;
  if(Notification.permission==="granted")return true;
  return(await Notification.requestPermission())==="granted";
};
const showNativeNotif=(title,body)=>{
  if(Notification.permission==="granted"){try{new Notification(title,{body,icon:"./icon-192.png"});}catch{}}
};

// ── Date helpers ───────────────────────────────────────────
const getVideoEmbed=url=>{
  const yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);if(yt)return`https://www.youtube.com/embed/${yt[1]}`;
  const v=url.match(/vimeo\.com\/(\d+)/);if(v)return`https://player.vimeo.com/video/${v[1]}`;
  return null;
};
const isVideoLink=url=>!!getVideoEmbed(url);
const fmt=ts=>new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const todayStr=()=>new Date().toISOString().slice(0,10);
const offsetDay=(d,n)=>{const dt=new Date(d+"T12:00:00");dt.setDate(dt.getDate()+n);return dt.toISOString().slice(0,10);};
const fmtLabel=d=>{const t=todayStr(),y=offsetDay(t,-1);if(d===t)return"hoje";if(d===y)return"ontem";const[yr,m,dy]=d.split("-");return new Date(yr,m-1,dy).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});};
const fmtFull=d=>{const[y,m,dy]=d.split("-");return new Date(y,m-1,dy).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});};  {id:"familia",emoji:"❤️",label:"Família",bg:"#FDE8F0",color:"#C0396A"},
  {id:"natureza",emoji:"🌿",label:"Natureza",bg:"#E8FBF0",color:"#1D9E75"},
  {id:"saude",emoji:"🏃",label:"Saúde",bg:"#E6F0FD",color:"#5B7FA6"},
  {id:"amigos",emoji:"🤝",label:"Amigos",bg:"#EDE9F6",color:"#7B6FA0"},
];
const TYPE_META={
  texto:   {icon:"✏️",fill:C.purple,bg:C.purpleLight},
  foto:    {icon:"📷",fill:C.blue,  bg:C.blueLight},
  video:   {icon:"🎬",fill:C.blue,  bg:C.blueLight},
  link:    {icon:"🔗",fill:C.blue,  bg:C.blueLight},
  videolink:{icon:"▶️",fill:C.blue, bg:C.blueLight},
  musica:  {icon:"🎵",fill:C.green, bg:C.greenLight},
  arte:    {icon:"🎨",fill:C.pink,  bg:C.pinkLight},
  voz:     {icon:"🎙️",fill:C.teal,  bg:C.tealLight},
  evento:  {icon:"📅",fill:C.amber, bg:C.amberLight},
};

// ── Crypto (PBKDF2 key caching) ────────────────────────────
const _keyCache=new Map();
const _deriveKey=async(pw,salt)=>{
  const km=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
};
const _getCachedKey=async(pw,salt)=>{
  const k=pw+"|"+Array.from(salt.slice(0,4)).join("-");
  if(_keyCache.has(k))return _keyCache.get(k);
  const key=await _deriveKey(pw,salt);
  _keyCache.set(k,key);
  return key;
};
const encryptFast=async(obj,key,salt)=>{
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const buf=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(obj)));
  return btoa(JSON.stringify({v:2,salt:Array.from(salt),iv:Array.from(iv),data:Array.from(new Uint8Array(buf))}));
};
const encryptObj=async(obj,pw)=>{
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await _getCachedKey(pw,salt);
  return encryptFast(obj,key,salt);
};
const decryptObj=async(ct,pw)=>{
  const {salt,iv,data}=JSON.parse(atob(ct));
  const saltArr=new Uint8Array(salt);
  const key=await _getCachedKey(pw,saltArr);
  const buf=await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(iv)},key,new Uint8Array(data));
  return {key,salt:saltArr,data:JSON.parse(new TextDecoder().decode(buf))};
};
const hashPw=async pw=>{
  const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("veeda:"+pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
};
const genCode=()=>{
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand=crypto.getRandomValues(new Uint8Array(16));
  const s=Array.from(rand).map(b=>chars[b%chars.length]).join("");
  return `${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}-${s.slice(12,16)}`;
};

// ── Safe localStorage wrapper ──────────────────────────────
const safeLS={
  get:(k,fb=null)=>{try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):fb;}catch{return fb;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}},
  raw:(k)=>{try{return localStorage.getItem(k);}catch{return null;}},
  rawSet:(k,v)=>{try{localStorage.setItem(k,v);return true;}catch{return false;}},
  del:(k)=>{try{localStorage.removeItem(k);}catch{}},
};

// ── Profiles ───────────────────────────────────────────────
const loadProfiles=()=>safeLS.get(PROFILES_KEY,[]);
const saveProfiles=ps=>safeLS.set(PROFILES_KEY,ps);

// ── Session (persiste entre fechamentos do app) ─────────────
const loadSession=()=>safeLS.get(SESSION_KEY,null);
const saveSession=(id,pw)=>safeLS.set(SESSION_KEY,{profileId:id,pw,ts:Date.now()});
const clearSession=()=>safeLS.del(SESSION_KEY);

// ── Monthly snapshot (nunca sobrescreve — protege histórico) ─
const saveMonthlySnapshot=(profileId,encBlob)=>{
  const ym=new Date().toISOString().slice(0,7);
  const k=`veeda_snap_${profileId}_${ym}`;
  if(!safeLS.raw(k)){safeLS.rawSet(k,encBlob);}
};
const getMonthlySnapshots=(profileId)=>{
  const out=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(`veeda_snap_${profileId}_`)){out.push({key:k,ym:k.split("_").pop()});}
  }
  return out.sort((a,b)=>b.ym.localeCompare(a.ym));
};

// ── Public registry (busca local cross-profile) ────────────
const registryAdd=(profile)=>{
  const reg=safeLS.get(REGISTRY_KEY,[]);
  if(!reg.find(p=>p.handle===profile.handle)){
    reg.push({id:profile.id,name:profile.name,handle:profile.handle,emoji:profile.emoji,avatarColor:profile.avatarColor,avatarSrc:profile.avatarSrc||null,ts:Date.now()});
    safeLS.set(REGISTRY_KEY,reg);
  }
};
const registryUpdate=(profile)=>{
  const reg=safeLS.get(REGISTRY_KEY,[]);
  const idx=reg.findIndex(p=>p.id===profile.id);
  if(idx>=0){reg[idx]={...reg[idx],...profile,ts:Date.now()};safeLS.set(REGISTRY_KEY,reg);}
  else registryAdd(profile);
};
const registrySearch=(q)=>{
  if(!q.trim())return[];
  const clean=q.toLowerCase().replace(/^@/,"");
  return safeLS.get(REGISTRY_KEY,[]).filter(p=>p.name.toLowerCase().includes(clean)||(p.handle||"").replace(/^@/,"").includes(clean));
};

// ── Profile card (código cross-device) ────────────────────
const makeProfileCard=(profile)=>{
  const pub={n:profile.name,h:(profile.handle||"").replace(/^@/,""),e:profile.emoji||"🌿",c:profile.avatarColor||C.purpleLight};
  return "vc2_"+btoa(unescape(encodeURIComponent(JSON.stringify(pub))));
};
const parseProfileCard=(code)=>{
  try{
    const t=code.trim();
    if(!t.startsWith("vc2_"))return null;
    const pub=JSON.parse(decodeURIComponent(escape(atob(t.slice(4)))));
    if(!pub.h||!pub.n)return null;
    return{name:pub.n,handle:"@"+pub.h,emoji:pub.e||"🌿",avatarColor:pub.c||C.purpleLight,avatarSrc:null,fromCard:true};
  }catch{return null;}
};

// ── Data schema ────────────────────────────────────────────
const EMPTY_DATA=()=>({
  _v:DATA_VERSION,moments:{},received:[],contacts:[],
  groupName:"Meu Círculo",dayColors:{},dayFeelings:{},
  reminders:[],sharedLog:{},events:[],customTags:[],
  suggestions:[],notifications:[],
  settings:{locationEnabled:false,notificationsEnabled:false},
});
const migrateData=(d)=>{
  if(!d)return EMPTY_DATA();
  let out={...EMPTY_DATA(),...d,_v:DATA_VERSION};
  if((d._v||1)<2&&out.groupName==="Família & Amigos")out.groupName="Meu Círculo";
  if((d._v||1)<3){out.notifications=[];out.settings={locationEnabled:false,notificationsEnabled:false,...(out.settings||{})};}
  return out;
};

// ── Handle utils ───────────────────────────────────────────
const sanitizeHandle=str=>str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_]/g,"").slice(0,20);
const nameToHandle=name=>"@"+sanitizeHandle(name);
const isHandleAvailable=(handle,excludeId)=>{
  const h=handle.replace(/^@/,"");
  return!loadProfiles().find(p=>p.id!==excludeId&&(p.handle||"").replace(/^@/,"")==h);
};

// ── Google Drive ───────────────────────────────────────────
const gdriveAuth=()=>new Promise((res,rej)=>{
  const params=new URLSearchParams({client_id:GOOGLE_CLIENT_ID,redirect_uri:window.location.origin+window.location.pathname,response_type:"token",scope:GDRIVE_SCOPE,state:Math.random().toString(36).slice(2)});
  const popup=window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`,"gauth","width=500,height=600");
  const t=setInterval(()=>{try{if(!popup||popup.closed){clearInterval(t);rej(new Error("Janela fechada."));return;}const hash=popup.location.hash;if(hash&&hash.includes("access_token")){clearInterval(t);popup.close();const p=new URLSearchParams(hash.slice(1));const token={access_token:p.get("access_token"),ts:Date.now()};safeLS.set(GDRIVE_KEY,token);res(token.access_token);}}catch{}},500);
});
const gdriveFindFile=async t=>{const r=await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${GDRIVE_FILE}'&fields=files(id)`,{headers:{Authorization:`Bearer ${t}`}});const d=await r.json();return d.files?.[0]?.id||null;};
const gdriveUpload=async(enc,t)=>{const id=await gdriveFindFile(t);const meta=JSON.stringify({name:GDRIVE_FILE,parents:["appDataFolder"]}),b="vb";const body=`--${b}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: text/plain\r\n\r\n${enc}\r\n--${b}--`;await fetch(id?`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=multipart`:`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,{method:id?"PATCH":"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":`multipart/related; boundary=${b}`},body});};
const gdriveDownload=async t=>{const id=await gdriveFindFile(t);if(!id)return null;const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`,{headers:{Authorization:`Bearer ${t}`}});return r.ok?r.text():null;};

// ── IndexedDB for media blobs ──────────────────────────────
const _idb={db:null};
const openIDB=()=>new Promise((res,rej)=>{
  if(_idb.db){res(_idb.db);return;}
  const req=indexedDB.open("veeda_media_v2",1);
  req.onupgradeneeded=e=>e.target.result.createObjectStore("media",{keyPath:"id"});
  req.onsuccess=e=>{_idb.db=e.target.result;res(e.target.result);};
  req.onerror=()=>rej();
});
const idbSave=async(id,dataUrl)=>{try{const db=await openIDB();db.transaction("media","readwrite").objectStore("media").put({id,dataUrl});}catch{}};
const idbLoad=async id=>{try{const db=await openIDB();return new Promise(res=>{const req=db.transaction("media","readonly").objectStore("media").get(id);req.onsuccess=()=>res(req.result?.dataUrl||null);req.onerror=()=>res(null);});}catch{return null;}};

// ── Notifications ──────────────────────────────────────────
const requestNotifPermission=async()=>{
  if(!("Notification" in window))return false;
  if(Notification.permission==="granted")return true;
  return(await Notification.requestPermission())==="granted";
};
const showNativeNotif=(title,body)=>{
  if(Notification.permission==="granted"){try{new Notification(title,{body,icon:"./icon-192.png"});}catch{}}
};

// ── Date helpers ───────────────────────────────────────────
const getVideoEmbed=url=>{
  const yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);if(yt)return`https://www.youtube.com/embed/${yt[1]}`;
  const v=url.match(/vimeo\.com\/(\d+)/);if(v)return`https://player.vimeo.com/video/${v[1]}`;
  return null;
};
const isVideoLink=url=>!!getVideoEmbed(url);
const fmt=ts=>new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const todayStr=()=>new Date().toISOString().slice(0,10);
const offsetDay=(d,n)=>{const dt=new Date(d+"T12:00:00");dt.setDate(dt.getDate()+n);return dt.toISOString().slice(0,10);};
const fmtLabel=d=>{const t=todayStr(),y=offsetDay(t,-1);if(d===t)return"hoje";if(d===y)return"ontem";const[yr,m,dy]=d.split("-");return new Date(yr,m-1,dy).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});};
const fmtFull=d=>{const[y,m,dy]=d.split("-");return new Date(y,m-1,dy).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});};
