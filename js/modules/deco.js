// ═══ DECO — Decoración de eventos ═══
let decoNId = 1;

// ── Ensure data structure for event ──────────────────────────
function decoEnsure(ev){
  if(!DECO_DATA[ev]) DECO_DATA[ev]={stock:[],shopping:[],budget:{total:0,gastado:0},checklist:[]};
  const d=DECO_DATA[ev];
  if(!d.stock)     d.stock=[];
  if(!d.shopping)  d.shopping=[];
  if(!d.budget)    d.budget={total:0,gastado:0};
  if(!d.checklist) d.checklist=[];
  return d;
}

function decoSave(ev){ if(window._fbOK) window.fbSave.deco(ev); }

// ── Page shell ────────────────────────────────────────────────
function pgDeco(){
  if(!EVENTOS.length) return`<div class="ptitle">🌸 Decoración</div><div class="empty" style="margin-top:2rem">Creá un evento primero.</div>`;
  return`
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.1rem">
    <div class="ptitle" style="margin:0">🌸 Decoración</div>
  </div>
  <div class="psub" id="deco-sub"></div>
  ${makeTabs('deco',[
    {id:'stock',    l:'📦 Stock'},
    {id:'shopping', l:'🛒 Compras'},
    {id:'budget',   l:'💰 Presupuesto'},
    {id:'checklist',l:'✅ Checklist'},
  ],'stock')}`;
}

function initDeco(){
  const ev=gEv();
  decoEnsure(ev);
  const sub=document.getElementById('deco-sub');
  if(sub) sub.textContent=EVENTOS[ev]?.nombre||'Evento';
  decoLoadStock();
  decoLoadShopping();
  decoLoadBudget();
  decoLoadChecklist();
}

