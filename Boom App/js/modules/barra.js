// ═══════════════════════════════════════════════════════════
// BARRA
// ═══════════════════════════════════════════════════════════
function pgBarra(){
  if(!EVENTOS.length)return`<div class="ptitle">🍺 Módulo de Barra</div><div class="empty" style="margin-top:2rem">Creá un evento primero.</div>`;
  return`<div class="ptitle">🍺 Módulo de Barra</div><div class="psub" id="barra-sub"></div>
  ${makeTabs('b',[{id:'inicio',l:'Inicio'},{id:'cierre',l:'Cierre'},{id:'consumo',l:'Consumo'},{id:'precios',l:'Precios'},{id:'cajas',l:'Cajas'},{id:'staff',l:'Staff'},{id:'compra',l:'Compra'}],'inicio')}`;
}
function initBarra(){
  document.getElementById('barra-sub').textContent=EVENTOS[gEv()].nombre;
  ensureEvArrays();bLoadInicio();bLoadCierre();bLoadConsumo();bLoadPrecios();bLoadCajas();bLoadStaff();bLoadCompra();
}
function bGuardarInicio(){if(window._fbOK)window.fbSave.stock?.(gEv());alert('Stock de inicio guardado ✓');}
function bGuardarCierre(){if(window._fbOK)window.fbSave.stock?.(gEv());alert('Stock de cierre guardado ✓');}
function bAgregarProducto(){
  const n=prompt('Nombre del producto:');if(!n)return;
  const pv=parseFloat(prompt('Precio de venta:')||0);
  const pc=parseFloat(prompt('Precio de costo:')||0);
  const uxc=parseInt(prompt('Unidades por caja:')||1);
  const cat=prompt('Categoría (ej: Cervezas):','Otros');
  PRODS.push({n,cat,uxc,pv,pc});
  STOCK_INI.forEach(s=>s.push(0));STOCK_CIE.forEach(s=>s.push(null));
  initBarra();
}
function bAgregarStaff(){
  document.getElementById('m-staff').style.display='flex';
}
function bGuardarStaff(){
  const n=document.getElementById('ms-nombre').value.trim();if(!n){alert('Ingresá el nombre.');return;}
  const s={n,rol:document.getElementById('ms-rol').value,ent:document.getElementById('ms-ent').value,sal:document.getElementById('ms-sal').value,monto:parseFloat(document.getElementById('ms-monto').value)||0,met:document.getElementById('ms-met').value,pag:false};
  STAFF_EV[gEv()].push(s);
  document.getElementById('m-staff').style.display='none';
  if(window._fbOK)window.fbSave.staff?.(gEv());
  bLoadStaff();
}
function bLoadInicio(){
  const ev=gEv();const ini0=STOCK_INI[ev];
  let h=`<div class="card"><div class="ctitle">Stock al inicio del evento</div><table><thead><tr><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Cajas</th><th>Estado</th></tr></thead><tbody>`;
  PRODS.forEach((p,i)=>{const u=ini0[i];const s=u>=30?'bok':u>=12?'bwarn':'bdanger';h+=`<tr><td style="font-weight:500">${p.n}</td><td><span class="badge bgray" style="font-size:10px">${p.cat}</span></td><td><input type="number" value="${u}" min="0" style="width:65px" id="bi${i}" onchange="STOCK_INI[gEv()][${i}]=parseInt(this.value)||0;document.getElementById('bic${i}').textContent=Math.floor((parseInt(this.value)||0)/${p.uxc})"></td><td id="bic${i}">${Math.floor(u/p.uxc)}</td><td><span class="badge ${s}">${u>=30?'OK':u>=12?'Bajo':'Muy bajo'}</span></td></tr>`;});
  h+=`</tbody></table></div>`;
  h+=`<div style="margin-top:.75rem;text-align:right"><button class="btn btnp btnsm" onclick="bGuardarInicio()">💾 Guardar stock inicio</button></div>`;
  document.getElementById('b-inicio').innerHTML=h;
}
function bLoadCierre(){
  const ev=gEv();const ini0=STOCK_INI[ev];const cie=STOCK_CIE[ev];
  let h=`<div class="card"><div class="ctitle">Stock al cierre</div><table><thead><tr><th>Producto</th><th>Inicio</th><th>Sobró</th><th>Vendido</th></tr></thead><tbody>`;
  PRODS.forEach((p,i)=>{h+=`<tr><td style="font-weight:500">${p.n}</td><td>${ini0[i]}</td><td><input type="number" value="${cie[i]??''}" min="0" style="width:65px" onchange="STOCK_CIE[gEv()][${i}]=parseInt(this.value)||0;document.getElementById('bcv${i}').textContent=STOCK_INI[gEv()][${i}]-(parseInt(this.value)||0)"></td><td id="bcv${i}">${cie[i]!==null?ini0[i]-cie[i]:'—'}</td></tr>`;});
  h+=`</tbody></table></div>`;
  h+=`<div style="margin-top:.75rem;text-align:right"><button class="btn btnp btnsm" onclick="bGuardarCierre()">💾 Guardar stock cierre</button></div>`;
  document.getElementById('b-cierre').innerHTML=h;
}
function bLoadConsumo(){
  const ev=gEv();const ini0=STOCK_INI[ev];const cie=STOCK_CIE[ev];
  const vend=cie[0]!==null?ini0.map((u,i)=>u-cie[i]):null;
  if(!vend){document.getElementById('b-consumo').innerHTML='<div class="empty">Cargá el cierre para ver consumo.</div>';return;}
  const tv=vend.reduce((a,b)=>a+b,0);const mx=Math.max(...vend)||1;
  const sorted=PRODS.map((p,i)=>({n:p.n,v:vend[i]})).sort((a,b)=>b.v-a.v);
  let h=`<div class="mg"><div class="met"><div class="ml">Total vendido</div><div class="mv">${tv}</div></div><div class="met"><div class="ml">Rotación</div><div class="mv">${Math.round(tv/ini0.reduce((a,b)=>a+b,0)*100)}%</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">Ranking de productos</div>`;
  sorted.forEach((x,idx)=>{h+=`<div class="bar-row"><span class="bar-lbl">${x.n.split(' ').slice(0,2).join(' ')}</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(x.v/mx*100)}%;background:${AVC[idx%8]}">${x.v}</div></div></div>`;});
  h+=`</div>`;
  document.getElementById('b-consumo').innerHTML=h;
}
function bLoadPrecios(){
  const ev=gEv();const ini0=STOCK_INI[ev];const cie=STOCK_CIE[ev];
  const vend=cie[0]!==null?ini0.map((u,i)=>u-cie[i]):null;
  let h=`<div class="card"><div class="ctitle">Precios y margen</div><table><thead><tr><th>Producto</th><th>Venta</th><th>Costo</th><th>Margen</th><th>Vendido</th><th>Ganancia est.</th></tr></thead><tbody>`;
  let totalG=0;
  PRODS.forEach((p,i)=>{const mg=p.pv-p.pc;const v=vend?vend[i]:null;const g=v!==null?mg*v:null;if(g)totalG+=g;h+=`<tr><td style="font-weight:500">${p.n}</td><td><input type="number" value="${p.pv}" style="width:90px" onchange="PRODS[${i}].pv=parseFloat(this.value)||0"></td><td><input type="number" value="${p.pc}" style="width:90px" onchange="PRODS[${i}].pc=parseFloat(this.value)||0"></td><td class="${mg>0?'pos':'neg'}">${fmt(mg)}</td><td>${v??'—'}</td><td>${g!==null?`<span class="pos">${fmt(g)}</span>`:'—'}</td></tr>`;});
  h+=`<tr class="trow-total"><td colspan="4" style="text-align:right">Total estimado</td><td>${vend?vend.reduce((a,b)=>a+b,0):'—'}</td><td>${totalG?`<span class="pos">${fmt(totalG)}</span>`:'—'}</td></tr></tbody></table></div>`;
  h+=`<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:.5rem"><button class="btn btnsm" onclick="bAgregarProducto()">+ Producto</button><button class="btn btnp btnsm" onclick="alert('Precios actualizados ✓')">💾 Guardar precios</button></div>`;
  document.getElementById('b-precios').innerHTML=h;
}
function bLoadCajas(){
  const ev=gEv();const cjs=CAJAS_EV[ev];
  let tFE=0,tFM=0,tRE=0,tRM=0;cjs.forEach(c=>{tFE+=c.fE;tFM+=c.fM;tRE+=c.rE;tRM+=c.rM;});
  const dE=tRE-tFE,dM=tRM-tFM,dT=(tRE+tRM)-(tFE+tFM);
  let h='';
  cjs.forEach((c,i)=>{h+=`<div class="pcard" style="margin-bottom:.5rem"><div style="font-size:12px;font-weight:500;margin-bottom:.5rem;color:var(--text2)">Caja ${i+1}</div><div class="fr"><div class="fc"><span class="fl">Fudo Efectivo</span><input type="number" value="${c.fE}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].fE=parseFloat(this.value)||0;bLoadCajas()"></div><div class="fc"><span class="fl">Fudo MP</span><input type="number" value="${c.fM}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].fM=parseFloat(this.value)||0;bLoadCajas()"></div><div class="fc"><span class="fl">Real Efectivo</span><input type="number" value="${c.rE}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].rE=parseFloat(this.value)||0;bLoadCajas()"></div><div class="fc"><span class="fl">Real MP</span><input type="number" value="${c.rM}" style="width:110px" onchange="CAJAS_EV[gEv()][${i}].rM=parseFloat(this.value)||0;bLoadCajas()"></div></div></div>`;});
  h+=`<div class="card"><div class="ctitle">Resultado del cierre</div><table><thead><tr><th></th><th>Fudo</th><th>Real</th><th>Diferencia</th><th>Estado</th></tr></thead><tbody>
  <tr><td style="font-weight:500">Efectivo total</td><td>${fmt(tFE)}</td><td>${fmt(tRE)}</td><td class="${dE===0?'pos':'neg'}">${fmt(dE)}</td><td><span class="badge ${dE===0?'bok':'bdanger'}">${dE===0?'Cuadra':'Diferencia'}</span></td></tr>
  <tr><td style="font-weight:500">MercadoPago total</td><td>${fmt(tFM)}</td><td>${fmt(tRM)}</td><td class="${dM===0?'pos':'neg'}">${fmt(dM)}</td><td><span class="badge ${dM===0?'bok':'bdanger'}">${dM===0?'Cuadra':'Diferencia'}</span></td></tr>
  <tr class="trow-total"><td>Total general</td><td>${fmt(tFE+tFM)}</td><td>${fmt(tRE+tRM)}</td><td class="${dT===0?'pos':'neg'}">${fmt(dT)}</td><td><span class="badge ${dT===0?'bok':'bdanger'}">${dT===0?'✓ Cuadra':'⚠ Diferencia'}</span></td></tr>
  </tbody></table></div>`;
  document.getElementById('b-cajas').innerHTML=h;
}
function bLoadStaff(){
  const ev=gEv();const st=STAFF_EV[ev];
  const pag=st.filter(s=>s.pag).reduce((a,s)=>a+s.monto,0);
  const pend=st.filter(s=>!s.pag).reduce((a,s)=>a+s.monto,0);
  let h=`<div class="mg"><div class="met"><div class="ml">Staff total</div><div class="mv">${st.length}</div></div><div class="met"><div class="ml">Pagado</div><div class="mv pos">${fmt(pag)}</div></div><div class="met"><div class="ml">Pendiente</div><div class="mv ${pend?'neg':''}">${fmt(pend)}</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">Personal del evento</div>`;
  if(!st.length){h+='<div class="empty">Sin staff cargado para este evento.</div>';}
  else{h+=`<table><thead><tr><th>Nombre</th><th>Rol</th><th>Horario</th><th>Monto</th><th>Método</th><th>Estado</th></tr></thead><tbody>`;st.forEach(s=>{h+=`<tr><td style="font-weight:500">${s.n}</td><td><span class="badge binfo" style="font-size:10px">${s.rol}</span></td><td>${s.ent}–${s.sal}</td><td>${fmt(s.monto)}</td><td>${s.met}</td><td><span class="badge ${s.pag?'bok':'bwarn'}">${s.pag?'Pagado':'Pendiente'}</span></td></tr>`;});h+=`</tbody></table>`;}
  h+=`<div style="display:flex;justify-content:flex-end;margin-top:.75rem"><button class="btn btnp btnsm" onclick="bAgregarStaff()">+ Agregar personal</button></div></div>`;
  document.getElementById('b-staff').innerHTML=h;
}
function bLoadCompra(){
  const todos=EVENTOS.map((_,i)=>STOCK_CIE[i][0]!==null?STOCK_INI[i].map((u,j)=>u-STOCK_CIE[i][j]):null).filter(Boolean);
  if(!todos.length){document.getElementById('b-compra').innerHTML='<div class="empty">Guardá al menos un cierre para ver la lista de compra.</div>';return;}
  const ev=gEv();const cie=STOCK_CIE[ev];const stock=cie[0]!==null?cie:PRODS.map(()=>0);
  const prom=PRODS.map((_,i)=>Math.round(todos.reduce((a,e)=>a+e[i],0)/todos.length));
  let h=`<div class="card"><div class="ctitle">Sugerencia de compra (+10% buffer)</div><table><thead><tr><th>Producto</th><th>Stock actual</th><th>Prom. consumo</th><th>Objetivo</th><th>A comprar</th><th>Cajas</th></tr></thead><tbody>`;
  PRODS.forEach((p,i)=>{const obj=Math.ceil(prom[i]*1.1);const sc=stock[i];const comp=Math.max(0,obj-sc);h+=`<tr><td style="font-weight:500">${p.n}</td><td>${sc}</td><td>${prom[i]}</td><td>${obj}</td><td>${comp>0?`<span class="badge bdanger">${comp}</span>`:'<span class="badge bok">OK</span>'}</td><td>${comp>0?Math.ceil(comp/p.uxc):'—'}</td></tr>`;});
  h+=`</tbody></table></div>`;
  document.getElementById('b-compra').innerHTML=h;
}
