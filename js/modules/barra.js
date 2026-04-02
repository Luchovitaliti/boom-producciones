// ═══════════════════════════════════════════════════════════
// BARRA
// ═══════════════════════════════════════════════════════════

let barraSaved    = { inicio: false, cierre: false };
let barraCfgIdx   = -1; // -1 = nuevo, >=0 = editar

// ─── Threshold helper ───
function bThreshold(p, u) {
  const bien  = p.umbralBien  ?? 30;
  const medio = p.umbralMedio ?? 12;
  const bajo  = p.umbralBajo  ?? 5;
  if (u >= bien)  return ['bok',     'Bien'];
  if (u >= medio) return ['bwarn',   'Medio'];
  if (u >= bajo)  return ['borange', 'Bajo'];
  return ['bdanger', 'Muy bajo'];
}

// ─── Page ───
function pgBarra(){
  if(!EVENTOS.length)return`<div class="ptitle">🍺 Módulo de Barra</div><div class="empty" style="margin-top:2rem">Creá un evento primero.</div>`;
  return`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.1rem">
    <div class="ptitle" style="margin:0">🍺 Módulo de Barra</div>
    <button class="btn btnsm" onclick="barraOpenCfg()" title="Configurar productos">⚙️ Configuración</button>
  </div>
  <div class="psub" id="barra-sub"></div>
  ${makeTabs('b',[{id:'inicio',l:'Inicio'},{id:'cierre',l:'Cierre'},{id:'consumo',l:'Consumo'},{id:'precios',l:'Precios'},{id:'cajas',l:'Cajas'},{id:'staff',l:'Staff'},{id:'compra',l:'Compra'}],'inicio')}`;
}
function initBarra(){
  document.getElementById('barra-sub').textContent=EVENTOS[gEv()].nombre;
  barraSaved={inicio:false,cierre:false};
  ensureEvArrays();bLoadInicio();bLoadCierre();bLoadConsumo();bLoadPrecios();bLoadCajas();bLoadStaff();bLoadCompra();
}

// ─── Guardar ───
function bGuardarInicio(){
  barraSaved.inicio=true;
  if(window._fbOK)window.fbSave.stock?.(gEv());
  const tick=document.getElementById('b-ini-tick');if(tick)tick.style.display='inline';
}
function bGuardarCierre(){
  barraSaved.cierre=true;
  if(window._fbOK)window.fbSave.stock?.(gEv());
  const tick=document.getElementById('b-cie-tick');if(tick)tick.style.display='inline';
}

// ─── INICIO ───
function bLoadInicio(){
  const ev=gEv();const ini0=STOCK_INI[ev];
  let h=`<div class="card"><div class="ctitle">Stock al inicio del evento</div>
  <table><thead><tr><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Cajas</th><th>Estado</th></tr></thead><tbody>`;
  PRODS.forEach((p,i)=>{
    const u=ini0[i]??0;
    const [cls,lbl]=bThreshold(p,u);
    h+=`<tr>
      <td style="font-weight:500">${p.n}</td>
      <td><span class="badge bgray" style="font-size:10px">${p.cat}</span></td>
      <td><input type="number" value="${u}" min="0" style="width:65px" id="bi${i}"
        onchange="STOCK_INI[gEv()][${i}]=parseInt(this.value)||0;
          document.getElementById('bic${i}').textContent=Math.floor((parseInt(this.value)||0)/${p.uxc});
          barraSaved.inicio=false;const t=document.getElementById('b-ini-tick');if(t)t.style.display='none'"></td>
      <td id="bic${i}">${Math.floor(u/(p.uxc||1))}</td>
      <td><span class="badge ${cls}">${lbl}</span></td>
    </tr>`;
  });
  h+=`</tbody></table></div>
  <div style="margin-top:.75rem;display:flex;align-items:center;justify-content:flex-end;gap:10px">
    <span class="save-tick" id="b-ini-tick" style="display:${barraSaved.inicio?'inline':'none'}">✓ Guardado</span>
    <button class="btn btnp btnsm" onclick="bGuardarInicio()">💾 Guardar stock inicio</button>
  </div>`;
  document.getElementById('b-inicio').innerHTML=h;
}