// ══════════════════════════════════════
// STOCK
// ══════════════════════════════════════
function decoLoadStock(){
  const ev=gEv(); const d=decoEnsure(ev);
  const el=document.getElementById('deco-stock'); if(!el) return;
  const ESTADOS=['ok','falta','dañado'];
  const ECLS={ok:'bok',falta:'bwarn',dañado:'bdanger'};
  const ELBL={ok:'Ok',falta:'Falta',dañado:'Dañado'};
  let h=`<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
      <div class="ctitle" style="margin:0">📦 Stock de decoración</div>
      <button class="btn btnsm btnp" onclick="decoOpenModal('stock')">+ Agregar</button>
    </div>`;
  if(!d.stock.length){
    h+=`<div class="empty">Sin items registrados.</div>`;
  } else {
    d.stock.forEach(it=>{
      h+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500">${it.name}</div>
          <div style="font-size:11px;color:var(--text3)">Cantidad: ${it.cantidad}</div>
        </div>
        <span class="badge ${ECLS[it.estado]||'bgray'}">${ELBL[it.estado]||it.estado}</span>
        <button class="btn btnsm" onclick="decoOpenModal('stock','${it.id}')">✏️</button>
        <button class="btn btnsm btnd" onclick="decoDelete('stock','${it.id}')" style="padding:5px 9px">✕</button>
      </div>`;
    });
  }
  h+=`</div>`;
  el.innerHTML=h;
}

// ══════════════════════════════════════
// SHOPPING
// ══════════════════════════════════════
function decoLoadShopping(){
  const ev=gEv(); const d=decoEnsure(ev);
  const el=document.getElementById('deco-shopping'); if(!el) return;
  const PCLS={alta:'bdanger',media:'bwarn',baja:'bok'};
  let h=`<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
      <div class="ctitle" style="margin:0">🛒 Lista de compras</div>
      <button class="btn btnsm btnp" onclick="decoOpenModal('shopping')">+ Agregar</button>
    </div>`;
  const pending=d.shopping.filter(i=>!i.comprado);
  const done   =d.shopping.filter(i=>i.comprado);
  if(!d.shopping.length){
    h+=`<div class="empty">Sin compras registradas.</div>`;
  } else {
    const row=(it)=>`
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);${it.comprado?'opacity:.5':''}">
        <input type="checkbox" ${it.comprado?'checked':''} style="width:17px;height:17px;cursor:pointer;accent-color:var(--accent)"
          onchange="decoToggleComprado('${it.id}',this.checked)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;${it.comprado?'text-decoration:line-through':''}">${it.name}</div>
          <div style="font-size:11px;color:var(--text3)">$${(it.precioEstimado||0).toLocaleString('es-AR')}</div>
        </div>
        <span class="badge ${PCLS[it.prioridad]||'bgray'}" style="font-size:10px">${it.prioridad||'—'}</span>
        <button class="btn btnsm" onclick="decoOpenModal('shopping','${it.id}')">✏️</button>
        <button class="btn btnsm btnd" onclick="decoDelete('shopping','${it.id}')" style="padding:5px 9px">✕</button>
      </div>`;
    if(pending.length){ h+=`<div style="font-size:11px;color:var(--text3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">Pendientes (${pending.length})</div>`; pending.forEach(it=>h+=row(it)); }
    if(done.length)   { h+=`<div style="font-size:11px;color:var(--text3);margin:12px 0 4px;text-transform:uppercase;letter-spacing:.04em">Comprados (${done.length})</div>`; done.forEach(it=>h+=row(it)); }
  }
  h+=`</div>`;
  el.innerHTML=h;
}

function decoToggleComprado(id,val){
  const ev=gEv(); const d=decoEnsure(ev);
  const it=d.shopping.find(i=>i.id===id); if(!it) return;
  it.comprado=val;
  decoSave(ev);
  decoLoadShopping();
  decoLoadBudget();
}

// ══════════════════════════════════════
// BUDGET
// ══════════════════════════════════════
function decoLoadBudget(){
  const ev=gEv(); const d=decoEnsure(ev);
  const el=document.getElementById('deco-budget'); if(!el) return;
  // Gastado = suma de items comprados con precioEstimado
  const gastadoAuto=d.shopping.filter(i=>i.comprado).reduce((s,i)=>s+(i.precioEstimado||0),0);
  const total  = d.budget.total||0;
  const gastado= d.budget.gastado||gastadoAuto;
  const restante=Math.max(0,total-gastado);
  const pct=total>0?Math.min(100,Math.round(gastado/total*100)):0;
  const barColor=pct>=90?'var(--red)':pct>=70?'#f59e0b':'var(--accent)';
  let h=`<div class="card" style="margin-bottom:1rem">
    <div class="ctitle" style="margin-bottom:1rem">💰 Presupuesto de decoración</div>
    <div style="display:flex;gap:10px;margin-bottom:1rem;flex-wrap:wrap">
      <div style="flex:1;min-width:100px;background:var(--glass2);border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px;text-transform:uppercase">Total</div>
        <div style="font-size:20px;font-weight:700;color:var(--text)">$${total.toLocaleString('es-AR')}</div>
      </div>
      <div style="flex:1;min-width:100px;background:var(--glass2);border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px;text-transform:uppercase">Gastado</div>
        <div style="font-size:20px;font-weight:700;color:${barColor}">$${gastado.toLocaleString('es-AR')}</div>
      </div>
      <div style="flex:1;min-width:100px;background:var(--glass2);border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px;text-transform:uppercase">Restante</div>
        <div style="font-size:20px;font-weight:700;color:var(--accent)">$${restante.toLocaleString('es-AR')}</div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,.06);border-radius:99px;height:8px;overflow:hidden;margin-bottom:1rem">
      <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px;transition:width .4s"></div>
    </div>
    <div class="ctitle" style="margin-bottom:8px">Editar presupuesto</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <div class="fc" style="flex:1;min-width:130px">
        <span class="fl">Presupuesto total</span>
        <input type="number" id="deco-budget-total" value="${total}" placeholder="0"
          style="width:100%" onchange="decoSetBudget()">
      </div>
      <div class="fc" style="flex:1;min-width:130px">
        <span class="fl">Gastado real</span>
        <input type="number" id="deco-budget-gastado" value="${gastado}" placeholder="0"
          style="width:100%" onchange="decoSetBudget()">
      </div>
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:6px">
      💡 El gastado se actualiza automáticamente con los items comprados (${gastadoAuto.toLocaleString('es-AR')} acumulado).
    </div>
  </div>`;
  el.innerHTML=h;
}

function decoSetBudget(){
  const ev=gEv(); const d=decoEnsure(ev);
  d.budget.total  = parseInt(document.getElementById('deco-budget-total')?.value||'0',10)||0;
  d.budget.gastado= parseInt(document.getElementById('deco-budget-gastado')?.value||'0',10)||0;
  decoSave(ev);
  decoLoadBudget();
}

// ══════════════════════════════════════
// CHECKLIST
// ══════════════════════════════════════
function decoLoadChecklist(){
  const ev=gEv(); const d=decoEnsure(ev);
  const el=document.getElementById('deco-checklist'); if(!el) return;
  const done  =d.checklist.filter(i=>i.done).length;
  const total =d.checklist.length;
  let h=`<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="ctitle" style="margin:0">✅ Checklist</div>
        ${total?`<span class="badge ${done===total&&total>0?'bok':'bgray'}" style="font-size:10px">${done}/${total}</span>`:''}
      </div>
      <button class="btn btnsm btnp" onclick="decoOpenModal('checklist')">+ Agregar</button>
    </div>`;
  if(!d.checklist.length){
    h+=`<div class="empty">Sin tareas en el checklist.</div>`;
  } else {
    d.checklist.forEach(it=>{
      h+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <input type="checkbox" ${it.done?'checked':''} style="width:17px;height:17px;cursor:pointer;accent-color:var(--accent)"
          onchange="decoToggleCheck('${it.id}',this.checked)">
        <div style="flex:1;font-size:13px;${it.done?'text-decoration:line-through;color:var(--text3)':''}">${it.text}</div>
        <button class="btn btnsm btnd" onclick="decoDelete('checklist','${it.id}')" style="padding:5px 9px">✕</button>
      </div>`;
    });
  }
  // Progreso bar
  if(total>0){
    const pct=Math.round(done/total*100);
    h+=`<div style="margin-top:10px;background:rgba(255,255,255,.06);border-radius:99px;height:6px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:99px;transition:width .4s"></div>
    </div>`;
  }
  h+=`</div>`;
  el.innerHTML=h;
}

