// ═══════════════════════════════════════════════════════════
// RECAUDACIÓN — Retiros de efectivo por evento
// ═══════════════════════════════════════════════════════════

let recView   = 'main'; // 'main' | 'caja' | 'nuevo'
let recCajaId = null;
let recCurEv  = null;
let nRecCajaId = 1;
let nRecLoteId = 1;

const REC_DENOMS = [
  {k:'b20000', v:20000, l:'$ 20.000'},
  {k:'b10000', v:10000, l:'$ 10.000'},
  {k:'b2000',  v:2000,  l:'$  2.000'},
  {k:'b1000',  v:1000,  l:'$  1.000'},
  {k:'b500',   v:500,   l:'$    500'},
  {k:'b200',   v:200,   l:'$    200'},
  {k:'b100',   v:100,   l:'$    100'},
];

const REC_EST = {
  borrador:   {l:'Borrador',   cls:'bgray'},
  confirmado: {l:'Confirmado', cls:'bok'},
  rendido:    {l:'Rendido',    cls:'binfo'},
  anulado:    {l:'Anulado',    cls:'bdanger'},
};

// ─── SCAFFOLD ─────────────────────────────────────────────
function pgRecaudacion(){
  return `<div id="rec-wrap"></div>`;
}

function initRecaudacion(){
  const ev = gEv();
  if(recCurEv !== ev){ recView='main'; recCajaId=null; recCurEv=ev; }
  const cajas = CAJAS_REC.filter(c=>c.evIdx===ev);
  const lotes = LOTES_REC.filter(l=>l.evIdx===ev);
  try{ nRecCajaId = cajas.length ? Math.max(...cajas.map(c=>c.id||0))+1 : 1; }catch(e){ nRecCajaId=1; }
  try{ nRecLoteId = lotes.length ? Math.max(...lotes.map(l=>l.id||0))+1 : 1; }catch(e){ nRecLoteId=1; }
  recRender();
}

function recRender(){
  const el = document.getElementById('rec-wrap'); if(!el) return;
  const ev = gEv();
  if(!EVENTOS.length || ev >= EVENTOS.length){
    el.innerHTML = `<div class="ptitle">💵 Recaudación</div><div class="empty" style="margin-top:2rem">Creá un evento primero.</div>`;
    return;
  }
  const adm = CU?.role === 'Admin Console';
  if(recView==='main')       el.innerHTML = recHtmlMain(ev, adm);
  else if(recView==='caja')  el.innerHTML = recHtmlCaja(ev, adm);
  else if(recView==='nuevo') el.innerHTML = recHtmlNuevo(ev, adm);
}

