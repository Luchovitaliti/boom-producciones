// ═══════════════════════════════════════════════════════════
// ADMIN FIN
// ═══════════════════════════════════════════════════════════
function pgAdminFin(){
  const ev=gEv();
  if(!EVENTOS.length||ev>=EVENTOS.length)return`<div class="ptitle">📋 Administración</div><div class="empty" style="margin-top:2rem">Creá un evento primero.</div>`;
  const gs=GASTOS_EV[ev]||[];
  const total=gs.reduce((a,g)=>a+g.m,0);
  const pag=gs.filter(g=>g.e==='pagado').reduce((a,g)=>a+g.m,0);
  const ap=gs.filter(g=>g.e==='aprobacion');
  return`<div class="ptitle">📋 Administración</div><div class="psub">${EVENTOS[ev].nombre}</div>
  <div class="mg"><div class="met"><div class="ml">Total gastos</div><div class="mv">${fmt(total)}</div></div><div class="met"><div class="ml">Pagado</div><div class="mv pos">${fmt(pag)}</div></div><div class="met"><div class="ml">Pendiente</div><div class="mv neg">${fmt(total-pag)}</div></div><div class="met"><div class="ml">En aprobación</div><div class="mv ${ap.length?'neg':''}">${ap.length}</div></div></div>
  <div class="tnav"><button class="tbtn active" onclick="afLoadGastos()">Gastos</button><button class="tbtn" onclick="afLoadAprob()">Aprobaciones</button></div>
  <div id="af-gastos-target"></div>
  <div id="af-aprob-target"></div>`;
}
function initAdminFin(){
  afLoadGastos();afLoadAprob();
}
function afLoadGastos(){
  const el=document.getElementById('af-gastos-target');if(!el)return;
  const ev=gEv();const gs=GASTOS_EV[ev]||[];
  let h=`<div style="display:flex;justify-content:flex-end;margin-bottom:.5rem"><button class="btn btnp btnsm" onclick="afAddGasto()">+ Agregar gasto</button></div>`;
  h+=`<div class="card"><div class="ctitle">Lista de gastos</div>`;
  if(!gs.length)h+='<div class="empty">Sin gastos cargados.</div>';
  else{h+=`<table><thead><tr><th>Descripción</th><th>Rubro</th><th>Monto</th><th>Estado</th><th></th></tr></thead><tbody>`;
  gs.forEach((g,i)=>{h+=`<tr><td style="font-weight:500">${g.d}</td><td><span class="tag">${g.r}</span></td><td class="${g.e==='pagado'?'pos':'neg'}">${fmt(g.m)}</td><td><span class="badge ${g.e==='pagado'?'bok':g.e==='aprobacion'?'bwarn':'bdanger'}">${g.e==='pagado'?'Pagado':g.e==='aprobacion'?'Aprobación':'Pendiente'}</span></td><td><div style="display:flex;gap:4px">${g.e!=='pagado'?`<button class="btn btnsm" onclick="afPagarGasto(${i})">✓ Pagar</button>`:''}<button class="btn btnsm btnd" onclick="afBorrarGasto(${i})">✕</button></div></td></tr>`;});
  h+=`</tbody></table>`;}
  h+=`</div>`;el.innerHTML=h;
}
function afLoadAprob(){
  const el=document.getElementById('af-aprob-target');if(!el)return;
  const ev=gEv();const ap=(GASTOS_EV[ev]||[]).filter(g=>g.e==='aprobacion');
  let h=`<div class="card"><div class="ctitle">Esperando aprobación CEO</div>`;
  if(!ap.length)h+='<div class="empty">Sin gastos en aprobación.</div>';
  else ap.forEach(g=>{h+=`<div class="ai"><div><div style="font-size:13px;font-weight:500">${g.d}</div><div style="font-size:11px;color:var(--text2)">${g.r}</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-weight:500">${fmt(g.m)}</span><button class="btn btnsm btnp" onclick="afAprob('${g.d}')">Aprobar</button><button class="btn btnsm btnd" onclick="afRech('${g.d}')">Rechazar</button></div></div>`;});
  h+=`</div>`;el.innerHTML=h;
}
function afAddGasto(){
  document.getElementById('m-gasto').style.display='flex';
}
function afSaveGasto(){
  const d=document.getElementById('mg-desc').value.trim();if(!d){alert('Ingresá una descripción.');return;}
  const m=parseFloat(document.getElementById('mg-monto').value)||0;
  const r=document.getElementById('mg-rubro').value;
  GASTOS_EV[gEv()].push({d,r,m,e:'pendiente'});
  document.getElementById('m-gasto').style.display='none';
  if(window._fbOK)window.fbSave.gastos?.(gEv());
  afLoadGastos();
}
function afPagarGasto(i){GASTOS_EV[gEv()][i].e='pagado';if(window._fbOK)window.fbSave.gastos?.(gEv());afLoadGastos();afLoadAprob();}
function afBorrarGasto(i){if(!confirm('¿Eliminar este gasto?'))return;GASTOS_EV[gEv()].splice(i,1);if(window._fbOK)window.fbSave.gastos?.(gEv());afLoadGastos();}
function afAprob(desc){
  const ev=gEv();const g=GASTOS_EV[ev].find(x=>x.d===desc&&x.e==='aprobacion');
  if(g){g.e='pendiente';if(window._fbOK)window.fbSave.gastos?.(ev);afLoadGastos();afLoadAprob();}
}
function afRech(desc){
  const ev=gEv();const idx=GASTOS_EV[ev].findIndex(x=>x.d===desc&&x.e==='aprobacion');
  if(idx>=0){GASTOS_EV[ev].splice(idx,1);if(window._fbOK)window.fbSave.gastos?.(ev);afLoadGastos();afLoadAprob();}
}
