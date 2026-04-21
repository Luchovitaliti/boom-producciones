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
  const key = 'ev'+ev;
  const lbl = document.getElementById('bhp-ev-label');
  if(lbl) lbl.textContent = EVENTOS[ev] ? EVENTOS[ev].nombre||'Evento #'+(ev+1) : '';
  const el = document.getElementById('bhp-wrap'); if(!el) return;

  el.innerHTML = bhpHtml(ev);

  // Efectos visuales — solo para el evento más recientemente finalizado
  checkBoomHeroFire();
  const _latestHero=hmLastHero();
  if(_latestHero && typeof boomConfetti==='function') boomConfetti('ev'+_latestHero.evIdx);
}

// ── Vista de evento actual ─────────────────────────────────────
function bhpHtml(ev){
  const key    = 'ev'+ev;
  const status = HERO_STATUS[key] || 'live';
  const parts  = HERO_PARTICIPANTS.filter(p=>p.evIdx===ev);
  const ranked = [...HERO_EVALS.filter(e=>e.evIdx===ev)].sort((a,b)=>b.totalScore-a.totalScore);
  const medals = ['🥇','🥈','🥉'];
  const cols   = ['var(--accent)','#a8b8a0','#c07840'];
  const titles = ['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'];

  // ══ BOTÓN PASILLO (siempre visible si hay historial) ════════
  const hasHistory = Object.keys(HERO_STATUS).some(k=>
    HERO_STATUS[k]==='finalized' && HERO_FINAL_SCORES[k]?.length && k!==key
  );
  const pasilloBtn = hasHistory
    ? `<div style="text-align:center;margin-top:1rem">
        <button class="btn" style="font-size:12px;padding:8px 18px;background:rgba(124,68,196,.12);border:1px solid rgba(124,68,196,.28);color:var(--purple2);border-radius:12px" onclick="showPasillo()">🏛 Pasillo de héroes</button>
       </div>`
    : '';

  // ══ MODO MISTERIO: evento en curso ════════════════════════════
  if(status !== 'finalized'){
    if(!parts.length && !ranked.length){
      return `<div class="card" style="text-align:center;padding:2.5rem 1rem">
        <div style="font-size:44px;margin-bottom:.75rem">🏆</div>
        <div style="color:var(--text2);font-size:14px;font-weight:500">Aún no hay resultados.</div>
        <div style="font-size:12px;color:var(--text3);margin-top:6px">Los puntajes se publican cuando el admin finaliza el evento.</div>
      </div>${pasilloBtn}`;
    }

    // Top 3 en modo misterio — nombres visibles, puntajes ocultos
    const mysteryList = ranked.length ? ranked : parts.map(p=>({userId:p.userId,userName:p.userName}));
    const top3m = mysteryList.slice(0,3);
    const order = top3m.length>=3?[1,0,2]:top3m.length===2?[1,0]:[0];

    let h=`<div class="card" style="background:linear-gradient(135deg,rgba(149,193,31,.07) 0%,transparent 70%);margin-bottom:1rem">
      <div style="text-align:center;margin-bottom:1rem">
        <div style="font-size:42px;margin-bottom:.5rem;filter:drop-shadow(0 0 16px rgba(149,193,31,.4))">⚡</div>
        <div style="font-size:15px;font-weight:700">Evento en curso</div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">Los puntajes se revelarán al finalizar</div>
        <div style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(149,193,31,.08);border:1px solid rgba(149,193,31,.2);border-radius:99px">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);animation:bootDot 1.3s infinite ease-in-out both;display:inline-block"></span>
          <span style="font-size:11px;color:var(--accent);font-weight:600">EN VIVO</span>
        </div>
      </div>`;

    if(top3m.length){
      h+=`<div style="display:flex;gap:10px;justify-content:center;align-items:flex-end;padding:4px 0 8px">`;
      order.forEach(i=>{
        if(!top3m[i]) return;
        const r=top3m[i]; const col=cols[i]; const isFirst=i===0;
        h+=`<div style="flex:1;max-width:120px;text-align:center">
          <div style="font-size:${isFirst?'46px':'32px'};margin-bottom:4px">${medals[i]}</div>
          <div style="font-size:${isFirst?'13px':'11px'};font-weight:700;color:${col};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.userName||'—'}</div>
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:3px 0 6px">${titles[i]}</div>
          <div style="background:${col}20;border:1px solid ${col}40;border-radius:10px;padding:5px 0;font-size:14px;font-weight:700;color:${col};opacity:.5;letter-spacing:.1em">???</div>
        </div>`;
      });
      h+=`</div>`;
    }

    if(parts.length > top3m.length){
      h+=`<div style="border-top:1px solid rgba(255,255,255,.06);padding-top:10px;margin-top:4px">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Otros participantes · ${parts.length - top3m.length}</div>`;
      parts.slice(top3m.length).forEach((p,i)=>{
        const u=USERS.find(u=>(u.uid||u.username)===p.userId);
        h+=`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.03)">
          ${avatarHtml(u?.photo||u?.photoURL||'',p.userName||'?',i,30,p.userId)}
          <div style="flex:1;font-size:13px;font-weight:500;${p.userId?'cursor:pointer':''}" ${p.userId?`onclick="viewProfile('${p.userId}')"`:''}>${p.userName}</div>
          <div style="font-size:20px">❓</div>
        </div>`;
      });
      h+=`</div>`;
    }
    h+=`</div>`;
    return h + pasilloBtn;
  }

  // ══ MODO FINALIZADO: mostrar ranking ══════════════════════════
  const finalScores = HERO_FINAL_SCORES[key] || [];
  const top3Data    = finalScores.length
    ? finalScores
    : ranked.slice(0,3).map((e,i)=>({ rank:i+1, userId:e.userId, userName:e.userName, totalScore:e.totalScore, logs:[] }));

  if(!top3Data.length && !ranked.length){
    return `<div class="card" style="text-align:center;padding:2rem 1rem">
      <div style="color:var(--text2);font-size:13px">Sin evaluaciones registradas para este evento.</div>
    </div>${pasilloBtn}`;
  }

  const order = top3Data.length>=3?[1,0,2]:top3Data.length===2?[1,0]:[0];

  // Podio
  let h=`<div class="card" style="background:linear-gradient(135deg,rgba(149,193,31,.09) 0%,transparent 70%);margin-bottom:1rem">
    <div style="text-align:center;margin-bottom:.75rem">
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.09em">Ranking del evento</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;align-items:flex-end;padding:0 0 8px">`;
  order.forEach(i=>{
    if(!top3Data[i]) return;
    const r=top3Data[i]; const col=cols[i]; const isFirst=i===0;
    h+=`<div style="flex:1;max-width:120px;text-align:center">
      <div style="font-size:${isFirst?'50px':'36px'};margin-bottom:4px;${isFirst?'filter:drop-shadow(0 0 14px rgba(149,193,31,.45))':''}">${medals[i]}</div>
      <div style="font-size:${isFirst?'14px':'12px'};font-weight:700;color:${col};margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${r.userId?'cursor:pointer':''}" ${r.userId?`onclick="viewProfile('${r.userId}')"`:''}>${r.userName||'—'}</div>
      <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${titles[i]}</div>
      <div style="background:${col}22;border:1px solid ${col}44;border-radius:12px;padding:6px 0;font-size:${isFirst?'22px':'18px'};font-weight:700;color:${col};box-shadow:0 2px 14px ${col}20">${r.totalScore}</div>
    </div>`;
  });
  h+=`</div>
    <div style="display:flex;gap:8px;margin-top:1rem">
      <button class="btn btnp" style="flex:1;padding:9px;font-size:12px;font-weight:600" onclick="bhShowAllRanking(${ev})">🏅 Ver todos</button>
      <button class="btn" style="padding:9px 14px;font-size:12px;background:rgba(124,68,196,.12);border:1px solid rgba(124,68,196,.28);color:var(--purple2)" onclick="showPasillo()">🏛 Pasillo</button>
    </div>
  </div>`;

  // Detalle de puntajes
  const hasLogs = top3Data.some(e=>(e.logs||[]).length>0);
  if(hasLogs){
    h+=`<div class="card"><div class="ctitle">📊 Detalle de puntajes</div>`;
    top3Data.forEach(e=>{
      h+=`<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
          <span style="font-size:16px">${medals[(e.rank||1)-1]||'•'}</span>
          <span style="font-size:13px;font-weight:600;flex:1">${e.userName}</span>
          <span style="font-size:15px;font-weight:700;color:var(--accent)">${e.totalScore} pts</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${(e.logs||[]).map(l=>`<span style="font-size:10px;padding:2px 8px;border-radius:99px;
            background:${l.type==='sum'?'rgba(149,193,31,.12)':'rgba(248,113,113,.1)'};
            color:${l.type==='sum'?'var(--accent)':'var(--red)'};
            border:1px solid ${l.type==='sum'?'rgba(149,193,31,.22)':'rgba(248,113,113,.22)'}">
            ${l.type==='sum'?'+':'−'}${l.value} ${l.reason}</span>`).join('')}
        </div>
      </div>`;
    });
    h+=`</div>`;
  }
  return h;
}