// ─── CIERRE ───
function bLoadCierre(){
  const ev=gEv();const ini0=STOCK_INI[ev];const cie=STOCK_CIE[ev];
  let h=`<div class="card"><div class="ctitle">Stock al cierre</div>
  <table><thead><tr><th>Producto</th><th>Inicio</th><th>Sobró</th><th>Vendido</th></tr></thead><tbody>`;
  PRODS.forEach((p,i)=>{
    h+=`<tr>
      <td style="font-weight:500">${p.n}</td>
      <td>${ini0[i]??0}</td>
      <td><input type="number" value="${cie[i]??''}" min="0" style="width:65px"
        onchange="STOCK_CIE[gEv()][${i}]=parseInt(this.value)||0;
          document.getElementById('bcv${i}').textContent=(STOCK_INI[gEv()][${i}]||0)-(parseInt(this.value)||0);
          barraSaved.cierre=false;const t=document.getElementById('b-cie-tick');if(t)t.style.display='none'"></td>
      <td id="bcv${i}">${cie[i]!==null&&cie[i]!==undefined?(ini0[i]??0)-cie[i]:'—'}</td>
    </tr>`;
  });
  h+=`</tbody></table></div>
  <div style="margin-top:.75rem;display:flex;align-items:center;justify-content:flex-end;gap:10px">
    <span class="save-tick" id="b-cie-tick" style="display:${barraSaved.cierre?'inline':'none'}">✓ Guardado</span>
    <button class="btn btnp btnsm" onclick="bGuardarCierre()">💾 Guardar stock cierre</button>
  </div>`;
  document.getElementById('b-cierre').innerHTML=h;
}

// ─── CONSUMO ───
function bLoadConsumo(){
  const ev=gEv();const ini0=STOCK_INI[ev];const cie=STOCK_CIE[ev];
  const vend=cie[0]!==null&&cie[0]!==undefined?ini0.map((u,i)=>(u??0)-(cie[i]??0)):null;
  if(!vend){document.getElementById('b-consumo').innerHTML='<div class="empty">Cargá el cierre para ver consumo.</div>';return;}
  const tv=vend.reduce((a,b)=>a+b,0);const iniTotal=ini0.reduce((a,b)=>a+(b??0),0)||1;
  const mx=Math.max(...vend,1);
  const sorted=PRODS.map((p,i)=>({n:p.n,v:vend[i]})).sort((a,b)=>b.v-a.v);
  let h=`<div class="mg"><div class="met"><div class="ml">Total vendido</div><div class="mv">${tv}</div></div><div class="met"><div class="ml">Rotación</div><div class="mv">${Math.round(tv/iniTotal*100)}%</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">Ranking de productos</div>`;
  sorted.forEach((x,idx)=>{h+=`<div class="bar-row"><span class="bar-lbl">${x.n.split(' ').slice(0,2).join(' ')}</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(x.v/mx*100)}%;background:${AVC[idx%8]}">${x.v}</div></div></div>`;});
  h+=`</div>`;
  document.getElementById('b-consumo').innerHTML=h;
}

// ─── PRECIOS ───
function bLoadPrecios(){
  const ev=gEv();const ini0=STOCK_INI[ev];const cie=STOCK_CIE[ev];
  const vend=cie[0]!==null&&cie[0]!==undefined?ini0.map((u,i)=>(u??0)-(cie[i]??0)):null;
  let h=`<div class="card"><div class="ctitle">Precios y margen</div>
  <table><thead><tr><th>Producto</th><th>Venta</th><th>Costo</th><th>Margen</th><th>Vendido</th><th>Ganancia est.</th></tr></thead><tbody>`;
  let totalG=0;
  PRODS.forEach((p,i)=>{
    const mg=p.pv-p.pc;const v=vend?vend[i]:null;const g=v!==null?mg*v:null;if(g)totalG+=g;
    h+=`<tr>
      <td style="font-weight:500">${p.n}</td>
      <td><input type="number" value="${p.pv}" style="width:90px" onchange="PRODS[${i}].pv=parseFloat(this.value)||0"></td>
      <td><input type="number" value="${p.pc}" style="width:90px" onchange="PRODS[${i}].pc=parseFloat(this.value)||0"></td>
      <td class="${mg>0?'pos':'neg'}">${fmt(mg)}</td>
      <td>${v??'—'}</td>
      <td>${g!==null?`<span class="pos">${fmt(g)}</span>`:'—'}</td>
    </tr>`;
  });
  h+=`<tr class="trow-total"><td colspan="4" style="text-align:right">Total estimado</td><td>${vend?vend.reduce((a,b)=>a+b,0):'—'}</td><td>${totalG?`<span class="pos">${fmt(totalG)}</span>`:'—'}</td></tr>
  </tbody></table></div>
  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:.5rem">
    <button class="btn btnp btnsm" onclick="if(window._fbOK)window.fbSave.stock?.(gEv());alert('Precios guardados ✓')">💾 Guardar precios</button>
  </div>`;
  document.getElementById('b-precios').innerHTML=h;
}