function decoToggleCheck(id,val){
  const ev=gEv(); const d=decoEnsure(ev);
  const it=d.checklist.find(i=>i.id===id); if(!it) return;
  it.done=val;
  decoSave(ev);
  decoLoadChecklist();
}

// ══════════════════════════════════════
// CRUD genérico
// ══════════════════════════════════════
let _decoModalSection='';
let _decoModalId=null;

function decoOpenModal(section, id=null){
  _decoModalSection=section;
  _decoModalId=id;
  const ev=gEv(); const d=decoEnsure(ev);
  const el=document.getElementById('m-deco'); if(!el) return;
  document.getElementById('m-deco-ttl').textContent = id ? 'Editar item' : 'Nuevo item';
  // Reset
  ['m-deco-name','m-deco-cantidad','m-deco-estado','m-deco-prioridad','m-deco-precio','m-deco-name-sh','m-deco-text'].forEach(i=>{
    const e=document.getElementById(i); if(e) e.value='';
  });
  // Mostrar campos según sección
  document.getElementById('deco-f-stock').style.display    = section==='stock'    ?'':'none';
  document.getElementById('deco-f-shopping').style.display = section==='shopping' ?'':'none';
  document.getElementById('deco-f-checklist').style.display= section==='checklist'?'':'none';
  // Si edita, cargar valores
  if(id){
    const arr=section==='stock'?d.stock:section==='shopping'?d.shopping:d.checklist;
    const it=arr.find(i=>i.id===id); if(!it) return;
    if(section==='stock'){
      document.getElementById('m-deco-name').value    = it.name||'';
      document.getElementById('m-deco-cantidad').value= it.cantidad||'';
      document.getElementById('m-deco-estado').value  = it.estado||'ok';
    } else if(section==='shopping'){
      document.getElementById('m-deco-name-sh').value  = it.name||'';
      document.getElementById('m-deco-prioridad').value= it.prioridad||'media';
      document.getElementById('m-deco-precio').value   = it.precioEstimado||'';
    } else {
      document.getElementById('m-deco-text').value = it.text||'';
    }
  }
  el.style.display='flex';
  setTimeout(()=>document.getElementById(section==='checklist'?'m-deco-text':section==='shopping'?'m-deco-name-sh':'m-deco-name')?.focus(),80);
}

