// ═══ HOME ═══
const HOME_MSGS = [
  "Cada evento es una oportunidad de dejar tu marca. 🚀",
  "El equipo que trabaja junto, triunfa junto. 💥",
  "Hoy es un buen día para ser extraordinario. ⚡",
  "Los grandes eventos los hacen grandes equipos. 🔥",
  "Tu energía define el nivel del evento. 🎯",
  "Sin esfuerzo no hay podio. Sin equipo no hay fiesta. 🏆",
  "Cada detalle que cuidás suma puntos. 📊",
  "El show no para, y vos tampoco. 💪",
  "Los que llegan temprano construyen el éxito. ⏱️",
  "Una buena actitud vale más que cualquier bonus. ✨",
  "El trabajo en equipo es el secreto del BOOM. 🤝",
  "Hoy te toca brillar. Aprovechalo. 🌟",
  "Las ideas que proponés hoy son el evento de mañana. 💡",
  "El que se compromete, marca la diferencia. 📌",
  "La constancia separa al equipo del equipo ganador. 🥇",
  "Cada evento es distinto. Tu nivel tiene que ser siempre el mismo. 🎪",
  "Si das lo mejor, el equipo da lo mejor. Así funciona. 🔄",
  "Los mejores no esperan reconocimiento, ya saben lo que valen. 👊",
  "Hoy es el día de subir el nivel. 📈",
  "BOOM no es solo un evento, es una forma de trabajar. ⚡",
  "La gente no recuerda lo que pasó, recuerda cómo se sintió. 🎭",
  "Sé la energía que querés ver en el equipo. 🌊",
  "Un equipo comprometido convierte una noche buena en una noche legendaria. 🌙",
  "Pequeñas acciones, grandes resultados. 💫",
  "El que ayuda fuera de su rol es el que crece más rápido. 🆙",
  "Las ideas más locas a veces son las mejores. 🧠",
  "Hacelo con ganas o no lo hagas. 💢",
  "El equipo te ve. El equipo te necesita. 👀",
  "Hoy no hay excusas. Hay resultados. 📋",
  "La buena energía es contagiosa. Propagala. ☀️",
  "Cada persona en este equipo tiene un rol clave. El tuyo también. 🗝️",
  "Los eventos memorables los hacen personas que no se conforman. 🎆",
  "El público lo siente cuando el equipo está alineado. 🎶",
  "Ser BOOM es una actitud, no solo un trabajo. 🧬",
  "Hoy ponemos todo. Después descansamos. 🛌",
  "Si no te desafía, no te cambia. Empujate un poco más. 🏋️",
  "El talento individual hace jugadas. El equipo gana campeonatos. 🏅",
  "El mejor momento para mejorar es ahora. ⏳",
  "No necesitás ser perfecto. Necesitás ser consistente. 📐",
  "Cada evento que terminamos bien es una victoria del equipo. 🎉",
  "Cuidá los detalles. Los detalles hacen la diferencia. 🔍",
  "El que se adapta, sobrevive. El que innova, lidera. 🧭",
  "La fiesta que construimos adentro se siente afuera. 🎊",
  "Más que colaboradores, somos familia BOOM. ❤️‍🔥",
  "El primer paso siempre es el más difícil. Ya lo diste. 👣",
  "Hoy tu trabajo importa. Siempre importó. 💎",
  "El éxito del evento es el éxito de todos. 🌐",
  "Si te sentís cansado, acordate por qué empezaste. 🔋",
  "Un 'bien hecho' dicho a tiempo vale más que cualquier discurso. 🗣️",
  "Hacé que cada evento cuente. Quedan pocos en el año. 📆",
];

const HOME_MOD_DESC = {
  dashboard:   'Panel de control y KPIs',
  boomhero:    'Ranking del equipo',
  heroconfig:  'Gestión de puntajes',
  barra:       'Stock y control de barra',
  adminfin:    'Gastos y finanzas',
  recaudacion: 'Cajas y recaudación',
  liderpub:    'Gestión de públicas',
  publicas:    'RRPP y seguimiento',
  trafic:      'Logística de transporte',
  cm:          'Calendario y publicaciones',
  boom:        'Ideas y tablero general',
  chat:        'Chat del equipo',
  proveedores: 'Base de proveedores',
  kpi:         'Reportes y análisis',
  dev:         'Panel de desarrollo',
  perfil:      'Tu perfil personal',
};

function pgHome(){
  return `<div id="hm-wrap"></div>`;
}

function initHome(){
  const el = document.getElementById('hm-wrap'); if(!el) return;
  el.innerHTML = hmHtml();
}

