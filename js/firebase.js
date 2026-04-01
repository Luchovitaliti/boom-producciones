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
  const _db = firebase.firestore();
  window._fbOK = true;

  async function fbSet(col,id,data){try{await _db.collection(col).doc(id).set(data,{merge:true});}catch(e){console.warn('fbSet:',e.message);}}
  async function fbGet(col,id){try{const d=await _db.collection(col).doc(id).get();return d.exists?d.data():null;}catch(e){return null;}}
  function fbListen(col,id,cb){return _db.collection(col).doc(id).onSnapshot(s=>{if(s.exists)cb(s.data());});}

  // SAVE
  window.fbSave = {
    stock:   ev => fbSet('stock',   'ev'+ev, {ini:STOCK_INI[ev],cie:STOCK_CIE[ev]}),
    gastos:  ev => fbSet('gastos',  'ev'+ev, {items:GASTOS_EV[ev]}),
    posts:   ()  => fbSet('cm',     'posts', {items:POSTS}),
    tasks:   ()  => fbSet('cm',     'tasks', {items:TASKS}),
    ideas:   ()  => fbSet('boom',   'ideas', {items:IDEAS}),
    publicas:()  => fbSet('publicas','lista',{items:PUBLICAS}),
    actEv:   ev => fbSet('actividad','ev'+ev,ACT_EV[ev]||{}),
    pubLogs: ev => fbSet('publogs', 'ev'+ev, {items:PUB_LOGS[ev]}),
    users:   ()  => fbSet('config', 'users', {items:USERS}),
    chat:    ch  => fbSet('chat',   ch,      {msgs:CHAT_DATA[ch].msgs}),
    cajas:   ev => fbSet('cajas',  'ev'+ev, {items:CAJAS_EV[ev]}),
    staff:   ev => fbSet('staff',  'ev'+ev, {items:STAFF_EV[ev]}),
    benef:   ev => fbSet('beneficios','ev'+ev,BENEF_EV[ev]||{}),
    provs:   ()  => fbSet('proveedores','lista',{items:PROVEEDORES}),
    eventos: ()  => fbSet('eventos','lista',{items:EVENTOS,evFin:EV_FIN}),
  };

  // LOAD
  window.fbLoad = async function(){
    console.log('Cargando desde Firebase...');
    for(let ev=0;ev<3;ev++){
      const d=await fbGet('stock','ev'+ev);
      if(d){if(d.ini)STOCK_INI[ev]=d.ini;if(d.cie)STOCK_CIE[ev]=d.cie;}
    }
    for(let ev=0;ev<3;ev++){const d=await fbGet('gastos','ev'+ev);if(d?.items)GASTOS_EV[ev]=d.items;}
    const posts=await fbGet('cm','posts');if(posts?.items)POSTS=posts.items;
    const tasks=await fbGet('cm','tasks');if(tasks?.items)TASKS=tasks.items;
    const ideas=await fbGet('boom','ideas');if(ideas?.items)IDEAS=ideas.items;
    const pub=await fbGet('publicas','lista');if(pub?.items)PUBLICAS=pub.items;
    for(let ev=0;ev<3;ev++){const d=await fbGet('actividad','ev'+ev);if(d)ACT_EV[ev]=d;}
    for(let ev=0;ev<3;ev++){const d=await fbGet('publogs','ev'+ev);if(d?.items)PUB_LOGS[ev]=d.items;}
    for(let ev=0;ev<3;ev++){const d=await fbGet('cajas','ev'+ev);if(d?.items)CAJAS_EV[ev]=d.items;}
    for(let ev=0;ev<3;ev++){const d=await fbGet('staff','ev'+ev);if(d?.items)STAFF_EV[ev]=d.items;}
    for(let ev=0;ev<3;ev++){const d=await fbGet('beneficios','ev'+ev);if(d)BENEF_EV[ev]=d;}
    const prov=await fbGet('proveedores','lista');if(prov?.items)PROVEEDORES=prov.items;
    const evs=await fbGet('eventos','lista');
    if(evs?.items&&evs.items.length>0){
      EVENTOS=evs.items;
      if(evs.evFin)EV_FIN=evs.evFin;
      ensureEvArrays();
    }
    const users=await fbGet('config','users');if(users?.items)USERS=users.items;
    // Chat tiempo real
    Object.keys(CHAT_DATA).forEach(ch=>{
      fbListen('chat',ch,data=>{
        if(data?.msgs){CHAT_DATA[ch].msgs=data.msgs;if(typeof renderMsgs==='function'&&curCh===ch)renderMsgs();}
      });
    });
    syncTopbarEventos();
    console.log('Firebase OK');
  };

  // ═══ SESIÓN PERSISTENTE ═══
  _auth.onAuthStateChanged(async function(fbUser){
    try{
      if(fbUser){
        const username=fbUser.email.replace('@boom.app','').toUpperCase();
        // Primero intentar cargar usuarios desde Firestore
        const usersData=await fbGet('config','users');
        if(usersData?.items)USERS=usersData.items;
        // Si no hay usuarios en Firestore, usar el array local (primera vez)
        const f=USERS.find(x=>x.user===username);
        if(!f){
          console.warn('Usuario autenticado en Firebase pero no encontrado en Firestore:',username);
          // Si no está en Firestore todavía, igual lo dejamos entrar como ADMIN si es admin@boom.app
          if(username==='ADMIN'){
            CU=USERS.find(x=>x.user==='ADMIN');
          }
          if(!CU){await _auth.signOut();return;}
        } else {
          CU=f;
        }
        document.getElementById('login').style.display='none';
        document.getElementById('app').style.display='flex';
        document.getElementById('t-role').textContent=CU.role;
        updateTopbarAvatar();
        syncTopbarEventos();buildSidebar();buildMobileNav();
        await window.fbLoad();
        navigate(CU.pages[0]);
      }else{
        CU=null;
        document.getElementById('login').style.display='flex';
        document.getElementById('app').style.display='none';
        const btn=document.querySelector('.lbtn');
        if(btn){btn.textContent='Ingresar';btn.disabled=false;}
      }
    }catch(err){
      console.error('Error en onAuthStateChanged:',err);
      if(typeof showLoginErr==='function')showLoginErr('Error interno: '+err.message);
      const btn=document.querySelector('.lbtn');
      if(btn){btn.textContent='Ingresar';btn.disabled=false;}
    }
  });

} catch(e) {
  console.warn('Firebase no disponible, usando datos locales:', e.message);
  window._fbOK = false;
  window.fbSave = {};
  window.fbLoad = async()=>{};
}