// ─── VISTA PRINCIPAL ──────────────────────────────────────
function recHtmlMain(ev, adm){
  const cajas  = CAJAS_REC.filter(c=>c.evIdx===ev).sort((a,b)=>a.orden-b.orden);
  const todos  = LOTES_REC.filter(l=>l.evIdx===ev);
  const activos= todos.filter(l=>l.estado!=='anulado');
  const totalEv= activos.reduce((a,l)=>a+l.total,0);
  const ultimos= [...todos].sort((a,b)=>b.id-a.id).slice(0,6);

  let h = `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
    <div>
      <div class="ptitle" style="margin:0">💵 Recaudación</div>
      <div class="psub">${EVENTOS[ev].nombre}</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${adm?`<button class="btn btnsm" onclick="recAbrirConfigCajas()">⚙️ Cajas</button>`:''}
      <button class="btn btnsm" onclick="recExportarEvento()">↓ CSV</button>
      <button class="btn btnp btnsm" onclick="recIrNuevo(null)">+ Nuevo retiro</button>
    </div>
  </div>`;

  // Métricas globales
  h += `<div class="mg" style="margin-bottom:1.5rem">
    <div class="met"><div class="ml">Total recaudado</div><div class="mv pos" style="font-size:18px">${fmt(totalEv)}</div></div>
    <div class="met"><div class="ml">Total lotes</div><div class="mv">${todos.length}</div></div>
    <div class="met"><div class="ml">Cajas activas</div><div class="mv">${cajas.filter(c=>c.activa).length}</div></div>
    <div class="met"><div class="ml">Confirmados</div><div class="mv">${todos.filter(l=>l.estado==='confirmado').length}</div></div>
  </div>`;

  // Tarjetas de cajas
  if(!cajas.length){
    h += `<div class="card" style="margin-bottom:1.5rem"><div class="empty">Sin cajas configuradas.${adm?' Usá ⚙️ Cajas para agregar las cajas del evento.':''}</div></div>`;
  } else {
    h += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-bottom:1.5rem">`;
    cajas.forEach(c=>{
      const cLotes = LOTES_REC.filter(l=>l.evIdx===ev&&l.cajaId===c.id&&l.estado!=='anulado');
      const cTotal = cLotes.reduce((a,l)=>a+l.total,0);
      const ultimo = [...LOTES_REC.filter(l=>l.evIdx===ev&&l.cajaId===c.id)].sort((a,b)=>b.id-a.id)[0];
      h += `<div class="rec-caja-card${!c.activa?' rec-inactiva':''}" onclick="${c.activa?`recIrCaja(${c.id})`:'void(0)'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem">
          <div style="font-size:13px;font-weight:600">${c.nombre}</div>
          <span class="badge ${c.activa?'bok':'bgray'}" style="font-size:10px">${c.activa?'Activa':'Inactiva'}</span>
        </div>
        <div style="font-size:22px;font-weight:700;color:var(--accent);margin-bottom:4px">${fmt(cTotal)}</div>
        <div style="font-size:11px;color:var(--text2)">${cLotes.length} retiro${cLotes.length!==1?'s':''}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${ultimo?`Último: ${ultimo.fechaHora.slice(11,16)}hs`:'Sin retiros aún'}</div>
      </div>`;
    });
    h += `</div>`;
  }

  // Últimos lotes
  if(ultimos.length){
    h += `<div class="card"><div class="ctitle">Últimos retiros</div>`;
    ultimos.forEach(l=>{
      const caja = CAJAS_REC.find(c=>c.id===l.cajaId);
      const est  = REC_EST[l.estado]||{l:l.estado,cls:'bgray'};
      h += `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="recVerDetalle(${l.id})">
        <div style="width:36px;height:36px;border-radius:var(--rs);background:var(--bg4);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--accent);flex-shrink:0">#${l.nroLote}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;display:flex;align-items:center;gap:6px">${caja?.nombre||'?'} <span class="badge ${est.cls}" style="font-size:10px">${est.l}</span></div>
          <div style="font-size:11px;color:var(--text2)">${l.fechaHora.slice(11,16)}hs · ${l.responsableNombre||'—'} → ${l.recaudadorNombre||'—'}</div>
        </div>
        <div style="font-size:15px;font-weight:700;color:var(--accent);white-space:nowrap">${fmt(l.total)}</div>
      </div>`;
    });
    h += `</div>`;
  }
  return h;
}

