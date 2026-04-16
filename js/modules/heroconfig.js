// ═══ PUNTAJES BOOM HERO (admin) ═══
let bhNId    = 1;
let bhEditId = null;
let bhDraft  = {};
let hcAddEv  = 0;

function pgHeroConfig(){
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
    <div class="ptitle" style="margin:0">🏆 Puntajes BOOM HERO</div>
    <span id="hc-ev-label" style="font-size:12px;color:var(--text3)"></span>
  </div>
  <div id="bh-wrap"></div>`;
}

function initHeroConfig(){
  try{ bhNId = HERO_EVALS.length ? Math.max(...HERO_EVALS.map(e=>e.id||0))+1 : 1; }catch(e){ bhNId=1; }
  hcRender();
}

function hcRender(){
  const el  = document.getElementById('bh-wrap'); if(!el) return;
  const ev  = gEv();
  const lbl = document.getElementById('hc-ev-label');
  if(lbl) lbl.textContent = EVENTOS[ev] ? `📅 ${EVENTOS[ev].nombre||'Evento #'+(ev+1)}` : '';
  el.innerHTML = hcHtmlMain(ev);
}

// ── Main view ──────────────────────────────────────────────────
function hcHtmlMain(ev){
  const parts  = HERO_PARTICIPANTS.filter(p=>p.evIdx===ev);
  const evals  = HERO_EVALS.filter(e=>e.evIdx===ev);
  const ranked = [...evals].sort((a,b)=>b.totalScore-a.totalScore);
  let h = '';

  // Mini podio (si hay evals)
  if(ranked.length){
    const medals=['🥇','🥈','🥉']; const cols=['var(--accent)','#a8b8a0','#c07840'];
    const top=ranked.slice(0,3); const order=top.length>=3?[1,0,2]:top.length===2?[1,0]:[0];
    h+=`<div class="card" style="margin-bottom:1rem;background:linear-gradient(135deg,rgba(149,193,31,.07) 0%,transparent 65%)">
      <div class="ctitle" style="text-align:center;margin-bottom:.25rem">🏆 Podio actual</div>
      <div style="display:flex;gap:8px;justify-content:center;align-items:flex-end;padding:4px 0 6px">`;
    order.forEach(i=>{
      if(!top[i]) return;
      const r=top[i];const col=cols[i];
      h+=`<div style="flex:1;max-width:110px;text-align:center">
        <div style="font-size:${i===0?'36px':'26px'};margin-bottom:2px">${medals[i]}</div>
        <div style="font-size:11px;font-weight:600;color:${col};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.userName||'—'}</div>
        <div style="font-size:9px;color:var(--text3);margin:2px 0 5px;text-transform:uppercase;letter-spacing:.05em">${['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'][i]}</div>
        <div style="background:${col}20;border:1px solid ${col}44;border-radius:10px;padding:3px 0;font-size:15px;font-weight:700;color:${col}">${r.totalScore}</div>
      </div>`;
    });
    h+=`</div></div>`;
  }

  // Participantes
  h+=`<div class="card">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:.75rem">
      <div class="ctitle" style="margin:0">👥 Participantes</div>
      <span style="font-size:11px;color:var(--text3)">${evals.length}/${parts.length} evaluados</span>
      <button class="btn btnsm btnp" style="margin-left:auto" onclick="hcOpenAdd(${ev})">+ Agregar</button>
    </div>`;

  if(!parts.length){
    h+=`<div class="empty" style="padding:1.25rem 0">Agregá participantes para comenzar las evaluaciones.</div>`;
  } else {
    parts.forEach((p,pi)=>{
      const u    = USERS.find(u=>(u.uid||u.username)===p.userId);
      const ui   = u ? USERS.indexOf(u) : pi;
      const evl  = evals.find(e=>e.userId===p.userId);
      const rank = evl ? ranked.findIndex(r=>r.userId===p.userId)+1 : 0;
      const medal= rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'';
      const tlbl = rank===1?'BOOM HERO':rank===2?'BOOM WARRIOR':rank===3?'BOOM PLAYER':'';
      const sc   = evl?(evl.totalScore>=50?'var(--accent)':evl.totalScore>=0?'var(--text)':'var(--red)'):'var(--text3)';
      const safeU= p.userId.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      const safeN= p.userName.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      h+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        ${avatarHtml(u?.photo||u?.photoURL||'', p.userName||'?', ui, 34)}
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.userName}</div>
          <div style="font-size:10px;color:${tlbl?'var(--accent)':'var(--text3)'}">${medal}${tlbl||'Sin evaluar'}</div>
        </div>
        ${evl?`<div style="text-align:right;min-width:40px"><div style="font-size:17px;font-weight:700;color:${sc}">${evl.totalScore}</div><div style="font-size:9px;color:var(--text3)">pts</div></div>`:''}
        <button class="btn btnsm${evl?' btnp':''}" onclick="bhOpenEval('${safeU}','${safeN}',${ev})">${evl?'✏️':'⚡'}</button>
        <button class="btn btnsm btnd" onclick="hcRemovePart(${p.id})" style="padding:5px 9px">✕</button>
      </div>`;
    });
  }
  h+=`</div>`;

  if(evals.length) h+=`<div style="text-align:center;margin-top:8px">
    <button class="btn btnsm" onclick="bhShowHist(${ev})">📊 Detalle completo</button>
  </div>`;

  // ── Status banner + finalize button ──
  const key         = 'ev'+ev;
  const isFinalized = HERO_STATUS[key]==='finalized';

  console.log('[HeroConfig] ev=%d key=%s status=%s parts=%d evals=%d',
    ev, key, HERO_STATUS[key]??'undefined', parts.length, evals.length);

  if(isFinalized){
    h+=`<div style="margin-top:12px;padding:12px 14px;background:rgba(149,193,31,.07);border:1px solid rgba(149,193,31,.2);border-radius:14px;text-align:center">
      <div style="font-size:13px;font-weight:600;color:var(--accent)">✅ Ranking publicado al equipo</div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">Visible en BOOM HERO</div>
    </div>`;
  } else if(parts.length){
    // Mostrar botón cuando hay participantes, sin importar si hay evals o no
    h+=`<div style="margin-top:12px">
      <button class="btn btnp" style="width:100%;padding:13px;font-size:14px;font-weight:600" onclick="bhFinalize(${ev})">
        🎯 MOSTRAR PUNTAJES AL TEAM
      </button>
      <div style="text-align:center;font-size:11px;color:var(--text3);margin-top:6px">
        ${evals.length ? `${evals.length}/${parts.length} evaluados — ` : ''}El equipo verá el ranking en BOOM HERO
      </div>
    </div>`;
  }
  return h;
}

