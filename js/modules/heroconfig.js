// ═══ PUNTAJES BOOM HERO (admin) ═══
let bhNId    = 1;
let bhEditId = null;
let bhDraft  = {};
let hcAddEv  = 0;

function pgHeroConfig(){
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
    <div class="ptitle" style="margin:0">🏆 Puntajes BOOM HERO</div>
    <div style="display:flex;align-items:center;gap:8px">
      <span id="hc-ev-label" style="font-size:12px;color:var(--text3)"></span>
      <button class="btn btnsm" onclick="bhShowConfigView()">⚙️ Configurar puntajes</button>
    </div>
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
  bhSaveAll(hcAddEv);
  hcRender();
}

function hcRemovePart(id){
  if(!confirm('¿Quitar este participante de la lista?')) return;
  const i = HERO_PARTICIPANTS.findIndex(p=>p.id===id);
  if(i>=0){
    const evIdx = HERO_PARTICIPANTS[i].evIdx;
    HERO_PARTICIPANTS.splice(i,1);
    bhSaveAll(evIdx);
    hcRender();
  }
}

// ── Persiste en Firestore: per-event (primario) + legacy (backup) ──
function bhSaveAll(evIdx){
  if(!window._fbOK){ console.warn('[bhSaveAll] Firebase no disponible'); return; }
  if(evIdx == null || isNaN(Number(evIdx))){ console.error('[bhSaveAll] evIdx inválido:', evIdx); return; }
  // Per-event: fuente primaria — objetos por userId, merge seguro
  window.fbSave.boomHeroEv(evIdx);
  // Legacy: backup para compatibilidad con carga anterior
  window.fbSave.heroParticipants();
  window.fbSave.boomHero();
}