// ─── VISTA CAJA ───────────────────────────────────────────
function recHtmlCaja(ev, adm){
  const caja = CAJAS_REC.find(c=>c.id===recCajaId);
  if(!caja){ recView='main'; return recHtmlMain(ev,adm); }
  const lotes = LOTES_REC.filter(l=>l.evIdx===ev&&l.cajaId===recCajaId).sort((a,b)=>b.nroLote-a.nroLote);
  const total = lotes.filter(l=>l.estado!=='anulado').reduce((a,l)=>a+l.total,0);

  let h = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap">
    <button class="btn btnsm" onclick="recView='main';recRender()">← Volver</button>
    <div style="flex:1;min-width:0">
      <div class="ptitle" style="margin:0">${caja.nombre}</div>
      <div class="psub">${EVENTOS[ev].nombre}</div>
    </div>
    <div style="display:flex;gap:6px">
      <button class="btn btnsm" onclick="recExportarCaja(${caja.id})">↓ CSV</button>
      <button class="btn btnp btnsm" onclick="recIrNuevo(${caja.id})">+ Nuevo retiro</button>
    </div>
  </div>`;

  h += `<div class="mg" style="margin-bottom:1.5rem">
    <div class="met"><div class="ml">Total caja</div><div class="mv pos">${fmt(total)}</div></div>
    <div class="met"><div class="ml">Retiros</div><div class="mv">${lotes.length}</div></div>
    <div class="met"><div class="ml">Confirmados</div><div class="mv">${lotes.filter(l=>l.estado==='confirmado').length}</div></div>
    <div class="met"><div class="ml">Último</div><div class="mv" style="font-size:13px">${lotes[0]?lotes[0].fechaHora.slice(11,16)+'hs':'—'}</div></div>
  </div>`;

  h += `<div class="card"><div class="ctitle">Historial de retiros</div>`;
  if(!lotes.length){
    h += '<div class="empty">Sin retiros registrados para esta caja.</div>';
  } else {
    h += `<div style="overflow-x:auto"><table><thead><tr>
      <th>Lote</th><th>Hora</th><th>Total</th><th>Entregó</th><th>Recaudó</th><th>Estado</th><th></th>
    </tr></thead><tbody>`;
    lotes.forEach(l=>{
      const est = REC_EST[l.estado]||{l:l.estado,cls:'bgray'};
      h += `<tr style="${l.estado==='anulado'?'opacity:.4':''}">
        <td><span style="font-weight:700;color:var(--accent);font-size:13px">#${l.nroLote}</span></td>
        <td style="font-size:12px;white-space:nowrap">${l.fechaHora.slice(11,16)}hs</td>
        <td style="font-weight:600;white-space:nowrap">${fmt(l.total)}</td>
        <td style="font-size:12px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.responsableNombre||'—'}</td>
        <td style="font-size:12px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.recaudadorNombre||'—'}</td>
        <td><span class="badge ${est.cls}" style="font-size:10px">${est.l}</span></td>
        <td>
          <div style="display:flex;gap:3px">
            <button class="btn btnsm" onclick="recVerDetalle(${l.id})" title="Ver detalle">👁</button>
            ${l.estado==='borrador'?`<button class="btn btnsm" style="background:var(--green)22;color:var(--green)" onclick="recCambiarEstado(${l.id},'confirmado')" title="Confirmar">✓</button>`:''}
            ${l.estado==='confirmado'&&adm?`<button class="btn btnsm" style="background:var(--blue)22;color:var(--blue)" onclick="recCambiarEstado(${l.id},'rendido')" title="Marcar rendido">📋</button>`:''}
            ${l.estado!=='anulado'&&adm?`<button class="btn btnsm btnd" onclick="recCambiarEstado(${l.id},'anulado')" title="Anular">✕</button>`:''}
          </div>
        </td>
      </tr>`;
    });
    h += `</tbody></table></div>`;
  }
  h += `</div>`;
  return h;
}

// ─── VISTA NUEVO RETIRO ───────────────────────────────────
function recHtmlNuevo(ev, adm){
  const cajas   = CAJAS_REC.filter(c=>c.evIdx===ev&&c.activa).sort((a,b)=>a.orden-b.orden);
  const nextLote = recNextNroLote(ev);
  const ahora   = new Date();
  const horaStr = ahora.toLocaleDateString('es-AR')+' '+ahora.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const usuarios = USERS.map(u=>u.chatName||u.user);

  let h = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem">
    <button class="btn btnsm" onclick="${recCajaId?`recView='caja'`:`recView='main'`};recRender()">← Volver</button>
    <div>
      <div class="ptitle" style="margin:0">Nuevo retiro</div>
      <div class="psub">${EVENTOS[ev].nombre}</div>
    </div>
  </div>`;

  h += `<div class="card" style="margin-bottom:1rem">
    <div class="ctitle">Información del retiro</div>
    <div class="fr">
      <div class="fc" style="flex:1"><span class="fl">Caja</span>
        <select id="rl-caja" style="width:100%" onchange="recActualizarNroLote()">
          ${cajas.length
            ? cajas.map(c=>`<option value="${c.id}" ${c.id===recCajaId?'selected':''}>${c.nombre}</option>`).join('')
            : '<option value="">Sin cajas activas</option>'}
        </select>
      </div>
      <div class="fc"><span class="fl">Lote #</span>
        <input type="text" id="rl-nro" value="${nextLote}" readonly
          style="width:72px;font-weight:700;font-size:16px;color:var(--accent);text-align:center;background:var(--bg3);border-color:var(--border2)">
      </div>
    </div>
    <div class="fc" style="margin-bottom:8px"><span class="fl">Hora (automática)</span>
      <input type="text" id="rl-hora" value="${horaStr}" readonly
        style="width:100%;background:var(--bg3);color:var(--text2);font-size:12px;border-color:var(--border2)">
    </div>
    <div class="fr">
      <div class="fc" style="flex:1"><span class="fl">Responsable de entrega</span>
        <input type="text" id="rl-entrega" style="width:100%" placeholder="Quién entrega el dinero"
          list="rl-entrega-list" autocomplete="off">
        <datalist id="rl-entrega-list">${usuarios.map(u=>`<option value="${u}">`).join('')}</datalist>
      </div>
      <div class="fc" style="flex:1"><span class="fl">Recaudador que recibe</span>
        <input type="text" id="rl-recibe" style="width:100%" placeholder="Recaudador"
          list="rl-recibe-list" autocomplete="off" value="${CU?.chatName||CU?.user||''}">
        <datalist id="rl-recibe-list">${usuarios.map(u=>`<option value="${u}">`).join('')}</datalist>
      </div>
    </div>
  </div>`;

  // Tabla de billetes
  h += `<div class="card" style="margin-bottom:1rem">
    <div class="ctitle">Detalle de billetes</div>
    <table style="width:100%">
      <thead><tr>
        <th style="text-align:left">Denominación</th>
        <th style="text-align:center;width:110px">Cantidad</th>
        <th style="text-align:right;width:110px">Subtotal</th>
      </tr></thead>
      <tbody>`;
  REC_DENOMS.forEach(d=>{
    h += `<tr>
      <td style="font-size:13px;font-weight:500;font-family:monospace;letter-spacing:.03em">${d.l}</td>
      <td style="padding:4px 0">
        <input type="number" id="rl-${d.k}" value="0" min="0" inputmode="numeric"
          style="width:100px;text-align:center;font-size:18px;font-weight:600;border-radius:var(--rs);display:block;margin:0 auto"
          oninput="recCalcTotal()">
      </td>
      <td style="text-align:right;font-weight:500;font-size:13px;white-space:nowrap" id="rl-sub-${d.k}">—</td>
    </tr>`;
  });
  h += `</tbody>
      <tfoot>
        <tr style="border-top:2px solid var(--border2)">
          <td colspan="2" style="font-weight:700;font-size:15px;padding-top:10px">TOTAL</td>
          <td style="text-align:right;font-weight:700;font-size:20px;color:var(--accent);padding-top:10px;white-space:nowrap" id="rl-total">$0</td>
        </tr>
      </tfoot>
    </table>
  </div>`;

  h += `<div class="card" style="margin-bottom:1rem">
    <div class="ctitle">Finalizar</div>
    <div class="fc" style="margin-bottom:8px"><span class="fl">Observaciones (opcional)</span>
      <textarea id="rl-obs" style="min-height:56px" placeholder="Sin observaciones, retiro urgente, faltan billetes chicos..."></textarea>
    </div>
    <div class="fc" style="margin-bottom:1rem"><span class="fl">Estado</span>
      <select id="rl-estado" style="width:160px">
        <option value="confirmado">Confirmado</option>
        <option value="borrador">Borrador</option>
      </select>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r);padding:1rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <span style="font-size:14px;font-weight:600;color:var(--text2)">Total del retiro</span>
      <span style="font-size:26px;font-weight:700;color:var(--accent)" id="rl-total-final">$0</span>
    </div>
    <div style="font-size:12px;color:var(--red);min-height:18px;margin-bottom:6px" id="rl-err"></div>
    <button class="btn btnp" style="width:100%;padding:14px;font-size:15px" onclick="recGuardarLote()">💾 Guardar retiro</button>
  </div>`;

  return h;
}

