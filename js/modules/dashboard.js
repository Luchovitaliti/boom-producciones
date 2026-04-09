// ═══════════════════════════════════════════════════════════
// DASHBOARD — Home overview + gestión de eventos
// ═══════════════════════════════════════════════════════════
function _dc(icon,title,value,sub,color,onclick){
  const bg=color==='green'?'rgba(149,193,31,.1)':color==='yellow'?'rgba(251,191,36,.1)':color==='red'?'rgba(248,113,113,.1)':'var(--bg3)';
  const bc=color==='green'?'rgba(149,193,31,.25)':color==='yellow'?'rgba(251,191,36,.25)':color==='red'?'rgba(248,113,113,.25)':'var(--border)';
  const oc=onclick?` onclick="navigate('${onclick}')" style="cursor:pointer"`:'';
  return`<div class="dcard" style="background:${bg};border-color:${bc}"${oc}>
    <div class="dcard-icon">${icon}</div>
    <div class="dcard-val">${value}</div>
    <div class="dcard-title">${title}</div>
    ${sub?`<div class="dcard-sub">${sub}</div>`:''}
  </div>`;
}
function _dsec(title,cards){
  return`<div class="dsec"><div class="dsec-title">${title}</div><div class="dsec-scroll">${cards}</div></div>`;
}

