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

  console.log('[BoomHero] ev=%d key=%s status=%s finalScores=%d parts=%d evals=%d',
    ev, key, HERO_STATUS[key]??'undefined',
    HERO_FINAL_SCORES[key]?.length??0,
    HERO_PARTICIPANTS.filter(p=>p.evIdx===ev).length,
    HERO_EVALS.filter(e=>e.evIdx===ev).length);

  let html = bhpHtml(ev);

  // ── Historial: eventos finalizados (excluye el actual) ──────
  const histItems = EVENTOS
    .map((evData,i)=>({
      evIdx:i, key:'ev'+i,
      nombre: evData.nombre||`Evento #${i+1}`,
      fecha:  evData.fecha||'',
      finalScores: HERO_FINAL_SCORES['ev'+i]||null,
      status: HERO_STATUS['ev'+i],
    }))
    .filter(e=>e.status==='finalized' && e.evIdx!==ev && e.finalScores?.length)
    .sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  if(histItems.length){
    html+=`<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-top:1.75rem;margin-bottom:8px">Historial de eventos</div>`;
    histItems.forEach(item=>{
      const top1 = item.finalScores[0];
      const top2 = item.finalScores[1];
      const top3 = item.finalScores[2];
      const dateStr = item.fecha
        ? new Date(item.fecha+'T00:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})
        : '';
      html+=`<div class="card" style="margin-bottom:.6rem;cursor:pointer;transition:background .15s" onclick="bhHistDetail(${item.evIdx})">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:28px;line-height:1">🏆</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.nombre}</div>
            ${dateStr?`<div style="font-size:11px;color:var(--text3);margin-top:2px">📅 ${dateStr}</div>`:''}
            <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">
              ${top1?`<span style="font-size:11px;background:rgba(149,193,31,.1);color:var(--accent);border:1px solid rgba(149,193,31,.2);padding:2px 8px;border-radius:99px">🥇 ${top1.userName}</span>`:''}
              ${top2?`<span style="font-size:11px;background:rgba(255,255,255,.05);color:var(--text2);border:1px solid rgba(255,255,255,.08);padding:2px 8px;border-radius:99px">🥈 ${top2.userName}</span>`:''}
              ${top3?`<span style="font-size:11px;background:rgba(255,255,255,.05);color:var(--text2);border:1px solid rgba(255,255,255,.08);padding:2px 8px;border-radius:99px">🥉 ${top3.userName}</span>`:''}
            </div>
          </div>
          <span style="font-size:18px;color:var(--text3)">›</span>
        </div>
      </div>`;
    });
  }

  el.innerHTML = html;
}