// ─── LÓGICA DEL FORMULARIO ────────────────────────────────
function recCalcTotal(){
  let total = 0;
  REC_DENOMS.forEach(d=>{
    const qty = Math.max(0, parseInt(document.getElementById('rl-'+d.k)?.value)||0);
    const sub = qty * d.v;
    total += sub;
    const subEl = document.getElementById('rl-sub-'+d.k);
    if(subEl) subEl.textContent = sub>0 ? '$'+sub.toLocaleString('es-AR') : '—';
  });
  const fmtd = '$'+total.toLocaleString('es-AR');
  const t1 = document.getElementById('rl-total');       if(t1) t1.textContent = fmtd;
  const t2 = document.getElementById('rl-total-final'); if(t2) t2.textContent = fmtd;
  return total;
}

function recNextNroLote(ev){
  const lots = LOTES_REC.filter(l=>l.evIdx===ev);
  return lots.length ? Math.max(...lots.map(l=>l.nroLote||0))+1 : 1;
}

function recActualizarNroLote(){
  const sel = document.getElementById('rl-caja');
  if(sel && sel.value) recCajaId = parseInt(sel.value);
  const nroEl = document.getElementById('rl-nro');
  if(nroEl) nroEl.value = recNextNroLote(gEv());
}

function recGuardarLote(){
  const ev     = gEv();
  const errEl  = document.getElementById('rl-err');
  const cajaEl = document.getElementById('rl-caja');
  const cajaId = cajaEl && cajaEl.value ? parseInt(cajaEl.value) : null;
  const entrega= (document.getElementById('rl-entrega')?.value||'').trim();
  const recibe = (document.getElementById('rl-recibe')?.value||'').trim();

  if(!cajaId)  { if(errEl) errEl.textContent='Seleccioná una caja.'; return; }
  if(!entrega) { if(errEl) errEl.textContent='Ingresá el responsable de entrega.'; return; }
  if(!recibe)  { if(errEl) errEl.textContent='Ingresá el recaudador que recibe.'; return; }

  const bills = {}; let hasAny = false;
  for(const d of REC_DENOMS){
    const v = parseInt(document.getElementById('rl-'+d.k)?.value)||0;
    if(v < 0){ if(errEl) errEl.textContent='No se permiten cantidades negativas.'; return; }
    bills[d.k] = v;
    if(v > 0) hasAny = true;
  }
  if(!hasAny){ if(errEl) errEl.textContent='Ingresá al menos una denominación.'; return; }

  const total   = recCalcTotal();
  const ahora   = new Date();
  const fechaHora = ahora.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+
                    ahora.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const nroLote = recNextNroLote(ev);
  const estado  = document.getElementById('rl-estado')?.value || 'confirmado';
  const obs     = (document.getElementById('rl-obs')?.value||'').trim();

  LOTES_REC.push({
    id: nRecLoteId++,
    evIdx: ev,
    cajaId,
    nroLote,
    fechaHora,
    responsableNombre: entrega,
    recaudadorNombre:  recibe,
    ...bills,
    total,
    obs,
    estado,
    ts: Date.now(),
  });

  if(window._fbOK) window.fbSave.recaudacion?.(ev);
  recCajaId = cajaId; // quedarse en la caja usada
  recView   = 'caja';
  recRender();
}

