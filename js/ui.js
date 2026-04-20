// ═══ PAGE HISTORY ═══
let pageHistory = [];

// ═══ BOTTOM NAV ═══
function buildMobileNav(){
  const nav=document.getElementById('mobile-bottom-nav');if(!nav)return;
  const priority=['home','dashboard','boomhero','boom','chat','cm','barra','recaudacion','adminfin','heroconfig','trafic','liderpub','publicas','kpi','proveedores','dev'];
  const all=(CU.pages||[]).filter(p=>p!=='perfil');
  const sorted=priority.filter(p=>all.includes(p)).concat(all.filter(p=>!priority.includes(p)));
  nav.innerHTML=`<div class="mbn-fade mbn-fade-l"></div><div class="mbn-scroll" id="mbn-scroll">`+
    sorted.map(p=>`<div class="mbn-item${curPage===p?' active':''}" data-page="${p}" onclick="navigate('${p}',true)"><span class="ico">${PAGE_ICONS[p]}</span><span>${(PAGE_LABELS[p]||p).slice(0,10)}</span></div>`).join('')+
    `<div class="mbn-item${curPage==='perfil'?' active':''}" data-page="perfil" onclick="navigate('perfil',true)"><span class="ico">👤</span><span>Perfil</span></div>`+
  `</div><div class="mbn-fade mbn-fade-r"></div>`;
  requestAnimationFrame(()=>{
    const sc=document.getElementById('mbn-scroll');if(!sc)return;
    const act=sc.querySelector('.mbn-item.active');if(!act)return;
    sc.scrollLeft=Math.max(0, act.offsetLeft - sc.offsetWidth/2 + act.offsetWidth/2);
    mbnUpdateFades();
  });
  const sc=document.getElementById('mbn-scroll');
  if(sc){ sc.addEventListener('scroll',mbnUpdateFades,{passive:true}); }
}
function mbnSetActive(page, fromTap){
  const sc=document.getElementById('mbn-scroll');
  if(!sc){ buildMobileNav(); return; }
  sc.querySelectorAll('.mbn-item').forEach(el=>el.classList.toggle('active', el.dataset.page===page));
  if(!fromTap) mbnCenterActive();
}
function mbnCenterActive(){
  const sc=document.getElementById('mbn-scroll');if(!sc)return;
  const act=sc.querySelector('.mbn-item.active');if(!act)return;
  sc.scrollLeft = Math.max(0, act.offsetLeft - sc.offsetWidth/2 + act.offsetWidth/2);
}
function mbnUpdateFades(){
  const sc=document.getElementById('mbn-scroll');if(!sc)return;
  const fl=sc.parentElement.querySelector('.mbn-fade-l');
  const fr=sc.parentElement.querySelector('.mbn-fade-r');
  if(fl) fl.classList.toggle('visible',sc.scrollLeft>8);
  if(fr) fr.classList.toggle('visible',sc.scrollLeft<sc.scrollWidth-sc.offsetWidth-8);
}

// ═══ SIDEBAR ═══
function buildSidebar(){
  const sb=document.getElementById('sb');sb.innerHTML='';
  const secs={};
  (CU.pages||[]).forEach(p=>{const sec=PAGE_SECTIONS[p]||'Otro';if(!secs[sec])secs[sec]=[];secs[sec].push(p);});
  Object.entries(secs).forEach(([sec,pages])=>{
    sb.innerHTML+=`<div class="ss">${sec}</div>`;
    pages.forEach(p=>sb.innerHTML+=`<div class="si" id="si-${p}" onclick="navigate('${p}')"><span>${PAGE_ICONS[p]}</span>${PAGE_LABELS[p]}</div>`);
  });
}

// ═══ NAVIGATION ═══
function navigate(page, fromTap, _back) {
  const mc = document.getElementById('mc');
  // Clear any in-flight swipe inline styles
  if (mc) { mc.style.transform = ''; mc.style.opacity = ''; mc.style.transition = ''; }

  // History: tab tap resets stack; forward nav pushes; back nav pops (done by caller)
  if (fromTap) {
    pageHistory = [];
  } else if (!_back && curPage && curPage !== page) {
    pageHistory.push(curPage);
    if (pageHistory.length > 30) pageHistory.shift();
  }

  curPage = page;
  document.querySelectorAll('.si').forEach(el => el.classList.remove('active'));
  document.getElementById('si-' + page)?.classList.add('active');
  if (mc) mc.innerHTML = '';
  mbnSetActive(page, fromTap);
  renderPage(page);
  updateBackBtn();

  // Slide transition — mobile only
  if (mc && window.matchMedia('(max-width:768px)').matches) {
    const cls = _back ? 'nav-back' : 'nav-fwd';
    mc.classList.remove('nav-fwd', 'nav-back');
    requestAnimationFrame(() => {
      mc.classList.add(cls);
      mc.addEventListener('animationend', () => mc.classList.remove(cls), { once: true });
    });
  }
}

function navigateBack() {
  if (!pageHistory.length) return;
  navigate(pageHistory.pop(), false, true);
}

function updateBackBtn() {
  const back = document.getElementById('tb-back');
  const logo = document.querySelector('.tbrand-logo');
  if (!back || !logo) return;
  const show = pageHistory.length > 0 && window.matchMedia('(max-width:768px)').matches;
  back.style.display = show ? 'flex' : 'none';
  logo.style.display = show ? 'none' : 'block';
}