// ── Vista de evento actual ─────────────────────────────────────
function bhpHtml(ev){
  const key    = 'ev'+ev;
  const status = HERO_STATUS[key] || 'live';
  const parts  = HERO_PARTICIPANTS.filter(p=>p.evIdx===ev);
  const ranked = [...HERO_EVALS.filter(e=>e.evIdx===ev)].sort((a,b)=>b.totalScore-a.totalScore);

  // ══ MODO MISTERIO: evento en curso ════════════════════════════
  if(status !== 'finalized'){
    if(!parts.length && !ranked.length){
      return `<div class="card" style="text-align:center;padding:2.5rem 1rem">
        <div style="font-size:44px;margin-bottom:.75rem">🏆</div>
        <div style="color:var(--text2);font-size:14px;font-weight:500">Aún no hay resultados.</div>
        <div style="font-size:12px;color:var(--text3);margin-top:6px">Los puntajes se publican cuando el admin finaliza el evento.</div>
      </div>`;
    }
    let h=`<div class="card" style="background:linear-gradient(135deg,rgba(149,193,31,.07) 0%,transparent 70%);margin-bottom:1rem">
      <div style="text-align:center;margin-bottom:1.25rem">
        <div style="font-size:42px;margin-bottom:.5rem;filter:drop-shadow(0 0 16px rgba(149,193,31,.4))">⚡</div>
        <div style="font-size:15px;font-weight:700">Evento en curso</div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">Los puntajes se revelarán al finalizar</div>
        <div style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(149,193,31,.08);border:1px solid rgba(149,193,31,.2);border-radius:99px">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);animation:bootDot 1.3s infinite ease-in-out both;display:inline-block"></span>
          <span style="font-size:11px;color:var(--accent);font-weight:600">EN VIVO</span>
        </div>
      </div>`;
    if(parts.length){
      h+=`<div style="border-top:1px solid rgba(255,255,255,.06);padding-top:10px">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Participantes · ${parts.length}</div>`;
      parts.forEach((p,i)=>{
        const u=USERS.find(u=>(u.uid||u.username)===p.userId);
        h+=`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.03)">
          ${avatarHtml(u?.photo||u?.photoURL||'',p.userName||'?',i,30)}
          <div style="flex:1;font-size:13px;font-weight:500">${p.userName}</div>
          <div style="font-size:20px">❓</div>
        </div>`;
      });
      h+=`</div>`;
    }
    h+=`</div>`;
    return h;
  }

  // ══ MODO FINALIZADO: mostrar ranking ══════════════════════════
  // Fuente primaria: HERO_FINAL_SCORES (congelado al finalizar)
  // Fallback: HERO_EVALS (live) si aún no hay finalScores guardados
  const finalScores = HERO_FINAL_SCORES[key] || [];
  const top3Data    = finalScores.length
    ? finalScores
    : ranked.slice(0,3).map((e,i)=>({ rank:i+1, userId:e.userId, userName:e.userName, totalScore:e.totalScore, logs:[] }));

  if(!top3Data.length && !ranked.length){
    return `<div class="card" style="text-align:center;padding:2rem 1rem">
      <div style="color:var(--text2);font-size:13px">Sin evaluaciones registradas para este evento.</div>
    </div>`;
  }

  const medals = ['🥇','🥈','🥉'];
  const titles  = ['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'];
  const cols    = ['var(--accent)','#a8b8a0','#c07840'];
  const order   = top3Data.length>=3 ? [1,0,2] : top3Data.length===2 ? [1,0] : [0];

  // Podio — usa top3Data (HERO_FINAL_SCORES o fallback)
  let h=`<div class="card" style="background:linear-gradient(135deg,rgba(149,193,31,.09) 0%,transparent 70%);margin-bottom:1.25rem">
    <div style="text-align:center;margin-bottom:.75rem">
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.09em">Ranking del evento</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;align-items:flex-end;padding:0 0 8px">`;
  order.forEach(i=>{
    if(!top3Data[i]) return;
    const r=top3Data[i]; const col=cols[i]; const isFirst=i===0;
    h+=`<div style="flex:1;max-width:120px;text-align:center">
      <div style="font-size:${isFirst?'50px':'36px'};margin-bottom:4px;${isFirst?'filter:drop-shadow(0 0 14px rgba(149,193,31,.45))':''}">${medals[i]}</div>
      <div style="font-size:${isFirst?'14px':'12px'};font-weight:700;color:${col};margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.userName||'—'}</div>
      <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${titles[i]}</div>
      <div style="background:${col}22;border:1px solid ${col}44;border-radius:12px;padding:6px 0;font-size:${isFirst?'22px':'18px'};font-weight:700;color:${col};box-shadow:0 2px 14px ${col}20">${r.totalScore}</div>
    </div>`;
  });
  h+=`</div></div>`;

  // Ranking completo 4+ — usa ranked (HERO_EVALS) para todos los participantes
  if(ranked.length>3){
    h+=`<div class="card" style="margin-bottom:1rem"><div class="ctitle">Ranking completo</div>`;
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

  // Detalle de puntajes — solo si top3Data tiene logs (es decir, viene de HERO_FINAL_SCORES)
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

// ── Detalle de un evento del historial ────────────────────────
function bhHistDetail(evIdx){
  const el=document.getElementById('bhp-wrap'); if(!el) return;
  const key       = 'ev'+evIdx;
  const evData    = EVENTOS[evIdx]||{};
  const finalScores = HERO_FINAL_SCORES[key]||[];
  const medals    = ['🥇','🥈','🥉'];
  const cols      = ['var(--accent)','#a8b8a0','#c07840'];
  const dateStr   = evData.fecha
    ? new Date(evData.fecha+'T00:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
    : '';

  let h=`<button class="btn btnsm" style="margin-bottom:1rem" onclick="initBoomHero()">← Volver</button>
  <div style="font-size:16px;font-weight:700;margin-bottom:2px">${evData.nombre||'Evento #'+(evIdx+1)}</div>
  ${dateStr?`<div style="font-size:11px;color:var(--text3);margin-bottom:1rem">📅 ${dateStr}</div>`:'<div style="margin-bottom:1rem"></div>'}`;

  if(!finalScores.length){
    h+=`<div class="card"><div class="empty">Sin datos de resultados.</div></div>`;
    el.innerHTML=h; return;
  }

  // Podio
  const order=finalScores.length>=3?[1,0,2]:finalScores.length===2?[1,0]:[0];
  h+=`<div class="card" style="margin-bottom:1rem;background:linear-gradient(135deg,rgba(149,193,31,.09) 0%,transparent 70%)">
    <div style="display:flex;gap:10px;justify-content:center;align-items:flex-end;padding:4px 0 8px">`;
  order.forEach(i=>{
    if(!finalScores[i]) return;
    const e=finalScores[i]; const col=cols[i]; const isFirst=i===0;
    h+=`<div style="flex:1;max-width:120px;text-align:center">
      <div style="font-size:${isFirst?'46px':'32px'};margin-bottom:4px">${medals[i]}</div>
      <div style="font-size:${isFirst?'13px':'11px'};font-weight:700;color:${col};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.userName}</div>
      <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:3px 0 6px">${['BOOM HERO','BOOM WARRIOR','BOOM PLAYER'][i]}</div>
      <div style="background:${col}22;border:1px solid ${col}44;border-radius:10px;padding:5px 0;font-size:${isFirst?'20px':'16px'};font-weight:700;color:${col}">${e.totalScore}</div>
    </div>`;
  });
  h+=`</div></div>`;

  // Detalle por persona
  h+=`<div class="card"><div class="ctitle">📊 Cómo sumaron puntos</div>`;
  finalScores.forEach(e=>{
    h+=`<div style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <span style="font-size:18px">${medals[e.rank-1]||e.rank+'.'}</span>
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
