// ═══ SIDEBAR ═══
function buildMobileNav(){
  const nav=document.getElementById('mobile-bottom-nav');if(!nav)return;
  const show=(CU.pages||[]).filter(p=>p!=='usuarios'&&p!=='perfil').slice(0,4);
  nav.innerHTML=show.map(p=>`<div class="mbn-item${curPage===p?' active':''}" onclick="navigate('${p}')"><span class="ico">${PAGE_ICONS[p]}</span><span>${(PAGE_LABELS[p]||p).slice(0,8)}</span></div>`).join('')+
  `<div class="mbn-item${curPage==='perfil'?' active':''}" onclick="navigate('perfil')"><span class="ico">👤</span><span>Perfil</span></div>`;
}

function buildSidebar(){
  const sb=document.getElementById('sb');sb.innerHTML='';
  const secs={};
  (CU.pages||[]).forEach(p=>{const sec=PAGE_SECTIONS[p]||'Otro';if(!secs[sec])secs[sec]=[];secs[sec].push(p);});
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
  document.body.classList.toggle('chat-active', p==='chat');
  const mc=document.getElementById('mc');
  try{
    if(p==='dashboard')mc.innerHTML=pgDash();
    else if(p==='barra'){mc.innerHTML=pgBarra();initBarra();}
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
    // Inyectar widget de nota en todos los módulos excepto perfil/usuarios/dev/chat
    if(!['perfil','usuarios','dev','chat'].includes(p)){
      const wrap=document.getElementById('mc');
      if(wrap){
        const nb=document.createElement('div');
        nb.innerHTML=notaWidgetHtml(p);
        nb.firstChild && wrap.appendChild(nb.firstChild);
      }
    }
  }catch(e){
    console.error('renderPage error ['+p+']:', e);
    mc.innerHTML=`<div class="ptitle" style="color:var(--red)">⚠️ Error al cargar módulo</div>
      <div class="card"><div style="font-size:12px;color:var(--text2);font-family:monospace">${e.message}</div>
      <button class="btn btnsm" style="margin-top:1rem" onclick="renderPage('${p}')">🔄 Reintentar</button></div>`;
  }
}

function updateTopbarAvatar(){
  const btn=document.getElementById('tav-btn');if(!btn)return;
  const u=CU;const col=AVC[USERS.indexOf(u)%8];
  const photoSrc=u.photoURL||u.photo;
  if(photoSrc){btn.innerHTML=`<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:1.5px solid var(--border2)">`;btn.style.background='transparent';}
  else{btn.style.cssText=`width:28px;height:28px;border-radius:50%;background:${col}22;color:${col};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;border:1.5px solid ${col}44;`;btn.textContent=ini(u.chatName);}
}