// ── Participant management ─────────────────────────────────────
function hcOpenAdd(ev){
  hcAddEv = ev;
  const used  = new Set(HERO_PARTICIPANTS.filter(p=>p.evIdx===ev).map(p=>p.userId));
  const avail = USERS.filter(u=>u.active!==false && !used.has(u.uid||u.username));
  if(!avail.length){ alert('Todos los usuarios ya están en la lista.'); return; }
  const sel = document.getElementById('hc-add-uid');
  sel.innerHTML = avail.map(u=>`<option value="${u.uid||u.username}">${u.chatName||u.username}</option>`).join('');
  document.getElementById('m-hc-add').style.display='flex';
  setTimeout(()=>sel.focus(), 80);
}

function hcConfirmAdd(){
  const uid = document.getElementById('hc-add-uid').value; if(!uid) return;
  const u   = USERS.find(u=>(u.uid||u.username)===uid);  if(!u)   return;
  if(HERO_PARTICIPANTS.find(p=>p.evIdx===hcAddEv && p.userId===uid)){
    document.getElementById('m-hc-add').style.display='none'; return;
  }
  const maxId = HERO_PARTICIPANTS.reduce((m,p)=>Math.max(m,p.id||0),0);
  HERO_PARTICIPANTS.push({ id:maxId+1, evIdx:hcAddEv, userId:uid, userName:u.chatName||u.username });
  document.getElementById('m-hc-add').style.display='none';
  if(window._fbOK) window.fbSave.boomHeroEv?.(hcAddEv);
  hcRender();
}

