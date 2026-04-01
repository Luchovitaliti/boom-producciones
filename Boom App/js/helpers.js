// ═══ HELPERS ═══
const fmt=n=>'$'+Math.round(n).toLocaleString('es-AR');
const ini=s=>s.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const avs=i=>`background:${AVC[i%8]}22;color:${AVC[i%8]}`;
const gEv=()=>{const v=parseInt(document.getElementById('g-ev')?.value);return isNaN(v)?0:v;};
const dateStr=d=>d.toISOString().split('T')[0];
function diffDias(s){const t=new Date(s.replace(/-/g,'/'));const h=new Date(HOY);h.setHours(0,0,0,0);t.setHours(0,0,0,0);return Math.round((t-h)/864e5);}
function diasLabel(d){return d===0?'Hoy':d===1?'Mañana':d===-1?'Ayer':d<0?`Hace ${Math.abs(d)}d`:`En ${d}d`;}
function getAct(ev,pid){return ACT_EV[ev]?.[pid]||{stories:0,reels:0,tiktok:0,inv:0,ing:0,actitud:'media',obs:''};}
function tpubs(a){return(a.stories||0)+(a.reels||0)+(a.tiktok||0);}
function nivel(ev,pid){const a=getAct(ev,pid);const tp=tpubs(a);const m=EVENTOS[ev].minPubs;if(tp>=m&&a.inv>=10&&a.actitud==='alta')return'top';if(tp>=m&&a.actitud!=='baja')return'activa';if(tp>=Math.ceil(m*.6))return'floja';return'descartable';}
const NVL={top:'🔥 TOP',activa:'⚡ Activa',floja:'🟡 Floja',descartable:'❌ Descartable'};
const NVC={top:'bgold',activa:'bok',floja:'bwarn',descartable:'bdanger'};
function openTab(prefix,id){
  document.querySelectorAll(`[id^="${prefix}-"]`).forEach(el=>{if(el.classList.contains('tsec'))el.classList.remove('active');});
  const el=document.getElementById(`${prefix}-${id}`);if(el)el.classList.add('active');
  document.querySelectorAll('.tbtn').forEach(b=>{const o=b.getAttribute('onclick');if(o)b.classList.toggle('active',o.includes(`'${id}'`)||o.includes(`"${id}"`));});
  if(id==='gastos')afLoadGastos?.();
  if(id==='aprob')afLoadAprob?.();
}

// Inicializar arrays por evento
function ensureEvArrays(){
  while(STOCK_INI.length<EVENTOS.length){STOCK_INI.push(Array(PRODS.length).fill(0));}
  while(STOCK_CIE.length<EVENTOS.length){STOCK_CIE.push(Array(PRODS.length).fill(null));}
  while(STAFF_EV.length<EVENTOS.length){STAFF_EV.push([]);}
  while(CAJAS_EV.length<EVENTOS.length){CAJAS_EV.push([{fE:0,fM:0,rE:0,rM:0},{fE:0,fM:0,rE:0,rM:0},{fE:0,fM:0,rE:0,rM:0}]);}
  while(GASTOS_EV.length<EVENTOS.length){GASTOS_EV.push([]);}
  while(EV_FIN.length<EVENTOS.length){EV_FIN.push({tickets:{eb:0,ae:0,am:0,taq:0,precio:0},barra:{g:0,c:0}});}
  while(ACT_EV.length<EVENTOS.length){ACT_EV.push({});}
  while(BENEF_EV.length<EVENTOS.length){BENEF_EV.push({});}
  while(PUB_LOGS.length<EVENTOS.length){PUB_LOGS.push([]);}
}
function syncTopbarEventos(){
  const sel=document.getElementById('g-ev');if(!sel)return;
  sel.innerHTML=EVENTOS.length?EVENTOS.map((e,i)=>`<option value="${i}">${e.nombre}</option>`).join(''):'<option value="">Sin eventos</option>';
}
function fbSaveEventos(){if(window._fbOK)window.fbSave.eventos?.();}

// ═══ TAB HELPER ═══
function makeTabs(prefix,tabs,first){
  const nav=tabs.map(t=>`<button class="tbtn${t.id===first?' active':''}" onclick="openTab('${prefix}','${t.id}')">${t.l}</button>`).join('');
  const secs=tabs.map(t=>`<div id="${prefix}-${t.id}" class="tsec${t.id===first?' active':''}"></div>`).join('');
  return`<div class="tnav">${nav}</div>${secs}`;
}
