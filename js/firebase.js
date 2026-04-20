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
    catch(e) { console.error('fbSet ERROR ['+col+'/'+id+']:', e.code, e.message); }
  }
  async function fbGet(col, id) {
    try { const d = await _db.collection(col).doc(id).get(); return d.exists ? d.data() : null; }
    catch(e) { return null; }
  }
  window.fbGet = fbGet;
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
    boomHero:           ()  => fbSet('boomhero', 'evals',        {items:HERO_EVALS}),
    heroParticipants:   ()  => fbSet('boomhero', 'participants', {items:HERO_PARTICIPANTS}),
    bhConfig:           ()  => fbSet('boomHeroConfig', 'default', BH_CONFIG),
    // ─── Per-event BoomHero — objetos keyed por userId ───
    // Los objetos se mergean correctamente en Firestore (no se reemplazan como los arrays).
    boomHeroEv: (ev) => {
      if (ev == null || isNaN(Number(ev))) {
        console.error('[boomHeroEv] evIdx inválido:', ev); return Promise.resolve();
      }
      const key = 'ev'+ev;
      // Convertir arrays → objetos keyed por userId
      const partsObj  = {};
      HERO_PARTICIPANTS.filter(p=>p.evIdx===ev).forEach(p=>{ partsObj[String(p.userId)] = p; });
      const scoresObj = {};
      HERO_EVALS.filter(e=>e.evIdx===ev).forEach(e=>{ scoresObj[String(e.userId)] = e; });
      console.log('[boomHeroEv] guardando ev%d | parts=%d scores=%d',
        ev, Object.keys(partsObj).length, Object.keys(scoresObj).length);
      return _db.collection('boomhero').doc(key).set({
        participants: partsObj,
        liveScores:   scoresObj,
        status:       HERO_STATUS[key]||'live',
        updatedAt:    firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
        .then(()=>console.log('[boomHeroEv] ✓ guardado en boomhero/'+key))
        .catch(e=>console.error('[boomHeroEv] ERROR boomhero/'+key+':', e.code, e.message));
    },
    boomHeroFinalize: async (ev) => {
      const key    = 'ev'+ev;
      const ranked = [...HERO_EVALS.filter(e=>e.evIdx===ev)].sort((a,b)=>b.totalScore-a.totalScore);
      const top3   = ranked.slice(0,3).map((e,i) => {
        const s    = (typeof bhCalc==='function') ? bhCalc(e) : {};
        const logs = [];
        [['presencia','Presencia'],['participacion','Participación'],
         ['responsabilidad','Responsabilidad'],['performance','Performance ×2'],
         ['actitud','Actitud'],['creatividad','Creatividad'],
         ['impacto','Impacto'],['bonus','Bonus']].forEach(([k,l])=>{
          if(s[k]) logs.push({type:s[k]>0?'sum':'rest', value:Math.abs(s[k]), reason:l});
        });
        if(s.penalizaciones) logs.push({type:'rest', value:s.penalizaciones, reason:'Penalizaciones'});
        return { rank:i+1, userId:e.userId, userName:e.userName, totalScore:e.totalScore, logs };
      });
      const finalizedAt      = Date.now();
      HERO_FINAL_SCORES[key] = top3;
      HERO_FINALIZED_AT[key] = finalizedAt;
      HERO_STATUS[key]       = 'finalized';
      const partsObj  = {};
      HERO_PARTICIPANTS.filter(p=>p.evIdx===ev).forEach(p=>{ partsObj[String(p.userId)] = p; });
      const scoresObj = {};
      HERO_EVALS.filter(e=>e.evIdx===ev).forEach(e=>{ scoresObj[String(e.userId)] = e; });
      await _db.collection('boomhero').doc(key).set({
        participants: partsObj,
        liveScores:   scoresObj,
        finalScores:  top3,
        status:       'finalized',
        finalizedAt,
        updatedAt:    firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      const evData   = EVENTOS[ev]||{};
      const histEntry = {
        eventId:   key,
        eventName: evData.nombre||`Evento #${ev+1}`,
        date:      evData.fecha||new Date().toISOString().slice(0,10),
        top3, ts: Date.now(),
      };
      HERO_HISTORY = HERO_HISTORY.filter(h=>h.eventId!==key).concat(histEntry);
      await fbSet('boomHeroHistory', key, histEntry);

      // ── Actualizar medallas de los ganadores ──
      const medalTypes=['hero','warrior','player'];
      await Promise.all(top3.map(async(entry,i)=>{
        const u=USERS.find(u=>(u.uid||u.username)===entry.userId);
        if(!u||!u.uid) return;
        if(!u.medals) u.medals={hero:0,warrior:0,player:0};
        const mk=medalTypes[i];
        u.medals[mk]=(u.medals[mk]||0)+1;
        if(CU&&(CU.uid||CU.username)===entry.userId){
          if(!CU.medals) CU.medals={hero:0,warrior:0,player:0};
          CU.medals[mk]=u.medals[mk];
        }
        try{ await _db.collection('users').doc(u.uid).update({medals:u.medals}); }
        catch(e){ console.warn('[medals] Error actualizando medalla:',e.message); }
      }));
    },
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
    deco: ev => fbSet('deco', 'ev'+ev, DECO_DATA[ev]||{stock:[],shopping:[],budget:{total:0,gastado:0},checklist:[]}),
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
      decoResults,
      posts, tasks, ideas, pub, prov, notas, clasifCfg, gadm, padm,
      customChs, heroEvals, heroParts, bhConfigDoc,
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
      Promise.all(evIndices.map(ev => fbGet('deco', 'ev'+ev))),
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
      fbGet('boomhero', 'evals'),
      fbGet('boomhero', 'participants'),
      fbGet('boomHeroConfig', 'default'),
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

      if (decoResults[ev]) DECO_DATA[ev] = decoResults[ev];
      else if (!DECO_DATA[ev]) DECO_DATA[ev] = {stock:[],shopping:[],budget:{total:0,gastado:0},checklist:[]};
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
    if (heroEvals?.items)  HERO_EVALS        = heroEvals.items;
    if (heroParts?.items)  HERO_PARTICIPANTS  = heroParts.items;
    // BH_CONFIG: si hay config guardada en Firestore, la usa; si no, queda el default de data.js
    if (bhConfigDoc?.categories?.length) BH_CONFIG = bhConfigDoc;

    // ─── Load per-event boomhero docs (fuente primaria) ───
    // Formato nuevo: participants y liveScores son objetos keyed por userId.
    // Fallback: arrays (formato viejo), o docs legacy boomhero/participants+evals.
    const bhEvDocs = await Promise.all(evIndices.map(ev => fbGet('boomhero', 'ev'+ev)));
    evIndices.forEach((ev, i) => {
      const bh  = bhEvDocs[i];
      const key = 'ev'+ev;

      if (bh) {
        // ── participants ──
        if (bh.participants && !Array.isArray(bh.participants)) {
          // Formato nuevo: objeto { userId: {...} }
          const fromDoc = Object.values(bh.participants).map(p=>({...p, evIdx:ev}));
          if (fromDoc.length > 0)
            HERO_PARTICIPANTS = HERO_PARTICIPANTS.filter(p=>p.evIdx!==ev).concat(fromDoc);
        } else if (Array.isArray(bh.participants) && bh.participants.length) {
          // Formato viejo: array
          HERO_PARTICIPANTS = HERO_PARTICIPANTS.filter(p=>p.evIdx!==ev)
            .concat(bh.participants.map(p=>({...p, evIdx:ev})));
        }

        // ── liveScores ──
        if (bh.liveScores && !Array.isArray(bh.liveScores)) {
          // Formato nuevo: objeto { userId: evalObj }
          const fromDoc = Object.values(bh.liveScores).map(s=>({...s, evIdx:ev}));
          if (fromDoc.length > 0)
            HERO_EVALS = HERO_EVALS.filter(e=>e.evIdx!==ev).concat(fromDoc);
        } else if (Array.isArray(bh.liveScores) && bh.liveScores.length) {
          // Formato viejo: array
          HERO_EVALS = HERO_EVALS.filter(e=>e.evIdx!==ev)
            .concat(bh.liveScores.map(s=>({...s, evIdx:ev})));
        }

        // ── status, finalScores y finalizedAt ──
        if (bh.status === 'live' || bh.status === 'finalized') HERO_STATUS[key] = bh.status;
        if (Array.isArray(bh.finalScores) && bh.finalScores.length) HERO_FINAL_SCORES[key] = bh.finalScores;
        if (bh.finalizedAt) HERO_FINALIZED_AT[key] = bh.finalizedAt;
      }

      console.log('[fbLoad] boomhero/ev%d → status=%s parts=%d evals=%d finalScores=%d',
        ev, HERO_STATUS[key]??'(sin doc)',
        HERO_PARTICIPANTS.filter(p=>p.evIdx===ev).length,
        HERO_EVALS.filter(e=>e.evIdx===ev).length,
        HERO_FINAL_SCORES[key]?.length??0);
    });
    // ─── Load boomhero history ───
    const bhHistDocs = await Promise.all(evIndices.map(ev => fbGet('boomHeroHistory', 'ev'+ev)));
    bhHistDocs.forEach((h, i) => {
      if (h) HERO_HISTORY = HERO_HISTORY.filter(x=>x.eventId!=='ev'+i).concat(h);
    });

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
    // Efecto visual BOOM HERO — solo el evento más reciente
    if(typeof checkBoomHeroFire==='function') checkBoomHeroFire();
    if(typeof boomConfetti==='function' && typeof hmLastHero==='function'){
      const _h=hmLastHero(); if(_h) boomConfetti('ev'+_h.evIdx);
    }
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
          medals: data.medals || { hero:0, warrior:0, player:0 },
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
        if (!f.pages.includes('home')) f.pages.unshift('home');

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
        navigate('home');
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