// ─── CAJAS (con resultado por caja + global) ───
function bLoadCajas(){
  const ev=gEv();const cjs=CAJAS_EV[ev];
  let tFE=0,tFM=0,tRE=0,tRM=0;
  cjs.forEach(c=>{tFE+=c.fE;tFM+=c.fM;tRE+=c.rE;tRM+=c.rM;});
  const dE=tRE-tFE,dM=tRM-tFM,dT=(tRE+tRM)-(tFE+tFM);

  let h='';
  cjs.forEach((c,i)=>{
    const dEi=c.rE-c.fE, dMi=c.rM-c.fM, dTi=(c.rE+c.rM)-(c.fE+c.fM);
    h+=`<div class="pcard" style="margin-bottom:.6rem">
      <div style="font-size:12px;font-weight:600;margin-bottom:.5rem;color:var(--text2);text-transform:uppercase;letter-spacing:.04em">Caja ${i+1}</div>
      <div class="fr">
        <div class="fc"><span class="fl">Fudo Efectivo</span><input type="number" value="${c.fE}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].fE=parseFloat(this.value)||0;bLoadCajas()"></div>
        <div class="fc"><span class="fl">Fudo MP</span><input type="number" value="${c.fM}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].fM=parseFloat(this.value)||0;bLoadCajas()"></div>
        <div class="fc"><span class="fl">Real Efectivo</span><input type="number" value="${c.rE}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].rE=parseFloat(this.value)||0;bLoadCajas()"></div>
        <div class="fc"><span class="fl">Real MP</span><input type="number" value="${c.rM}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].rM=parseFloat(this.value)||0;bLoadCajas()"></div>
      </div>
      <div style="margin-top:.5rem;padding-top:.5rem;border-top:1px solid var(--border);display:flex;gap:12px;flex-wrap:wrap;font-size:12px">
        <span>Efectivo: <span class="${dEi===0?'pos':'neg'}" style="font-weight:500">${dEi>0?'+':''}${fmt(dEi)}</span></span>
        <span>MP: <span class="${dMi===0?'pos':'neg'}" style="font-weight:500">${dMi>0?'+':''}${fmt(dMi)}</span></span>
        <span>Total: <span class="${dTi===0?'pos':'neg'}" style="font-weight:600">${dTi>0?'+':''}${fmt(dTi)}</span>
          <span class="badge ${dTi===0?'bok':'bdanger'}" style="font-size:9px;margin-left:4px">${dTi===0?'✓':'⚠'}</span>
        </span>
      </div>
    </div>`;
  });

  h+=`<div class="card"><div class="ctitle">Resultado global del cierre</div>
  <table><thead><tr><th></th><th>Fudo</th><th>Real</th><th>Diferencia</th><th>Estado</th></tr></thead><tbody>
  <tr><td style="font-weight:500">Efectivo total</td><td>${fmt(tFE)}</td><td>${fmt(tRE)}</td><td class="${dE===0?'pos':'neg'}">${fmt(dE)}</td><td><span class="badge ${dE===0?'bok':'bdanger'}">${dE===0?'Cuadra':'Diferencia'}</span></td></tr>
  <tr><td style="font-weight:500">MercadoPago total</td><td>${fmt(tFM)}</td><td>${fmt(tRM)}</td><td class="${dM===0?'pos':'neg'}">${fmt(dM)}</td><td><span class="badge ${dM===0?'bok':'bdanger'}">${dM===0?'Cuadra':'Diferencia'}</span></td></tr>
  <tr class="trow-total"><td>Total general</td><td>${fmt(tFE+tFM)}</td><td>${fmt(tRE+tRM)}</td><td class="${dT===0?'pos':'neg'}">${fmt(dT)}</td><td><span class="badge ${dT===0?'bok':'bdanger'}">${dT===0?'✓ Cuadra':'⚠ Diferencia'}</span></td></tr>
  </tbody></table></div>`;

  document.getElementById('b-cajas').innerHTML=h;
}

