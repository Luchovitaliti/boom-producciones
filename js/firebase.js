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
  const _storage = firebase.storage();
  window._fbOK = true;
  window._fbStorage = _storage;

  async function fbSet(col, id, data) {
    try { await _db.collection(col).doc(id).set(data, {merge:true}); }
    catch(e) { console.warn('fbSet:', e.message); }
  }
  async function fbGet(col, id) {
    try { const d = await _db.collection(col).doc(id).get(); return d.exists ? d.data() : null; }
    catch(e) { return null; }
  }
  function fbListen(col, id, cb) {
    return _db.collection(col).doc(id).onSnapshot(s => { if (s.exists) cb(s.data()); });
  }

  // ─── Chat: subcollection-based listeners ───
  window._chatUnsubs = {};

  window.fbListenChannel = function(ch) {
    // Unsubscribe previous listener if exists
    if (window._chatUnsubs[ch]) window._chatUnsubs[ch]();

    window._chatUnsubs[ch] = _db.collection('chatChannels').doc(ch)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limitToLast(100)
      .onSnapshot(snap => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!CHAT_DATA[ch]) CHAT_DATA[ch] = { l: '#' + ch, msgs: [] };
        CHAT_DATA[ch].msgs = msgs;
        if (typeof renderMsgs === 'function' && curCh === ch) renderMsgs();
      });
  };

  // ─── SAVE ───
  window.fbSave = {
    stock:          ev => fbSet('stock',        'ev'+ev,  {ini:STOCK_INI[ev], cie:STOCK_CIE[ev]}),
    gastos:         ev => fbSet('gastos',       'ev'+ev,  {items:GASTOS_EV[ev]}),
    posts:          ()  => fbSet('cm',          'posts',  {items:POSTS}),
    tasks:          ()  => fbSet('cm',          'tasks',  {items:TASKS}),
    ideas:          ()  => fbSet('boom',        'ideas',  {items:IDEAS}),
    publicas:       ()  => fbSet('publicas',    'lista',  {items:PUBLICAS}),
    actEv:          ev => fbSet('actividad',    'ev'+ev,  ACT_EV[ev]||{}),
    pubLogs:        ev => fbSet('publogs',      'ev'+ev,  {items:PUB_LOGS[ev]}),
    cajas:          ev => fbSet('cajas',        'ev'+ev,  {items:CAJAS_EV[ev]}),
    staff:          ev => fbSet('staff',        'ev'+ev,  {items:STAFF_EV[ev]}),
    benef:          ev => fbSet('beneficios',   'ev'+ev,  BENEF_EV[ev]||{}),
    provs:          ()  => fbSet('proveedores', 'lista',  {items:PROVEEDORES}),
    gastosAdm:      ()  => fbSet('adminfin',    'gastos', {items:GASTOS_ADM}),
    personasAdm:    ()  => fbSet('adminfin',    'personas',{items:PERSONAS_ADM}),
    notasMod:       ()  => fbSet('config',      'notas',  {items:NOTAS_MOD}),
    clasificacion:  ()  => fbSet('config',      'clasificacion', CLASIF_CFG),
    recaudacion:    ev  => fbSet('recaudacion', 'ev'+ev, {
      cajas: CAJAS_REC.filter(c => c.evIdx === ev),
      lotes: LOTES_REC.filter(l => l.evIdx === ev),
    }),
    eventos:        ()  => fbSet('eventos',     'lista',  {items:EVENTOS, evFin:EV_FIN}),
    customChannels: ()  => fbSet('chat',        'customChannels', {items:CUSTOM_CHANNELS}),
    trafic:         ev => fbSet('trafic',       'ev'+ev, {
      etapas:      TRAFIC_ETAPAS.filter(e => e.evIdx === ev),
      localidades: TRAFIC_LOCALIDADES.filter(l => l.evIdx === ev),
      viajes:      TRAFIC_VIAJES.filter(v => v.evIdx === ev),
      // pasajeros migrado a subcollection trafic/ev{N}/pasajeros/{id}
    }),
    // ─── Trafic pasajeros (subcollection) ───
    traficPasAdd: (ev, pas) => {
      return _db.collection('trafic').doc('ev'+ev).collection('pasajeros').doc(String(pas.id)).set(pas);
    },
    traficPasDel: (ev, pasId) => {
      return _db.collection('trafic').doc('ev'+ev).collection('pasajeros').doc(String(pasId)).delete();
    },
    traficPasDelBatch: async (ev, pasIds) => {
      const batch = _db.batch();
      pasIds.forEach(id => {
        batch.delete(_db.collection('trafic').doc('ev'+ev).collection('pasajeros').doc(String(id)));
      });
      return batch.commit();
    },
    // Send a single chat message to subcollection
    chatMsg: (ch, msg) => {
      return _db.collection('chatChannels').doc(ch).collection('messages').add({
        ...msg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    },
  };

  // ─── Helper: get current user's ID token for API calls ───
  window.fbGetToken = async function() {
    const user = _auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
  };

  // ─── LOAD — parallelized ───
  window.fbLoad = async function() {
    console.log('Cargando desde Firebase...');

    // Phase 1: Load events first (defines array sizes)
    const evs = await fbGet('eventos', 'lista');
    if (evs?.items && evs.items.length > 0) {
      EVENTOS = evs.items;
      if (evs.evFin) EV_FIN = evs.evFin;
      ensureEvArrays();
    }

    const n = Math.max(EVENTOS.length, 3);

    // Phase 2: Load ALL event-indexed data + singletons in parallel
    const evIndices = Array.from({length: n}, (_, i) => i);

    const [
      stockResults,
      gastosResults,
      actResults,
      publogResults,
      cajasResults,
      staffResults,
      benefResults,
      traficResults,
      recResults,
      posts, tasks, ideas, pub, prov, notas, clasifCfg, gadm, padm,
      customChs,
    ] = await Promise.all([
      // Event-indexed: batch each type
      Promise.all(evIndices.map(ev => fbGet('stock', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('gastos', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('actividad', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('publogs', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('cajas', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('staff', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('beneficios', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('trafic', 'ev'+ev))),
      Promise.all(evIndices.map(ev => fbGet('recaudacion', 'ev'+ev))),
      // Singletons
      fbGet('cm', 'posts'),
      fbGet('cm', 'tasks'),
      fbGet('boom', 'ideas'),
      fbGet('publicas', 'lista'),
      fbGet('proveedores', 'lista'),
      fbGet('config', 'notas'),
      fbGet('config', 'clasificacion'),
      fbGet('adminfin', 'gastos'),
      fbGet('adminfin', 'personas'),
      fbGet('chat', 'customChannels'),
    ]);

    // Apply event-indexed results
    evIndices.forEach(ev => {
      const sd = stockResults[ev];
      if (sd) { if (sd.ini) STOCK_INI[ev] = sd.ini; if (sd.cie) STOCK_CIE[ev] = sd.cie; }
      if (gastosResults[ev]?.items) GASTOS_EV[ev] = gastosResults[ev].items;
      if (actResults[ev]) ACT_EV[ev] = actResults[ev];
      if (publogResults[ev]?.items) PUB_LOGS[ev] = publogResults[ev].items;
      if (cajasResults[ev]?.items) CAJAS_EV[ev] = cajasResults[ev].items;
      if (staffResults[ev]?.items) STAFF_EV[ev] = staffResults[ev].items;
      if (benefResults[ev]) BENEF_EV[ev] = benefResults[ev];

      const td = traficResults[ev];
      if (td) {
        if (td.etapas)      TRAFIC_ETAPAS = TRAFIC_ETAPAS.filter(e => e.evIdx !== ev).concat(td.etapas);
        if (td.localidades) TRAFIC_LOCALIDADES = TRAFIC_LOCALIDADES.filter(l => l.evIdx !== ev).concat(td.localidades);
        if (td.viajes)      TRAFIC_VIAJES = TRAFIC_VIAJES.filter(v => v.evIdx !== ev).concat(td.viajes);
        // Legacy fallback: if pasajeros still in doc, load them (will be migrated on next write)
        if (td.pasajeros && td.pasajeros.length) {
          TRAFIC_PASAJEROS = TRAFIC_PASAJEROS.filter(p => p.evIdx !== ev).concat(td.pasajeros);
        }
      }

      const rd = recResults[ev];
      if (rd) {
        if (rd.cajas) CAJAS_REC = CAJAS_REC.filter(c => c.evIdx !== ev).concat(rd.cajas);
        if (rd.lotes) LOTES_REC = LOTES_REC.filter(l => l.evIdx !== ev).concat(rd.lotes);
      }
    });

    // Apply singletons
    if (posts?.items)  POSTS       = posts.items;
    if (tasks?.items)  TASKS       = tasks.items;
    if (ideas?.items)  IDEAS       = ideas.items;
    if (pub?.items) {
      // Dedup: keep last occurrence of each id to fix legacy collisions
      const seen = new Set();
      PUBLICAS = pub.items.filter(p => p.id != null).reverse().filter(p => seen.has(p.id) ? false : (seen.add(p.id), true)).reverse();
    }
    if (prov?.items)   PROVEEDORES = prov.items;
    if (notas?.items)  NOTAS_MOD   = notas.items;
    if (clasifCfg && clasifCfg.topMinInv !== undefined) CLASIF_CFG = clasifCfg;
    if (gadm?.items)   GASTOS_ADM  = gadm.items;
    if (padm?.items)   PERSONAS_ADM= padm.items;

    // Sync ID counters to avoid collisions with loaded data
    const _maxId = (arr, field='id') => arr.reduce((m, x) => Math.max(m, x[field]||0), 0);
    npid   = Math.max(npid,   _maxId(POSTS), _maxId(TASKS));
    nPubId = Math.max(nPubId, _maxId(PUBLICAS));
    niid   = Math.max(niid,   _maxId(IDEAS));
    npvid  = Math.max(npvid,  _maxId(PROVEEDORES));

    // Load trafic pasajeros from subcollections (in parallel per event)
    await Promise.all(evIndices.map(async ev => {
      try {
        const snap = await _db.collection('trafic').doc('ev'+ev).collection('pasajeros').get();
        if (!snap.empty) {
          const subPas = snap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) || d.id }));
          // Subcollection overrides any legacy array data for this event
          TRAFIC_PASAJEROS = TRAFIC_PASAJEROS.filter(p => p.evIdx !== ev).concat(subPas);
        }
      } catch(e) { /* subcollection may not exist yet — legacy array fallback already loaded */ }
    }));

    // Load users from Firestore collection 'users'
    await loadUsersFromFirestore();

    // Custom chat channels
    if (customChs?.items) {
      CUSTOM_CHANNELS = customChs.items;
      CUSTOM_CHANNELS.forEach(ch => {
        if (!CHAT_DATA[ch.id]) CHAT_DATA[ch.id] = { l: ch.name, msgs: [] };
      });
    }

    // Chat: only listen to the active channel
    window._activeChatChannel = null;
    window.fbListenActiveChannel = function(ch) {
      if (window._activeChatChannel === ch) return;
      // Unsub previous
      if (window._activeChatChannel && window._chatUnsubs[window._activeChatChannel]) {
        window._chatUnsubs[window._activeChatChannel]();
        delete window._chatUnsubs[window._activeChatChannel];
      }
      window._activeChatChannel = ch;
      if (!CHAT_DATA[ch]) CHAT_DATA[ch] = { l: '#' + ch, msgs: [] };
      window.fbListenChannel(ch);
    };

    // Re-bind CU to refreshed USERS array
    if (CU) {
      const refreshed = USERS.find(x => x.username === CU.username || x.user === CU.user);
      if (refreshed) CU = refreshed;
    }

    syncTopbarEventos();
    if (typeof syncChatEventChannels === 'function') syncChatEventChannels();
    console.log('Firebase OK ✓');
  };

  // ─── Load users from Firestore 'users' collection ───
  async function loadUsersFromFirestore() {
    const snap = await _db.collection('users').where('active', '==', true).get();
    if (!snap.empty) {
      const firestoreUsers = snap.docs.map(d => {
        const data = d.data();
        return {
          uid: d.id,
          user: data.username || data.user || '',
          username: data.username || data.user || '',
          role: data.role || 'Otro',
          chatName: data.chatName || data.displayName || data.username || '',
          photo: data.photoURL || data.photo || '',
          photoURL: data.photoURL || '',
          bio: data.bio || '',
          instagram: data.instagram || '',
          telefono: data.telefono || '',
          email: data.email || '',
          pages: data.pages || ['perfil'],
          active: data.active !== false,
          createdAt: data.createdAt || '',
        };
      });
      USERS = firestoreUsers;
    }

    // Ensure Admin always has all pages
    let adminPagesUpdated = false;
    USERS.forEach(u => {
      if (u.role === 'Admin Console') {
        ALL_PAGES.forEach(p => {
          if (!Array.isArray(u.pages)) u.pages = [];
          if (!u.pages.includes(p)) { u.pages.push(p); adminPagesUpdated = true; }
        });
      }
      if (!Array.isArray(u.pages)) u.pages = ['perfil'];
      else if (!u.pages.includes('perfil')) u.pages.push('perfil');
    });
    // Admin pages ensured locally — Firestore updates go through API
  }

  // ─── Expose for use from usuarios.js ───
  window.fbReloadUsers = loadUsersFromFirestore;

  // ─── SESIÓN PERSISTENTE ───
  _auth.onAuthStateChanged(async function(fbUser) {
    try {
      console.log('🔑 onAuthStateChanged:', fbUser ? fbUser.uid + ' / ' + fbUser.email : 'NO USER');
      if (fbUser) {
        // Load user from Firestore 'users' collection by UID
        let userDoc = await _db.collection('users').doc(fbUser.uid).get();
        console.log('📄 Doc by UID exists?', userDoc.exists);
        let f = null;

        if (userDoc.exists) {
          const data = userDoc.data();
          f = {
            uid: fbUser.uid,
            user: data.username || data.user || '',
            username: data.username || '',
            role: data.role || 'Otro',
            chatName: data.chatName || data.displayName || '',
            photo: data.photoURL || data.photo || '',
            photoURL: data.photoURL || '',
            bio: data.bio || '',
            instagram: data.instagram || '',
            telefono: data.telefono || '',
            email: data.email || fbUser.email || '',
            pages: data.pages || ['perfil'],
            active: data.active !== false,
          };
        } else {
          // Doc not found by UID — try by email (migration/bootstrap case)
          const byEmail = await _db.collection('users')
            .where('email', '==', fbUser.email)
            .where('active', '==', true)
            .limit(1).get();
          if (!byEmail.empty) {
            const data = byEmail.docs[0].data();
            f = {
              uid: fbUser.uid,
              user: data.username || data.user || '',
              username: data.username || '',
              role: data.role || 'Otro',
              chatName: data.chatName || data.displayName || '',
              photo: data.photoURL || data.photo || '',
              photoURL: data.photoURL || '',
              bio: data.bio || '',
              instagram: data.instagram || '',
              telefono: data.telefono || '',
              email: data.email || fbUser.email || '',
              pages: data.pages || ['perfil'],
              active: true,
            };
            // Migration: use API bootstrap to move doc to correct ID
            try {
              const token = await fbUser.getIdToken();
              await fetch('/api/bootstrap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: '{}',
              });
              console.log('Migrated user doc via API bootstrap');
            } catch (migErr) {
              console.warn('Migration via API failed:', migErr.message);
            }
          }
        }

        // No doc found — only auto-create if ZERO active users (first-time setup)
        if (!f) {
          console.warn('⚠️ No user doc found for UID:', fbUser.uid, 'Email:', fbUser.email);
          const anyActive = await _db.collection('users').where('active', '==', true).limit(1).get();
          if (anyActive.empty) {
            // First user ever → create as Admin
            const now = new Date().toISOString();
            const adminPages = ['dashboard','barra','adminfin','recaudacion','liderpub','publicas','trafic','cm','boom','chat','proveedores','kpi','dev','usuarios','perfil'];
            const adminData = {
              uid: fbUser.uid, username: 'ADMIN',
              email: (fbUser.email || '').toLowerCase(),
              role: 'Admin Console', active: true,
              chatName: 'Administrador', displayName: 'Administrador',
              photo: '', photoURL: '', bio: '', instagram: '', telefono: '',
              pages: adminPages, createdAt: now, updatedAt: now, createdBy: fbUser.uid,
            };
            await _db.collection('users').doc(fbUser.uid).set(adminData);
            console.log('✅ First-time admin doc created');
            f = {
              uid: fbUser.uid, user: 'ADMIN', username: 'ADMIN',
              role: 'Admin Console', chatName: 'Administrador',
              photo: '', photoURL: '', bio: '', instagram: '', telefono: '',
              email: adminData.email, pages: adminPages, active: true,
            };
          } else {
            console.warn('❌ User has no doc and other users exist — access denied.');
          }
        }

        if (!f || f.active === false) {
          await _auth.signOut();
          return;
        }

        // Ensure pages are sane
        if (!Array.isArray(f.pages)) f.pages = ['perfil'];
        if (f.role === 'Admin Console') {
          ALL_PAGES.forEach(p => { if (!f.pages.includes(p)) f.pages.push(p); });
        }
        if (!f.pages.includes('perfil')) f.pages.push('perfil');

        CU = f;

        document.getElementById('boot-loader').style.display = 'none';
        document.getElementById('login').style.display = 'none';
        document.getElementById('forgot-password').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('t-role').textContent = CU.role;
        updateTopbarAvatar();
        syncTopbarEventos();
        buildSidebar();
        buildMobileNav();
        navigate(CU.pages[0]);
        await window.fbLoad();
        renderPage(curPage);
      } else {
        CU = null;
        const mc = document.getElementById('mc'); if (mc) mc.innerHTML = '';
        const sb = document.getElementById('sb'); if (sb) sb.innerHTML = '';
        document.getElementById('boot-loader').style.display = 'none';
        document.getElementById('login').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
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
  window._fbOK           = false;
  window._fbStorage       = null;
  window.fbSave           = {};
  window.fbLoad           = async () => {};
  window.fbListenChannel  = () => {};
  window.fbListenChannelLegacy = () => {};
  window.fbGetToken       = async () => '';
}