// ── Ver ranking completo ───────────────────────────────────────
function bhShowAllRanking(ev){
  const el=document.getElementById('bhp-wrap'); if(!el) return;
  const ranked=[...HERO_EVALS.filter(e=>e.evIdx===ev)].sort((a,b)=>b.totalScore-a.totalScore);
  const medals=['🥇','🥈','🥉'];
  const cols=['var(--accent)','#a8b8a0','#c07840'];

  let h=`<button class="btn btnsm" style="margin-bottom:1rem" onclick="initBoomHero()">← Volver</button>
  <div style="font-size:14px;font-weight:600;margin-bottom:1rem">🏅 Ranking completo — ${EVENTOS[ev]?.nombre||'Evento'}</div>
  <div class="card">`;

  if(!ranked.length){
    h+=`<div class="empty">Sin evaluaciones registradas.</div>`;
  } else {
    ranked.forEach((r,i)=>{
      const col=i<3?cols[i]:'var(--text2)';
      const sc=r.totalScore>=50?'var(--accent)':r.totalScore>=0?'var(--text)':'var(--red)';
      h+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="width:26px;text-align:center;font-size:${i<3?'20px':'13px'}">${i<3?medals[i]:(i+1)+'.'}</div>
        ${avatarHtml('',r.userName||'?',i,30,r.userId)}
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500">${r.userName||'—'}</div>
          ${i<3?`<div style="font-size:10px;color:${col};text-transform:uppercase;letter-spacing:.04em">${['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'][i]}</div>`:''}
        </div>
        <div style="font-size:16px;font-weight:700;color:${sc}">${r.totalScore} <span style="font-size:10px;color:var(--text3)">pts</span></div>
      </div>`;
    });
  }
  h+=`</div>`;
  el.innerHTML=h;
}

// ── Pasillo de Héroes ─────────────────────────────────────────
function showPasillo(){
  const el=document.getElementById('bhp-wrap'); if(!el) return;
  // Combinar HERO_HISTORY con datos locales (EVENTOS finalizados con HERO_FINAL_SCORES)
  const fromHistory = [...HERO_HISTORY];
  // Agregar eventos finalizados que no estén en HERO_HISTORY
  EVENTOS.forEach((ev,i)=>{
    const key='ev'+i;
    if(HERO_STATUS[key]==='finalized' && HERO_FINAL_SCORES[key]?.length){
      if(!fromHistory.find(h=>h.eventId===key)){
        fromHistory.push({
          eventId:key, eventName:ev.nombre||`Evento #${i+1}`,
          date:ev.fecha||'', top3:HERO_FINAL_SCORES[key], ts:0
        });
      }
    }
  });
  const items=[...fromHistory].sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  let h=`<button class="btn btnsm" style="margin-bottom:1.25rem" onclick="initBoomHero()">← Volver</button>
  <div style="font-size:18px;font-weight:700;margin-bottom:4px;letter-spacing:-.01em">🏛 Pasillo de héroes</div>
  <div style="font-size:12px;color:var(--text3);margin-bottom:1.25rem">Todos los campeones del equipo</div>`;

  if(!items.length){
    h+=`<div class="card"><div class="empty">No hay eventos finalizados aún.</div></div>`;
    el.innerHTML=h; return;
  }

  const medals=['🥇','🥈','🥉'];
  items.forEach(item=>{
    const dateStr=item.date
      ? new Date(item.date+'T00:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})
      : '';
    const top3=item.top3||[];
    h+=`<div class="card" style="margin-bottom:.6rem;cursor:pointer;transition:background .15s" onclick="bhPasilloDetail('${item.eventId}')">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px;line-height:1">🏆</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.eventName||item.eventId}</div>
          ${dateStr?`<div style="font-size:11px;color:var(--text3);margin-top:2px">📅 ${dateStr}</div>`:''}
          <div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">
            ${top3.slice(0,3).map((t,i)=>`
              <span style="font-size:11px;padding:2px 8px;border-radius:99px;
                background:${i===0?'rgba(149,193,31,.1)':'rgba(255,255,255,.05)'};
                color:${i===0?'var(--accent)':'var(--text2)'};
                border:1px solid ${i===0?'rgba(149,193,31,.2)':'rgba(255,255,255,.08)'}">
                ${medals[i]} ${t.userName}
              </span>`).join('')}
          </div>
        </div>
        <span style="font-size:18px;color:var(--text3)">›</span>
      </div>
    </div>`;
  });
  el.innerHTML=h;
}

