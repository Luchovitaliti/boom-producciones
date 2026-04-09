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
    h+=`<div class="rkcard ${zona}"><div style="width:24px;text-align:center;font-size:${i<3?'17':'13'}px;font-weight:500;flex-shrink:0">${medal}</div><div class="av" style="${avs(i)}">${ini(p.n)}</div><div style="flex:1"><div style="font-size:13px;font-weight:500">${p.n} <span class="badge ${p.tipo==='vip'?'bvip':'bgray'}" style="font-size:10px">${p.tipo==='vip'?'VIP':'Común'}</span></div><div style="font-size:11px;color:var(--text2)">${p.ig} · ${a.inv} inv · actitud ${a.actitud}</div><div class="progbg" style="width:100px;margin-top:3px"><div class="progfill" style="width:${pct}%;background:${col}"></div></div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><div style="font-size:15px;font-weight:500">${tp}</div><span class="badge ${tp>=mp?'bok':'bdanger'}" style="font-size:10px">${tp>=mp?'OK':'Falta '+(mp-tp)}</span><div style="display:flex;gap:4px"><button class="btn btnsm" style="font-size:10px;padding:2px 6px" onclick="event.stopPropagation();lpEditPublica(${p.id})">✏️</button><button class="btn btnsm" style="font-size:10px;padding:2px 6px;color:var(--red)" onclick="event.stopPropagation();lpDelPublica(${p.id})">✕</button></div></div></div>`;
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
  const cc=CLASIF_CFG;
  let h=`<div class="card" style="margin-bottom:1rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem"><div class="ctitle" style="margin:0">Configuración de clasificación</div></div>
    <div class="fr">
      <div class="fc"><span class="fl">TOP: mín. invitados</span><input type="number" id="cc-topInv" value="${cc.topMinInv||10}" style="width:80px" min="0"></div>
      <div class="fc"><span class="fl">TOP: actitud mínima</span><select id="cc-topAct" style="width:100px"><option value="alta" ${cc.topActitud==='alta'?'selected':''}>Alta 🔥</option><option value="media" ${cc.topActitud==='media'?'selected':''}>Media ⚡</option></select></div>
      <div class="fc"><span class="fl">Floja: % mín. pubs</span><input type="number" id="cc-flojaPct" value="${cc.flojaPct||60}" style="width:80px" min="0" max="100"></div>
      <div class="fc" style="justify-content:flex-end"><button class="btn btnp btnsm" onclick="lpSaveClasifCfg()">Guardar config</button></div>
    </div></div>`;
  [{k:'top',l:'🔥 TOP',d:'Cumplen + llevan gente'},{k:'activa',l:'⚡ Activas',d:'Cumplen justo'},{k:'floja',l:'🟡 Flojas',d:'No llegan al mínimo'},{k:'descartable',l:'❌ Descartables',d:'No suman — evaluar baja'}].forEach(def=>{
    h+=`<div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:.5rem"><span class="badge ${NVC[def.k]}">${def.l}</span><span style="font-size:12px;color:var(--text2)">${g[def.k].length} públicas · ${def.d}</span></div>`;
    if(!g[def.k].length){h+='<div class="empty">Sin públicas.</div>';}
    else g[def.k].forEach(({p,a})=>{const idx=PUBLICAS.indexOf(p);h+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><div class="av" style="${avs(idx)}">${ini(p.n)}</div><div style="flex:1"><div style="font-size:13px;font-weight:500">${p.n}</div><div style="font-size:11px;color:var(--text2)">${tpubs(a)} pubs · ${a.inv} inv · ${a.actitud}</div></div><button class="btn btnsm" onclick="lpOpenAct(${p.id})">Actualizar</button></div>`;});
    h+=`</div>`;
  });
  document.getElementById('lp-clasificacion').innerHTML=h;
}
const CON_TIPOS=['Cerveza','Vaso 500cc','Promo nacional','Promo internacional'];
function lpBenDef(){return{ent:false,conCant:0,conTipo:'',ex:'',entregado:{}};}
function lpGetBen(ev,pid){
  const b=BENEF_EV[ev]?.[pid];if(!b)return lpBenDef();
  // migrate old 'con' string → conCant/conTipo
  if(typeof b.con==='string'&&b.con&&!b.conTipo){b.conCant=1;b.conTipo=b.con;delete b.con;}
  if(b.conCant===undefined)b.conCant=0;
  if(b.conTipo===undefined)b.conTipo='';
  return b;
}
function lpLoadBeneficios(){
  const ev=gEv();if(!BENEF_EV[ev])BENEF_EV[ev]={};
  const pubs=PUBLICAS.filter(p=>p.activo&&p.evIdx===ev);
  let h=`<div class="card"><div class="ctitle">Control de beneficios</div>`;
  if(!pubs.length){h+='<div class="empty">Sin públicas.</div>';}
  pubs.forEach(p=>{
    const b=lpGetBen(ev,p.id);
    const nv=nivel(ev,p.id);
    const opts=CON_TIPOS.map(t=>`<option value="${t}" ${b.conTipo===t?'selected':''}>${t}</option>`).join('');
    h+=`<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div class="av" style="${avs(PUBLICAS.indexOf(p))}">${ini(p.n)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500;margin-bottom:6px">${p.n} <span class="badge ${NVC[nv]}" style="font-size:10px">${NVL[nv]}</span></div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer">
            <button class="chkbtn ${b.ent?'on':''}" onclick="lpTogBen(${p.id},'ent')">${b.ent?'✓':''}</button> Entrada libre
          </label>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="color:var(--text2);min-width:85px">Consumición:</span>
            <input type="number" value="${b.conCant||''}" min="0" placeholder="0" style="width:50px;font-size:12px" onchange="lpSetBen(${p.id},'conCant',parseInt(this.value)||0)">
            <select style="font-size:12px;width:170px" onchange="lpSetBen(${p.id},'conTipo',this.value)">
              <option value="">— Elegir —</option>${opts}
            </select>
            ${b.conCant&&b.conTipo?`<span class="badge binfo" style="font-size:10px">${b.conCant}× ${b.conTipo}</span>`:''}
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px">
            <span style="color:var(--text2);min-width:85px">Extras:</span>
            <input type="text" value="${(b.ex||'').replace(/"/g,'&quot;')}" placeholder="Texto libre" style="width:220px;font-size:12px" onchange="lpSetBen(${p.id},'ex',this.value)">
          </div>
        </div>
      </div>
    </div>`;
  });
  h+=`</div>`;document.getElementById('lp-beneficios').innerHTML=h;
}
function lpTogBen(pid,key){const ev=gEv();if(!BENEF_EV[ev])BENEF_EV[ev]={};if(!BENEF_EV[ev][pid])BENEF_EV[ev][pid]=lpBenDef();BENEF_EV[ev][pid][key]=!BENEF_EV[ev][pid][key];if(window._fbOK)window.fbSave.benef?.(ev);lpLoadBeneficios();}
function lpSetBen(pid,key,val){const ev=gEv();if(!BENEF_EV[ev])BENEF_EV[ev]={};if(!BENEF_EV[ev][pid])BENEF_EV[ev][pid]=lpBenDef();BENEF_EV[ev][pid][key]=val;if(window._fbOK)window.fbSave.benef?.(ev);}
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
  if(window._fbOK)window.fbSave.actEv?.(ev);
  document.getElementById('m-act').style.display='none';initLider();
}
let lpEditPubId=null;
function lpAddPublica(){
  lpEditPubId=null;
  document.querySelector('#m-nueva-publica .mtitle').textContent='Nueva pública';
  document.getElementById('np-nombre').value='';document.getElementById('np-ig').value='';
  document.getElementById('np-tel').value='';document.getElementById('np-tipo').value='comun';
  document.getElementById('np-com').value='0';document.getElementById('np-obs').value='';
  document.getElementById('m-nueva-publica').style.display='flex';
}
function lpEditPublica(pid){
  const p=PUBLICAS.find(x=>x.id===pid);if(!p)return;
  lpEditPubId=pid;
  document.querySelector('#m-nueva-publica .mtitle').textContent='Editar pública';
  document.getElementById('np-nombre').value=p.n||'';
  document.getElementById('np-ig').value=p.ig||'';
  document.getElementById('np-tel').value=p.tel||'';
  document.getElementById('np-tipo').value=p.tipo||'comun';
  document.getElementById('np-com').value=p.com||0;
  document.getElementById('np-obs').value=p.obs||'';
  document.getElementById('m-nueva-publica').style.display='flex';
}
function lpDelPublica(pid){
  const p=PUBLICAS.find(x=>x.id===pid);if(!p)return;
  if(!confirm(`¿Eliminar a ${p.n}? Se desactivará.`))return;
  p.activo=false;
  if(window._fbOK)window.fbSave.publicas?.();
  initLider();
}
function lpSavePublica(){
  const n=document.getElementById('np-nombre').value.trim();if(!n){alert('Ingresá el nombre.');return;}
  if(lpEditPubId!==null){
    const p=PUBLICAS.find(x=>x.id===lpEditPubId);if(p){
      p.n=n;p.ig=document.getElementById('np-ig').value.trim()||'@nuevo';
      p.tel=document.getElementById('np-tel').value.trim();
      p.tipo=document.getElementById('np-tipo').value;
      p.com=parseFloat(document.getElementById('np-com').value)||0;
      p.obs=document.getElementById('np-obs').value.trim();
    }
  } else {
    PUBLICAS.push({
      id:++nPubId,n,
      ig:document.getElementById('np-ig').value.trim()||'@nuevo',
      tel:document.getElementById('np-tel').value.trim(),
      tipo:document.getElementById('np-tipo').value,
      com:parseFloat(document.getElementById('np-com').value)||0,
      activo:true,obs:document.getElementById('np-obs').value.trim(),camps:0,
      evIdx:gEv()
    });
  }
  document.getElementById('m-nueva-publica').style.display='none';
  if(window._fbOK)window.fbSave.publicas?.();
  initLider();
}
function lpActualizar(){initLider();}
function lpSaveAct(){saveAct();}
function lpSaveBeneficios(){if(window._fbOK)window.fbSave.benef?.(gEv());}
function lpSaveClasifCfg(){
  CLASIF_CFG.topMinInv=parseInt(document.getElementById('cc-topInv').value)||10;
  CLASIF_CFG.topActitud=document.getElementById('cc-topAct').value||'alta';
  CLASIF_CFG.flojaPct=parseInt(document.getElementById('cc-flojaPct').value)||60;
  if(window._fbOK)window.fbSave.clasificacion?.();
  initLider();
}
