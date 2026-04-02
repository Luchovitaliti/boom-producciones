// ═══════════════════════════════════════════════════════════
// TRAFIC
// ═══════════════════════════════════════════════════════════

// ─── State ───
let trView    = 'main';  // 'main' | 'loc' | 'viaje'
let trLocId   = null;
let trViajeId = null;
let trCurEv   = -1;

// ─── Helpers ───
function trIsAdmin(){ return CU?.role === 'Admin Console'; }

function trGetEtapaActiva(ev){
  return (TRAFIC_ETAPAS||[]).find(e=>e.evIdx===ev && e.activa);
}
function trGetViajesLoc(ev,locId){
  return (TRAFIC_VIAJES||[]).filter(v=>v.evIdx===ev && v.locId===locId);
}
function trGetPasViaje(ev,viajeId){
  return (TRAFIC_PASAJEROS||[]).filter(p=>p.evIdx===ev && p.viajeId===viajeId);
}
function trGetPasLoc(ev,locId){
  return (TRAFIC_PASAJEROS||[]).filter(p=>p.evIdx===ev && p.locId===locId);
}
function trGetAllPas(ev){
  return (TRAFIC_PASAJEROS||[]).filter(p=>p.evIdx===ev);
}
function trGetLocs(ev){
  return (TRAFIC_LOCALIDADES||[]).filter(l=>l.evIdx===ev && l.activa!==false);
}
function trNextId(arr){
  if(!arr||!arr.length) return 1;
  return Math.max(...arr.map(x=>x.id||0))+1;
}
function trFmt(n){ return '$'+(n||0).toLocaleString('es-AR'); }
function trSaveFB(ev){ if(window._fbOK) window.fbSave.trafic?.(ev); }

// ─── Page entry ───
function pgTrafic(){
  if(!EVENTOS.length)
    return `<div class="ptitle">🚐 Trafic</div><div class="empty">Creá un evento primero para usar este módulo.</div>`;
  return `<div class="ptitle">🚐 Trafic</div><div id="tr-wrap"></div>`;
}
function initTrafic(){
  const ev=gEv();
  if(trCurEv!==ev){ trView='main'; trLocId=null; trViajeId=null; trCurEv=ev; }
  trRender();
}
function trRender(){
  const el=document.getElementById('tr-wrap'); if(!el) return;
  const ev=gEv(); const adm=trIsAdmin();
  if(trView==='viaje' && trViajeId!==null) el.innerHTML=trHtmlViaje(ev,adm);
  else if(trView==='loc' && trLocId!==null) el.innerHTML=trHtmlLoc(ev,adm);
  else el.innerHTML=trHtmlMain(ev,adm);
}

