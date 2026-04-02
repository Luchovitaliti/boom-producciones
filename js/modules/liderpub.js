// ═══════════════════════════════════════════════════════════
// LIDER PUBLICAS
// ═══════════════════════════════════════════════════════════
function pgLiderPub(){
  return`<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:.25rem">
  <div><div class="ptitle" style="margin:0">⭐ Líder de Públicas</div><div class="psub" id="lp-sub"></div></div>
  <button class="btn btnp btnsm" onclick="lpAddPublica()">+ Nueva pública</button>
  </div>
  <div id="lp-alerta"></div>
  <div class="mg" id="lp-metrics"></div>
  ${makeTabs('lp',[{id:'ranking',l:'Ranking'},{id:'actividad',l:'Actividad'},{id:'invitados',l:'Invitados'},{id:'clasificacion',l:'Clasificación'},{id:'beneficios',l:'Beneficios'},{id:'post',l:'Post-evento'}],'ranking')}`;
}
function initLider(){
  const ev=gEv();
  if(!EVENTOS.length||ev>=EVENTOS.length){
    document.getElementById('lp-sub').textContent='';
    document.getElementById('lp-alerta').innerHTML='<div class="abox agray"><div>Creá un evento primero para usar este módulo.</div></div>';
    document.getElementById('lp-metrics').innerHTML='';
    return;
  }
  document.getElementById('lp-sub').textContent=EVENTOS[ev].nombre;
  lpLoadAll();
}
function lpGetStats(ev){return PUBLICAS.filter(p=>p.activo&&p.evIdx===ev).map(p=>({p,a:getAct(ev,p.id),nv:nivel(ev,p.id)})).sort((a,b)=>tpubs(b.a)-tpubs(a.a));}
function lpLoadAll(){
  const ev=gEv();const cfg=EVENTOS[ev];if(!cfg)return;const stats=lpGetStats(ev);
  const N=stats.length;const cumplieron=stats.filter(s=>tpubs(s.a)>=(cfg.minPubs||0)).length;
  const pct=N?Math.round(cumplieron/N*100):0;
  const tInv=stats.reduce((a,s)=>a+s.a.inv,0);const tIng=stats.reduce((a,s)=>a+s.a.ing,0);
  const scls=N===0?'agray':pct>=70?'agreen':pct>=40?'ayellow':'ared';const ssem=N===0?'semg':pct>=70?'semg':pct>=40?'semy':'semr';
  document.getElementById('lp-alerta').innerHTML=`<div class="abox ${scls}"><div class="sem ${ssem}"></div><div><div style="font-size:13px;font-weight:500">${N===0?'Sin públicas para este evento':pct>=70?'Campaña en buen camino 🟢':pct>=40?'Campaña irregular ⚠️':'Campaña en riesgo 🔴'}</div><div style="font-size:12px;color:var(--text2);margin-top:2px">${N===0?'Agregá públicas con el botón + Nueva pública':`${cumplieron} de ${N} públicas cumpliendo (mín: ${cfg.minPubs} pubs)`}</div></div></div>`;
  document.getElementById('lp-metrics').innerHTML=`<div class="met"><div class="ml">Públicas activas</div><div class="mv">${N}</div></div><div class="met"><div class="ml">Prom. stories</div><div class="mv">${N?(stats.reduce((a,s)=>a+s.a.stories,0)/N).toFixed(1):'—'}</div></div><div class="met"><div class="ml">Total invitados</div><div class="mv">${tInv}</div></div><div class="met"><div class="ml">Ingresaron</div><div class="mv pos">${tIng}</div><div class="ms">${tInv?Math.round(tIng/tInv*100):0}% conv.</div></div><div class="met"><div class="ml">% cumplimiento</div><div class="mv ${pct>=70?'pos':pct>=40?'':'neg'}">${N?pct+'%':'—'}</div></div>`;
  lpLoadRanking();lpLoadActividad();lpLoadInvitados();lpLoadClasif();lpLoadBeneficios();lpLoadPost();
}
function lpLoadRanking(){
  const ev=gEv();const cfg=EVENTOS[ev];if(!cfg){document.getElementById('lp-ranking').innerHTML='';return;}const stats=lpGetStats(ev);const N=stats.length;
  const z1=Math.ceil(N*.33),z2=Math.ceil(N*.66);const mp=cfg.minPubs||0;
  let h=`<div class="card"><div class="ctitle">Tabla de posiciones</div>`;
  if(!N)h+='<div class="empty">Sin públicas para este evento.</div>';
  stats.forEach(({p,a,nv},i)=>{
    const tp=tpubs(a);const pct=mp?Math.min(100,Math.round(tp/mp*100)):0;
    const zona=i<z1?'zona-a':i>=z2?'zona-d':'zona-m';const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1;
    const col=i<z1?'#4ade80':i>=z2?'#f87171':'#fbbf24';
    h+=`<div class="rkcard ${zona}"><div style="width:24px;text-align:center;font-size:${i<3?'17':'13'}px;font-weight:500;flex-shrink:0">${medal}</div><div class="av" style="${avs(i)}">${ini(p.n)}</div><div style="flex:1"><div style="font-size:13px;font-weight:500">${p.n} <span class="badge ${p.tipo==='vip'?'bvip':'bgray'}" style="font-size:10px">${p.tipo==='vip'?'VIP':'Común'}</span></div><div style="font-size:11px;color:var(--text2)">${p.ig} · ${a.inv} inv · actitud ${a.actitud}</div><div class="progbg" style="width:100px;margin-top:3px"><div class="progfill" style="width:${pct}%;background:${col}"></div></div></div><div style="text-align:right"><div style="font-size:15px;font-weight:500">${tp}</div><span class="badge ${tp>=mp?'bok':'bdanger'}" style="font-size:10px">${tp>=mp?'OK':'Falta '+(mp-tp)}</span></div></div>`;
  });
  h+=`</div>`;document.getElementById('lp-ranking').innerHTML=h;
}
function lpLoadActividad(){
  const ev=gEv();const cfg=EVENTOS[ev];if(!cfg){document.getElementById('lp-actividad').innerHTML='';return;}const stats=lpGetStats(ev);const mp=cfg.minPubs||0;
  let h=`<div class="card"><div class="ctitle">Seguimiento rápido</div><table><thead><tr><th>Pública</th><th>Stories</th><th>Reels</th><th>TikTok</th><th>Total</th><th>Mín ${mp}</th><th>Actitud</th><th></th></tr></thead><tbody>`;
  if(!stats.length)h+=`<tr><td colspan="8"><div class="empty">Sin públicas.</div></td></tr>`;
  stats.forEach(({p,a})=>{const tp=tpubs(a);const ok=tp>=mp;h+=`<tr><td style="font-weight:500">${p.n}</td><td>${a.stories}</td><td>${a.reels}</td><td>${a.tiktok}</td><td style="font-weight:500;color:${ok?'var(--green)':'var(--red)'}">${tp}</td><td><span class="badge ${ok?'bok':'bdanger'}">${ok?'✓':'Falta '+(mp-tp)}</span></td><td>${a.actitud==='alta'?'🔥':a.actitud==='media'?'⚡':'🟡'} ${a.actitud}</td><td><button class="btn btnsm" onclick="lpOpenAct(${p.id})">Actualizar</button></td></tr>`;});
  h+=`</tbody></table></div>`;document.getElementById('lp-actividad').innerHTML=h;
}
function lpLoadInvitados(){
  const ev=gEv();const stats=lpGetStats(ev).sort((a,b)=>b.a.ing-a.a.ing);
  let h=`<div class="card"><div class="ctitle">Control de invitados</div><table><thead><tr><th>Pública</th><th>Invitados</th><th>Ingresaron</th><th>Conversión</th><th></th></tr></thead><tbody>`;
  stats.forEach(({p,a})=>{const conv=a.inv?Math.round(a.ing/a.inv*100):0;h+=`<tr><td style="font-weight:500">${p.n}</td><td>${a.inv}</td><td class="pos">${a.ing}</td><td><span class="badge ${conv>=80?'bok':conv>=50?'bwarn':'bdanger'}">${conv}%</span></td><td><button class="btn btnsm" onclick="lpOpenAct(${p.id})">Editar</button></td></tr>`;});
  h+=`</tbody></table></div>`;document.getElementById('lp-invitados').innerHTML=h;
}
function lpLoadClasif(){
  const ev=gEv();const g={top:[],activa:[],floja:[],descartable:[]};lpGetStats(ev).forEach(s=>g[s.nv].push(s));
  let h='';
  [{k:'top',l:'🔥 TOP',d:'Cumplen + llevan gente'},{k:'activa',l:'⚡ Activas',d:'Cumplen justo'},{k:'floja',l:'🟡 Flojas',d:'No llegan al mínimo'},{k:'descartable',l:'❌ Descartables',d:'No suman — evaluar baja'}].forEach(def=>{
    h+=`<div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:.5rem"><span class="badge ${NVC[def.k]}">${def.l}</span><span style="font-size:12px;color:var(--text2)">${g[def.k].length} públicas · ${def.d}</span></div>`;
    if(!g[def.k].length){h+='<div class="empty">Sin públicas.</div>';}
    else g[def.k].forEach(({p,a})=>{const idx=PUBLICAS.indexOf(p);h+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><div class="av" style="${avs(idx)}">${ini(p.n)}</div><div style="flex:1"><div style="font-size:13px;font-weight:500">${p.n}</div><div style="font-size:11px;color:var(--text2)">${tpubs(a)} pubs · ${a.inv} inv · ${a.actitud}</div></div><button class="btn btnsm" onclick="lpOpenAct(${p.id})">Actualizar</button></div>`;});
    h+=`</div>`;
  });
  document.getElementById('lp-clasificacion').innerHTML=h;
}
function lpLoadBeneficios(){
  const ev=gEv();const ben=BENEF_EV[ev]||{};
  let h=`<div class="card"><div class="ctitle">Control de beneficios</div><table><thead><tr><th>Pública</th><th>Nivel</th><th>Entrada</th><th>Consumición</th><th>Extras</th></tr></thead><tbody>`;
  PUBLICAS.filter(p=>p.activo&&p.evIdx===ev).forEach(p=>{const b=ben[p.id]||{ent:false,con:false,ex:''};const nv=nivel(ev,p.id);h+=`<tr><td style="font-weight:500">${p.n}</td><td><span class="badge ${NVC[nv]}" style="font-size:10px">${NVL[nv]}</span></td><td><button class="chkbtn ${b.ent?'on':''}" onclick="lpTogBen(${p.id},'ent')">${b.ent?'✓':''}</button></td><td><button class="chkbtn ${b.con?'on':''}" onclick="lpTogBen(${p.id},'con')">${b.con?'✓':''}</button></td><td style="font-size:12px;color:var(--text2)">${b.ex||'—'}</td></tr>`;});
  h+=`</tbody></table></div>`;document.getElementById('lp-beneficios').innerHTML=h;
}
function lpTogBen(pid,key){const ev=gEv();if(!BENEF_EV[ev])BENEF_EV[ev]={};if(!BENEF_EV[ev][pid])BENEF_EV[ev][pid]={ent:false,con:false,ex:''};BENEF_EV[ev][pid][key]=!BENEF_EV[ev][pid][key];if(window._fbOK)window.fbSave.benef?.(ev);lpLoadBeneficios();}
function lpLoadPost(){
  const ev=gEv();const cfg=EVENTOS[ev];if(!cfg)return;
  const stats=PUBLICAS.filter(p=>p.activo&&p.evIdx===ev).map(p=>{const a=getAct(ev,p.id);const cumple=tpubs(a)>=(cfg.minPubs||0);return{p,a,cumple};}).sort((a,b)=>b.a.ing-a.a.ing);
  let h=`<div style="font-size:13px;color:var(--text2);margin-bottom:1rem">Análisis post-evento: <strong style="color:var(--text)">${cfg.nombre}</strong></div><div class="card"><div class="ctitle">Análisis individual</div>`;
  if(!stats.length){h+='<div class="empty">Sin públicas para este evento.</div>';}
  stats.forEach(({p,a,cumple})=>{const v=a.ing>=15&&cumple?'Superó expectativas':cumple&&a.ing>=5?'Cumplió':cumple?'Cumplió (sin ventas)':'No cumplió';const vc=v.includes('Superó')?'bgold':v.includes('Cumplió')?'bok':'bdanger';const idx=PUBLICAS.indexOf(p);h+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="av" style="${avs(idx)}">${ini(p.n)}</div><div style="flex:1"><div style="font-size:13px;font-weight:500">${p.n}</div><div style="font-size:11px;color:var(--text2)">${tpubs(a)} pubs · ${a.inv} inv · ${a.ing} ingresaron</div></div><span class="badge ${vc}" style="font-size:10px">${v}</span></div>`;});
  h+=`</div>`;document.getElementById('lp-post').innerHTML=h;
}
function lpOpenAct(pid){
  actTarget=pid;const p=PUBLICAS.find(x=>x.id===pid);const ev=gEv();const a=getAct(ev,pid);
  document.getElementById('m-act-ttl').textContent='Actividad — '+p.n;
  document.getElementById('ma-st').value=a.stories;document.getElementById('ma-re').value=a.reels;
  document.getElementById('ma-tt').value=a.tiktok;document.getElementById('ma-inv').value=a.inv;
  document.getElementById('ma-ing').value=a.ing;document.getElementById('ma-act').value=a.actitud;
  document.getElementById('ma-obs').value=a.obs;
  document.getElementById('m-act').style.display='flex';
}
function saveAct(){
  const ev=gEv();if(!ACT_EV[ev])ACT_EV[ev]={};
  ACT_EV[ev][actTarget]={stories:parseInt(document.getElementById('ma-st').value)||0,reels:parseInt(document.getElementById('ma-re').value)||0,tiktok:parseInt(document.getElementById('ma-tt').value)||0,inv:parseInt(document.getElementById('ma-inv').value)||0,ing:parseInt(document.getElementById('ma-ing').value)||0,actitud:document.getElementById('ma-act').value,obs:document.getElementById('ma-obs').value};
  document.getElementById('m-act').style.display='none';initLider();
}
function lpAddPublica(){document.getElementById('m-nueva-publica').style.display='flex';}
function lpSavePublica(){
  const n=document.getElementById('np-nombre').value.trim();if(!n){alert('Ingresá el nombre.');return;}
  PUBLICAS.push({
    id:++npid,n,
    ig:document.getElementById('np-ig').value.trim()||'@nuevo',
    tel:document.getElementById('np-tel').value.trim(),
    tipo:document.getElementById('np-tipo').value,
    com:parseFloat(document.getElementById('np-com').value)||0,
    activo:true,obs:document.getElementById('np-obs').value.trim(),camps:0,
    evIdx:gEv()
  });
  document.getElementById('m-nueva-publica').style.display='none';
  if(window._fbOK)window.fbSave.publicas?.();
  initLider();
}
function lpActualizar(){initLider();}
function lpSaveAct(){saveAct();}
function lpSaveBeneficios(){if(window._fbOK)window.fbSave.benef?.(gEv());}