function hmHtml(){
  const hora   = new Date().getHours();
  const saludo = hora<12?'Buenos días':hora<18?'Buenas tardes':'Buenas noches';
  const nombre = (CU?.chatName||CU?.username||'Equipo').split(' ')[0];
  const msg    = HOME_MSGS[Math.floor(Math.random()*HOME_MSGS.length)];
  const cuIdx  = USERS.findIndex(u=>u.uid===CU?.uid||u.username===CU?.username);

  // ── User status ──
  const uid     = CU?.uid||CU?.username;
  const myEvals = HERO_EVALS.filter(e=>e.userId===uid);
  let statusLabel, statusColor, statusBg;
  if(myEvals.length){
    const evIndices = [...new Set(HERO_EVALS.map(e=>e.evIdx))];
    const isTop3    = evIndices.some(evIdx=>{
      const ev = HERO_EVALS.filter(e=>e.evIdx===evIdx).sort((a,b)=>b.totalScore-a.totalScore);
      return ev.slice(0,3).some(e=>e.userId===uid);
    });
    const avg = myEvals.reduce((a,e)=>a+e.totalScore,0)/myEvals.length;
    if(isTop3 || avg>60){
      statusLabel='🔥 On Fire'; statusColor='var(--accent)';
      statusBg='rgba(149,193,31,.1)';
    } else if(avg>=0){
      statusLabel='⚡ Activo'; statusColor='var(--blue)';
      statusBg='rgba(96,165,250,.1)';
    } else {
      statusLabel='🧊 Bajo rendimiento'; statusColor='#60a5fa';
      statusBg='rgba(96,165,250,.07)';
    }
  } else {
    statusLabel='⚡ Activo'; statusColor='var(--blue)';
    statusBg='rgba(96,165,250,.1)';
  }

  // ── Last BOOM HERO ──
  const hero = hmLastHero();

  // ── Modules list ──
  const mods = ALL_PAGES.filter(p=>p!=='home'&&p!=='usuarios');

  let h = '';

  // ── 1. Welcome ──────────────────────────────────────────────
  h+=`<div class="card" style="background:linear-gradient(135deg,rgba(149,193,31,.09) 0%,rgba(149,193,31,.02) 100%);margin-bottom:1rem">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:1rem">
      <div>
        <div style="font-size:19px;font-weight:700;letter-spacing:-.02em;line-height:1.2">${saludo},<br>${nombre} 👋</div>
        <div style="font-size:11px;color:var(--text3);margin-top:3px">BOOM Producciones</div>
      </div>
      ${avatarHtml(CU?.photo||CU?.photoURL, CU?.chatName||CU?.username||'?', cuIdx, 46)}
    </div>
    <div style="padding:11px 13px;background:rgba(149,193,31,.07);border:1px solid rgba(149,193,31,.16);border-radius:12px;margin-bottom:10px">
      <div style="font-size:12px;color:var(--text);line-height:1.55;font-style:italic">"${msg}"</div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:${statusBg};border-radius:10px;border:1px solid ${statusColor}22">
      <span style="font-size:13px;font-weight:600;color:${statusColor}">${statusLabel}</span>
      ${myEvals.length?`<span style="font-size:11px;color:var(--text3);margin-left:auto">${myEvals.length} evento${myEvals.length!==1?'s':''} evaluado${myEvals.length!==1?'s':''}</span>`:''}
    </div>
  </div>`;

  // ── 2. Last BOOM HERO ────────────────────────────────────────
  if(hero){
    h+=`<div class="card" style="background:linear-gradient(135deg,rgba(149,193,31,.11) 0%,transparent 65%);margin-bottom:1rem;border-color:rgba(149,193,31,.2)">
      <div class="ctitle">🏆 Último BOOM HERO</div>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="font-size:48px;line-height:1;filter:drop-shadow(0 0 16px rgba(149,193,31,.55))">🥇</div>
        <div>
          <div style="font-size:17px;font-weight:700;color:var(--accent);letter-spacing:-.01em">${hero.userName}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:3px">📅 ${hero.eventName}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">⚡ ${hero.totalScore} pts</div>
        </div>
      </div>
    </div>`;
  }

  // ── 3. Modules ──────────────────────────────────────────────
  h+=`<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;font-weight:500;margin-bottom:8px">Tus módulos</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`;

  mods.forEach(p=>{
    const active = (CU?.pages||[]).includes(p);
    const desc   = HOME_MOD_DESC[p]||'';
    const icon   = PAGE_ICONS[p]||'📦';
    const label  = PAGE_LABELS[p]||p;
    if(active){
      h+=`<div class="hm-mod-card" onclick="navigate('${p}',true)">
        <div style="font-size:26px;margin-bottom:6px">${icon}</div>
        <div style="font-size:12px;font-weight:600;margin-bottom:3px;letter-spacing:-.01em">${label}</div>
        <div style="font-size:10px;color:var(--text3);line-height:1.35">${desc}</div>
      </div>`;
    } else {
      h+=`<div class="hm-mod-card hm-mod-locked">
        <div style="font-size:26px;margin-bottom:6px;filter:grayscale(1);opacity:.5">${icon}</div>
        <div style="font-size:12px;font-weight:600;margin-bottom:3px;opacity:.45">${label}</div>
        <div style="font-size:10px;color:var(--text3);line-height:1.35;opacity:.4">${desc}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:5px;opacity:.5">🔒 Sin acceso</div>
      </div>`;
    }
  });

  h+=`</div>`;
  return h;
}

function hmLastHero(){
  if(!HERO_EVALS.length) return null;
  const indices = [...new Set(HERO_EVALS.map(e=>e.evIdx))].sort((a,b)=>b-a);
  for(const evIdx of indices){
    const ranked = HERO_EVALS.filter(e=>e.evIdx===evIdx).sort((a,b)=>b.totalScore-a.totalScore);
    if(ranked.length) return {
      userName:  ranked[0].userName,
      eventName: EVENTOS[evIdx]?.nombre||`Evento #${evIdx+1}`,
      totalScore:ranked[0].totalScore,
    };
  }
  return null;
}