// ═══════════ MAIN VIEW ═══════════
function trHtmlMain(ev,adm){
  const locs=trGetLocs(ev);
  const etapaActiva=trGetEtapaActiva(ev);
  const etapas=(TRAFIC_ETAPAS||[]).filter(e=>e.evIdx===ev).sort((a,b)=>a.orden-b.orden);

  let h=`<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:1rem">
    <div style="font-size:13px;color:var(--text2)">${EVENTOS[ev]?.nombre||''}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${adm?`<button class="btn btnp btnsm" onclick="trOpenLocModal()">+ Localidad</button>`:''}
      <button class="btn btnsm" onclick="trExportEvento(${ev})">⬇ CSV Evento</button>
    </div>
  </div>`;

  // Etapas card (admin full, others summary)
  if(adm){
    h+=`<div class="card" style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <div class="ctitle" style="margin:0">Etapas de precio</div>
        <button class="btn btnp btnsm" onclick="trOpenEtapaModal()">+ Etapa</button>
      </div>`;
    if(!etapas.length){
      h+=`<div class="empty">Sin etapas. Creá la primera etapa para poder cargar pasajeros.</div>`;
    } else {
      h+=`<table><thead><tr><th>Etapa</th><th>Precio</th><th>Estado</th><th></th></tr></thead><tbody>`;
      etapas.forEach(e=>{
        h+=`<tr>
          <td style="font-weight:500">${e.nombre}</td>
          <td>${trFmt(e.precio)}</td>
          <td><span class="badge ${e.activa?'bok':'bgray'}">${e.activa?'Activa ✓':'Inactiva'}</span></td>
          <td style="display:flex;gap:4px">
            ${!e.activa?`<button class="btn btnsm btnp" onclick="trActivarEtapa(${e.id},${ev})">Activar</button>`:''}
            <button class="btn btnsm" style="color:var(--red)" onclick="trDelEtapa(${e.id},${ev})">✕</button>
          </td></tr>`;
      });
      h+=`</tbody></table>`;
    }
    h+=`</div>`;
  } else {
    if(etapaActiva){
      h+=`<div style="margin-bottom:.75rem"><span class="badge bok">Etapa activa: ${etapaActiva.nombre} — ${trFmt(etapaActiva.precio)}</span></div>`;
    } else {
      h+=`<div style="margin-bottom:.75rem"><span class="badge bdanger">Sin etapa activa — no se pueden cargar pasajeros</span></div>`;
    }
  }

  // Localidades
  if(!locs.length){
    h+=`<div class="empty">Sin localidades.${adm?' Agregá una para empezar.':' El administrador debe agregar localidades.'}</div>`;
  } else {
    h+=`<div class="tr-loc-grid">`;
    locs.forEach(loc=>{
      const viajes=trGetViajesLoc(ev,loc.id);
      const pas=trGetPasLoc(ev,loc.id);
      const lastViaje=viajes[viajes.length-1];
      const estaLlena=lastViaje?.estado==='llena';
      const totalCap=viajes.reduce((a,v)=>a+(v.capacidad||0),0);
      const pct=totalCap?Math.round(pas.length/totalCap*100):0;
      const statusBadge=!viajes.length
        ?`<span class="badge bgray">Sin trafic</span>`
        :estaLlena
        ?`<span class="badge bdanger">Trafic ${lastViaje.numero} llena</span>`
        :`<span class="badge bwarn">Trafic ${lastViaje.numero} en curso</span>`;
      h+=`<div class="tr-loc-card" onclick="trGoLoc(${loc.id})">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
          <div style="font-size:15px;font-weight:600">${loc.nombre}</div>
          ${adm?`<button class="btn btnsm" style="font-size:10px;padding:2px 6px" onclick="event.stopPropagation();trDelLoc(${loc.id},${ev})">✕</button>`:''}
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:.5rem">${viajes.length} trafic${viajes.length!==1?'s':''} · ${pas.length} pasajero${pas.length!==1?'s':''}</div>
        ${statusBadge}
        ${totalCap?`<div class="progbg" style="margin-top:8px"><div class="progfill" style="width:${Math.min(100,pct)}%;background:var(--accent)"></div></div>`:''}
      </div>`;
    });
    h+=`</div>`;
  }
  return h;
}