// ─── ACCIONES LOTES ───────────────────────────────────────
function recIrCaja(id){
  recCajaId = id; recView = 'caja'; recRender();
}

function recIrNuevo(cajaId){
  recCajaId = cajaId; recView = 'nuevo'; recRender();
}

function recCambiarEstado(loteId, estado){
  const l = LOTES_REC.find(x=>x.id===loteId); if(!l) return;
  if(estado==='anulado' && !confirm('¿Anular este retiro? No se puede deshacer.')) return;
  l.estado = estado;
  if(window._fbOK) window.fbSave.recaudacion?.(gEv());
  recRender();
}

function recVerDetalle(loteId){
  const l = LOTES_REC.find(x=>x.id===loteId); if(!l) return;
  const caja = CAJAS_REC.find(c=>c.id===l.cajaId);
  const est  = REC_EST[l.estado]||{l:l.estado, cls:'bgray'};

  let h = `<div class="mtitle">Retiro #${l.nroLote} — ${caja?.nombre||'?'}</div>
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem">
    <span style="font-size:12px;color:var(--text2)">${l.fechaHora}</span>
    <span class="badge ${est.cls}" style="font-size:10px">${est.l}</span>
  </div>
  <table style="width:100%;margin-bottom:1rem">
    <thead><tr><th style="text-align:left">Denominación</th><th style="text-align:center">Cant.</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>`;
  REC_DENOMS.forEach(d=>{
    const qty = l[d.k]||0;
    if(qty>0) h += `<tr>
      <td style="font-family:monospace;font-size:13px">${d.l}</td>
      <td style="text-align:center;font-weight:600">${qty}</td>
      <td style="text-align:right;font-weight:500">${fmt(qty*d.v)}</td>
    </tr>`;
  });
  h += `</tbody>
    <tfoot><tr style="border-top:2px solid var(--border2)">
      <td colspan="2" style="font-weight:700;padding-top:8px">TOTAL</td>
      <td style="text-align:right;font-weight:700;font-size:18px;color:var(--accent);padding-top:8px">${fmt(l.total)}</td>
    </tr></tfoot>
  </table>
  <div style="background:var(--bg3);border-radius:var(--rs);padding:.75rem;font-size:13px;margin-bottom:1rem">
    <div style="margin-bottom:4px">📤 <span style="color:var(--text2)">Entregó:</span> <strong>${l.responsableNombre||'—'}</strong></div>
    <div>📥 <span style="color:var(--text2)">Recibió:</span> <strong>${l.recaudadorNombre||'—'}</strong></div>
    ${l.obs?`<div style="margin-top:6px;color:var(--text2);font-size:12px;font-style:italic">💬 ${l.obs}</div>`:''}
  </div>
  <div class="mrow">
    <button class="btn" style="flex:1" onclick="document.getElementById('m-rec-detalle').style.display='none'">Cerrar</button>
  </div>`;

  document.getElementById('m-rec-detalle-body').innerHTML = h;
  document.getElementById('m-rec-detalle').style.display  = 'flex';
}