function onEvChange(){ renderPage(curPage); }

// ═══ RENDER DISPATCHER ═══
function renderPage(p){
  const chatOn = p === 'chat';
  document.body.classList.toggle('chat-active', chatOn);
  if (chatOn) {
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);
  } else {
    document.documentElement.style.height = '';
    document.documentElement.style.overflow = '';
  }
  const mc = document.getElementById('mc');
  try {
    if(p==='home'){mc.innerHTML=pgHome();initHome();}
    else if(p==='boomhero'){mc.innerHTML=pgBoomHero();initBoomHero();}
    else if(p==='heroconfig'){mc.innerHTML=pgHeroConfig();initHeroConfig();}
    else if(p==='dashboard')mc.innerHTML=pgDash();
    else if(p==='barra'){mc.innerHTML=pgBarra();initBarra();}
    else if(p==='deco'){mc.innerHTML=pgDeco();initDeco();}
    else if(p==='adminfin'){mc.innerHTML=pgAdminFin();initAdminFin();}
    else if(p==='recaudacion'){mc.innerHTML=pgRecaudacion();initRecaudacion();}
    else if(p==='liderpub'){mc.innerHTML=pgLiderPub();initLider();}
    else if(p==='publicas')mc.innerHTML=pgPublicas();
    else if(p==='trafic'){mc.innerHTML=pgTrafic();initTrafic();}
    else if(p==='cm'){mc.innerHTML=pgCM();initCM();}
    else if(p==='boom'){mc.innerHTML=pgBoom();initBoom();}
    else if(p==='chat'){mc.innerHTML=pgChat();initChat();}
    else if(p==='proveedores')mc.innerHTML=pgProveedores();
    else if(p==='kpi'){mc.innerHTML=pgKPI();initKPI();}
    else if(p==='dev')mc.innerHTML=pgDev();
    else if(p==='usuarios')mc.innerHTML=pgUsuarios();
    else if(p==='perfil'){mc.innerHTML=pgPerfil();initPerfil();}
    if(!['home','perfil','usuarios','dev','chat'].includes(p)){
      const wrap = document.getElementById('mc');
      if(wrap){ const nb=document.createElement('div'); nb.innerHTML=notaWidgetHtml(p); nb.firstChild&&wrap.appendChild(nb.firstChild); }
    }
  } catch(e) {
    console.error('renderPage error ['+p+']:', e);
    mc.innerHTML=`<div class="ptitle" style="color:var(--red)">⚠️ Error al cargar módulo</div>
      <div class="card"><div style="font-size:12px;color:var(--text2);font-family:monospace">${e.message}</div>
      <button class="btn btnsm" style="margin-top:1rem" onclick="renderPage('${p}')">🔄 Reintentar</button></div>`;
  }
}

function updateTopbarAvatar(){
  const btn=document.getElementById('tav-btn');if(!btn)return;
  const u=CU; const col=AVC[USERS.indexOf(u)%8];
  const photoSrc=u.photoURL||u.photo;
  if(photoSrc){btn.innerHTML=`<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:1.5px solid var(--border2)">`;btn.style.background='transparent';}
  else{btn.style.cssText=`width:28px;height:28px;border-radius:50%;background:${col}22;color:${col};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;border:1.5px solid ${col}44;`;btn.textContent=ini(u.chatName);}
}

// ═══ SWIPE-BACK GESTURE ═══
function initSwipeBack() {
  let sx = 0, sy = 0, tracking = false;
  const EDGE = 32, TRIGGER = 80;
  const mc = () => document.getElementById('mc');

  document.addEventListener('touchstart', e => {
    if (document.body.classList.contains('chat-active')) return;
    if (!window.matchMedia('(max-width:768px)').matches) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    tracking = sx < EDGE && pageHistory.length > 0;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!tracking) return;
    const dx = e.touches[0].clientX - sx;
    const dy = Math.abs(e.touches[0].clientY - sy);
    if (dx <= 0 || dy > dx + 12) { tracking = false; resetSwipe(); return; }
    const m = mc(); if (!m) return;
    m.style.transition = 'none';
    m.style.transform = 'translateX(' + Math.min(dx, window.innerWidth * .6) + 'px)';
    m.style.opacity = String(Math.max(.3, 1 - dx / (window.innerWidth * 1.2)));
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - sx;
    const m = mc(); if (!m) return;
    if (dx >= TRIGGER) {
      // Complete: old page exits right, new page enters from left
      m.style.transition = 'transform .2s var(--ease-smooth), opacity .2s';
      m.style.transform = 'translateX(' + window.innerWidth + 'px)';
      m.style.opacity = '0';
      setTimeout(() => {
        m.style.transform = ''; m.style.opacity = ''; m.style.transition = '';
        navigateBack();
      }, 205);
    } else {
      resetSwipe();
    }
  }, { passive: true });

  function resetSwipe() {
    const m = mc(); if (!m) return;
    m.style.transition = 'transform .28s var(--ease-spring), opacity .28s';
    m.style.transform = 'translateX(0)';
    m.style.opacity = '1';
    setTimeout(() => { m.style.transform = ''; m.style.opacity = ''; m.style.transition = ''; }, 300);
  }
}

initSwipeBack();