// ═══════════ LOCALIDAD VIEW ═══════════
function trHtmlLoc(ev,adm){
  const loc=(TRAFIC_LOCALIDADES||[]).find(l=>l.id===trLocId);
  if(!loc) return '<div class="empty">Localidad no encontrada.</div>';
  const viajes=trGetViajesLoc(ev,trLocId);
  const lastViaje=viajes[viajes.length-1];
  const canAdd=!lastViaje||lastViaje.estado==='llena';

  let h=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
    <button class="btn btnsm" onclick="trGoMain()">← Volver</button>
    <div style="font-size:15px;font-weight:600">${loc.nombre}</div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-bottom:.75rem">
    ${canAdd?`<button class="btn btnp btnsm" onclick="trOpenViajeModal(${loc.id})">+ Nueva trafic</button>`:''}
    <button class="btn btnsm" onclick="trExportLoc(${ev},${loc.id})">⬇ CSV Localidad</button>
  </div>`;

  if(!viajes.length){
    h+=`<div class="empty">Sin trafics. ${canAdd?'Creá la primera.':''}</div>`;
    return h;
  }

  viajes.slice().reverse().forEach(v=>{
    const pas=trGetPasViaje(ev,v.id);
    const pct=v.capacidad?Math.min(100,Math.round(pas.length/v.capacidad*100)):0;
    const libre=Math.max(0,(v.capacidad||0)-pas.length);
    const ingresos=pas.reduce((a,p)=>a+(p.precioCong||0),0);
    h+=`<div class="tr-viaje-card" onclick="trGoViaje(${v.id})">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
        <div style="font-size:14px;font-weight:600">Trafic N° ${v.numero}</div>
        <span class="badge ${v.estado==='llena'?'bdanger':'bok'}">${v.estado==='llena'?'Llena':'En curso'}</span>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:.5rem">${pas.length}/${v.capacidad} pasajeros · ${libre} libre${libre!==1?'s':''} · ${trFmt(ingresos)}</div>
      <div class="progbg"><div class="progfill" style="width:${pct}%;background:${pct>=100?'var(--red)':pct>=80?'var(--yellow)':'var(--accent)'}"></div></div>
    </div>`;
  });
  return h;
}

// ═══════════ VIAJE VIEW ═══════════
function trHtmlViaje(ev,adm){
  const viaje=(TRAFIC_VIAJES||[]).find(v=>v.id===trViajeId);
  if(!viaje) return '<div class="empty">Trafic no encontrada.</div>';
  const loc=(TRAFIC_LOCALIDADES||[]).find(l=>l.id===viaje.locId);
  const pas=trGetPasViaje(ev,trViajeId);
  const libre=Math.max(0,(viaje.capacidad||0)-pas.length);
  const ingresos=pas.reduce((a,p)=>a+(p.precioCong||0),0);

  let h=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:1rem">
    <button class="btn btnsm" onclick="trGoLoc(${viaje.locId})">← ${loc?.nombre||'Volver'}</button>
    <div style="font-size:15px;font-weight:600">Trafic N° ${viaje.numero}</div>
    <span class="badge ${viaje.estado==='llena'?'bdanger':'bok'}">${viaje.estado==='llena'?'Llena':'En curso'}</span>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem">
    ${viaje.estado!=='llena'&&libre>0?`<button class="btn btnp btnsm" onclick="trOpenPasModal()">+ Pasajero</button>`:''}
    ${viaje.estado!=='llena'?`<button class="btn btnsm" style="color:var(--red)" onclick="trMarcarLlena(${viaje.id},${ev})">🔒 Marcar llena</button>`:''}
    <button class="btn btnsm" onclick="trExportViaje(${ev},${viaje.id})">⬇ CSV</button>
  </div>`;

  h+=`<div class="mg" style="margin-bottom:1rem">
    <div class="met"><div class="ml">Capacidad</div><div class="mv">${viaje.capacidad}</div></div>
    <div class="met"><div class="ml">Pasajeros</div><div class="mv">${pas.length}</div></div>
    <div class="met"><div class="ml">Lugares libres</div><div class="mv ${libre<=2?'neg':''}">${libre}</div></div>
    <div class="met"><div class="ml">Recaudado</div><div class="mv pos">${trFmt(ingresos)}</div></div>
  </div>`;

  if(!pas.length){
    h+=`<div class="empty">Sin pasajeros cargados aún.</div>`;
    return h;
  }

  h+=`<div class="card"><div class="ctitle">Pasajeros (${pas.length})</div>
    <table><thead><tr><th>#</th><th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Etapa</th><th>Precio</th>${adm?'<th></th>':''}</tr></thead><tbody>`;
  pas.forEach((p,i)=>{
    const etaNombre=(TRAFIC_ETAPAS||[]).find(e=>e.id===p.etapaId)?.nombre||'—';
    h+=`<tr>
      <td style="color:var(--text3);font-size:11px">${i+1}</td>
      <td style="font-weight:500">${p.nombre} ${p.apellido}</td>
      <td>${p.dni}</td>
      <td>${p.telefono||'—'}</td>
      <td><span class="badge bgray" style="font-size:10px">${etaNombre}</span></td>
      <td>${trFmt(p.precioCong)}</td>
      ${adm?`<td><button class="btn btnsm" style="color:var(--red);font-size:10px" onclick="trDelPas(${p.id},${ev})">✕</button></td>`:''}
    </tr>`;
  });
  h+=`</tbody></table></div>`;
  return h;
}