// ─── CONFIG CAJAS ─────────────────────────────────────────
function recAbrirConfigCajas(){
  document.getElementById('m-rec-cajas').style.display = 'flex';
  recRenderCajasModal();
  document.getElementById('rc-nombre').value = '';
  document.getElementById('rc-tipo').value   = 'barra';
  document.getElementById('rc-orden').value  = '';
}

function recRenderCajasModal(){
  const ev    = gEv();
  const cajas = CAJAS_REC.filter(c=>c.evIdx===ev).sort((a,b)=>a.orden-b.orden);
  let h = '';
  if(!cajas.length){
    h = '<div class="empty" style="margin:.5rem 0">Sin cajas configuradas para este evento.</div>';
  } else {
    cajas.forEach(c=>{
      h += `<div class="rec-caja-modal-row">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600">${c.nombre}
            <span class="badge bgray" style="font-size:10px;margin-left:5px">${c.tipo||'otro'}</span>
          </div>
          <div style="font-size:11px;color:var(--text2)">Orden ${c.orden}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;flex-shrink:0">
          <span class="badge ${c.activa?'bok':'bgray'}" style="font-size:10px">${c.activa?'Activa':'Inactiva'}</span>
          <button class="btn btnsm" onclick="recToggleCaja(${c.id})">${c.activa?'Desactivar':'Activar'}</button>
          <button class="btn btnsm btnd" onclick="recEliminarCaja(${c.id})">✕</button>
        </div>
      </div>`;
    });
  }
  document.getElementById('m-rec-cajas-lista').innerHTML = h;
}

