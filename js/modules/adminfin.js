// ═══════════════════════════════════════════════════════════
// ADMIN FIN — Módulo de Administración y Finanzas
// ═══════════════════════════════════════════════════════════

let afTab = 'gastos';
let afFiltros = { desde:'', hasta:'', cat:'', tipo:'', estado:'', personaId:'', q:'' };
let afEditGastoId = null;
let afEditPersonaId = null;
let nGastoId = 1;
let nPersonaId = 1;

const AF_CATS = ['Sonido','Catering','Movilidad','Sueldos','Insumos','Habilitaciones',
  'Diseño / Publicidad','Cachets artistas / DJ','Alquiler lugar / equipos',
  'Seguridad','Iluminación','Marketing','Producción','Otros'];
const AF_TIPOS = [
  {v:'compra',        l:'Compra / Gasto'},
  {v:'pago_proveedor',l:'Pago a proveedor'},
  {v:'pago_empleado', l:'Pago a empleado'},
];
const AF_MEDIOS = ['Efectivo','Transferencia bancaria','Cuenta bancaria','Mercado Pago','Cheque','Otro'];
const AF_TIPO_BADGE = {compra:'bgray',pago_proveedor:'binfo',pago_empleado:'borange'};
const AF_TIPO_LABEL = {compra:'Compra/Gasto',pago_proveedor:'Pago proveedor',pago_empleado:'Pago empleado'};

