// ═══ DATA ═══
let USERS=[
  {user:'ADMIN',role:'Admin Console',chatName:'Lu (CEO)',photo:'',bio:'CEO y fundador de BOOM Producciones.',instagram:'',telefono:'',pages:['dashboard','barra','adminfin','liderpub','publicas','trafic','cm','boom','chat','proveedores','kpi','usuarios','perfil']},
  {user:'BARRA',role:'Barra',chatName:'Líder de Barra',photo:'',bio:'',instagram:'',telefono:'',pages:['barra','chat','perfil']},
  {user:'PUBLICA',role:'Públicas',chatName:'Líder de Públicas',photo:'',bio:'',instagram:'',telefono:'',pages:['liderpub','publicas','boom','chat','perfil']},
  {user:'CM',role:'CM',chatName:'Community Manager',photo:'',bio:'',instagram:'',telefono:'',pages:['cm','boom','chat','perfil']},
  {user:'ADMINFIN',role:'Administración',chatName:'Administración',photo:'',bio:'',instagram:'',telefono:'',pages:['adminfin','proveedores','chat','perfil']},
];
const ALL_PAGES=['dashboard','barra','adminfin','liderpub','publicas','trafic','cm','boom','chat','proveedores','kpi','usuarios','perfil'];
const PAGE_LABELS={dashboard:'Dashboard',barra:'Barra',adminfin:'Administración',liderpub:'Líder Públicas',publicas:'Públicas',trafic:'Trafic',cm:'CM',boom:'BOOM General',chat:'Chat interno',proveedores:'Proveedores',kpi:'Reportes y KPIs',usuarios:'Usuarios',perfil:'Mi perfil'};
const PAGE_ICONS={dashboard:'📊',barra:'🍺',adminfin:'📋',liderpub:'⭐',publicas:'📸',trafic:'🚐',cm:'📅',boom:'🏠',chat:'💬',proveedores:'🤝',kpi:'📈',usuarios:'👥',perfil:'👤'};
const PAGE_SECTIONS={dashboard:'Admin',barra:'Módulos',adminfin:'Módulos',liderpub:'Módulos',publicas:'Módulos',trafic:'Módulos',cm:'Comunicación',boom:'Comunicación',chat:'Comunicación',proveedores:'Admin',kpi:'Admin',usuarios:'Admin',perfil:'Mi cuenta'};

let EVENTOS=[]; // Se carga desde Firebase o queda vacío
const EV_DATES=['2025-03-15','2025-03-22','2025-04-05'];
let EV_FIN=[]; // Se sincroniza con EVENTOS
const PRODS=[
  {n:'Cerveza Quilmes 1L',cat:'Cervezas',uxc:12,pv:1500,pc:800},
  {n:'Cerveza Corona 355ml',cat:'Cervezas',uxc:24,pv:1200,pc:600},
  {n:'Fernet Branca 750ml',cat:'Fernet/Espirituosas',uxc:6,pv:2500,pc:1200},
  {n:'Coca-Cola 500ml',cat:'Gaseosas/Aguas',uxc:24,pv:800,pc:300},
  {n:'Agua sin gas 500ml',cat:'Gaseosas/Aguas',uxc:24,pv:600,pc:200},
  {n:'Sprite 500ml',cat:'Gaseosas/Aguas',uxc:24,pv:800,pc:300},
  {n:'Champagne Chandon 750ml',cat:'Vinos/Champagne',uxc:6,pv:3500,pc:1800},
  {n:'Vino tinto Malbec 750ml',cat:'Vinos/Champagne',uxc:12,pv:2000,pc:900},
];
let STOCK_INI=[];
let STOCK_CIE=[];
let STAFF_EV=[];
let CAJAS_EV=[];
let GASTOS_EV=[];
let PUBLICAS=[];
let ACT_EV=[];
let BENEF_EV=[];
let PUB_LOGS=[[
  {pid:1,tipo:'Story de Instagram',desc:'Cuenta regresiva',ent:3,ts:'20:00'},{pid:1,tipo:'Reel/video',desc:'Teaser',ent:5,ts:'21:00'},
  {pid:2,tipo:'Story de Instagram',desc:'Flyer',ent:4,ts:'19:30'},{pid:3,tipo:'TikTok',desc:'Video promo',ent:1,ts:'21:30'},
  {pid:6,tipo:'Reel/video',desc:'Reel lugar',ent:6,ts:'18:00'},{pid:6,tipo:'Story de Instagram',desc:'Cuenta regresiva',ent:3,ts:'20:00'},
  {pid:4,tipo:'Story de Instagram',desc:'Story',ent:0,ts:'20:00'},{pid:5,tipo:'Story de Instagram',desc:'Story',ent:0,ts:'20:00'},
  {pid:7,tipo:'Story de Instagram',desc:'Flyer',ent:0,ts:'19:00'},{pid:8,tipo:'Story de Instagram',desc:'Story',ent:0,ts:'20:00'},
],[
  {pid:1,tipo:'Story de Instagram',desc:'Promo',ent:2,ts:'19:00'},{pid:2,tipo:'Reel/video',desc:'Reel',ent:7,ts:'20:00'},
  {pid:6,tipo:'TikTok',desc:'TT viral',ent:8,ts:'21:00'},{pid:3,tipo:'Story de Instagram',desc:'Story',ent:0,ts:'20:00'},
],[],];
let POSTS=[];
let TASKS=[];
let IDEAS=[];
let PROVEEDORES=[];
let CUSTOM_CHANNELS=[]; // Canales de chat personalizados (se cargan desde Firebase)
let TRAFIC_ETAPAS=[];      // {id, evIdx, nombre, precio, orden, activa}
let TRAFIC_LOCALIDADES=[];  // {id, evIdx, nombre, activa}
let TRAFIC_VIAJES=[];       // {id, evIdx, locId, numero, capacidad, estado, fechaCreacion, fechaCierre}
let TRAFIC_PASAJEROS=[];    // {id, evIdx, locId, viajeId, etapaId, precioCong, nombre, apellido, dni, telefono, obs, fechaCarga, cargadoPor}
const EV_NOMBRES=['Sunset 15 Mar','Sunset 22 Mar','Fiesta 5 Abr'];
const CHAT_DATA={
  general:{l:'# General',msgs:[]},
  ideas:{l:'# Ideas',msgs:[]},
  barra:{l:'# Barra',msgs:[]},
  cm:{l:'# CM',msgs:[]},
  publicas:{l:'# Públicas',msgs:[]},
  admin:{l:'# Admin',msgs:[]},
  ev0:{l:'# Evento 1',msgs:[]},
  ev1:{l:'# Evento 2',msgs:[]},
  ev2:{l:'# Evento 3',msgs:[]},
};

const HOY=new Date();
let calYear=new Date().getFullYear(),calMonth=new Date().getMonth();
let CU=null,curPage='dashboard',catTarget='',pubTarget=null,actTarget=null,editProvId=null,editUsrIdx=null;
let curCh='general';
let npid=10,ntid=7,niid=5,npvid=7;
const RED_LABEL={ig_feed:'IG Feed',ig_story:'Story',reel:'Reel',tiktok:'TikTok',facebook:'Facebook'};
const RED_CLS={ig_feed:'ce-ig',ig_story:'ce-story',reel:'ce-reel',tiktok:'ce-tiktok',facebook:'ce-ig'};
const AVC=['#e8d5a3','#4ade80','#60a5fa','#f87171','#a78bfa','#fbbf24','#34d399','#fb7185'];

// Estado mutable para modales
let editEvIdx = null;
