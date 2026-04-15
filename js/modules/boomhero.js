// ═══ BOOM HERO — Podio público ═══
function pgBoomHero(){
  return `
  <div style="text-align:center;margin-bottom:1.75rem">
    <div style="font-size:40px;margin-bottom:.25rem;filter:drop-shadow(0 0 16px rgba(149,193,31,.5))">⚡</div>
    <div class="ptitle" style="margin:0;font-size:22px;letter-spacing:-.02em">BOOM HERO</div>
    <div id="bhp-ev-label" style="font-size:12px;color:var(--text3);margin-top:4px"></div>
  </div>
  <div id="bhp-wrap"></div>`;
}

function initBoomHero(){
  const ev  = gEv();
  const lbl = document.getElementById('bhp-ev-label');
  if(lbl) lbl.textContent = EVENTOS[ev] ? EVENTOS[ev].nombre||'Evento #'+(ev+1) : '';
  const el = document.getElementById('bhp-wrap'); if(!el) return;
  el.innerHTML = bhpHtml(ev);
}

function bhpHtml(ev){
  const ranked = [...HERO_EVALS.filter(e=>e.evIdx===ev)].sort((a,b)=>b.totalScore-a.totalScore);

  if(!ranked.length){
    return `<div class="card" style="text-align:center;padding:2.5rem 1rem">
      <div style="font-size:44px;margin-bottom:.75rem">🏆</div>
      <div style="color:var(--text2);font-size:14px;font-weight:500">Aún no hay resultados.</div>
      <div style="font-size:12px;color:var(--text3);margin-top:6px">Los puntajes se publican después del evento.</div>
    </div>`;
  }

  const medals = ['🥇','🥈','🥉'];
  const titles  = ['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'];
  const cols    = ['var(--accent)','#a8b8a0','#c07840'];
  const top     = ranked.slice(0,3);
  const order   = top.length>=3 ? [1,0,2] : top.length===2 ? [1,0] : [0];

  let h = `<div class="card" style="background:linear-gradient(135deg,rgba(149,193,31,.09) 0%,transparent 70%);margin-bottom:1.25rem">
    <div style="text-align:center;margin-bottom:.75rem">
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.09em">Ranking del evento</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;align-items:flex-end;padding:0 0 8px">`;

  order.forEach(i=>{
    if(!top[i]) return;
    const r=top[i]; const col=cols[i]; const isFirst=i===0;
    h+=`<div style="flex:1;max-width:120px;text-align:center">
      <div style="font-size:${isFirst?'50px':'36px'};margin-bottom:4px;${isFirst?'filter:drop-shadow(0 0 14px rgba(149,193,31,.45))':''}">${medals[i]}</div>
      <div style="font-size:${isFirst?'14px':'12px'};font-weight:700;color:${col};margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.userName||'—'}</div>
      <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${titles[i]}</div>
      <div style="background:${col}22;border:1px solid ${col}44;border-radius:12px;padding:6px 0;font-size:${isFirst?'22px':'18px'};font-weight:700;color:${col};box-shadow:0 2px 14px ${col}20">${r.totalScore}</div>
    </div>`;
  });
  h+=`</div></div>`;

  // 4th+ ranking
  if(ranked.length>3){
    h+=`<div class="card"><div class="ctitle">Ranking completo</div>`;
    ranked.slice(3).forEach((r,i)=>{
      const sc=r.totalScore>=50?'var(--accent)':r.totalScore>=0?'var(--text)':'var(--red)';
      h+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="width:24px;text-align:center;font-size:12px;color:var(--text3);font-weight:600">${i+4}</div>
        ${avatarHtml('',r.userName||'?',i+3,30)}
        <div style="flex:1;font-size:13px;font-weight:500">${r.userName||'—'}</div>
        <div style="font-size:16px;font-weight:700;color:${sc}">${r.totalScore} <span style="font-size:10px;color:var(--text3);font-weight:400">pts</span></div>
      </div>`;
    });
    h+=`</div>`;
  }

  return h;
}