function bhPasilloDetail(eventId){
  const el=document.getElementById('bhp-wrap'); if(!el) return;
  // Buscar en HERO_HISTORY primero, fallback a HERO_FINAL_SCORES
  let item=HERO_HISTORY.find(h=>h.eventId===eventId);
  if(!item){
    const evIdx=parseInt(eventId.replace('ev',''),10);
    const evData=EVENTOS[evIdx]||{};
    item={
      eventId, eventName:evData.nombre||`Evento #${evIdx+1}`,
      date:evData.fecha||'', top3:HERO_FINAL_SCORES[eventId]||[], ts:0
    };
  }

  const medals=['🥇','🥈','🥉'];
  const cols=['var(--accent)','#a8b8a0','#c07840'];
  const dateStr=item.date
    ? new Date(item.date+'T00:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
    : '';

  let h=`<button class="btn btnsm" style="margin-bottom:1rem" onclick="showPasillo()">← Volver</button>
  <div style="font-size:16px;font-weight:700;margin-bottom:2px">${item.eventName||eventId}</div>
  ${dateStr?`<div style="font-size:11px;color:var(--text3);margin-bottom:1.25rem">📅 ${dateStr}</div>`:'<div style="margin-bottom:1rem"></div>'}`;

  const top3=item.top3||[];
  if(!top3.length){
    h+=`<div class="card"><div class="empty">Sin datos de resultados.</div></div>`;
    el.innerHTML=h; return;
  }

  // Podio
  const order=top3.length>=3?[1,0,2]:top3.length===2?[1,0]:[0];
  h+=`<div class="card" style="margin-bottom:1rem;background:linear-gradient(135deg,rgba(149,193,31,.09) 0%,transparent 70%)">
    <div style="display:flex;gap:10px;justify-content:center;align-items:flex-end;padding:4px 0 8px">`;
  order.forEach(i=>{
    if(!top3[i]) return;
    const e=top3[i]; const col=cols[i]; const isFirst=i===0;
    h+=`<div style="flex:1;max-width:120px;text-align:center">
      <div style="font-size:${isFirst?'46px':'32px'};margin-bottom:4px">${medals[i]}</div>
      <div style="font-size:${isFirst?'13px':'11px'};font-weight:700;color:${col};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.userName}</div>
      <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:3px 0 6px">${['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'][i]}</div>
      <div style="background:${col}22;border:1px solid ${col}44;border-radius:10px;padding:5px 0;font-size:${isFirst?'20px':'16px'};font-weight:700;color:${col}">${e.totalScore}</div>
    </div>`;
  });
  h+=`</div></div>`;

  // Detalle de puntajes
  h+=`<div class="card"><div class="ctitle">📊 Cómo sumaron puntos</div>`;
  top3.forEach(e=>{
    h+=`<div style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <span style="font-size:18px">${medals[(e.rank||1)-1]||'•'}</span>
        <span style="font-size:13px;font-weight:600;flex:1">${e.userName}</span>
        <span style="font-size:15px;font-weight:700;color:var(--accent)">${e.totalScore} pts</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${(e.logs||[]).length
          ? (e.logs||[]).map(l=>`<span style="font-size:10px;padding:2px 8px;border-radius:99px;
              background:${l.type==='sum'?'rgba(149,193,31,.12)':'rgba(248,113,113,.1)'};
              color:${l.type==='sum'?'var(--accent)':'var(--red)'};
              border:1px solid ${l.type==='sum'?'rgba(149,193,31,.22)':'rgba(248,113,113,.22)'}">
              ${l.type==='sum'?'+':'−'}${l.value} ${l.reason}</span>`).join('')
          : `<span style="font-size:11px;color:var(--text3)">Sin detalle disponible</span>`}
      </div>
    </div>`;
  });
  h+=`</div>`;
  el.innerHTML=h;
}

// ── Detalle de un evento del historial (legacy — sigue funcionando) ─
function bhHistDetail(evIdx){
  bhPasilloDetail('ev'+evIdx);
}

// ── Efecto fuego — SOLO para el BOOM HERO del evento más reciente ──
function checkBoomHeroFire(){
  const uid=CU?.uid||CU?.username; if(!uid) return;
  const hero=hmLastHero(); // evento más reciente finalizado
  const isHero=hero!==null && HERO_FINAL_SCORES['ev'+hero.evIdx]?.[0]?.userId===uid;
  let el=document.getElementById('bh-hero-fire');
  if(isHero && !el){
    el=document.createElement('div'); el.id='bh-hero-fire'; document.body.appendChild(el);
  } else if(!isHero && el){
    el.remove();
  }
}

// ── Confetti BOOM ─────────────────────────────────────────────
// Dispara SOLO la primera vez que el usuario pasa a ser HERO.
// Usa finalizedAt para no disparar en recargas por eventos viejos.
function boomConfetti(eventKey){
  if(typeof confetti!=='function') return;
  const uid=CU?.uid||CU?.username; if(!uid) return;
  const scores=HERO_FINAL_SCORES[eventKey];
  if(!scores?.[0] || scores[0].userId!==uid) return;

  const storageKey=`confetti_seen_${eventKey}_${uid}`;
  if(localStorage.getItem(storageKey)) return; // ya disparado: una sola vez por usuario/evento
  localStorage.setItem(storageKey,'1');

  const colors=['#AFFF00','#ffffff','#0a0c09'];
  const burst=(ox)=>confetti({
    particleCount:14,
    angle:ox>0.5?115:65,
    spread:48,
    origin:{x:ox,y:0.9},
    colors,
    gravity:0.65,
    scalar:0.62,
    ticks:160,
    shapes:['square'],
    drift:0,
  });

  // Bursts escalonados — 15-20 segundos, elegantes
  [0,700,1600,3000,5000,7500,10500,14000,17500].forEach((t,i)=>{
    setTimeout(()=>{
      burst(0.05); burst(0.95);
      if(i%3===0) burst(0.5);
    },t);
  });
}