// ─── SCAFFOLD ─────────────────────────────────────────────
function pgAdminFin(){
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
    <div class="ptitle" style="margin:0">💰 Administración</div>
    <button class="btn btnp btnsm" onclick="afAbrirGasto(null)">+ Nuevo gasto</button>
  </div>
  <div class="tnav" id="af-tabs">
    <button class="tbtn active" onclick="afSetTab('gastos')">💸 Gastos</button>
    <button class="tbtn" onclick="afSetTab('personas')">👥 Personas</button>
    <button class="tbtn" onclick="afSetTab('reportes')">📊 Reportes</button>
  </div>
  <div id="af-body"></div>`;
}

function initAdminFin(){
  try{nGastoId  = GASTOS_ADM.length  ? Math.max(...GASTOS_ADM.map(g=>g.id||0))  + 1 : 1;}catch(e){nGastoId=1;}
  try{nPersonaId= PERSONAS_ADM.length ? Math.max(...PERSONAS_ADM.map(p=>p.id||0))+ 1 : 1;}catch(e){nPersonaId=1;}
  afRender();
}

function afSetTab(tab){
  afTab = tab;
  document.querySelectorAll('#af-tabs .tbtn').forEach(b=>b.classList.remove('active'));
  const idx={gastos:0,personas:1,reportes:2}[tab];
  document.querySelectorAll('#af-tabs .tbtn')[idx]?.classList.add('active');
  afRender();
}

function afRender(){
  const el=document.getElementById('af-body');if(!el)return;
  if(afTab==='gastos')    el.innerHTML=afHtmlGastos();
  else if(afTab==='personas') el.innerHTML=afHtmlPersonas();
  else if(afTab==='reportes') el.innerHTML=afHtmlReportes();
}

// ─── GASTOS ───────────────────────────────────────────────
function afHtmlGastos(){
  const gastos=afGetFiltrados();
  const total=gastos.reduce((a,g)=>a+g.monto,0);
  const pag=gastos.filter(g=>g.estado==='pagado').reduce((a,g)=>a+g.monto,0);
  const pend=total-pag;

  let h=`<div class="mg" style="margin-bottom:1rem">
    <div class="met"><div class="ml">Total filtrado</div><div class="mv">${fmt(total)}</div></div>
    <div class="met"><div class="ml">Pagado</div><div class="mv pos">${fmt(pag)}</div></div>
    <div class="met"><div class="ml">Pendiente</div><div class="mv neg">${fmt(pend)}</div></div>
    <div class="met"><div class="ml">Registros</div><div class="mv">${gastos.length}</div></div>
  </div>`;

  // Filtros
  h+=`<div class="card" style="margin-bottom:1rem"><div class="ctitle">Filtros</div>
  <div class="fr" style="flex-wrap:wrap;gap:6px">
    <div class="fc"><span class="fl">Desde</span><input type="date" id="af-f-desde" value="${afFiltros.desde}" onchange="afFiltrar()" style="width:130px"></div>
    <div class="fc"><span class="fl">Hasta</span><input type="date" id="af-f-hasta" value="${afFiltros.hasta}" onchange="afFiltrar()" style="width:130px"></div>
    <div class="fc"><span class="fl">Categoría</span><select id="af-f-cat" onchange="afFiltrar()" style="width:140px">
      <option value="">Todas</option>${AF_CATS.map(c=>`<option value="${c}" ${afFiltros.cat===c?'selected':''}>${c}</option>`).join('')}
    </select></div>
    <div class="fc"><span class="fl">Tipo</span><select id="af-f-tipo" onchange="afFiltrar()" style="width:150px">
      <option value="">Todos</option>${AF_TIPOS.map(t=>`<option value="${t.v}" ${afFiltros.tipo===t.v?'selected':''}>${t.l}</option>`).join('')}
    </select></div>
    <div class="fc"><span class="fl">Estado</span><select id="af-f-estado" onchange="afFiltrar()" style="width:120px">
      <option value="">Todos</option>
      <option value="pagado" ${afFiltros.estado==='pagado'?'selected':''}>Pagado</option>
      <option value="pendiente" ${afFiltros.estado==='pendiente'?'selected':''}>Pendiente</option>
    </select></div>
    <div class="fc" style="flex:1;min-width:160px"><span class="fl">Buscar</span>
      <input type="text" id="af-f-q" value="${afFiltros.q}" oninput="afFiltrar()" placeholder="Desc., persona, categoría..." style="width:100%">
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:8px">
    <button class="btn btnsm" onclick="afLimpiarFiltros()">✕ Limpiar</button>
    <button class="btn btnsm" onclick="afExportarCSV()">↓ Exportar CSV</button>
  </div></div>`;

  // Tabla
  h+=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
    <div class="ctitle" style="margin:0">Registros</div>
  </div>`;
  if(!gastos.length){
    h+='<div class="empty">Sin registros para los filtros aplicados.</div>';
  } else {
    h+=`<div style="overflow-x:auto"><table>
    <thead><tr>
      <th>Fecha</th><th>Categoría</th><th>Tipo</th><th>Persona / Lugar</th>
      <th>Medio</th><th>Monto</th><th>Estado</th><th>Comp.</th><th></th>
    </tr></thead><tbody>`;
    gastos.forEach(g=>{
      const comp=g.comprobante?`<a href="${g.comprobante}" target="_blank" style="font-size:11px;color:var(--ac)">📎</a>`:'—';
      const persona=g.personaNombre||'—';
      h+=`<tr>
        <td style="font-size:12px;white-space:nowrap">${g.fecha||'—'}</td>
        <td><span class="tag" style="font-size:11px">${g.cat||'—'}</span></td>
        <td><span class="badge ${AF_TIPO_BADGE[g.tipo]||'bgray'}" style="font-size:10px">${AF_TIPO_LABEL[g.tipo]||g.tipo||'—'}</span></td>
        <td style="font-size:12px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${persona}">${persona}</td>
        <td style="font-size:11px;color:var(--text2);white-space:nowrap">${g.medio||'—'}</td>
        <td style="font-weight:600;white-space:nowrap">${fmt(g.monto)}</td>
        <td><span class="badge ${g.estado==='pagado'?'bok':'bdanger'}" style="font-size:10px">${g.estado==='pagado'?'Pagado':'Pendiente'}</span></td>
        <td style="text-align:center">${comp}</td>
        <td>
          <div style="display:flex;gap:3px">
            ${g.estado!=='pagado'?`<button class="btn btnsm" style="background:var(--green)22;color:var(--green)" onclick="afMarcarPagado(${g.id})" title="Marcar pagado">✓</button>`:''}
            <button class="btn btnsm" onclick="afAbrirGasto(${g.id})" title="Editar">✏️</button>
            <button class="btn btnsm" onclick="afCopiarGasto(${g.id})" title="Copiar gasto">📋</button>
            <button class="btn btnsm btnd" onclick="afEliminarGasto(${g.id})" title="Eliminar">✕</button>
          </div>
        </td>
      </tr>`;
    });
    h+=`</tbody></table></div>`;
  }
  h+=`</div>`;
  return h;
}

