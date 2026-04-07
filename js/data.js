// ═══ DATA ═══
// USERS se carga desde Firestore collection 'users'. Este array es fallback vacío.
let USERS=[];
const ALL_PAGES=['dashboard','barra','adminfin','recaudacion','liderpub','publicas','trafic','cm','boom','chat','proveedores','kpi','dev','usuarios','perfil'];
const PAGE_LABELS={dashboard:'Dashboard',barra:'Barra',adminfin:'Administración',recaudacion:'Recaudación',liderpub:'Líder Públicas',publicas:'Públicas',trafic:'Trafic',cm:'CM',boom:'BOOM General',chat:'Chat interno',proveedores:'Proveedores',kpi:'Reportes y KPIs',dev:'🛠 Dev',usuarios:'Usuarios',perfil:'Mi perfil'};
const PAGE_ICONS={dashboard:'📊',barra:'🍺',adminfin:'📋',recaudacion:'💵',liderpub:'⭐',publicas:'📸',trafic:'🚐',cm:'📅',boom:'🏠',chat:'💬',proveedores:'🤝',kpi:'📈',dev:'🛠',usuarios:'👥',perfil:'👤'};
const PAGE_SECTIONS={dashboard:'Admin',barra:'Módulos',adminfin:'Módulos',recaudacion:'Módulos',liderpub:'Módulos',publicas:'Módulos',trafic:'Módulos',cm:'Comunicación',boom:'Comunicación',chat:'Comunicación',proveedores:'Admin',kpi:'Admin',dev:'Admin',usuarios:'Admin',perfil:'Mi cuenta'};

let EVENTOS=[]; // Se carga desde Firebase o queda vacío
const EV_DATES=['2025-03-15','2025-03-22','2025-04-05'];
let EV_FIN=[]; // Se sincroniza con EVENTOS
const PRODS=[
  {n:'Cerveza Quilmes 1L',cat:'Cervezas',uxc:12,pv:1500,pc:800,umbralBien:30,umbralMedio:15,umbralBajo:6},
  {n:'Cerveza Corona 355ml',cat:'Cervezas',uxc:24,pv:1200,pc:600,umbralBien:30,umbralMedio:15,umbralBajo:6},
  {n:'Fernet Branca 750ml',cat:'Fernet/Espirituosas',uxc:6,pv:2500,pc:1200,umbralBien:18,umbralMedio:9,umbralBajo:3},
  {n:'Coca-Cola 500ml',cat:'Gaseosas/Aguas',uxc:24,pv:800,pc:300,umbralBien:36,umbralMedio:18,umbralBajo:6},
  {n:'Agua sin gas 500ml',cat:'Gaseosas/Aguas',uxc:24,pv:600,pc:200,umbralBien:36,umbralMedio:18,umbralBajo:6},
  {n:'Sprite 500ml',cat:'Gaseosas/Aguas',uxc:24,pv:800,pc:300,umbralBien:30,umbralMedio:15,umbralBajo:5},
  {n:'Champagne Chandon 750ml',cat:'Vinos/Champagne',uxc:6,pv:3500,pc:1800,umbralBien:12,umbralMedio:6,umbralBajo:2},
  {n:'Vino tinto Malbec 750ml',cat:'Vinos/Champagne',uxc:12,pv:2000,pc:900,umbralBien:24,umbralMedio:12,umbralBajo:4},
];
let STOCK_INI=[];
let STOCK_CIE=[];
let STAFF_EV=[];
let CAJAS_EV=[];
let GASTOS_EV=[];
let PUBLICAS=[];
let ACT_EV=[];
let BENEF_EV=[];
let PUB_LOGS=[];
let POSTS=[];
let TASKS=[];
let IDEAS=[];
let PROVEEDORES=[];
let CUSTOM_CHANNELS=[]; // Canales de chat personalizados (se cargan desde Firebase)
let GASTOS_ADM=[];    // {id, fecha, cat, tipo, personaNombre, personaId, medio, monto, desc, estado, comprobante, evIdx, obs, ts}
let PERSONAS_ADM=[];  // {id, nombre, tipo:'proveedor'|'empleado', tel, mail, cbu, cuit, dir, obs}
let CAJAS_REC=[];     // {id, evIdx, nombre, tipo, activa, orden, ts}
let NOTAS_MOD=[];     // {id, modulo, texto, user, ts}
let LOTES_REC=[];     // {id, evIdx, cajaId, nroLote, fechaHora, responsableNombre, recaudadorNombre, b20000..b100, total, obs, estado, ts}
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