function hcRemovePart(id){
  if(!confirm('¿Quitar este participante de la lista?')) return;
  const i = HERO_PARTICIPANTS.findIndex(p=>p.id===id);
  if(i>=0){
    const evIdx = HERO_PARTICIPANTS[i].evIdx;
    HERO_PARTICIPANTS.splice(i,1);
    if(window._fbOK) window.fbSave.boomHeroEv?.(evIdx);
    hcRender();
  }
}

// ── Eval Modal Logic ───────────────────────────────────────────
function bhOpenEval(userId, userName, evIdx){
  const existing = HERO_EVALS.find(e=>e.userId===userId && e.evIdx===evIdx);
  bhEditId = existing ? existing.id : null;
  bhDraft  = existing ? {...existing} : {
    userId, userName, evIdx,
    p_ev:false, p_armado:false, p_desarmado:false, p_promo:false, p_falta:false, p_falta_promo:false,
    pa_meet:false, pa_cena:false, pa_activa:false, pa_inactivo:false,
    r_cumple:false, r_antes:false, r_no_cumple:false,
    perf_base:0, perf_resuelve:false, perf_ayuda:false, perf_prob:false,
    a_energia:false, a_lider:false, a_mala:false,
    c_impl:false, c_util:false,
    i_cont:false, i_mejora:false, i_representa:false,
    bon_equipo:false, bon_dir:false,
    pen_conducta:false, pen_conflictos:false, pen_falta:false,
    totalScore:0
  };
  document.getElementById('m-bh-eval-ttl').textContent = `⚡ ${userName}`;
  document.querySelectorAll('#m-bh-eval .bh-tog[data-key]').forEach(btn=>{
    btn.classList.toggle('on', !!bhDraft[btn.dataset.key]);
  });
  document.querySelectorAll('#bh-perf-group .bh-tog').forEach(btn=>{
    btn.classList.toggle('on', parseInt(btn.dataset.perf)===(bhDraft.perf_base||0));
  });
  bhUpdatePreview();
  document.getElementById('m-bh-eval').style.display='flex';
}

function bhTog(btn){
  const key=btn.dataset.key;
  bhDraft[key]=!bhDraft[key];
  btn.classList.toggle('on',bhDraft[key]);
  bhUpdatePreview();
}

function bhSetPerf(val){
  bhDraft.perf_base=val;
  document.querySelectorAll('#bh-perf-group .bh-tog').forEach(b=>{
    b.classList.toggle('on',parseInt(b.dataset.perf)===val);
  });
  bhUpdatePreview();
}

function bhCalc(d){
  let pr=0;
  if(d.p_ev)          pr+=10;
  if(d.p_armado)      pr+=8;
  if(d.p_desarmado)   pr+=6;
  if(d.p_promo)       pr+=6;
  if(d.p_falta)       pr-=20;
  if(d.p_falta_promo) pr-=8;
  pr=Math.round(pr*1.5);

  let pa=0;
  if(d.pa_meet)    pa+=4;
  if(d.pa_cena)    pa+=6;
  if(d.pa_activa)  pa+=3;
  if(d.pa_inactivo)pa-=6;

  let re=0;
  if(d.r_cumple)    re+=5;
  if(d.r_antes)     re+=7;
  if(d.r_no_cumple) re-=10;

  let pf=d.perf_base||0;
  if(d.perf_resuelve) pf+=10;
  if(d.perf_ayuda)    pf+=6;
  if(d.perf_prob)     pf-=12;
  pf=pf*2;

  let ac=0;
  if(d.a_energia) ac+=5;
  if(d.a_lider)   ac+=8;
  if(d.a_mala)    ac-=10;

  let cr=0;
  if(d.c_impl) cr+=10;
  if(d.c_util) cr+=5;

  let im=0;
  if(d.i_cont)       im+=6;
  if(d.i_mejora)     im+=10;
  if(d.i_representa) im+=5;

  let bo=0;
  if(d.bon_equipo) bo+=10;
  if(d.bon_dir)    bo+=10;

  let pe=0;
  if(d.pen_conducta)   pe+=10;
  if(d.pen_conflictos) pe+=8;
  if(d.pen_falta)      pe+=20;

  return { presencia:pr, participacion:pa, responsabilidad:re, performance:pf,
           actitud:ac, creatividad:cr, impacto:im, bonus:bo, penalizaciones:pe,
           totalScore:pr+pa+re+pf+ac+cr+im+bo-pe };
}