// ─── STAFF ───
function bAgregarStaff(){ document.getElementById('m-staff').style.display='flex'; }
function bGuardarStaff(){
  const n=document.getElementById('ms-nombre').value.trim();if(!n){alert('Ingresá el nombre.');return;}
  const s={n,rol:document.getElementById('ms-rol').value,ent:document.getElementById('ms-ent').value,sal:document.getElementById('ms-sal').value,monto:parseFloat(document.getElementById('ms-monto').value)||0,met:document.getElementById('ms-met').value,pag:false};
  STAFF_EV[gEv()].push(s);
  document.getElementById('m-staff').style.display='none';
  if(window._fbOK)window.fbSave.staff?.(gEv());
  bLoadStaff();
}
function bLoadStaff(){
  const ev=gEv();const st=STAFF_EV[ev];
  const pag=st.filter(s=>s.pag).reduce((a,s)=>a+s.monto,0);
  const pend=st.filter(s=>!s.pag).reduce((a,s)=>a+s.monto,0);
  let h=`<div class="mg"><div class="met"><div class="ml">Staff total</div><div class="mv">${st.length}</div></div><div class="met"><div class="ml">Pagado</div><div class="mv pos">${fmt(pag)}</div></div><div class="met"><div class="ml">Pendiente</div><div class="mv ${pend?'neg':''}">${fmt(pend)}</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">Personal del evento</div>`;
  if(!st.length){h+='<div class="empty">Sin staff cargado para este evento.</div>';}
  else{
    h+=`<table><thead><tr><th>Nombre</th><th>Rol</th><th>Horario</th><th>Monto</th><th>Método</th><th>Estado</th><th></th></tr></thead><tbody>`;
    st.forEach((s,idx)=>{
      h+=`<tr>
        <td style="font-weight:500">${s.n}</td>
        <td><span class="badge binfo" style="font-size:10px">${s.rol}</span></td>
        <td>${s.ent}–${s.sal}</td>
        <td>${fmt(s.monto)}</td>
        <td>${s.met}</td>
        <td><span class="badge ${s.pag?'bok':'bwarn'}" onclick="bTogglePago(${idx})" style="cursor:pointer">${s.pag?'Pagado':'Pendiente'}</span></td>
        <td><button class="btn btnsm" style="color:var(--red);font-size:10px" onclick="bDelStaff(${idx})">✕</button></td>
      </tr>`;
    });
    h+=`</tbody></table>`;
  }
  h+=`<div style="display:flex;justify-content:flex-end;margin-top:.75rem"><button class="btn btnp btnsm" onclick="bAgregarStaff()">+ Agregar personal</button></div></div>`;
  document.getElementById('b-staff').innerHTML=h;
}
function bTogglePago(idx){
  const ev=gEv();STAFF_EV[ev][idx].pag=!STAFF_EV[ev][idx].pag;
  if(window._fbOK)window.fbSave.staff?.(ev);bLoadStaff();
}
function bDelStaff(idx){
  if(!confirm('¿Eliminar personal?'))return;
  STAFF_EV[gEv()].splice(idx,1);
  if(window._fbOK)window.fbSave.staff?.(gEv());bLoadStaff();
}

// ─── COMPRA ───
function bLoadCompra(){
  const todos=EVENTOS.map((_,i)=>STOCK_CIE[i]&&STOCK_CIE[i][0]!==null&&STOCK_CIE[i][0]!==undefined?STOCK_INI[i].map((u,j)=>(u??0)-(STOCK_CIE[i][j]??0)):null).filter(Boolean);
  if(!todos.length){document.getElementById('b-compra').innerHTML='<div class="empty">Guardá al menos un cierre para ver la lista de compra.</div>';return;}
  const ev=gEv();const cie=STOCK_CIE[ev];const stock=cie&&cie[0]!==null&&cie[0]!==undefined?cie:PRODS.map(()=>0);
  const prom=PRODS.map((_,i)=>Math.round(todos.reduce((a,e)=>a+(e[i]||0),0)/todos.length));
  let h=`<div class="card"><div class="ctitle">Sugerencia de compra (+10% buffer)</div>
  <table><thead><tr><th>Producto</th><th>Stock actual</th><th>Prom. consumo</th><th>Objetivo</th><th>A comprar</th><th>Cajas</th></tr></thead><tbody>`;
  PRODS.forEach((p,i)=>{
    const obj=Math.ceil(prom[i]*1.1);const sc=stock[i]??0;const comp=Math.max(0,obj-sc);
    h+=`<tr><td style="font-weight:500">${p.n}</td><td>${sc}</td><td>${prom[i]}</td><td>${obj}</td><td>${comp>0?`<span class="badge bdanger">${comp}</span>`:'<span class="badge bok">OK</span>'}</td><td>${comp>0?Math.ceil(comp/(p.uxc||1)):'—'}</td></tr>`;
  });
  h+=`</tbody></table></div>`;
  document.getElementById('b-compra').innerHTML=h;
}

