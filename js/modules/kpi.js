// ═══════════════════════════════════════════════════════════
// KPI — 100% dinámico con datos reales de los módulos
// ═══════════════════════════════════════════════════════════
function pgKPI() {
  const n = EVENTOS.length;
  return `<div class="ptitle">📈 Reportes y KPIs</div>
  <div class="psub">${n ? `Temporada · ${n} evento${n!==1?'s':''}` : 'Sin eventos creados aún'}</div>
  ${makeTabs('kpi',[{id:'general',l:'General'},{id:'financiero',l:'Financiero'},{id:'barra',l:'Barra'},{id:'publicas',l:'Públicas'}],'general')}`;
}

function initKPI() { kpiGeneral(); kpiFinanciero(); kpiBarra(); kpiPublicas(); }

function kpiGeneral() {
  const el = document.getElementById('kpi-general'); if (!el) return;
  if (!EVENTOS.length) { el.innerHTML = '<div class="empty">Creá un evento primero para ver los KPIs.</div>'; return; }

  let totIng = 0, totGas = 0, totTix = 0, conDatos = 0;
  EVENTOS.forEach((_, i) => {
    const d = EV_FIN[i] || {tickets:{eb:0,ae:0,am:0,taq:0,precio:0}, barra:{g:0,c:0}};
    const ing = (d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio + d.barra.g;
    const gas = (GASTOS_EV[i]||[]).reduce((a,g)=>a+g.m, 0);
    totIng += ing; totGas += gas;
    totTix += d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq;
    if (d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq > 0) conDatos++;
  });

  let h = `<div class="mg">
    <div class="pcard" style="text-align:center">
      <div style="font-size:28px;font-weight:600">${EVENTOS.length}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px">Eventos creados</div>
    </div>
    <div class="pcard" style="text-align:center">
      <div style="font-size:28px;font-weight:600">${PUBLICAS.filter(p=>p.activo).length}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px">Públicas activas</div>
    </div>
    <div class="pcard" style="text-align:center">
      <div style="font-size:24px;font-weight:600;color:var(--accent)">${conDatos ? fmt(totIng) : '—'}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px">Ingresos totales</div>
    </div>
    <div class="pcard" style="text-align:center">
      <div style="font-size:24px;font-weight:600;${conDatos&&totIng-totGas>0?'color:var(--accent)':'color:var(--red)'}">${conDatos ? fmt(totIng-totGas) : '—'}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px">Resultado neto</div>
    </div>
  </div>`;

  h += `<div class="card"><div class="ctitle">Resultado por evento</div>`;
  EVENTOS.forEach((ev, i) => {
    const d = EV_FIN[i] || {tickets:{eb:0,ae:0,am:0,taq:0,precio:0}, barra:{g:0,c:0}};
    const ing = (d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio + d.barra.g;
    const gas = (GASTOS_EV[i]||[]).reduce((a,g)=>a+g.m, 0);
    const res = ing - gas;
    const ok  = ing > 0;
    const dias = ev.fecha ? diffDias(ev.fecha) : null;
    const estado = ok ? 'Cerrado' : dias !== null && dias > 0 ? `En ${dias}d` : dias === 0 ? 'Hoy 🎉' : 'Pendiente';
    h += `<div class="ai">
      <div>
        <div style="font-size:13px;font-weight:500">${ev.nombre}</div>
        <div style="font-size:11px;color:var(--text2)">${ev.fecha||''} ${ev.venue?'· '+ev.venue:''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:500" class="${ok?res>0?'pos':'neg':''}">${ok?fmt(res):'—'}</div>
        <span class="badge ${ok?res>0?'bok':'bdanger':'bwarn'}">${estado}</span>
      </div>
    </div>`;
  });
  h += `</div>`;
  el.innerHTML = h;
}

function kpiFinanciero() {
  const el = document.getElementById('kpi-financiero'); if (!el) return;
  if (!EVENTOS.length) { el.innerHTML = '<div class="empty">Sin eventos.</div>'; return; }

  let h = `<div class="card"><div class="ctitle">Comparativo financiero</div>
  <table><thead><tr><th>Evento</th><th>Ingresos</th><th>Gastos</th><th>Margen</th><th>Resultado</th></tr></thead><tbody>`;
  EVENTOS.forEach((ev, i) => {
    const d = EV_FIN[i] || {tickets:{eb:0,ae:0,am:0,taq:0,precio:0}, barra:{g:0,c:0}};
    const ing = (d.tickets.eb+d.tickets.ae+d.tickets.am+d.tickets.taq)*d.tickets.precio + d.barra.g;
    const gas = (GASTOS_EV[i]||[]).reduce((a,g)=>a+g.m, 0);
    const res = ing - gas;
    const m   = ing ? Math.round(res/ing*100) : 0;
    const ok  = ing > 0;
    h += `<tr><td style="font-weight:500">${ev.nombre}</td><td class="pos">${ok?fmt(ing):'—'}</td>
    <td class="neg">${gas?fmt(gas):'—'}</td><td>${ok?m+'%':'—'}</td>
    <td class="${ok?res>0?'pos':'neg':''}">${ok?fmt(res):'—'}</td></tr>`;
  });
  h += `</tbody></table></div>`;

  // Desglose real por rubro
  const allG = GASTOS_EV.flat().filter(Boolean);
  if (allG.length) {
    const byRubro = {};
    allG.forEach(g => { byRubro[g.r] = (byRubro[g.r]||0) + g.m; });
    const sorted = Object.entries(byRubro).sort((a,b) => b[1]-a[1]);
    const maxV = sorted[0]?.[1] || 1;
    h += `<div class="card"><div class="ctitle">Gastos por rubro · todos los eventos</div>`;
    sorted.forEach(([r,v], idx) => {
      h += `<div class="bar-row">
        <span class="bar-lbl">${r.slice(0,22)}</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${Math.round(v/maxV*100)}%;background:${AVC[idx%8]}">${fmt(v)}</div></div>
      </div>`;
    });
    h += `</div>`;
  } else {
    h += `<div class="empty">Cargá gastos en el módulo Administración para ver el desglose.</div>`;
  }
  el.innerHTML = h;
}

function kpiBarra() {
  const el = document.getElementById('kpi-barra'); if (!el) return;
  if (!EVENTOS.length) { el.innerHTML = '<div class="empty">Sin eventos.</div>'; return; }

  let h = `<div class="mg">`;
  EVENTOS.forEach((ev, i) => {
    const d = EV_FIN[i] || {barra:{g:0,c:0}};
    const m = d.barra.g ? Math.round((d.barra.g-d.barra.c)/d.barra.g*100) : 0;
    h += `<div class="met"><div class="ml">${ev.nombre.slice(0,18)}</div>
      <div class="mv pos">${d.barra.g ? fmt(d.barra.g) : '—'}</div>
      <div class="ms">Margen ${m}%</div></div>`;
  });
  h += `</div>`;

  // Ranking real de productos
  const totVend = {};
  PRODS.forEach((p, pi) => {
    totVend[p.n] = EVENTOS.reduce((sum, _, ei) => {
      const ini = STOCK_INI[ei]?.[pi] ?? 0;
      const cie = STOCK_CIE[ei]?.[pi];
      return sum + (cie !== null && cie !== undefined ? ini - cie : 0);
    }, 0);
  });
  const sorted = Object.entries(totVend).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);

  if (sorted.length) {
    const maxV = sorted[0][1] || 1;
    h += `<div class="card"><div class="ctitle">Productos más vendidos · histórico</div>`;
    sorted.forEach(([n,v], idx) => {
      h += `<div class="bar-row">
        <span class="bar-lbl">${n.split(' ').slice(0,2).join(' ')}</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${Math.round(v/maxV*100)}%;background:${AVC[idx%8]}">${v} unid.</div></div>
      </div>`;
    });
    h += `</div>`;
  } else {
    h += `<div class="empty">Guardá stock de cierre en el módulo Barra para ver el ranking de productos.</div>`;
  }
  el.innerHTML = h;
}

function kpiPublicas() {
  const el = document.getElementById('kpi-publicas'); if (!el) return;
  if (!PUBLICAS.length || !EVENTOS.length) {
    el.innerHTML = '<div class="empty">Sin datos de públicas aún. Cargá públicas en el módulo Líder Públicas.</div>'; return;
  }

  let totInv=0, totIng=0, totCumplieron=0, totTotal=0;
  EVENTOS.forEach((ev, ei) => {
    const activas = PUBLICAS.filter(p => p.activo);
    activas.forEach(p => {
      const a = getAct(ei, p.id);
      totInv += a.inv; totIng += a.ing; totTotal++;
      if (tpubs(a) >= (ev.minPubs||8)) totCumplieron++;
    });
  });

  const pctCump = totTotal ? Math.round(totCumplieron/totTotal*100) : 0;
  const pctConv = totInv   ? Math.round(totIng/totInv*100) : 0;

  let h = `<div class="mg">
    <div class="met"><div class="ml">Cumplimiento prom.</div><div class="mv ${pctCump>=70?'pos':pctCump>=40?'':'neg'}">${pctCump}%</div></div>
    <div class="met"><div class="ml">Total invitados</div><div class="mv">${totInv}</div></div>
    <div class="met"><div class="ml">Ingresaron</div><div class="mv pos">${totIng}</div></div>
    <div class="met"><div class="ml">Conversión prom.</div><div class="mv">${pctConv}%</div></div>
  </div>`;

  h += `<div class="card"><div class="ctitle">KPIs por evento</div>
  <table><thead><tr><th>Evento</th><th>Equipo</th><th>Cumplieron</th><th>Invitados</th><th>Ingresaron</th><th>Conversión</th></tr></thead><tbody>`;
  EVENTOS.forEach((ev, ei) => {
    const act = PUBLICAS.filter(p => p.activo);
    const cum = act.filter(p => tpubs(getAct(ei,p.id)) >= (ev.minPubs||8)).length;
    const inv = act.reduce((a,p) => a+getAct(ei,p.id).inv, 0);
    const ing = act.reduce((a,p) => a+getAct(ei,p.id).ing, 0);
    const conv = inv ? Math.round(ing/inv*100) : 0;
    h += `<tr><td style="font-weight:500">${ev.nombre}</td><td>${act.length}</td><td>${cum}</td><td>${inv}</td><td>${ing}</td>
    <td><span class="badge ${conv>=80?'bok':conv>=50?'bwarn':'bdanger'}">${conv}%</span></td></tr>`;
  });
  h += `</tbody></table></div>`;

  // Top públicas histórico
  const ranking = PUBLICAS.filter(p=>p.activo).map(p => {
    const pubs = EVENTOS.reduce((a,_,ei) => a+tpubs(getAct(ei,p.id)), 0);
    const inv  = EVENTOS.reduce((a,_,ei) => a+getAct(ei,p.id).inv, 0);
    const ing  = EVENTOS.reduce((a,_,ei) => a+getAct(ei,p.id).ing, 0);
    return {p, pubs, inv, ing};
  }).sort((a,b) => b.inv - a.inv);

  if (ranking.length) {
    h += `<div class="card"><div class="ctitle">Ranking histórico</div>`;
    ranking.slice(0, 8).forEach(({p, pubs, inv, ing}, i) => {
      const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1;
      h += `<div class="ai">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:${i<3?'18':'13'}px;width:26px">${medal}</span>
          <div class="av" style="${avs(PUBLICAS.indexOf(p))}">${ini(p.n)}</div>
          <div><div style="font-size:13px;font-weight:500">${p.n}</div>
          <div style="font-size:11px;color:var(--text2)">${p.ig} · ${pubs} pubs total</div></div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:500">${inv} inv</div>
          <div style="font-size:11px;color:var(--accent)">${ing} ingresaron</div>
        </div>
      </div>`;
    });
    h += `</div>`;
  }
  el.innerHTML = h;
}