function decoSaveModal(){
  const ev=gEv(); const d=decoEnsure(ev);
  const s=_decoModalSection;
  let item={};
  if(s==='stock'){
    const name=(document.getElementById('m-deco-name')?.value||'').trim();
    if(!name){ alert('Ingresá un nombre.'); return; }
    item={ id:_decoModalId||'deco_'+Date.now(), name, cantidad:parseInt(document.getElementById('m-deco-cantidad')?.value||'1',10)||1, estado:document.getElementById('m-deco-estado')?.value||'ok' };
    if(_decoModalId){ const i=d.stock.findIndex(x=>x.id===_decoModalId); if(i>=0) d.stock[i]=item; }
    else d.stock.push(item);
  } else if(s==='shopping'){
    const name=(document.getElementById('m-deco-name-sh')?.value||'').trim();
    if(!name){ alert('Ingresá un nombre.'); return; }
    const existing=_decoModalId?d.shopping.find(x=>x.id===_decoModalId):null;
    item={ id:_decoModalId||'deco_'+Date.now(), name, prioridad:document.getElementById('m-deco-prioridad')?.value||'media', precioEstimado:parseInt(document.getElementById('m-deco-precio')?.value||'0',10)||0, comprado:existing?.comprado||false };
    if(_decoModalId){ const i=d.shopping.findIndex(x=>x.id===_decoModalId); if(i>=0) d.shopping[i]=item; }
    else d.shopping.push(item);
  } else if(s==='checklist'){
    const text=(document.getElementById('m-deco-text')?.value||'').trim();
    if(!text){ alert('Ingresá una tarea.'); return; }
    const existing=_decoModalId?d.checklist.find(x=>x.id===_decoModalId):null;
    item={ id:_decoModalId||'deco_'+Date.now(), text, done:existing?.done||false };
    if(_decoModalId){ const i=d.checklist.findIndex(x=>x.id===_decoModalId); if(i>=0) d.checklist[i]=item; }
    else d.checklist.push(item);
  }
  document.getElementById('m-deco').style.display='none';
  decoSave(ev);
  if(s==='stock')    decoLoadStock();
  if(s==='shopping') { decoLoadShopping(); decoLoadBudget(); }
  if(s==='checklist')decoLoadChecklist();
}

function decoDelete(section, id){
  if(!confirm('¿Eliminar este item?')) return;
  const ev=gEv(); const d=decoEnsure(ev);
  if(section==='stock')    d.stock    =d.stock.filter(i=>i.id!==id);
  if(section==='shopping') d.shopping =d.shopping.filter(i=>i.id!==id);
  if(section==='checklist')d.checklist=d.checklist.filter(i=>i.id!==id);
  decoSave(ev);
  if(section==='stock')    decoLoadStock();
  if(section==='shopping') { decoLoadShopping(); decoLoadBudget(); }
  if(section==='checklist')decoLoadChecklist();
}