// ═══════════ Navigation ═══════════
function trGoMain(){ trView='main'; trLocId=null; trViajeId=null; trRender(); }
function trGoLoc(locId){ trView='loc'; trLocId=locId; trViajeId=null; trRender(); }
function trGoViaje(viajeId){ trView='viaje'; trViajeId=viajeId; trRender(); }

// ═══════════ Modal openers ═══════════
function trOpenLocModal(){
  document.getElementById('tr-loc-nombre').value='';
  document.getElementById('m-tr-loc').style.display='flex';
}
function trOpenEtapaModal(){
  document.getElementById('tr-eta-nombre').value='';
  document.getElementById('tr-eta-precio').value='';
  document.getElementById('m-tr-etapa').style.display='flex';
}
function trOpenViajeModal(locId){
  trLocId=locId;
  const ev=gEv();
  const viajes=trGetViajesLoc(ev,locId);
  document.getElementById('tr-viaje-num').textContent=viajes.length+1;
  document.getElementById('tr-viaje-cap').value=15;
  document.getElementById('m-tr-viaje').style.display='flex';
}
function trOpenPasModal(){
  const ev=gEv();
  const eta=trGetEtapaActiva(ev);
  if(!eta){ alert('No hay etapa activa.'+(trIsAdmin()?' Activá una etapa primero desde el panel principal.':' Pedile al administrador que active una etapa.')); return; }
  const viaje=(TRAFIC_VIAJES||[]).find(v=>v.id===trViajeId);
  if(!viaje) return;
  const pas=trGetPasViaje(ev,trViajeId);
  if(pas.length>=(viaje.capacidad||0)){ alert('La trafic está llena.'); return; }
  document.getElementById('tr-pas-nombre').value='';
  document.getElementById('tr-pas-apellido').value='';
  document.getElementById('tr-pas-dni').value='';
  document.getElementById('tr-pas-tel').value='';
  document.getElementById('tr-pas-obs').value='';
  document.getElementById('tr-pas-etapa').textContent=eta.nombre+' — '+trFmt(eta.precio);
  document.getElementById('tr-pas-err').textContent='';
  document.getElementById('m-tr-pas').style.display='flex';
  setTimeout(()=>document.getElementById('tr-pas-nombre').focus(),80);
}

// ═══════════ Save actions ═══════════
function trSaveLoc(){
  const nombre=document.getElementById('tr-loc-nombre').value.trim();
  if(!nombre){ alert('Ingresá el nombre de la localidad.'); return; }
  const ev=gEv();
  TRAFIC_LOCALIDADES.push({ id:trNextId(TRAFIC_LOCALIDADES), evIdx:ev, nombre, activa:true });
  document.getElementById('m-tr-loc').style.display='none';
  trSaveFB(ev); trRender();
}

function trSaveEtapa(){
  const nombre=document.getElementById('tr-eta-nombre').value.trim();
  const precio=parseFloat(document.getElementById('tr-eta-precio').value)||0;
  if(!nombre){ alert('Ingresá el nombre de la etapa.'); return; }
  if(!precio){ alert('Ingresá un precio válido.'); return; }
  const ev=gEv();
  const orden=(TRAFIC_ETAPAS||[]).filter(e=>e.evIdx===ev).length+1;
  TRAFIC_ETAPAS.push({ id:trNextId(TRAFIC_ETAPAS), evIdx:ev, nombre, precio, orden, activa:false });
  document.getElementById('m-tr-etapa').style.display='none';
  trSaveFB(ev); trRender();
}

