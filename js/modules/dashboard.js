// ═══════════════════════════════════════════════════════════
// DASHBOARD — Home overview + gestión de eventos
// ═══════════════════════════════════════════════════════════
function pgDash() {
  const isAdmin = CU?.role === 'Admin Console';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = CU?.chatName?.split(' ')[0] || CU?.user || 'Admin';

  let h = `<div class="dash-home-header">
    <div><div class="ptitle">${saludo}, ${nombre} 👋</div>
    <div class="psub">Panel de control · BOOM Producciones</div></div>
    ${isAdmin ? `<button class="btn btnp btnsm" onclick="openEvModal(null)">+ Nuevo evento</button>` : ''}
  </div>`;

  // Próximo evento countdown
  if (EVENTOS.length) {
    const proxEvs = EVENTOS.map((e,i) => ({e,i,d:e.fecha?diffDias(e.fecha):999}))
      .filter(x => x.d >= 0).sort((a,b) => a.d - b.d);
    if (proxEvs.length) {
      const {e,d} = proxEvs[0];
      h += `<div class="event-countdown-card">
        <div>
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Próximo evento</div>
          <div style="font-size:17px;font-weight:600;margin-top:3px">${e.nombre}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:3px">${e.venue ? e.venue + ' · ' : ''}${e.fecha ? e.fecha.split('-').reverse().join('/') : ''}</div>
        </div>
        <div style="text-align:center;flex-shrink:0">
          <div style="font-size:${d===0?'40':'48'}px;font-weight:700;color:var(--accent);line-height:1">${d === 0 ? '🎉' : d}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${d === 0 ? 'Es hoy' : d === 1 ? 'día' : 'días'}</div>
        </div>
      </div>`;
    }
  } else {
    h += `<div class="card" style="text-align:center;padding:2rem">
      <div style="font-size:40px;margin-bottom:.75rem">🎉</div>
      <div style="font-size:15px;font-weight:500;margin-bottom:.5rem">No hay eventos creados</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:1.25rem">Creá el primer evento para que todos los módulos empiecen a funcionar</div>
      ${isAdmin ? `<button class="btn btnp" onclick="openEvModal(null)">+ Crear primer evento</button>` : ''}
    </div>`;
  }

  // Estado de módulos
  if (EVENTOS.length) {
    h += `<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.75rem">Estado de módulos</div>`;
    h += `<div class="mod-status-grid">`;
    const statuses = buildModuleStatuses();
    const pagesShow = CU.pages.filter(p => p !== 'perfil' && p !== 'dashboard');
    pagesShow.forEach(p => {
      const s = statuses[p] || {status:'empty', desc:'Sin datos'};
      const cls = s.status === 'ok' ? 'ms-ok' : s.status === 'warn' ? 'ms-warn' : s.status === 'alert' ? 'ms-alert' : 'ms-empty';
      const badge = s.status === 'ok' ? '<span class="badge bok" style="font-size:9px">✓ OK</span>' :
                    s.status === 'warn' ? '<span class="badge bwarn" style="font-size:9px">⚠ Revisar</span>' :
                    s.status === 'alert' ? '<span class="badge bdanger" style="font-size:9px">! Urgente</span>' :
                    '<span class="badge bgray" style="font-size:9px">Vacío</span>';
      h += `<div class="mod-status-card ${cls}" onclick="navigate('${p}')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:22px">${PAGE_ICONS[p]}</span>${badge}
        </div>
        <div style="font-size:12px;font-weight:500;margin-bottom:2px">${PAGE_LABELS[p]}</div>
        <div style="font-size:11px;color:var(--text3);line-height:1.4">${s.desc}</div>
      </div>`;
    });
    h += `</div>`;

    // Resumen financiero rápido
    if (isAdmin && EVENTOS.length) {
      const ev = gEv();
      if (ev >= 0 && ev < EVENTOS.length) {
        const d = EV_FIN[ev] || {tickets:{eb:0,ae:0,am:0,taq:0,precio:0},barra:{g:0,c:0}};
        const ing = (d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio + d.barra.g;
        const gas = (GASTOS_EV[ev]||[]).reduce((a,g)=>a+g.m,0);
        const res = ing - gas;
        h += `<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin:.25rem 0 .5rem">
          Resumen · ${EVENTOS[ev].nombre}
        </div>`;
        h += `<div class="mg">
          <div class="met"><div class="ml">Ingresos</div><div class="mv pos">${ing ? fmt(ing) : '—'}</div></div>
          <div class="met"><div class="ml">Gastos</div><div class="mv neg">${gas ? fmt(gas) : '—'}</div></div>
          <div class="met"><div class="ml">Resultado</div><div class="mv ${ing&&res>0?'pos':'neg'}">${ing ? fmt(res) : '—'}</div></div>
          <div class="met"><div class="ml">Públicas</div><div class="mv">${PUBLICAS.filter(p=>p.activo).length}</div></div>
        </div>`;
        // Event management
        h += `<div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btnsm" onclick="openEvModal(${ev})">✏️ Editar evento</button>
          <button class="btn btnsm btnd" onclick="delEvento(${ev})">🗑 Eliminar</button>
        </div>`;
      }
    }
  }

  return h;
}

function buildModuleStatuses() {
  const ev = gEv();
  const s = {};

  // Barra
  const stockOk = STOCK_INI[ev] && STOCK_INI[ev].some(u => u > 0);
  const staffOk = STAFF_EV[ev] && STAFF_EV[ev].length > 0;
  s.barra = stockOk && staffOk ? {status:'ok',   desc:`${STAFF_EV[ev]?.length||0} staff · stock cargado`} :
            stockOk            ? {status:'warn',  desc:'Stock OK · sin staff cargado'} :
                                 {status:'empty', desc:'Stock sin cargar'};

  // Admin Fin
  const gs = GASTOS_EV[ev] || [];
  const pend = gs.filter(g => g.e !== 'pagado').length;
  const aprob = gs.filter(g => g.e === 'aprobacion').length;
  s.adminfin = aprob > 0   ? {status:'alert', desc:`${aprob} gasto${aprob>1?'s':''} en aprobación`} :
               pend > 0    ? {status:'warn',  desc:`${pend} gasto${pend>1?'s':''} pendientes`} :
               gs.length>0 ? {status:'ok',    desc:`${gs.length} gastos registrados`} :
                             {status:'empty', desc:'Sin gastos registrados'};

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

  // Chat
  const totalMsgs = Object.values(CHAT_DATA).reduce((a,c) => a+(c.msgs?.length||0), 0);
  s.chat = totalMsgs > 0 ? {status:'ok', desc:`${totalMsgs} mensajes total`} :
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