// ── Eval Modal Logic ───────────────────────────────────────────
function bhOpenEval(userId, userName, evIdx){
  const existing = HERO_EVALS.find(e=>e.userId===userId && e.evIdx===evIdx);
  bhEditId = existing ? existing.id : null;
  bhDraft  = existing ? {...existing} : {
    userId, userName, evIdx,
    p_ev:false, p_armado:false, p_desarmado:false, p_promo:false,
    p_meet_org:false, p_falta:false, p_falta_promo:false,
    pa_meet:false, pa_cena:false, pa_activa:false, pa_inactivo:false,
    r_cumple:false, r_antes:false, r_no_cumple:false,
    perf_base:0, perf_resuelve:false, perf_ayuda:false, perf_prob:false,
    a_energia:false, a_lider:false, a_mala:false,
    c_impl:false, c_util:false,
    i_cont:false, i_mejora:false, i_representa:false,
    bon_equipo:false, bon_dir:false,
    pen_conducta:false, pen_conflictos:false, pen_falta:false,
    _custom: [],
    totalScore:0
  };
  if(!bhDraft._custom) bhDraft._custom = [];
  document.getElementById('m-bh-eval-ttl').textContent = `⚡ ${userName}`;
  document.querySelectorAll('#m-bh-eval .bh-tog[data-key]').forEach(btn=>{
    btn.classList.toggle('on', !!bhDraft[btn.dataset.key]);
  });
  document.querySelectorAll('#bh-perf-group .bh-tog').forEach(btn=>{
    btn.classList.toggle('on', parseInt(btn.dataset.perf)===(bhDraft.perf_base||0));
  });
  // Limpiar inputs custom
  const li = document.getElementById('bh-custom-label');
  const vi = document.getElementById('bh-custom-value');
  if(li) li.value=''; if(vi) vi.value='';
  bhRenderCustomItems();
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

// ── BH_CONFIG helpers ─────────────────────────────────────────
function bhConfigVal(id, fallback=0){
  for(const cat of (BH_CONFIG.categories||[])){
    const item=(cat.items||[]).find(it=>it.id===id);
    if(item!=null) return Number(item.value);
  }
  return fallback;
}
function bhConfigMult(catId, fallback=1){
  const cat=(BH_CONFIG.categories||[]).find(c=>c.id===catId);
  return cat?.multiplier ?? fallback;
}

function bhCalc(d){
  const cv=bhConfigVal;

  // Presencia (× multiplier)
  let pr=0;
  if(d.p_ev)          pr += cv('p_ev',10);
  if(d.p_armado)      pr += cv('p_armado',8);
  if(d.p_desarmado)   pr += cv('p_desarmado',6);
  if(d.p_promo)       pr += cv('p_promo',6);
  if(d.p_meet_org)    pr += cv('p_meet_org',5);
  if(d.p_falta)       pr += cv('p_falta',-20);
  if(d.p_falta_promo) pr += cv('p_falta_promo',-8);
  pr = Math.round(pr * bhConfigMult('presencia',1.5));

  // Participación
  let pa=0;
  if(d.pa_meet)     pa += cv('pa_meet',4);
  if(d.pa_cena)     pa += cv('pa_cena',6);
  if(d.pa_activa)   pa += cv('pa_activa',3);
  if(d.pa_inactivo) pa += cv('pa_inactivo',-6);
  pa = Math.round(pa * bhConfigMult('participacion',1));

  // Responsabilidad
  let re=0;
  if(d.r_cumple)    re += cv('r_cumple',5);
  if(d.r_antes)     re += cv('r_antes',7);
  if(d.r_no_cumple) re += cv('r_no_cumple',-10);
  re = Math.round(re * bhConfigMult('responsabilidad',1));

  // Performance (legacy — no está en BH_CONFIG, se mantiene como estaba)
  let pf=d.perf_base||0;
  if(d.perf_resuelve) pf+=10;
  if(d.perf_ayuda)    pf+=6;
  if(d.perf_prob)     pf-=12;
  pf=pf*2;

  // Actitud
  let ac=0;
  if(d.a_energia) ac += cv('a_energia',5);
  if(d.a_lider)   ac += cv('a_lider',8);
  if(d.a_mala)    ac += cv('a_mala',-10);
  ac = Math.round(ac * bhConfigMult('actitud',1));

  // Creatividad
  let cr=0;
  if(d.c_impl) cr += cv('c_impl',10);
  if(d.c_util) cr += cv('c_util',5);
  cr = Math.round(cr * bhConfigMult('creatividad',1));

  // Impacto
  let im=0;
  if(d.i_cont)       im += cv('i_cont',6);
  if(d.i_mejora)     im += cv('i_mejora',10);
  if(d.i_representa) im += cv('i_representa',5);
  im = Math.round(im * bhConfigMult('impacto',1));

  // Bonus
  let bo=0;
  if(d.bon_equipo) bo += cv('bon_equipo',10);
  if(d.bon_dir)    bo += cv('bon_dir',10);
  bo = Math.round(bo * bhConfigMult('bonus',1));

  // Penalizaciones
  let pe=0;
  if(d.pen_conducta)   pe += Math.abs(cv('pen_conducta',-10));
  if(d.pen_conflictos) pe += Math.abs(cv('pen_conflictos',-8));
  if(d.pen_falta)      pe += Math.abs(cv('pen_falta',-20));
  pe = Math.round(pe * bhConfigMult('penalizaciones',1));

  // Custom items (puntajes personalizados del evaluador)
  const cu = (d._custom||[]).reduce((s,it)=>s + Number(it.value||0), 0);

  return { presencia:pr, participacion:pa, responsabilidad:re, performance:pf,
           actitud:ac, creatividad:cr, impacto:im, bonus:bo, penalizaciones:pe,
           custom:cu, totalScore:pr+pa+re+pf+ac+cr+im+bo+cu-pe };
}

function bhUpdatePreview(){
  const {totalScore}=bhCalc(bhDraft);
  const el=document.getElementById('m-bh-score-preview'); if(!el) return;
  el.textContent=totalScore;
  el.style.color=totalScore>=0?'var(--accent)':'var(--red)';
}

// ── Custom items (puntaje personalizado por evaluación) ───────
function bhRenderCustomItems(){
  const el=document.getElementById('bh-custom-items'); if(!el) return;
  const items=bhDraft._custom||[];
  if(!items.length){ el.innerHTML=''; return; }
  el.innerHTML=items.map((it,i)=>`
    <span style="display:inline-flex;align-items:center;gap:5px;background:var(--glass2);
      border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:4px 10px;font-size:12px">
      <span style="color:${it.value>=0?'var(--accent)':'var(--red)'}">
        ${it.value>=0?'+':''}${it.value}
      </span>
      <span style="color:var(--text)">${it.label}</span>
      <button onclick="bhRemoveCustom(${i})"
        style="background:none;border:none;color:var(--text3);cursor:pointer;padding:0 0 0 3px;font-size:15px;line-height:1">✕</button>
    </span>`).join('');
}

function bhAddCustom(){
  const lbl=(document.getElementById('bh-custom-label')?.value||'').trim();
  const raw=document.getElementById('bh-custom-value')?.value;
  const val=parseInt(raw,10);
  if(!lbl){ alert('Ingresá un motivo.'); return; }
  if(isNaN(val)||val===0){ alert('Ingresá un valor distinto de cero.'); return; }
  if(!bhDraft._custom) bhDraft._custom=[];
  const item = { id:'custom_'+Date.now(), label:lbl, value:val };
  bhDraft._custom.push(item);
  document.getElementById('bh-custom-label').value='';
  document.getElementById('bh-custom-value').value='';
  bhRenderCustomItems();
  bhUpdatePreview();
  // Persist immediately to liveScores + scoreLogs
  _bhFlushDraft(item);
}

// Auto-guarda el draft actual a HERO_EVALS + Firestore sin cerrar el modal
function _bhFlushDraft(newItem){
  if(!bhDraft.userId) return;
  const scores = bhCalc(bhDraft);
  const entry  = { ...bhDraft, ...scores, ts: Date.now() };
  if(bhEditId != null){
    const i = HERO_EVALS.findIndex(e=>e.id===bhEditId);
    if(i>=0) HERO_EVALS[i] = { ...HERO_EVALS[i], ...entry };
    else { entry.id=bhEditId; HERO_EVALS.push(entry); }
  } else {
    entry.id  = bhNId++;
    bhEditId  = entry.id;
    HERO_EVALS.push(entry);
  }
  // Registrar el nuevo ítem custom en scoreLogs (sin duplicar)
  if(newItem){
    const evKey='ev'+entry.evIdx;
    if(!HERO_SCORE_LOGS[evKey]) HERO_SCORE_LOGS[evKey]=[];
    if(!HERO_SCORE_LOGS[evKey].some(l=>l.itemId===newItem.id)){
      HERO_SCORE_LOGS[evKey].push({
        userId:entry.userId, userName:entry.userName,
        itemId:newItem.id, label:newItem.label, value:newItem.value, ts:Date.now()
      });
    }
  }
  bhSaveAll(entry.evIdx);
}

function bhRemoveCustom(i){
  if(!bhDraft._custom) return;
  bhDraft._custom.splice(i,1);
  bhRenderCustomItems();
  bhUpdatePreview();
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

  // ── Score logs: registrar cada ítem seleccionado ──────────────
  const evKey='ev'+entry.evIdx;
  if(!HERO_SCORE_LOGS[evKey]) HERO_SCORE_LOGS[evKey]=[];
  const tsNow=Date.now();
  // Items estándar de BH_CONFIG
  (BH_CONFIG.categories||[]).forEach(cat=>{
    (cat.items||[]).forEach(it=>{
      if(entry[it.id]===true){
        HERO_SCORE_LOGS[evKey].push({
          userId:entry.userId, userName:entry.userName,
          itemId:it.id, label:it.label, value:it.value, ts:tsNow
        });
      }
    });
  });
  // Custom items
  (entry._custom||[]).forEach(it=>{
    HERO_SCORE_LOGS[evKey].push({
      userId:entry.userId, userName:entry.userName,
      itemId:it.id, label:it.label, value:it.value, ts:tsNow
    });
  });

  document.getElementById('m-bh-eval').style.display='none';
  bhSaveAll(entry.evIdx);
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
      // Efecto visual para el nuevo BOOM HERO
      if(typeof checkBoomHeroFire==='function') checkBoomHeroFire();
      if(typeof boomConfetti==='function') boomConfetti('ev'+ev);
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

// ── Config view: editar BH_CONFIG ────────────────────────────
function bhShowConfigView(){
  const el=document.getElementById('bh-wrap'); if(!el) return;
  el.innerHTML=bhConfigViewHtml();
}

function bhConfigViewHtml(){
  let h=`
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:1.25rem">
    <button class="btn btnsm" onclick="hcRender()">← Volver</button>
    <span style="font-size:15px;font-weight:600">⚙️ Configurar puntajes</span>
  </div>
  <div class="card" style="margin-bottom:1rem;padding:14px 16px">
    <div class="ctitle" style="margin-bottom:4px;font-size:12px;color:var(--text3)">
      Los cambios afectan a todas las evaluaciones futuras. Los puntajes guardados no se recalculan.
    </div>
  </div>`;

  (BH_CONFIG.categories||[]).forEach((cat,ci)=>{
    h+=`<div class="card" style="margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:.75rem;flex-wrap:wrap">
        <span style="font-size:13px;font-weight:600;flex:1">${cat.label}</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:11px;color:var(--text3)">Multiplicador</span>
          <input type="number" step="0.1" min="0" max="5"
            value="${cat.multiplier??1}"
            onchange="bhConfigSetMult(${ci},this.value)"
            style="width:58px;font-size:12px;padding:4px 6px;border-radius:8px;
              background:var(--glass2);border:1px solid rgba(255,255,255,.12);
              color:var(--text);text-align:center">
        </div>
      </div>`;

    (cat.items||[]).forEach((item,ii)=>{
      const neg=item.value<0;
      h+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;
            border-bottom:1px solid rgba(255,255,255,.04)">
        <span style="flex:1;font-size:12px;color:var(--text2)">${item.label}</span>
        <input type="number" step="1"
          value="${item.value}"
          onchange="bhConfigSetItem(${ci},${ii},this.value)"
          style="width:64px;font-size:13px;font-weight:600;padding:5px 6px;border-radius:8px;
            background:${neg?'rgba(239,68,68,.1)':'rgba(149,193,31,.08)'};
            border:1px solid ${neg?'rgba(239,68,68,.25)':'rgba(149,193,31,.25)'};
            color:${neg?'var(--red)':'var(--accent)'};text-align:center">
        <button class="btn btnsm btnd" onclick="bhConfigRemoveItem(${ci},${ii})"
          style="padding:5px 9px;font-size:13px">✕</button>
      </div>`;
    });

    // Agregar nuevo ítem en esta categoría
    h+=`<div style="display:flex;gap:6px;align-items:center;margin-top:10px;flex-wrap:wrap">
      <input id="cfg-lbl-${ci}" type="text" placeholder="Nuevo ítem"
        style="flex:1;min-width:110px;font-size:12px;padding:6px 9px;border-radius:8px;
          background:var(--glass2);border:1px solid rgba(255,255,255,.1);color:var(--text)">
      <input id="cfg-val-${ci}" type="number" step="1" placeholder="+/− pts"
        style="width:72px;font-size:12px;padding:6px 8px;border-radius:8px;
          background:var(--glass2);border:1px solid rgba(255,255,255,.1);color:var(--text);text-align:center">
      <button class="btn btnsm btnp" onclick="bhConfigAddItem(${ci})"
        style="font-size:12px;padding:6px 12px">+ Agregar</button>
    </div>
    </div>`;
  });

  h+=`<div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">
    <button class="btn btnp" style="flex:1;padding:12px;font-size:14px;font-weight:600"
      onclick="bhConfigSave()">💾 Guardar configuración</button>
    <button class="btn btnsm btnd" style="padding:12px 16px"
      onclick="bhConfigReset()">↺ Restablecer</button>
  </div>`;

  return h;
}

function bhConfigSetMult(ci, val){
  const cat=(BH_CONFIG.categories||[])[ci]; if(!cat) return;
  cat.multiplier=parseFloat(val)||1;
}

function bhConfigSetItem(ci, ii, val){
  const cat=(BH_CONFIG.categories||[])[ci]; if(!cat) return;
  const item=(cat.items||[])[ii]; if(!item) return;
  item.value=parseInt(val,10)||0;
}

function bhConfigRemoveItem(ci, ii){
  const cat=(BH_CONFIG.categories||[])[ci]; if(!cat) return;
  if(!confirm(`¿Eliminar este ítem? Las evaluaciones existentes no se recalculan.`)) return;
  cat.items.splice(ii,1);
  bhShowConfigView();
}

function bhConfigAddItem(ci){
  const cat=(BH_CONFIG.categories||[])[ci]; if(!cat) return;
  const lbl=(document.getElementById(`cfg-lbl-${ci}`)?.value||'').trim();
  const val=parseInt(document.getElementById(`cfg-val-${ci}`)?.value||'0',10);
  if(!lbl){ alert('Ingresá una etiqueta para el ítem.'); return; }
  if(isNaN(val)||val===0){ alert('Ingresá un valor distinto de cero.'); return; }
  const newId=cat.id+'_'+Date.now();
  if(!cat.items) cat.items=[];
  cat.items.push({ id:newId, label:lbl, value:val });
  bhShowConfigView();
}

function bhConfigSave(){
  if(window._fbOK){
    window.fbSave.bhConfig()
      .then(()=>{ alert('✅ Configuración guardada.'); })
      .catch(e=>{ alert('Error al guardar: '+(e?.message||e)); });
  } else {
    alert('⚠️ Sin conexión — la config se aplicará localmente hasta que la app se reconecte.');
  }
}

function bhConfigReset(){
  if(!confirm('¿Restablecer la configuración de puntajes a los valores por defecto?\nSe perderán los cambios no guardados.')) return;
  // Recargar desde Firestore
  if(window._fbOK){
    window.fbGet('boomHeroConfig','default').then(doc=>{
      if(doc?.categories?.length){ BH_CONFIG=doc; }
      bhShowConfigView();
    }).catch(()=>bhShowConfigView());
  } else {
    bhShowConfigView();
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
          ${s.custom&&s.custom!==0?`<span class="badge ${s.custom>0?'bok':'bdanger'}" style="font-size:10px">Custom:${s.custom>0?'+':''}${s.custom}</span>`:''}
          ${(e._custom||[]).map(it=>`<span class="badge" style="font-size:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)">${it.value>=0?'+':''}${it.value} ${it.label}</span>`).join('')}
        </div>
      </div>`;
    });
    h+=`</div>`;
  }
  el.innerHTML=h;
}
