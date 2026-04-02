try {
  firebase.initializeApp({
    apiKey:"AIzaSyCJ3JlOH7cWId3t4pe_7WuuyqptWk7VXE0",
    authDomain:"boom-producciones.firebaseapp.com",
    projectId:"boom-producciones",
    storageBucket:"boom-producciones.firebasestorage.app",
    messagingSenderId:"53907802659",
    appId:"1:53907802659:web:4c66eeb1eaed087e467f96"
  });
  const _auth = firebase.auth();
  const _db   = firebase.firestore();
  window._fbOK = true;

  async function fbSet(col,id,data){try{await _db.collection(col).doc(id).set(data,{merge:true});}catch(e){console.warn('fbSet:',e.message);}}
  async function fbGet(col,id){try{const d=await _db.collection(col).doc(id).get();return d.exists?d.data():null;}catch(e){return null;}}
  function fbListen(col,id,cb){return _db.collection(col).doc(id).onSnapshot(s=>{if(s.exists)cb(s.data());});}

  // ─── Listener para un canal de chat individual ───
  window.fbListenChannel = function(ch){
    fbListen('chat', ch, data => {
      if (data?.msgs) {
        if (!CHAT_DATA[ch]) CHAT_DATA[ch] = {l:'#'+ch, msgs:[]};
        CHAT_DATA[ch].msgs = data.msgs;
        if (typeof renderMsgs === 'function' && curCh === ch) renderMsgs();
      }
    });
  };

  // ─── SAVE ───
  window.fbSave = {
    stock:          ev => fbSet('stock',        'ev'+ev,  {ini:STOCK_INI[ev], cie:STOCK_CIE[ev]}),
    gastos:         ev => fbSet('gastos',        'ev'+ev,  {items:GASTOS_EV[ev]}),
    posts:          ()  => fbSet('cm',           'posts',  {items:POSTS}),
    tasks:          ()  => fbSet('cm',           'tasks',  {items:TASKS}),
    ideas:          ()  => fbSet('boom',         'ideas',  {items:IDEAS}),
    publicas:       ()  => fbSet('publicas',     'lista',  {items:PUBLICAS}),
    actEv:          ev => fbSet('actividad',     'ev'+ev,  ACT_EV[ev]||{}),
    pubLogs:        ev => fbSet('publogs',       'ev'+ev,  {items:PUB_LOGS[ev]}),
    users:          ()  => fbSet('config',       'users',  {items:USERS}),
    chat:           ch  => { if(CHAT_DATA[ch]) fbSet('chat', ch, {msgs:CHAT_DATA[ch].msgs}); },
    cajas:          ev => fbSet('cajas',         'ev'+ev,  {items:CAJAS_EV[ev]}),
    staff:          ev => fbSet('staff',         'ev'+ev,  {items:STAFF_EV[ev]}),
    benef:          ev => fbSet('beneficios',    'ev'+ev,  BENEF_EV[ev]||{}),
    provs:          ()  => fbSet('proveedores',  'lista',  {items:PROVEEDORES}),
    gastosAdm:      ()  => fbSet('adminfin',     'gastos', {items:GASTOS_ADM}),
    personasAdm:    ()  => fbSet('adminfin',     'personas',{items:PERSONAS_ADM}),
    eventos:        ()  => fbSet('eventos',      'lista',  {items:EVENTOS, evFin:EV_FIN}),
    customChannels: ()  => fbSet('chat',         'customChannels', {items:CUSTOM_CHANNELS}),
    trafic:         ev => fbSet('trafic',        'ev'+ev, {
      etapas:      TRAFIC_ETAPAS.filter(e=>e.evIdx===ev),
      localidades: TRAFIC_LOCALIDADES.filter(l=>l.evIdx===ev),
      viajes:      TRAFIC_VIAJES.filter(v=>v.evIdx===ev),
      pasajeros:   TRAFIC_PASAJEROS.filter(p=>p.evIdx===ev),
    }),
  };

  // ─── LOAD ───
  window.fbLoad = async function(){
    console.log('Cargando desde Firebase...');

    // Primero cargar eventos (define cuántos índices hay)
    const evs = await fbGet('eventos','lista');
    if (evs?.items && evs.items.length > 0) {
      EVENTOS = evs.items;
      if (evs.evFin) EV_FIN = evs.evFin;
      ensureEvArrays();
    }

    // Stock, gastos, actividad, etc. — dinámico según cantidad de eventos
    const n = Math.max(EVENTOS.length, 3);
    for (let ev=0; ev<n; ev++) {
      const d = await fbGet('stock','ev'+ev);
      if (d) { if(d.ini) STOCK_INI[ev]=d.ini; if(d.cie) STOCK_CIE[ev]=d.cie; }
    }
    for (let ev=0; ev<n; ev++) { const d=await fbGet('gastos','ev'+ev);    if(d?.items) GASTOS_EV[ev]=d.items; }
    for (let ev=0; ev<n; ev++) { const d=await fbGet('actividad','ev'+ev); if(d) ACT_EV[ev]=d; }
    for (let ev=0; ev<n; ev++) { const d=await fbGet('publogs','ev'+ev);   if(d?.items) PUB_LOGS[ev]=d.items; }
    for (let ev=0; ev<n; ev++) { const d=await fbGet('cajas','ev'+ev);     if(d?.items) CAJAS_EV[ev]=d.items; }
    for (let ev=0; ev<n; ev++) { const d=await fbGet('staff','ev'+ev);     if(d?.items) STAFF_EV[ev]=d.items; }
    for (let ev=0; ev<n; ev++) { const d=await fbGet('beneficios','ev'+ev);if(d) BENEF_EV[ev]=d; }
    for (let ev=0; ev<n; ev++) {
      const d=await fbGet('trafic','ev'+ev);
      if(d){
        if(d.etapas)      TRAFIC_ETAPAS=TRAFIC_ETAPAS.filter(e=>e.evIdx!==ev).concat(d.etapas);
        if(d.localidades) TRAFIC_LOCALIDADES=TRAFIC_LOCALIDADES.filter(l=>l.evIdx!==ev).concat(d.localidades);
        if(d.viajes)      TRAFIC_VIAJES=TRAFIC_VIAJES.filter(v=>v.evIdx!==ev).concat(d.viajes);
        if(d.pasajeros)   TRAFIC_PASAJEROS=TRAFIC_PASAJEROS.filter(p=>p.evIdx!==ev).concat(d.pasajeros);
      }
    }

    const posts = await fbGet('cm','posts');           if(posts?.items)  POSTS      = posts.items;
    const tasks = await fbGet('cm','tasks');           if(tasks?.items)  TASKS      = tasks.items;
    const ideas = await fbGet('boom','ideas');         if(ideas?.items)  IDEAS      = ideas.items;
    const pub   = await fbGet('publicas','lista');     if(pub?.items)    PUBLICAS   = pub.items;
    const prov  = await fbGet('proveedores','lista');  if(prov?.items)   PROVEEDORES= prov.items;
    const gadm  = await fbGet('adminfin','gastos');    if(gadm?.items)   GASTOS_ADM  = gadm.items;
    const padm  = await fbGet('adminfin','personas');  if(padm?.items)   PERSONAS_ADM= padm.items;
    const users = await fbGet('config','users');       if(users?.items)  USERS      = users.items;

    // Canales personalizados de chat
    const customChs = await fbGet('chat','customChannels');
    if (customChs?.items) {
      CUSTOM_CHANNELS = customChs.items;
      CUSTOM_CHANNELS.forEach(ch => {
        if (!CHAT_DATA[ch.id]) CHAT_DATA[ch.id] = {l: ch.name, msgs: []};
      });
    }

    // Listeners en tiempo real — canales base + evento + custom
    const allChannelIds = [
      'general','ideas','barra','cm','publicas','admin',
      ...EVENTOS.map((_,i) => 'ev'+i),
      ...CUSTOM_CHANNELS.map(c => c.id),
    ];
    allChannelIds.forEach(ch => {
      if (!CHAT_DATA[ch]) CHAT_DATA[ch] = {l:'#'+ch, msgs:[]};
      window.fbListenChannel(ch);
    });

    // Re-vincular CU al nuevo array USERS (fbLoad reemplaza el array)
    if (CU) {
      const refreshed = USERS.find(x => x.user === CU.user);
      if (refreshed) CU = refreshed;
    }

    syncTopbarEventos();
    // Sincronizar nombres de canales de eventos en chat
    if (typeof syncChatEventChannels === 'function') syncChatEventChannels();
    console.log('Firebase OK ✓');
  };

  // ─── SESIÓN PERSISTENTE ───
  _auth.onAuthStateChanged(async function(fbUser){
    try {
      if (fbUser) {
        const username = fbUser.email.replace('@boom.app','').toUpperCase();
        const usersData = await fbGet('config','users');
        if (usersData?.items) USERS = usersData.items;
        let f = USERS.find(x => x.user === username);
        if (!f && username === 'ADMIN') f = USERS.find(x => x.user === 'ADMIN');
        if (!f) { await _auth.signOut(); return; }
        CU = f;

        document.getElementById('boot-loader').style.display = 'none';
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display   = 'flex';
        document.getElementById('t-role').textContent  = CU.role;
        updateTopbarAvatar();
        syncTopbarEventos();
        buildSidebar();
        buildMobileNav();
        navigate(CU.pages[0]);
        await window.fbLoad();
        // Refrescar la página actual con datos reales
        renderPage(curPage);
      } else {
        CU = null;
        // Limpiar contenido de la app antes de mostrar login
        const mc = document.getElementById('mc');
        if (mc) mc.innerHTML = '';
        const sb = document.getElementById('sb');
        if (sb) sb.innerHTML = '';
        document.getElementById('boot-loader').style.display = 'none';
        document.getElementById('login').style.display = 'flex';
        document.getElementById('app').style.display   = 'none';
        const btn = document.querySelector('.lbtn');
        if (btn) { btn.textContent = 'Ingresar'; btn.disabled = false; }
      }
    } catch(err) {
      console.error('Error en onAuthStateChanged:', err);
      document.getElementById('boot-loader').style.display = 'none';
      document.getElementById('login').style.display = 'flex';
      if (typeof showLoginErr === 'function') showLoginErr('Error interno: ' + err.message);
      const btn = document.querySelector('.lbtn');
      if (btn) { btn.textContent = 'Ingresar'; btn.disabled = false; }
    }
  });

} catch(e) {
  console.warn('Firebase no disponible:', e.message);
  window._fbOK          = false;
  window.fbSave         = {};
  window.fbLoad         = async () => {};
  window.fbListenChannel= () => {};
}
