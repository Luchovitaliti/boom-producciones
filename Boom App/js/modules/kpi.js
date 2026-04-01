// ═══════════════════════════════════════════════════════════
// KPI — sin scripts embebidos
// ═══════════════════════════════════════════════════════════
function pgKPI(){
  return`<div class="ptitle">📈 Reportes y KPIs</div><div class="psub">Vista completa de la temporada</div>
  ${makeTabs('kpi',[{id:'general',l:'General'},{id:'financiero',l:'Financiero'},{id:'barra',l:'Barra'},{id:'publicas',l:'Públicas'}],'general')}`;
}
function initKPI(){kpiGeneral();kpiFinanciero();kpiBarra();kpiPublicas();}
function kpiGeneral(){
  const el=document.getElementById('kpi-general');if(!el)return;
  const cerrados=EV_FIN.slice(0,2);
  const totIng=cerrados.reduce((a,d)=>a+(d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio+d.barra.g,0);
  const totGas=GASTOS_EV.slice(0,2).reduce((a,gs)=>a+gs.reduce((b,g)=>b+g.m,0),0);
  let h=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1rem">
    <div class="pcard" style="text-align:center"><div style="font-size:28px;font-weight:600">2</div><div style="font-size:12px;color:var(--text3);margin-top:4px">Eventos realizados</div></div>
    <div class="pcard" style="text-align:center"><div style="font-size:28px;font-weight:600">360</div><div style="font-size:12px;color:var(--text3);margin-top:4px">Asistencia promedio</div></div>
    <div class="pcard" style="text-align:center"><div style="font-size:28px;font-weight:600;color:var(--green)">${fmt(totIng)}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">Ingresos totales</div></div>
    <div class="pcard" style="text-align:center"><div style="font-size:28px;font-weight:600;${totIng-totGas>0?'color:var(--green)':'color:var(--red)'}">${fmt(totIng-totGas)}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">Resultado neto</div></div>
  </div>`;
  h+=`<div class="card"><div class="ctitle">Resultado por evento</div>`;
  EV_FIN.forEach((d,i)=>{const ing=(d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio+d.barra.g;const gas=GASTOS_EV[i].reduce((a,g)=>a+g.m,0);const res=ing-gas;const ok=i<2;h+=`<div class="ai"><div><div style="font-size:13px;font-weight:500">${EVENTOS[i].nombre}</div><div style="font-size:11px;color:var(--text2)">${ok?'Realizado':'En planificación'}</div></div><div style="text-align:right"><div style="font-size:14px;font-weight:500" class="${ok?res>0?'pos':'neg':''}">${ok?fmt(res):'—'}</div><span class="badge ${ok?res>0?'bok':'bdanger':'bwarn'}">${ok?res>0?'Positivo':'Negativo':'Pendiente'}</span></div></div>`;});
  h+=`</div>`;el.innerHTML=h;
}
function kpiFinanciero(){
  const el=document.getElementById('kpi-financiero');if(!el)return;
  let h=`<div class="card"><div class="ctitle">Comparativo financiero</div><table><thead><tr><th>Evento</th><th>Ingresos</th><th>Gastos</th><th>Margen</th><th>Resultado</th></tr></thead><tbody>`;
  EV_FIN.forEach((d,i)=>{const ing=(d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio+d.barra.g;const gas=GASTOS_EV[i].reduce((a,g)=>a+g.m,0);const res=ing-gas;const m=ing?Math.round(res/ing*100):0;const ok=i<2;h+=`<tr><td style="font-weight:500">${EVENTOS[i].nombre}</td><td class="pos">${ok?fmt(ing):'—'}</td><td class="neg">${fmt(gas)}</td><td>${ok?m+'%':'—'}</td><td class="${ok?res>0?'pos':'neg':''}">${ok?fmt(res):'—'}</td></tr>`;});
  h+=`</tbody></table></div>`;
  h+=`<div class="card"><div class="ctitle">Desglose de gastos promedio</div>`;
  [['Cachets artistas','#D85A30',120000],['Alquiler venue','#60a5fa',80000],['Staff','#4ade80',39000],['Publicidad','#fbbf24',41500],['Habilitaciones','#a78bfa',18000],['Otros','#888',20000]].forEach(([l,c,v])=>{h+=`<div class="bar-row"><span class="bar-lbl">${l}</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(v/120000*100)}%;background:${c}">${fmt(v)}</div></div></div>`;});
  h+=`</div>`;el.innerHTML=h;
}
function kpiBarra(){
  const el=document.getElementById('kpi-barra');if(!el)return;
  const cerrados=EV_FIN.slice(0,2);
  let h=`<div class="mg">${cerrados.map((d,i)=>`<div class="met"><div class="ml">${EVENTOS[i].nombre}</div><div class="mv pos">${fmt(d.barra.g)}</div><div class="ms">Margen ${d.barra.g?Math.round((d.barra.g-d.barra.c)/d.barra.g*100):0}%</div></div>`).join('')}</div>`;
  h+=`<div class="card"><div class="ctitle">Producto más vendido (histórico)</div>`;
  [['Coca-Cola',48],['Quilmes',40],['Corona',30],['Fernet',16],['Malbec',14],['Champagne',9]].forEach(([n,v])=>{h+=`<div class="bar-row"><span class="bar-lbl">${n}</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(v/48*100)}%;background:var(--accent)">${v} unid.</div></div></div>`;});
  h+=`</div>`;el.innerHTML=h;
}
function kpiPublicas(){
  const el=document.getElementById('kpi-publicas');if(!el)return;
  let h=`<div class="mg"><div class="met"><div class="ml">Cumplimiento prom.</div><div class="mv">81%</div></div><div class="met"><div class="ml">Invitados prom.</div><div class="mv">65</div></div><div class="met"><div class="ml">Conversión prom.</div><div class="mv">83%</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">KPIs por evento</div><table><thead><tr><th>Evento</th><th>Equipo</th><th>Cumplieron</th><th>Invitados</th><th>Ingresaron</th><th>Conversión</th></tr></thead><tbody><tr><td style="font-weight:500">Sunset 15 Mar</td><td>8</td><td>6</td><td>70</td><td>58</td><td>83%</td></tr><tr><td style="font-weight:500">Sunset 22 Mar</td><td>8</td><td>7</td><td>60</td><td>51</td><td>85%</td></tr></tbody></table></div>`;
  el.innerHTML=h;
}