function pgDash() {
  const isAdmin = CU?.role === 'Admin Console';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = CU?.chatName?.split(' ')[0] || CU?.user || 'Admin';
  const ev = gEv();

  let h = `<div class="dash-home-header">
    <div><div class="ptitle">${saludo}, ${nombre} 👋</div>
    <div class="psub">Panel de control · BOOM Producciones</div></div>
    ${isAdmin ? `<button class="btn btnp btnsm" onclick="openEvModal(null)">+ Nuevo evento</button>` : ''}
  </div>`;

  if (!EVENTOS.length) {
    h += `<div class="card" style="text-align:center;padding:2rem">
      <div style="font-size:40px;margin-bottom:.75rem">🎉</div>
      <div style="font-size:15px;font-weight:500;margin-bottom:.5rem">No hay eventos creados</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:1.25rem">Creá el primer evento para que todos los módulos empiecen a funcionar</div>
      ${isAdmin ? `<button class="btn btnp" onclick="openEvModal(null)">+ Crear primer evento</button>` : ''}
    </div>`;
    return h;
  }

  // ── Countdown card ──
  const proxEvs = EVENTOS.map((e,i)=>({e,i,d:e.fecha?diffDias(e.fecha):999})).filter(x=>x.d>=0).sort((a,b)=>a.d-b.d);
  if (proxEvs.length) {
    const {e,d}=proxEvs[0];
    h += `<div class="event-countdown-card">
      <div>
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Próximo evento</div>
        <div style="font-size:17px;font-weight:600;margin-top:3px">${e.nombre}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:3px">${e.venue?e.venue+' · ':''}${e.fecha?e.fecha.split('-').reverse().join('/'):''}</div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="font-size:${d===0?'40':'48'}px;font-weight:700;color:var(--accent);line-height:1">${d===0?'🎉':d}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${d===0?'Es hoy':d===1?'día':'días'}</div>
      </div>
    </div>`;
  }

  // ── Data gathering ──
  const cfg = EVENTOS[ev]||{};
  const pubA = PUBLICAS.filter(p=>p.activo&&p.evIdx===ev);
  const cumplieron = pubA.filter(p=>tpubs(getAct(ev,p.id))>=(cfg.minPubs||8)).length;
  const pctPub = pubA.length?Math.round(cumplieron/pubA.length*100):0;
  const stockLoaded = STOCK_INI[ev]&&STOCK_INI[ev].some(u=>u>0);
  const stockLow = stockLoaded?PRODS.filter((_,i)=>(STOCK_INI[ev][i]||0)<(PRODS[i]?.umbralBajo||5)).length:0;
  const staffEv = STAFF_EV[ev]||[];
  const staffPend = staffEv.filter(s=>!s.pag).length;
  const trPas = (TRAFIC_PASAJEROS||[]).filter(p=>p.evIdx===ev);
  const trViajes = (TRAFIC_VIAJES||[]).filter(v=>v.evIdx===ev);
  const trIng = trPas.reduce((a,p)=>a+(p.precioCong||0),0);
  const recLotes = (LOTES_REC||[]).filter(l=>l.evIdx===ev&&l.estado!=='anulado');
  const recTotal = recLotes.reduce((a,l)=>a+(l.total||0),0);
  const gadm = GASTOS_ADM||[];
  const gadmPend = gadm.filter(g=>g.estado!=='pagado').length;
  const unread = typeof chatGetTotalUnread==='function'?chatGetTotalUnread():0;

  // ── 1. Alertas ──
  let alertCards = '';
  if (pctPub<40&&pubA.length) alertCards+=_dc('🔴','Campaña en riesgo',pctPub+'%',`Solo ${cumplieron}/${pubA.length} cumplen`,'red','liderpub');
  else if (pctPub<70&&pubA.length) alertCards+=_dc('🟡','Campaña irregular',pctPub+'%',`${cumplieron}/${pubA.length} cumplen`,'yellow','liderpub');
  if (stockLow>0) alertCards+=_dc('📦','Stock bajo',stockLow,`producto${stockLow>1?'s':''} bajo umbral`,'red','barra');
  if (staffPend>0) alertCards+=_dc('💸','Staff sin pagar',staffPend,`de ${staffEv.length} personas`,'yellow','barra');
  if (gadmPend>0) alertCards+=_dc('📋','Gastos pendientes',gadmPend,`de ${gadm.length} total`,'yellow','adminfin');
  if (unread>0) alertCards+=_dc('💬','Mensajes nuevos',unread,`sin leer`,'green','chat');
  if (!alertCards) alertCards=_dc('✅','Todo al día','OK','Sin alertas activas','green');
  h += _dsec('Alertas', alertCards);

  // ── 2. Públicas ──
  let pubCards = '';
  pubCards+=_dc('👩‍🎤','Activas',pubA.length,pubA.length?`${pubA.reduce((a,p)=>a+tpubs(getAct(ev,p.id)),0)} publicaciones`:'Cargá públicas',pubA.length?'green':'','liderpub');
  if (pubA.length) {
    pubCards+=_dc('📊','Cumplimiento',pctPub+'%',`${cumplieron} de ${pubA.length}`,pctPub>=70?'green':pctPub>=40?'yellow':'red','liderpub');
    const tInv=pubA.reduce((a,p)=>a+getAct(ev,p.id).inv,0);
    const tIng=pubA.reduce((a,p)=>a+getAct(ev,p.id).ing,0);
    pubCards+=_dc('🎟','Invitados',tInv,tInv?`${tIng} ingresaron (${tInv?Math.round(tIng/tInv*100):0}%)`:'Sin invitados aún',tIng?'green':'','liderpub');
  }
  h += _dsec('Públicas', pubCards);

  // ── 3. Barra ──
  let barCards = '';
  barCards+=_dc('🍺','Stock',stockLoaded?'Cargado':'Vacío',stockLoaded?`${stockLow?stockLow+' bajo umbral':'Todo OK'}`:' Sin cargar',stockLoaded?(stockLow?'yellow':'green'):'','barra');
  barCards+=_dc('👥','Staff',staffEv.length||'—',staffEv.length?`${staffPend} pago${staffPend!==1?'s':''} pend.`:'Sin staff',staffEv.length?'green':'','barra');
  const cajEv=CAJAS_EV[ev]||[];
  const cajTotal=cajEv.reduce((a,c)=>a+(c.rE||0)+(c.rM||0),0);
  barCards+=_dc('💰','Cajas',cajTotal?fmt(cajTotal):'—',`${cajEv.length} caja${cajEv.length!==1?'s':''}`,cajTotal?'green':'','barra');
  h += _dsec('Barra', barCards);

  // ── 4. Tráfico ──
  let trCards = '';
  trCards+=_dc('🚐','Pasajeros',trPas.length||'—',trPas.length?fmt(trIng)+' recaudado':'Sin pasajeros',trPas.length?'green':'','trafic');
  trCards+=_dc('🗺','Viajes',trViajes.length||'—',trViajes.length?`activos`:'Sin viajes',trViajes.length?'green':'','trafic');
  const trLocs=(TRAFIC_LOCALIDADES||[]).filter(l=>l.evIdx===ev&&l.activa!==false);
  trCards+=_dc('📍','Localidades',trLocs.length||'—',trLocs.length?'configuradas':'Sin localidades',trLocs.length?'green':'','trafic');
  h += _dsec('Tráfico', trCards);

  // ── 5. Caja / Recaudación ──
  let finCards = '';
  finCards+=_dc('🧾','Lotes',recLotes.length||'—',recLotes.length?fmt(recTotal)+' total':'Sin lotes',recLotes.length?'green':'','recaudacion');
  const gadmTot=gadm.reduce((a,g)=>a+(g.monto||0),0);
  finCards+=_dc('📋','Gastos admin',gadm.length||'—',gadm.length?fmt(gadmTot):'Sin gastos',gadm.length?'green':'','adminfin');
  if (isAdmin) {
    const dFin=EV_FIN[ev]||{tickets:{eb:0,ae:0,am:0,taq:0,precio:0},barra:{g:0,c:0}};
    const ing=(dFin.tickets.eb+dFin.tickets.ae+dFin.tickets.am+dFin.tickets.taq)*dFin.tickets.precio+dFin.barra.g;
    const gas=(GASTOS_EV[ev]||[]).reduce((a,g)=>a+g.m,0);
    const res=ing-gas;
    finCards+=_dc('💵','Resultado',ing?fmt(res):'—',ing?`Ing ${fmt(ing)} · Gas ${fmt(gas)}`:'Sin datos de cierre',ing?(res>=0?'green':'red'):'','kpi');
  }
  h += _dsec('Caja / Recaudación', finCards);

  // ── Event management ──
  if (isAdmin) {
    h += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:.5rem">
      <button class="btn btnsm" onclick="openEvModal(${ev})">✏️ Editar evento</button>
      <button class="btn btnsm btnd" onclick="delEvento(${ev})">🗑 Eliminar</button>
    </div>`;
  }

  return h;
}

function buildModuleStatuses() {
  const ev = gEv();
  const s = {};

  // Barra
  const stockOk = STOCK_INI[ev] && STOCK_INI[ev].some(u => u > 0);
  const staffOk = STAFF_EV[ev] && STAFF_EV[ev].length > 0;
  const staffCount = STAFF_EV[ev]?.length || 0;
  const staffPag = (STAFF_EV[ev]||[]).filter(x=>x.pagado).length;
  s.barra = stockOk && staffOk ? {status:'ok',   desc:`${staffCount} staff (${staffPag} pagados) · stock cargado`} :
            stockOk            ? {status:'warn',  desc:'Stock OK · sin staff cargado'} :
                                 {status:'empty', desc:'Stock sin cargar'};

  // Administración — usa GASTOS_ADM (global) + GASTOS_EV (por evento)
  const gadm = GASTOS_ADM || [];
  const gadmTotal = gadm.reduce((a,g)=>a+(g.monto||0),0);
  const gadmPend = gadm.filter(g => g.estado !== 'pagado');
  const gev = GASTOS_EV[ev] || [];
  s.adminfin = gadmPend.length > 0
    ? {status:'warn',  desc:`${gadm.length} gastos · ${fmt(gadmTotal)} · ${gadmPend.length} pendientes`}
    : gadm.length > 0
    ? {status:'ok',    desc:`${gadm.length} gastos · ${fmt(gadmTotal)}`}
    : gev.length > 0
    ? {status:'ok',    desc:`${gev.length} gastos evento`}
    : {status:'empty', desc:'Sin gastos registrados'};

  // Recaudación
  const recLotes = (LOTES_REC||[]).filter(l=>l.evIdx===ev && l.estado!=='anulado');
  const recTotal = recLotes.reduce((a,l)=>a+(l.total||0),0);
  const recCajas = (CAJAS_REC||[]).filter(c=>c.evIdx===ev);
  s.recaudacion = recLotes.length > 0
    ? {status:'ok',   desc:`${fmt(recTotal)} · ${recLotes.length} lotes · ${recCajas.length} cajas`}
    : recCajas.length > 0
    ? {status:'warn', desc:`${recCajas.length} cajas · sin lotes`}
    : {status:'empty', desc:'Sin datos'};

  // Trafic
  const trPas = (TRAFIC_PASAJEROS||[]).filter(p=>p.evIdx===ev);
  const trViajes = (TRAFIC_VIAJES||[]).filter(v=>v.evIdx===ev);
  const trLocs = (TRAFIC_LOCALIDADES||[]).filter(l=>l.evIdx===ev && l.activa!==false);
  const trIngresos = trPas.reduce((a,p)=>a+(p.precioCong||0),0);
  s.trafic = trPas.length > 0
    ? {status:'ok',   desc:`${trPas.length} pasajeros · ${trViajes.length} trafics · ${fmt(trIngresos)}`}
    : trLocs.length > 0
    ? {status:'warn', desc:`${trLocs.length} localidades · sin pasajeros`}
    : {status:'empty', desc:'Sin datos'};

  // Líder Públicas
  const pubA = PUBLICAS.filter(p => p.activo);
  if (!pubA.length) {
    s.liderpub = {status:'empty', desc:'Sin públicas cargadas'};
  } else {
    const cumplieron = pubA.filter(p => tpubs(getAct(ev,p.id)) >= (EVENTOS[ev]?.minPubs||8)).length;
    const pct = Math.round(cumplieron/pubA.length*100);
    s.liderpub = pct>=70 ? {status:'ok',   desc:`${cumplieron}/${pubA.length} cumpliendo (${pct}%)`} :
                 pct>=40 ? {status:'warn',  desc:`${cumplieron}/${pubA.length} cumpliendo (${pct}%)`} :
                           {status:'alert', desc:`Solo ${cumplieron}/${pubA.length} cumpliendo`};
  }

  // Públicas
  s.publicas = pubA.length > 0 ?
    {status:'ok', desc:`${pubA.length} activas · ${pubA.reduce((a,p)=>a+tpubs(getAct(ev,p.id)),0)} pubs`} :
    {status:'empty', desc:'Sin públicas cargadas'};

  // CM
  const postsProx = POSTS.filter(p => diffDias(p.fecha) >= 0).length;
  const tPend = TASKS.filter(t => !t.done).length;
  s.cm = tPend > 5  ? {status:'warn',  desc:`${postsProx} posts · ${tPend} tareas pend.`} :
         postsProx>0 ? {status:'ok',    desc:`${postsProx} posts próximos · ${tPend} tareas`} :
                       {status:'empty', desc:'Sin contenido programado'};

  // BOOM General
  const tareasTeam = TASKS.filter(t => t.vis==='todos' && !t.done).length;
  s.boom = tareasTeam > 5 ? {status:'warn',  desc:`${tareasTeam} tareas pendientes`} :
           IDEAS.length>0  ? {status:'ok',    desc:`${tareasTeam} tareas · ${IDEAS.length} ideas`} :
                             {status:'empty', desc:'Sin tareas ni ideas'};

  // Chat — con no leídos
  const unread = typeof chatGetTotalUnread === 'function' ? chatGetTotalUnread() : 0;
  const totalMsgs = Object.values(CHAT_DATA).reduce((a,c) => a+(c.msgs?.length||0), 0);
  s.chat = unread > 0  ? {status:'alert', desc:`${unread} mensaje${unread>1?'s':''} sin leer`} :
           totalMsgs > 0 ? {status:'ok', desc:`${totalMsgs} mensajes · al día ✓`} :
                           {status:'empty', desc:'Sin mensajes aún'};

  // Proveedores
  s.proveedores = PROVEEDORES.length > 0 ?
    {status:'ok', desc:`${PROVEEDORES.length} proveedores registrados`} :
    {status:'empty', desc:'Sin proveedores'};

  // KPI
  const conDatos = EV_FIN.filter((d,i) => i<EVENTOS.length && (d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)>0).length;
  s.kpi = conDatos > 0 ? {status:'ok',   desc:`${conDatos} evento${conDatos>1?'s':''} con datos reales`} :
          EVENTOS.length>0 ? {status:'warn', desc:'Sin datos de cierre aún'} :
                             {status:'empty', desc:'Sin eventos'};

  // Dev
  const notasPend = (NOTAS_MOD||[]).filter(n=>!n.resuelta).length;
  s.dev = notasPend > 0 ? {status:'warn', desc:`${notasPend} nota${notasPend>1?'s':''} pendientes`} :
                          {status:'ok',   desc:'Sin notas pendientes'};

  // Usuarios
  s.usuarios = USERS.length > 2 ? {status:'ok',   desc:`${USERS.length} usuarios activos`} :
               USERS.length > 1 ? {status:'warn',  desc:`Solo ${USERS.length} usuarios`} :
                                  {status:'warn',  desc:'Solo el admin registrado'};

  return s;
}

function openEvModal(idx) {
  editEvIdx = idx;
  const ev = idx !== null ? EVENTOS[idx] : null;
  document.getElementById('m-ev-ttl').textContent = ev ? 'Editar evento' : 'Nuevo evento';
  document.getElementById('ev-nombre').value = ev?.nombre || '';
  document.getElementById('ev-fecha').value  = ev?.fecha  || '';
  document.getElementById('ev-precio').value = ev?.precio || 0;
  document.getElementById('ev-minpubs').value= ev?.minPubs|| 8;
  document.getElementById('ev-venue').value  = ev?.venue  || '';
  document.getElementById('ev-desc').value   = ev?.desc   || '';
  document.getElementById('m-ev').style.display = 'flex';
}
function saveEvento() {
  const nombre = document.getElementById('ev-nombre').value.trim();
  if (!nombre) { alert('Ingresá el nombre del evento.'); return; }
  const ev = {
    nombre,
    fecha:   document.getElementById('ev-fecha').value,
    precio:  parseFloat(document.getElementById('ev-precio').value) || 0,
    minPubs: parseInt(document.getElementById('ev-minpubs').value) || 8,
    venue:   document.getElementById('ev-venue').value.trim(),
    desc:    document.getElementById('ev-desc').value.trim(),
  };
  if (editEvIdx !== null) {
    EVENTOS[editEvIdx] = ev;
  } else {
    EVENTOS.push(ev);
    ensureEvArrays();
  }
  document.getElementById('m-ev').style.display = 'none';
  fbSaveEventos();
  syncTopbarEventos();
  if (editEvIdx === null) document.getElementById('g-ev').value = EVENTOS.length - 1;
  // Re-sync chat channels with new event
  if (typeof syncChatEventChannels === 'function') syncChatEventChannels();
  renderPage(curPage);
}
function delEvento(idx) {
  if (!confirm(`¿Eliminar "${EVENTOS[idx].nombre}"? Se borrarán todos sus datos.`)) return;
  EVENTOS.splice(idx, 1);
  STOCK_INI.splice(idx,1); STOCK_CIE.splice(idx,1);
  STAFF_EV.splice(idx,1);  CAJAS_EV.splice(idx,1);
  GASTOS_EV.splice(idx,1); EV_FIN.splice(idx,1);
  ACT_EV.splice(idx,1);    BENEF_EV.splice(idx,1); PUB_LOGS.splice(idx,1);
  fbSaveEventos();
  syncTopbarEventos();
  const sel = document.getElementById('g-ev');
  if (sel) sel.value = Math.max(0, idx-1);
  renderPage(curPage);
}
