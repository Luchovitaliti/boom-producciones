// ═══════════════════════════════════════════════════════════
// PUBLICAS
// ═══════════════════════════════════════════════════════════
function pgPublicas(){
  if(!EVENTOS.length||gEv()>=EVENTOS.length)return`<div class="ptitle">📸 Módulo de Públicas</div><div class="empty" style="margin-top:2rem">Creá un evento primero.</div>`;
  const ev=gEv();const cfg=EVENTOS[ev];
  const stats=PUBLICAS.filter(p=>p.activo&&p.evIdx===ev).map(p=>({p,a:getAct(ev,p.id)})).sort((a,b)=>tpubs(b.a)-tpubs(a.a));
  let h=`<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem"><div><div class="ptitle">📸 Módulo de Públicas</div><div class="psub">${EVENTOS[ev].nombre}</div></div><button class="btn btnp btnsm" onclick="lpAddPublica()">+ Nueva pública</button></div>`;
  h+=`<div class="mg"><div class="met"><div class="ml">Equipo activo</div><div class="mv">${stats.length}</div></div><div class="met"><div class="ml">Total publicaciones</div><div class="mv">${stats.reduce((a,s)=>a+tpubs(s.a),0)}</div></div><div class="met"><div class="ml">Entradas vendidas</div><div class="mv">${PUB_LOGS[ev].reduce((a,l)=>a+l.ent,0)}</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">Equipo</div>`;
  stats.forEach(({p,a},i)=>{const tp=tpubs(a);const ok=tp>=cfg.minPubs;h+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="av" style="${avs(i)}">${ini(p.n)}</div><div style="flex:1"><div style="font-size:13px;font-weight:500">${p.n} <span class="badge ${p.tipo==='vip'?'bvip':'bgray'}" style="font-size:10px">${p.tipo==='vip'?'VIP':'Común'}</span></div><div style="font-size:11px;color:var(--text2)">${p.ig} · ${tp} publicaciones · ${a.inv} invitados</div></div><span class="badge ${ok?'bok':'bdanger'}">${ok?'✓':'Falta '+(cfg.minPubs-tp)}</span><button class="btn btnsm" onclick="pubOpenModal(${p.id})">+ Pub</button></div>`;});
  h+=`</div>`;
  h+=`<div class="card"><div class="ctitle">Últimas publicaciones</div>`;
  const logs=[...PUB_LOGS[ev]].slice(-8).reverse();
  if(!logs.length)h+='<div class="empty">Sin publicaciones.</div>';
  else logs.forEach(l=>{const p=PUBLICAS.find(x=>x.id===l.pid);h+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><span class="badge bgray" style="font-size:10px;min-width:50px">${l.tipo.split(' ')[0]}</span><div style="flex:1;font-size:13px;font-weight:500">${p?.n||'?'} <span style="font-weight:400;color:var(--text2)">· ${l.desc}</span></div><span style="font-size:12px;color:var(--text2)">${l.ts}hs</span>${l.ent>0?`<span class="pos" style="font-size:12px">+${l.ent}</span>`:''}</div>`;});
  h+=`</div>`;return h;
}
function pubOpenModal(pid){
  pubTarget=pid;const p=PUBLICAS.find(x=>x.id===pid);
  document.getElementById('m-pub-ttl').textContent='Registrar — '+p.n;
  document.getElementById('m-pub-desc').value='';document.getElementById('m-pub-ent').value='';
  document.getElementById('m-pub').style.display='flex';
}
function confirmPub(){
  const tipo=document.getElementById('m-pub-tipo').value;const desc=document.getElementById('m-pub-desc').value.trim();const ent=parseInt(document.getElementById('m-pub-ent').value)||0;
  const ev=gEv();const now=new Date();const ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  PUB_LOGS[ev].push({pid:pubTarget,tipo,desc,ent,ts});
  document.getElementById('m-pub').style.display='none';
  if(window._fbOK)window.fbSave.pubLogs?.(gEv());
  renderPage(curPage);
}
function confirmCat(){
  const val=document.getElementById('mc-inp').value.trim();if(!val)return;
  document.getElementById('m-cat').style.display='none';
}