function bhUpdatePreview(){
  const {totalScore}=bhCalc(bhDraft);
  const el=document.getElementById('m-bh-score-preview'); if(!el) return;
  el.textContent=totalScore;
  el.style.color=totalScore>=0?'var(--accent)':'var(--red)';
}

function bhSaveEval(){
  const scores=bhCalc(bhDraft);
  const entry={...bhDraft,...scores,ts:Date.now()};
  if(bhEditId!=null){
    const i=HERO_EVALS.findIndex(e=>e.id===bhEditId);
    if(i>=0) HERO_EVALS[i]={...HERO_EVALS[i],...entry};
  } else {
    entry.id=bhNId++;
    HERO_EVALS.push(entry);
  }
  document.getElementById('m-bh-eval').style.display='none';
  if(window._fbOK) window.fbSave.boomHeroEv?.(entry.evIdx);
  hcRender();
}

// ── Finalizar evento: publicar ranking al equipo ───────────────
async function bhFinalize(ev){
  if(!confirm('¿Publicar el ranking final al equipo?\n\nEl equipo podrá ver los puntajes en BOOM HERO. Esta acción no se puede deshacer.')) return;
  const key = 'ev'+ev;
  if(window._fbOK){
    try {
      await window.fbSave.boomHeroFinalize(ev);
      hcRender();
      setTimeout(()=>alert('✅ ¡Ranking publicado! El equipo ya puede ver los puntajes en BOOM HERO.'), 80);
    } catch(e) { alert('Error al publicar: '+e.message); }
  } else {
    // Offline: calcular y guardar local
    const ranked=[...HERO_EVALS.filter(e=>e.evIdx===ev)].sort((a,b)=>b.totalScore-a.totalScore);
    HERO_FINAL_SCORES[key]=ranked.slice(0,3).map((e,i)=>({rank:i+1,userId:e.userId,userName:e.userName,totalScore:e.totalScore,logs:[]}));
    HERO_STATUS[key]='finalized';
    hcRender();
  }
}

// ── Detail / history ──────────────────────────────────────────
function bhShowHist(ev){
  const el=document.getElementById('bh-wrap'); if(!el) return;
  const ranked=[...HERO_EVALS.filter(e=>e.evIdx===ev)].sort((a,b)=>b.totalScore-a.totalScore);
  const medals=['🥇','🥈','🥉'];
  const titles=['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'];
  let h=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem">
    <button class="btn btnsm" onclick="hcRender()">← Volver</button>
    <span style="font-size:14px;font-weight:600">Detalle — ${EVENTOS[ev]?.nombre||'Evento'}</span>
  </div>`;
  if(!ranked.length){
    h+=`<div class="card"><div class="empty">Sin evaluaciones.</div></div>`;
  } else {
    h+=`<div class="card">`;
    const bdg=(v,lbl)=>v!==0?`<span class="badge ${v>0?'bok':'bdanger'}" style="font-size:10px">${lbl}:${v>0?'+':''}${v}</span>`:'';
    ranked.forEach((e,i)=>{
      const s=bhCalc(e);
      const sc=e.totalScore>=50?'var(--accent)':e.totalScore>=0?'var(--text)':'var(--red)';
      h+=`<div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:18px">${i<3?medals[i]:(i+1)+'.'}</span>
          <div style="flex:1;font-size:13px;font-weight:600">${e.userName||'—'}</div>
          ${i<3?`<span style="font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:.04em">${titles[i]}</span>`:''}
          <span style="font-size:17px;font-weight:700;color:${sc}">${e.totalScore}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${bdg(s.presencia,'Pres')}${bdg(s.participacion,'Part')}${bdg(s.responsabilidad,'Resp')}
          ${bdg(s.performance,'Perf×2')}${bdg(s.actitud,'Act')}${bdg(s.creatividad,'Creat')}
          ${bdg(s.impacto,'Imp')}
          ${s.bonus>0?`<span class="badge binfo" style="font-size:10px">Bonus:+${s.bonus}</span>`:''}
          ${s.penalizaciones>0?`<span class="badge bdanger" style="font-size:10px">Pen:-${s.penalizaciones}</span>`:''}
        </div>
      </div>`;
    });
    h+=`</div>`;
  }
  el.innerHTML=h;
}