function trActivarEtapa(id,ev){
  TRAFIC_ETAPAS.forEach(e=>{ if(e.evIdx===ev) e.activa=false; });
  const eta=TRAFIC_ETAPAS.find(e=>e.id===id);
  if(eta) eta.activa=true;
  trSaveFB(ev); trRender();
}

function trDelEtapa(id,ev){
  const enUso=(TRAFIC_PASAJEROS||[]).some(p=>p.evIdx===ev&&p.etapaId===id);
  if(enUso&&!confirm('Esta etapa tiene pasajeros registrados. ¿Eliminar igual?')) return;
  if(!enUso&&!confirm('¿Eliminar esta etapa?')) return;
  TRAFIC_ETAPAS=TRAFIC_ETAPAS.filter(e=>e.id!==id);
  trSaveFB(ev); trRender();
}

function trDelLoc(id,ev){
  const pas=trGetPasLoc(ev,id);
  if(pas.length&&!confirm(`Esta localidad tiene ${pas.length} pasajero(s). ¿Eliminar todo?`)) return;
  if(!pas.length&&!confirm('¿Eliminar esta localidad?')) return;
  TRAFIC_LOCALIDADES=TRAFIC_LOCALIDADES.filter(l=>l.id!==id);
  TRAFIC_VIAJES=TRAFIC_VIAJES.filter(v=>!(v.locId===id&&v.evIdx===ev));
  TRAFIC_PASAJEROS=TRAFIC_PASAJEROS.filter(p=>!(p.locId===id&&p.evIdx===ev));
  trSaveFB(ev); trRender();
}

function trSaveViaje(){
  if(trLocId===null){ alert('Error: localidad no seleccionada.'); return; }
  const cap=parseInt(document.getElementById('tr-viaje-cap').value)||0;
  if(cap<1||cap>60){ alert('La capacidad debe ser entre 1 y 60.'); return; }
  const ev=gEv();
  const viajes=trGetViajesLoc(ev,trLocId);
  const numero=viajes.length+1;
  const id=trNextId(TRAFIC_VIAJES);
  TRAFIC_VIAJES.push({ id, evIdx:ev, locId:trLocId, numero, capacidad:cap, estado:'activa', fechaCreacion:new Date().toISOString() });
  document.getElementById('m-tr-viaje').style.display='none';
  trSaveFB(ev); trGoViaje(id);
}

function trMarcarLlena(viajeId,ev){
  if(!confirm('¿Marcar esta trafic como llena? Ya no se podrán agregar pasajeros.')) return;
  const v=TRAFIC_VIAJES.find(x=>x.id===viajeId);
  if(v){ v.estado='llena'; v.fechaCierre=new Date().toISOString(); }
  trSaveFB(ev); trRender();
}

function trSavePas(){
  const ev=gEv();
  const eta=trGetEtapaActiva(ev);
  if(!eta){ document.getElementById('tr-pas-err').textContent='No hay etapa activa.'; return; }
  const nombre=document.getElementById('tr-pas-nombre').value.trim();
  const apellido=document.getElementById('tr-pas-apellido').value.trim();
  const dni=document.getElementById('tr-pas-dni').value.trim();
  const tel=document.getElementById('tr-pas-tel').value.trim();
  const obs=document.getElementById('tr-pas-obs').value.trim();
  if(!nombre||!apellido){ document.getElementById('tr-pas-err').textContent='Nombre y apellido son obligatorios.'; return; }
  if(!dni){ document.getElementById('tr-pas-err').textContent='El DNI es obligatorio.'; return; }
  // DNI unique per event
  if((TRAFIC_PASAJEROS||[]).some(p=>p.evIdx===ev&&p.dni===dni)){
    document.getElementById('tr-pas-err').textContent=`El DNI ${dni} ya está registrado en este evento.`; return;
  }
  // Capacity
  const viaje=(TRAFIC_VIAJES||[]).find(v=>v.id===trViajeId);
  if(!viaje){ document.getElementById('tr-pas-err').textContent='Error: trafic no encontrada.'; return; }
  const pas=trGetPasViaje(ev,trViajeId);
  if(pas.length>=(viaje.capacidad||0)){ document.getElementById('tr-pas-err').textContent='La trafic está llena.'; return; }
  const id=trNextId(TRAFIC_PASAJEROS);
  TRAFIC_PASAJEROS.push({
    id, evIdx:ev, locId:viaje.locId, viajeId:trViajeId,
    etapaId:eta.id, precioCong:eta.precio,
    nombre, apellido, dni, telefono:tel, obs,
    fechaCarga:new Date().toISOString(), cargadoPor:CU?.chatName||CU?.user||''
  });
  document.getElementById('m-tr-pas').style.display='none';
  trSaveFB(ev); trRender();
}