function afGetFiltrados(){
  return GASTOS_ADM.filter(g=>{
    if(afFiltros.desde && g.fecha && g.fecha<afFiltros.desde) return false;
    if(afFiltros.hasta && g.fecha && g.fecha>afFiltros.hasta) return false;
    if(afFiltros.cat   && g.cat!==afFiltros.cat)   return false;
    if(afFiltros.tipo  && g.tipo!==afFiltros.tipo)  return false;
    if(afFiltros.estado&& g.estado!==afFiltros.estado) return false;
    if(afFiltros.personaId && g.personaId!==afFiltros.personaId) return false;
    if(afFiltros.q){
      const q=afFiltros.q.toLowerCase();
      if(![(g.desc||''),(g.personaNombre||''),(g.cat||''),(g.medio||''),(g.obs||'')]
          .some(s=>s.toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
}

function afFiltrar(){
  afFiltros.desde  = document.getElementById('af-f-desde')?.value  || '';
  afFiltros.hasta  = document.getElementById('af-f-hasta')?.value  || '';
  afFiltros.cat    = document.getElementById('af-f-cat')?.value    || '';
  afFiltros.tipo   = document.getElementById('af-f-tipo')?.value   || '';
  afFiltros.estado = document.getElementById('af-f-estado')?.value || '';
  afFiltros.q      = document.getElementById('af-f-q')?.value      || '';
  const el=document.getElementById('af-body');
  if(el && afTab==='gastos') el.innerHTML=afHtmlGastos();
}

function afLimpiarFiltros(){
  afFiltros={desde:'',hasta:'',cat:'',tipo:'',estado:'',personaId:'',q:''};
  afRender();
}

function afMarcarPagado(id){
  const g=GASTOS_ADM.find(x=>x.id===id);
  if(g){g.estado='pagado';if(window._fbOK)window.fbSave.gastosAdm?.();afRender();}
}

function afEliminarGasto(id){
  if(!confirm('¿Eliminar este gasto?'))return;
  const i=GASTOS_ADM.findIndex(x=>x.id===id);
  if(i>=0){GASTOS_ADM.splice(i,1);if(window._fbOK)window.fbSave.gastosAdm?.();afRender();}
}

function afCopiarGasto(id){
  const g=GASTOS_ADM.find(x=>x.id===id);if(!g)return;
  const copia={...g,id:nGastoId++,fecha:new Date().toISOString().slice(0,10),estado:'pendiente',ts:Date.now()};
  GASTOS_ADM.push(copia);
  if(window._fbOK)window.fbSave.gastosAdm?.();
  afRender();
}

// ─── MODAL: GASTO ─────────────────────────────────────────
function afAbrirGasto(id){
  afEditGastoId=id;
  const g=id?GASTOS_ADM.find(x=>x.id===id):null;
  document.getElementById('m-gasto-adm-ttl').textContent=g?'Editar gasto':'Nuevo gasto';
  document.getElementById('gad-fecha').value=g?(g.fecha||''):new Date().toISOString().slice(0,10);
  document.getElementById('gad-cat').value=g?(g.cat||AF_CATS[0]):AF_CATS[0];
  document.getElementById('gad-tipo').value=g?(g.tipo||'compra'):'compra';
  document.getElementById('gad-persona').value=g?(g.personaNombre||''):'';
  document.getElementById('gad-persona-id').value=g&&g.personaId!=null?g.personaId:'';
  document.getElementById('gad-medio').value=g?(g.medio||'Efectivo'):'Efectivo';
  document.getElementById('gad-monto').value=g?(g.monto||''):'';
  document.getElementById('gad-desc').value=g?(g.desc||''):'';
  document.getElementById('gad-estado').value=g?(g.estado||'pendiente'):'pendiente';
  document.getElementById('gad-comp').value=g?(g.comprobante||''):'';
  document.getElementById('gad-obs').value=g?(g.obs||''):'';
  // Evento
  const evSel=document.getElementById('gad-ev');
  evSel.innerHTML=`<option value="">Sin evento específico</option>`+
    EVENTOS.map((e,i)=>`<option value="${i}" ${g&&g.evIdx===i?'selected':''}>${e.nombre}</option>`).join('');
  if(!g && gEv()>=0 && EVENTOS.length) evSel.value=gEv();
  // Limpiar autocomplete
  const acList=document.getElementById('gad-persona-list');
  if(acList){acList.innerHTML='';acList.style.display='none';}
  document.getElementById('m-gasto-adm').style.display='flex';
  setTimeout(()=>document.getElementById('gad-monto')?.focus(),80);
}

function afSaveGasto(){
  const fecha    =document.getElementById('gad-fecha').value;
  const cat      =document.getElementById('gad-cat').value;
  const tipo     =document.getElementById('gad-tipo').value;
  const personaNombre=document.getElementById('gad-persona').value.trim();
  const personaIdRaw =document.getElementById('gad-persona-id').value;
  const personaId    =personaIdRaw!==''?parseInt(personaIdRaw):null;
  const medio    =document.getElementById('gad-medio').value;
  const monto    =parseFloat(document.getElementById('gad-monto').value)||0;
  const desc     =document.getElementById('gad-desc').value.trim();
  const estado   =document.getElementById('gad-estado').value;
  const comp     =document.getElementById('gad-comp').value.trim();
  const evVal    =document.getElementById('gad-ev').value;
  const evIdx    =evVal!==''?parseInt(evVal):null;
  const obs      =document.getElementById('gad-obs').value.trim();

  if(!desc&&!personaNombre){alert('Ingresá una descripción o persona.');return;}
  if(monto<=0){alert('Ingresá un monto mayor a 0.');return;}

  if(afEditGastoId){
    const g=GASTOS_ADM.find(x=>x.id===afEditGastoId);
    if(g)Object.assign(g,{fecha,cat,tipo,personaNombre,personaId,medio,monto,desc,estado,comprobante:comp,evIdx,obs});
  } else {
    GASTOS_ADM.push({id:nGastoId++,fecha,cat,tipo,personaNombre,personaId,medio,monto,desc,estado,comprobante:comp,evIdx,obs,ts:Date.now()});
  }
  document.getElementById('m-gasto-adm').style.display='none';
  if(window._fbOK)window.fbSave.gastosAdm?.();
  afRender();
}

// Autocomplete personas
function afBuscarPersona(val){
  const list=document.getElementById('gad-persona-list');if(!list)return;
  if(!val.trim()){list.innerHTML='';list.style.display='none';return;}
  const q=val.toLowerCase();
  const matches=PERSONAS_ADM.filter(p=>p.nombre.toLowerCase().includes(q)).slice(0,7);
  if(!matches.length){list.style.display='none';return;}
  list.innerHTML=matches.map(p=>`
    <div class="ac-item" onmousedown="afSelPersona(${p.id},'${p.nombre.replace(/'/g,"\\'")}')">
      <span style="font-weight:500;font-size:13px">${p.nombre}</span>
      <span class="badge ${p.tipo==='empleado'?'borange':'binfo'}" style="font-size:10px;margin-left:6px">${p.tipo==='empleado'?'Empleado':'Proveedor'}</span>
      <span style="font-size:11px;color:var(--text2);margin-left:auto">${p.cbu?'🏦 '+p.cbu:p.cuit?p.cuit:''}</span>
    </div>`).join('');
  list.style.display='block';
}

function afSelPersona(id,nombre){
  document.getElementById('gad-persona').value=nombre;
  document.getElementById('gad-persona-id').value=id;
  const list=document.getElementById('gad-persona-list');
  if(list){list.innerHTML='';list.style.display='none';}
}

// ─── PERSONAS ──────────────────────────────────────────────
function afHtmlPersonas(){
  const q=(document.getElementById('af-per-q')?.value||'').toLowerCase();
  let personas=PERSONAS_ADM;
  if(q)personas=personas.filter(p=>
    p.nombre.toLowerCase().includes(q)||(p.mail||'').toLowerCase().includes(q)||(p.cuit||'').includes(q)
  );
  const provs=personas.filter(p=>p.tipo==='proveedor');
  const emps =personas.filter(p=>p.tipo==='empleado');

  let h=`<div style="display:flex;gap:8px;margin-bottom:1rem;align-items:center">
    <input type="text" id="af-per-q" placeholder="Buscar nombre, mail, CUIT..." oninput="afRenderPersonas()" style="flex:1">
    <button class="btn btnp btnsm" onclick="afAbrirPersona(null)">+ Nueva persona</button>
  </div>`;

  if(!personas.length){
    h+='<div class="empty" style="margin-top:2rem">Sin personas cargadas. Agregá proveedores y empleados para autocompletar los gastos.</div>';
    return h;
  }
  if(provs.length){
    h+=`<div class="card" style="margin-bottom:1rem"><div class="ctitle">Proveedores (${provs.length})</div>`;
    provs.forEach(p=>h+=afRowPersona(p));
    h+=`</div>`;
  }
  if(emps.length){
    h+=`<div class="card"><div class="ctitle">Empleados (${emps.length})</div>`;
    emps.forEach(p=>h+=afRowPersona(p));
    h+=`</div>`;
  }
  return h;
}

function afRowPersona(p){
  return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
    <div style="flex:1">
      <div style="font-size:13px;font-weight:600">${p.nombre}
        <span class="badge ${p.tipo==='empleado'?'borange':'binfo'}" style="font-size:10px;margin-left:5px">${p.tipo==='empleado'?'Empleado':'Proveedor'}</span>
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:3px;line-height:1.6">
        ${p.tel?`📞 ${p.tel} &nbsp;`:''}${p.mail?`✉️ ${p.mail} &nbsp;`:''}${p.cbu?`🏦 ${p.cbu} &nbsp;`:''}${p.cuit?`CUIT/DNI: ${p.cuit}`:''}
      </div>
      ${p.dir?`<div style="font-size:11px;color:var(--text3)">📍 ${p.dir}</div>`:''}
      ${p.obs?`<div style="font-size:11px;color:var(--text3);font-style:italic">${p.obs}</div>`:''}
    </div>
    <div style="display:flex;gap:4px;flex-shrink:0">
      <button class="btn btnsm" onclick="afAbrirPersona(${p.id})">✏️</button>
      <button class="btn btnsm btnd" onclick="afEliminarPersona(${p.id})">✕</button>
    </div>
  </div>`;
}

function afRenderPersonas(){
  const el=document.getElementById('af-body');
  if(el&&afTab==='personas')el.innerHTML=afHtmlPersonas();
}

function afAbrirPersona(id){
  afEditPersonaId=id;
  const p=id?PERSONAS_ADM.find(x=>x.id===id):null;
  document.getElementById('m-persona-adm-ttl').textContent=p?'Editar persona':'Nueva persona';
  document.getElementById('per-nombre').value=p?.nombre||'';
  document.getElementById('per-tipo').value=p?.tipo||'proveedor';
  document.getElementById('per-tel').value=p?.tel||'';
  document.getElementById('per-mail').value=p?.mail||'';
  document.getElementById('per-cbu').value=p?.cbu||'';
  document.getElementById('per-cuit').value=p?.cuit||'';
  document.getElementById('per-dir').value=p?.dir||'';
  document.getElementById('per-obs').value=p?.obs||'';
  document.getElementById('m-persona-adm').style.display='flex';
  setTimeout(()=>document.getElementById('per-nombre')?.focus(),80);
}

function afSavePersona(){
  const nombre=document.getElementById('per-nombre').value.trim();
  if(!nombre){alert('Ingresá el nombre.');return;}
  const data={
    nombre,
    tipo: document.getElementById('per-tipo').value,
    tel:  document.getElementById('per-tel').value.trim(),
    mail: document.getElementById('per-mail').value.trim(),
    cbu:  document.getElementById('per-cbu').value.trim(),
    cuit: document.getElementById('per-cuit').value.trim(),
    dir:  document.getElementById('per-dir').value.trim(),
    obs:  document.getElementById('per-obs').value.trim(),
  };
  if(afEditPersonaId){
    const p=PERSONAS_ADM.find(x=>x.id===afEditPersonaId);
    if(p)Object.assign(p,data);
  } else {
    PERSONAS_ADM.push({id:nPersonaId++,...data});
  }
  document.getElementById('m-persona-adm').style.display='none';
  if(window._fbOK)window.fbSave.personasAdm?.();
  afRender();
}

function afEliminarPersona(id){
  if(!confirm('¿Eliminar esta persona?'))return;
  const i=PERSONAS_ADM.findIndex(x=>x.id===id);
  if(i>=0){PERSONAS_ADM.splice(i,1);if(window._fbOK)window.fbSave.personasAdm?.();afRender();}
}

// ─── REPORTES ─────────────────────────────────────────────
function afHtmlReportes(){
  const todos=GASTOS_ADM;
  let h='';

  if(!todos.length){
    return '<div class="empty" style="margin-top:2rem">Sin gastos cargados aún.</div>';
  }

  // Por categoría
  const porCat={};
  todos.forEach(g=>{if(!porCat[g.cat])porCat[g.cat]=0;porCat[g.cat]+=g.monto;});
  const catSort=Object.entries(porCat).sort((a,b)=>b[1]-a[1]);
  const catTotal=catSort.reduce((a,[,v])=>a+v,0);
  h+=`<div class="card" style="margin-bottom:1rem"><div class="ctitle">Por categoría</div>`;
  catSort.forEach(([cat,tot])=>{
    const pct=catTotal?Math.round(tot/catTotal*100):0;
    h+=`<div style="margin-bottom:.6rem">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px">
        <span style="font-weight:500">${cat}</span>
        <span>${fmt(tot)} <span style="color:var(--text2);font-size:11px">(${pct}%)</span></span>
      </div>
      <div class="progbg"><div class="progfill" style="width:${pct}%"></div></div>
    </div>`;
  });
  h+=`</div>`;

  // Por evento
  const porEv={};
  todos.forEach(g=>{
    const k=g.evIdx!=null?(EVENTOS[g.evIdx]?.nombre||'Evento '+g.evIdx):'Sin evento asociado';
    if(!porEv[k]){porEv[k]={total:0,pag:0,pend:0};}
    porEv[k].total+=g.monto;
    if(g.estado==='pagado')porEv[k].pag+=g.monto;
    else porEv[k].pend+=g.monto;
  });
  const evSort=Object.entries(porEv).sort((a,b)=>b[1].total-a[1].total);
  h+=`<div class="card" style="margin-bottom:1rem"><div class="ctitle">Por evento</div>
  <table><thead><tr><th>Evento</th><th>Total</th><th>Pagado</th><th>Pendiente</th></tr></thead><tbody>
  ${evSort.map(([ev,d])=>`<tr>
    <td style="font-size:13px">${ev}</td>
    <td style="font-weight:600">${fmt(d.total)}</td>
    <td class="pos">${fmt(d.pag)}</td>
    <td class="neg">${fmt(d.pend)}</td>
  </tr>`).join('')}
  </tbody></table></div>`;

  // Por persona
  const porPer={};
  todos.forEach(g=>{
    if(!g.personaNombre)return;
    if(!porPer[g.personaNombre]){porPer[g.personaNombre]={total:0,tipo:g.tipo,pend:0};}
    porPer[g.personaNombre].total+=g.monto;
    if(g.estado!=='pagado')porPer[g.personaNombre].pend+=g.monto;
  });
  const perSort=Object.entries(porPer).sort((a,b)=>b[1].total-a[1].total);
  if(perSort.length){
    h+=`<div class="card" style="margin-bottom:1rem"><div class="ctitle">Por proveedor / empleado</div>
    <table><thead><tr><th>Persona</th><th>Total</th><th>Pendiente</th></tr></thead><tbody>
    ${perSort.map(([n,d])=>`<tr>
      <td style="font-size:12px">${n} <span class="badge ${AF_TIPO_BADGE[d.tipo]||'bgray'}" style="font-size:10px">${AF_TIPO_LABEL[d.tipo]||''}</span></td>
      <td style="font-weight:600">${fmt(d.total)}</td>
      <td class="${d.pend>0?'neg':''}">${fmt(d.pend)}</td>
    </tr>`).join('')}
    </tbody></table></div>`;
  }

  // Resumen mensual
  const porMes={};
  todos.forEach(g=>{
    if(!g.fecha)return;
    const m=g.fecha.slice(0,7);
    if(!porMes[m]){porMes[m]={total:0,pag:0,pend:0,n:0};}
    porMes[m].total+=g.monto;porMes[m].n++;
    if(g.estado==='pagado')porMes[m].pag+=g.monto;else porMes[m].pend+=g.monto;
  });
  const mesSort=Object.entries(porMes).sort((a,b)=>b[0].localeCompare(a[0]));
  if(mesSort.length){
    h+=`<div class="card" style="margin-bottom:1rem"><div class="ctitle">Resumen mensual</div>
    <table><thead><tr><th>Mes</th><th>Registros</th><th>Total</th><th>Pagado</th><th>Pendiente</th></tr></thead><tbody>
    ${mesSort.map(([mes,d])=>`<tr>
      <td style="font-size:13px;font-weight:500">${mes}</td>
      <td style="color:var(--text2)">${d.n}</td>
      <td style="font-weight:600">${fmt(d.total)}</td>
      <td class="pos">${fmt(d.pag)}</td>
      <td class="${d.pend>0?'neg':''}">${fmt(d.pend)}</td>
    </tr>`).join('')}
    </tbody></table></div>`;
  }

  h+=`<div style="display:flex;justify-content:flex-end;margin-bottom:1rem">
    <button class="btn btnsm" onclick="afExportarCSV()">↓ Exportar todos a CSV</button>
  </div>`;
  return h;
}

// ─── EXPORT CSV ────────────────────────────────────────────
function afExportarCSV(){
  const gastos=afGetFiltrados();
  const rows=[['ID','Fecha','Categoría','Tipo','Persona/Lugar','CBU/Alias','CUIT','Medio de pago','Monto','Descripción','Estado','Evento','Comprobante','Observaciones']];
  gastos.forEach(g=>{
    const per=g.personaId?PERSONAS_ADM.find(x=>x.id===g.personaId):null;
    rows.push([
      g.id, g.fecha||'', g.cat||'', AF_TIPO_LABEL[g.tipo]||g.tipo||'',
      g.personaNombre||'', per?.cbu||'', per?.cuit||'',
      g.medio||'', g.monto||0, g.desc||'', g.estado||'',
      g.evIdx!=null?(EVENTOS[g.evIdx]?.nombre||'Evento '+g.evIdx):'',
      g.comprobante||'', g.obs||''
    ]);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`gastos_boom_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();URL.revokeObjectURL(url);
}

// ─── COMPAT: old m-gasto modal (quick event gastos) ───────
function afAddGasto(){ afAbrirGasto(null); }