// ══════════ CONFIG ══════════
function barraOpenCfg(){
  barraRenderCfg();
  document.getElementById('m-barra-cfg').style.display='flex';
}
function barraRenderCfg(){
  const body=document.getElementById('barra-cfg-body');if(!body)return;
  if(!PRODS.length){body.innerHTML='<div class="empty">Sin productos. Agregá el primero.</div>';return;}
  body.innerHTML=PRODS.map((p,i)=>`
    <div class="barra-cfg-row">
      <div class="cfg-name">${p.n}</div>
      <div class="cfg-info">${p.cat}</div>
      <div class="cfg-info">×${p.uxc}/caja</div>
      <div class="cfg-info">${fmt(p.pv)} venta</div>
      <button class="btn btnsm" onclick="barraOpenProd(${i})">✏️ Editar</button>
      <button class="btn btnsm" style="color:var(--red)" onclick="barraDelProd(${i})">✕</button>
    </div>`).join('');
}
function barraOpenProd(idx){
  barraCfgIdx=idx;
  document.getElementById('m-barra-prod-ttl').textContent=idx===-1?'Nuevo producto':'Editar producto';
  const p=idx===-1?{n:'',cat:'',uxc:12,pv:0,pc:0,umbralBien:30,umbralMedio:12,umbralBajo:5}:PRODS[idx];
  document.getElementById('bp-nombre').value=p.n||'';
  document.getElementById('bp-cat').value=p.cat||'';
  document.getElementById('bp-pv').value=p.pv||0;
  document.getElementById('bp-pc').value=p.pc||0;
  document.getElementById('bp-uxc').value=p.uxc||12;
  document.getElementById('bp-bien').value=p.umbralBien??30;
  document.getElementById('bp-medio').value=p.umbralMedio??12;
  document.getElementById('bp-bajo').value=p.umbralBajo??5;
  document.getElementById('m-barra-prod').style.display='flex';
}
function barraSaveProd(){
  const nombre=document.getElementById('bp-nombre').value.trim();
  if(!nombre){alert('Ingresá el nombre del producto.');return;}
  const prod={
    n:nombre,
    cat:document.getElementById('bp-cat').value.trim()||'Otros',
    pv:parseFloat(document.getElementById('bp-pv').value)||0,
    pc:parseFloat(document.getElementById('bp-pc').value)||0,
    uxc:parseInt(document.getElementById('bp-uxc').value)||1,
    umbralBien:parseInt(document.getElementById('bp-bien').value)||30,
    umbralMedio:parseInt(document.getElementById('bp-medio').value)||12,
    umbralBajo:parseInt(document.getElementById('bp-bajo').value)||5,
  };
  if(barraCfgIdx===-1){
    PRODS.push(prod);
    STOCK_INI.forEach(s=>s.push(0));
    STOCK_CIE.forEach(s=>s.push(null));
  } else {
    Object.assign(PRODS[barraCfgIdx],prod);
  }
  document.getElementById('m-barra-prod').style.display='none';
  barraRenderCfg();
  // Refresh current barra view
  if(document.getElementById('b-inicio'))bLoadInicio();
  if(document.getElementById('b-cierre'))bLoadCierre();
  if(document.getElementById('b-precios'))bLoadPrecios();
}
function barraDelProd(idx){
  if(!confirm(`¿Eliminar "${PRODS[idx].n}"? Se borrarán también sus datos de stock.`))return;
  PRODS.splice(idx,1);
  STOCK_INI.forEach(s=>s.splice(idx,1));
  STOCK_CIE.forEach(s=>s.splice(idx,1));
  barraRenderCfg();
  if(document.getElementById('b-inicio'))bLoadInicio();
  if(document.getElementById('b-cierre'))bLoadCierre();
  if(document.getElementById('b-precios'))bLoadPrecios();
}