function trDelPas(id,ev){
  if(!confirm('¿Eliminar este pasajero?')) return;
  TRAFIC_PASAJEROS=TRAFIC_PASAJEROS.filter(p=>p.id!==id);
  trSaveFB(ev); trRender();
}

// ═══════════ CSV Export ═══════════
function trCsvDl(filename,rows){
  const csv=rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function trExportViaje(ev,viajeId){
  const v=(TRAFIC_VIAJES||[]).find(x=>x.id===viajeId); if(!v) return;
  const loc=(TRAFIC_LOCALIDADES||[]).find(l=>l.id===v.locId);
  const pas=trGetPasViaje(ev,viajeId);
  const rows=[['#','Nombre','Apellido','DNI','Teléfono','Etapa','Precio','Cargado por','Fecha']];
  pas.forEach((p,i)=>{
    const eta=(TRAFIC_ETAPAS||[]).find(e=>e.id===p.etapaId);
    rows.push([i+1,p.nombre,p.apellido,p.dni,p.telefono||'',eta?.nombre||'',p.precioCong,p.cargadoPor,p.fechaCarga?.slice(0,10)||'']);
  });
  trCsvDl(`trafic_${loc?.nombre||'loc'}_${v.numero}_ev${ev}.csv`,rows);
}
function trExportLoc(ev,locId){
  const loc=(TRAFIC_LOCALIDADES||[]).find(l=>l.id===locId); if(!loc) return;
  const pas=trGetPasLoc(ev,locId);
  const rows=[['Trafic N°','Nombre','Apellido','DNI','Teléfono','Etapa','Precio','Cargado por','Fecha']];
  pas.forEach(p=>{
    const v=(TRAFIC_VIAJES||[]).find(x=>x.id===p.viajeId);
    const eta=(TRAFIC_ETAPAS||[]).find(e=>e.id===p.etapaId);
    rows.push([v?.numero||'',p.nombre,p.apellido,p.dni,p.telefono||'',eta?.nombre||'',p.precioCong,p.cargadoPor,p.fechaCarga?.slice(0,10)||'']);
  });
  trCsvDl(`trafic_${loc.nombre}_ev${ev}.csv`,rows);
}
function trExportEvento(ev){
  const pas=trGetAllPas(ev);
  if(!pas.length){ alert('Sin pasajeros registrados para este evento.'); return; }
  const rows=[['Localidad','Trafic N°','Nombre','Apellido','DNI','Teléfono','Etapa','Precio','Cargado por','Fecha']];
  pas.forEach(p=>{
    const loc=(TRAFIC_LOCALIDADES||[]).find(l=>l.id===p.locId);
    const v=(TRAFIC_VIAJES||[]).find(x=>x.id===p.viajeId);
    const eta=(TRAFIC_ETAPAS||[]).find(e=>e.id===p.etapaId);
    rows.push([loc?.nombre||'',v?.numero||'',p.nombre,p.apellido,p.dni,p.telefono||'',eta?.nombre||'',p.precioCong,p.cargadoPor,p.fechaCarga?.slice(0,10)||'']);
  });
  trCsvDl(`trafic_evento${ev}_completo.csv`,rows);
}