function recGuardarCaja(){
  const ev     = gEv();
  const nombre = document.getElementById('rc-nombre')?.value.trim();
  if(!nombre){ alert('Ingresá el nombre de la caja.'); return; }
  const tipo  = document.getElementById('rc-tipo')?.value   || 'barra';
  const orden = parseInt(document.getElementById('rc-orden')?.value)||
                CAJAS_REC.filter(c=>c.evIdx===ev).length + 1;
  CAJAS_REC.push({id:nRecCajaId++, evIdx:ev, nombre, tipo, activa:true, orden, ts:Date.now()});
  document.getElementById('rc-nombre').value = '';
  if(window._fbOK) window.fbSave.recaudacion?.(ev);
  recRenderCajasModal();
  recRender();
}

function recToggleCaja(id){
  const c = CAJAS_REC.find(x=>x.id===id);
  if(c){ c.activa=!c.activa; if(window._fbOK)window.fbSave.recaudacion?.(gEv()); recRenderCajasModal(); recRender(); }
}

function recEliminarCaja(id){
  if(!confirm('¿Eliminar esta caja?\nLos lotes existentes se conservarán.')) return;
  const i = CAJAS_REC.findIndex(x=>x.id===id);
  if(i>=0){ CAJAS_REC.splice(i,1); if(window._fbOK)window.fbSave.recaudacion?.(gEv()); recRenderCajasModal(); recRender(); }
}

// ─── EXPORTAR CSV ─────────────────────────────────────────
function recExportarCaja(cajaId){
  const ev   = gEv();
  const caja = CAJAS_REC.find(c=>c.id===cajaId);
  _recExportCSV(LOTES_REC.filter(l=>l.evIdx===ev&&l.cajaId===cajaId), caja?.nombre||'caja', ev);
}

function recExportarEvento(){
  const ev = gEv();
  _recExportCSV(LOTES_REC.filter(l=>l.evIdx===ev), EVENTOS[ev]?.nombre||'evento', ev);
}

function _recExportCSV(lotes, nombre, ev){
  lotes = [...lotes].sort((a,b)=>a.nroLote-b.nroLote);
  const cols = ['Lote','Fecha/Hora','Caja','$20.000','$10.000','$2.000','$1.000','$500','$200','$100','Total','Observaciones','Entregó','Recibió','Estado'];
  const rows = [cols];
  lotes.forEach(l=>{
    const caja = CAJAS_REC.find(c=>c.id===l.cajaId);
    rows.push([l.nroLote, l.fechaHora, caja?.nombre||'',
      l.b20000||0, l.b10000||0, l.b2000||0, l.b1000||0, l.b500||0, l.b200||0, l.b100||0,
      l.total, l.obs||'', l.responsableNombre||'', l.recaudadorNombre||'', l.estado]);
  });
  const csv  = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `recaudacion_${nombre}.csv`; a.click();
  URL.revokeObjectURL(url);
}
