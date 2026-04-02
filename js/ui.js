// ═══ SIDEBAR ═══
function buildMobileNav(){
  const nav=document.getElementById('mobile-bottom-nav');if(!nav)return;
  const show=CU.pages.filter(p=>p!=='usuarios'&&p!=='perfil').slice(0,4);
  nav.innerHTML=show.map(p=>`<div class="mbn-item${curPage===p?' active':''}" onclick="navigate('${p}')"><span class="ico">${PAGE_ICONS[p]}</span><span>${(PAGE_LABELS[p]||p).slice(0,8)}</span></div>`).join('')+
  `<div class="mbn-item${curPage==='perfil'?' active':''}" onclick="navigate('perfil')"><span class="ico">👤</span><span>Perfil</span></div>`;
}

function buildSidebar(){
  const sb=document.getElementById('sb');sb.innerHTML='';
  const secs={};
  CU.pages.forEach(p=>{const sec=PAGE_SECTIONS[p]||'Otro';if(!secs[sec])secs[sec]=[];secs[sec].push(p);});
  Object.entries(secs).forEach(([sec,pages])=>{
    sb.innerHTML+=`<div class="ss">${sec}</div>`;
    pages.forEach(p=>sb.innerHTML+=`<div class="si" id="si-${p}" onclick="navigate('${p}')"><span>${PAGE_ICONS[p]}</span>${PAGE_LABELS[p]}</div>`);
  });
}
function navigate(page){
  curPage=page;
  document.querySelectorAll('.si').forEach(el=>el.classList.remove('active'));
  document.getElementById('si-'+page)?.classList.add('active');
  document.getElementById('mc').innerHTML='';
  buildMobileNav();
  renderPage(page);
}
function onEvChange(){renderPage(curPage);}

// ═══ RENDER DISPATCHER ═══
function renderPage(p){
  const mc=document.getElementById('mc');
  if(p==='dashboard')mc.innerHTML=pgDash();
  else if(p==='barra'){mc.innerHTML=pgBarra();initBarra();}
  else if(p==='adminfin'){mc.innerHTML=pgAdminFin();initAdminFin();}
  else if(p==='liderpub'){mc.innerHTML=pgLiderPub();initLider();}
  else if(p==='publicas')mc.innerHTML=pgPublicas();
  else if(p==='trafic'){mc.innerHTML=pgTrafic();initTrafic();}
  else if(p==='cm'){mc.innerHTML=pgCM();initCM();}
  else if(p==='boom'){mc.innerHTML=pgBoom();initBoom();}
  else if(p==='chat'){mc.innerHTML=pgChat();initChat();}
  else if(p==='proveedores')mc.innerHTML=pgProveedores();
  else if(p==='kpi'){mc.innerHTML=pgKPI();initKPI();}
  else if(p==='usuarios')mc.innerHTML=pgUsuarios();
  else if(p==='perfil'){mc.innerHTML=pgPerfil();initPerfil();}
}

function updateTopbarAvatar(){
  const btn=document.getElementById('tav-btn');if(!btn)return;
  const u=CU;const col=AVC[USERS.indexOf(u)%8];
  if(u.photo){btn.innerHTML=`<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:1.5px solid var(--border2)">`;btn.style.background='transparent';}
  else{btn.style.cssText=`width:28px;height:28px;border-radius:50%;background:${col}22;color:${col};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;border:1.5px solid ${col}44;`;btn.textContent=ini(u.chatName);}
}
