// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function pgDash(){
  if(!EVENTOS.length){
    return`<div class="ptitle">📊 Dashboard</div><div class="psub">Vista del CEO</div>
    <div class="card" style="text-align:center;padding:3rem 1.5rem">
      <div style="font-size:40px;margin-bottom:1rem">🎉</div>
      <div style="font-size:16px;font-weight:500;margin-bottom:.5rem">No hay eventos creados</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:1.5rem">Creá el primer evento para empezar a trabajar</div>
      ${CU?.role==='Admin Console'?`<button class="btn btnp" onclick="openEvModal(null)">+ Crear primer evento</button>`:''}
    </div>`;
  }
  const ev=gEv();if(ev<0||ev>=EVENTOS.length)return'';
  const d=EV_FIN[ev]||{tickets:{eb:0,ae:0,am:0,taq:0,precio:0},barra:{g:0,c:0}};
  const tT=(d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio;
  const ing=tT+d.barra.g;const gas=(GASTOS_EV[ev]||[]).reduce((a,g)=>a+g.m,0);
  const res=ing-gas;const ok=false;
  const pG=(GASTOS_EV[ev]||[]).filter(g=>g.e!=='pagado').length;
  const isAdmin=CU?.role==='Admin Console';
  return`<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
    <div><div class="ptitle">📊 Dashboard</div><div class="psub">${EVENTOS[ev].nombre} — Vista del CEO</div></div>
    ${isAdmin?`<div style="display:flex;gap:6px"><button class="btn btnp btnsm" onclick="openEvModal(null)">+ Nuevo evento</button><button class="btn btnsm" onclick="openEvModal(${ev})">✏️ Editar</button><button class="btn btnsm btnd" onclick="delEvento(${ev})">🗑 Eliminar</button></div>`:''}
  </div>
  <div class="mg">
    <div class="met"><div class="ml">Resultado evento</div><div class="mv ${ok?res>0?'pos':'neg':''}">${ok?fmt(res):'—'}</div><div class="ms">${ok?res>0?'Positivo':'Negativo':'En planificación'}</div></div>
    <div class="met"><div class="ml">Ingresos totales</div><div class="mv pos">${ok?fmt(ing):'—'}</div></div>
    <div class="met"><div class="ml">Gastos registrados</div><div class="mv neg">${fmt(gas)}</div></div>
    <div class="met"><div class="ml">Gastos pendientes</div><div class="mv ${pG?'neg':''}">${pG}</div></div>
    <div class="met"><div class="ml">Tickets vendidos</div><div class="mv">${d.tickets.eb+d.tickets.ae+d.tickets.am+(ok?d.tickets.taq:0)}</div></div>
    <div class="met"><div class="ml">Públicas activas</div><div class="mv">${PUBLICAS.filter(p=>p.activo).length}</div></div>
  </div>
  <div class="card"><div class="ctitle">Ganancia por área</div>
  ${[['Tickets Eventbrite',d.tickets.eb*d.tickets.precio,'#60a5fa'],['Anticipadas efectivo',d.tickets.ae*d.tickets.precio,'#4ade80'],['Anticipadas MP',d.tickets.am*d.tickets.precio,'#a78bfa'],['Taquilla',d.tickets.taq*d.tickets.precio,'#fbbf24'],['Barra',d.barra.g,'#e8d5a3']].map(([l,v,c])=>{
    const mx=Math.max(d.tickets.eb,d.tickets.ae,d.tickets.am,d.tickets.taq)*d.tickets.precio||1;
    return`<div class="bar-row"><span class="bar-lbl">${l}</span><div class="bar-bg"><div class="bar-fill" style="width:${v?Math.min(100,Math.round(v/mx*100)):5}%;background:${c}">${fmt(v)}</div></div></div>`;
  }).join('')}</div>`;
}

function openEvModal(idx){
  editEvIdx=idx;
  const ev=idx!==null?EVENTOS[idx]:null;
  document.getElementById('m-ev-ttl').textContent=ev?'Editar evento':'Nuevo evento';
  document.getElementById('ev-nombre').value=ev?.nombre||'';
  document.getElementById('ev-fecha').value=ev?.fecha||'';
  document.getElementById('ev-precio').value=ev?.precio||0;
  document.getElementById('ev-minpubs').value=ev?.minPubs||8;
  document.getElementById('ev-venue').value=ev?.venue||'';
  document.getElementById('ev-desc').value=ev?.desc||'';
  document.getElementById('m-ev').style.display='flex';
}
function saveEvento(){
  const nombre=document.getElementById('ev-nombre').value.trim();
  if(!nombre){alert('Ingresá el nombre del evento.');return;}
  const ev={
    nombre,
    fecha:document.getElementById('ev-fecha').value,
    precio:parseFloat(document.getElementById('ev-precio').value)||0,
    minPubs:parseInt(document.getElementById('ev-minpubs').value)||8,
    venue:document.getElementById('ev-venue').value.trim(),
    desc:document.getElementById('ev-desc').value.trim(),
  };
  if(editEvIdx!==null){
    EVENTOS[editEvIdx]=ev;
  } else {
    EVENTOS.push(ev);
    ensureEvArrays();
  }
  document.getElementById('m-ev').style.display='none';
  fbSaveEventos();
  syncTopbarEventos();
  // Select new event
  if(editEvIdx===null) document.getElementById('g-ev').value=EVENTOS.length-1;
  renderPage(curPage);
}
function delEvento(idx){
  if(!confirm(`¿Eliminar "${EVENTOS[idx].nombre}"? Se borrarán todos sus datos.`))return;
  EVENTOS.splice(idx,1);
  STOCK_INI.splice(idx,1);STOCK_CIE.splice(idx,1);
  STAFF_EV.splice(idx,1);CAJAS_EV.splice(idx,1);
  GASTOS_EV.splice(idx,1);EV_FIN.splice(idx,1);
  ACT_EV.splice(idx,1);BENEF_EV.splice(idx,1);PUB_LOGS.splice(idx,1);
  fbSaveEventos();
  syncTopbarEventos();
  const sel=document.getElementById('g-ev');
  if(sel) sel.value=Math.max(0,idx-1);
  renderPage(curPage);
}
