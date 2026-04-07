// ═══════════════════════════════════════════════════════════
// PERFIL DE USUARIO
// ═══════════════════════════════════════════════════════════
function pgPerfil() {
  return `<div class="ptitle">👤 Mi perfil</div><div class="psub">Tus datos personales y configuración</div>
  <div class="card"><div class="profile-header">
    <div class="upload-av" onclick="document.getElementById('prof-file').click()">
      <div id="prof-av-preview" style="width:80px;height:80px;border-radius:50%;background:var(--bg3);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600;overflow:hidden;color:var(--accent)"></div>
      <span class="upload-av-label">Cambiar foto</span>
      <input type="file" id="prof-file" accept="image/*" style="display:none" onchange="handlePhotoUpload(this)">
    </div>
    <div class="profile-info">
      <div class="profile-name" id="prof-display-name"></div>
      <div class="profile-role" id="prof-display-role"></div>
      <div class="profile-bio" id="prof-display-bio" style="font-style:italic"></div>
    </div>
  </div></div>
  <div class="card"><div class="ctitle">Editar información</div>
    <div class="fr">
      <div class="fc" style="flex:1;min-width:150px"><span class="fl">Nombre en el chat</span><input type="text" id="prof-chatname" style="width:100%" placeholder="Tu nombre visible"></div>
      <div class="fc" style="flex:1;min-width:150px"><span class="fl">Instagram</span><input type="text" id="prof-ig" style="width:100%" placeholder="@tuusuario"></div>
    </div>
    <div class="fr">
      <div class="fc" style="flex:1;min-width:150px"><span class="fl">Teléfono</span><input type="text" id="prof-tel" style="width:100%" placeholder="+54 9 261..."></div>
      <div class="fc" style="flex:1;min-width:150px"><span class="fl">Email</span><input type="text" id="prof-email" style="width:100%;color:var(--text2)" readonly></div>
    </div>
    <div class="fc" style="margin-bottom:12px"><span class="fl">Bio / Descripción</span><textarea id="prof-bio" placeholder="Contá algo sobre vos o tu rol en BOOM..."></textarea></div>
    <button class="btn btnp" onclick="saveProfile()">Guardar cambios</button>
    <div id="prof-msg" style="font-size:12px;margin-top:8px"></div>
  </div>
  <div class="card"><div class="ctitle">Cambiar contraseña</div>
    <div class="fr">
      <div class="fc" style="flex:1;min-width:150px"><span class="fl">Contraseña actual</span><input type="password" id="prof-pass-old" style="width:100%" placeholder="••••••••"></div>
      <div class="fc" style="flex:1;min-width:150px"><span class="fl">Nueva contraseña</span><input type="password" id="prof-pass-new" style="width:100%" placeholder="••••••••"></div>
      <div class="fc" style="flex:1;min-width:150px"><span class="fl">Confirmar nueva</span><input type="password" id="prof-pass-conf" style="width:100%" placeholder="••••••••"></div>
    </div>
    <button class="btn" onclick="savePassword()">Cambiar contraseña</button>
    <div id="prof-pass-msg" style="font-size:12px;margin-top:8px"></div>
  </div>
  <div class="card"><div class="ctitle">Mis módulos</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:.5rem">Módulos a los que tenés acceso. Si necesitás más, pedíselos al Admin.</div>
    <div id="prof-mods"></div>
  </div>`;
}

function initPerfil() {
  const u = CU;
  const col = AVC[USERS.indexOf(u) % 8];
  const el = document.getElementById('prof-av-preview');
  const photoSrc = u.photoURL || u.photo;
  if (photoSrc) {
    const img = document.createElement('img');
    img.src = photoSrc;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover';
    el.innerHTML = '';
    el.appendChild(img);
  } else {
    el.textContent = ini(u.chatName);
    el.style.color = col;
  }
  document.getElementById('prof-display-name').textContent = u.chatName;
  document.getElementById('prof-display-role').textContent = u.role + ' · ' + (u.username || u.user);
  document.getElementById('prof-display-bio').textContent = u.bio || 'Sin bio todavía.';
  document.getElementById('prof-chatname').value = u.chatName;
  document.getElementById('prof-ig').value = u.instagram || '';
  document.getElementById('prof-tel').value = u.telefono || '';
  document.getElementById('prof-email').value = u.email || '';
  document.getElementById('prof-bio').value = u.bio || '';
  document.getElementById('prof-mods').innerHTML = u.pages.filter(p => p !== 'perfil').map(p =>
    `<span class="mod-tag">${PAGE_ICONS[p]} ${PAGE_LABELS[p] || p}</span>`
  ).join('');
}

async function handlePhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const msgEl = document.getElementById('prof-msg');

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    msgEl.innerHTML = '<span style="color:var(--red)">La imagen no puede superar 2MB.</span>';
    return;
  }

  // Show preview immediately from local file
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById('prof-av-preview');
    if (el) el.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
  };
  reader.readAsDataURL(file);

  // Upload to Firebase Storage
  if (!window._fbStorage || !CU?.uid) {
    msgEl.innerHTML = '<span style="color:var(--yellow)">Foto cargada localmente. Guardá cambios para aplicar.</span>';
    // Store as data URL fallback
    const r2 = new FileReader();
    r2.onload = e2 => { CU._pendingPhoto = e2.target.result; };
    r2.readAsDataURL(file);
    return;
  }

  msgEl.innerHTML = '<span style="color:var(--text2)">⏳ Subiendo foto...</span>';

  try {
    const storageRef = window._fbStorage.ref(`avatars/${CU.uid}`);
    await storageRef.put(file);
    const photoURL = await storageRef.getDownloadURL();

    CU.photoURL = photoURL;
    CU.photo = photoURL;
    updateTopbarAvatar();

    // Save to Firestore
    if (CU.uid) {
      await firebase.firestore().collection('users').doc(CU.uid).update({
        photoURL: photoURL,
        updatedAt: new Date().toISOString(),
      });
    }

    // Update local USERS array
    const idx = USERS.findIndex(u => (u.uid || u.user) === (CU.uid || CU.user));
    if (idx !== -1) {
      USERS[idx].photoURL = photoURL;
      USERS[idx].photo = photoURL;
    }

    msgEl.innerHTML = '<span style="color:var(--accent)">✓ Foto actualizada correctamente.</span>';
  } catch(e) {
    console.error('Photo upload error:', e);
    msgEl.innerHTML = `<span style="color:var(--red)">Error al subir foto: ${e.message}</span>`;
  }
}

async function saveProfile() {
  const cn = document.getElementById('prof-chatname').value.trim();
  const msgEl = document.getElementById('prof-msg');
  if (!cn) { msgEl.innerHTML = '<span style="color:var(--red)">El nombre no puede estar vacío.</span>'; return; }

  CU.chatName = cn;
  CU.instagram = document.getElementById('prof-ig').value.trim();
  CU.telefono = document.getElementById('prof-tel').value.trim();
  CU.bio = document.getElementById('prof-bio').value.trim();

  // Sync CU back into USERS array
  const idx = USERS.findIndex(u => (u.uid || u.user) === (CU.uid || CU.user));
  if (idx !== -1) {
    USERS[idx].chatName = CU.chatName;
    USERS[idx].instagram = CU.instagram;
    USERS[idx].telefono = CU.telefono;
    USERS[idx].bio = CU.bio;
  }

  document.getElementById('prof-display-name').textContent = cn;
  document.getElementById('prof-display-bio').textContent = CU.bio || 'Sin bio todavía.';
  updateTopbarAvatar();

  // Save to Firestore users collection
  try {
    if (window._fbOK && CU.uid) {
      await firebase.firestore().collection('users').doc(CU.uid).update({
        chatName: cn,
        displayName: cn,
        instagram: CU.instagram,
        telefono: CU.telefono,
        bio: CU.bio,
        updatedAt: new Date().toISOString(),
      });
    }
    msgEl.innerHTML = '<span style="color:var(--green)">Perfil guardado correctamente.</span>';
  } catch(e) {
    msgEl.innerHTML = `<span style="color:var(--red)">Error al guardar: ${e.message}</span>`;
  }
}

async function savePassword() {
  const old  = document.getElementById('prof-pass-old').value;
  const nw   = document.getElementById('prof-pass-new').value;
  const conf = document.getElementById('prof-pass-conf').value;
  const msg  = document.getElementById('prof-pass-msg');

  if (!nw || nw.length < 6) { msg.innerHTML = '<span style="color:var(--red)">La nueva contraseña debe tener al menos 6 caracteres.</span>'; return; }
  if (nw !== conf) { msg.innerHTML = '<span style="color:var(--red)">Las contraseñas no coinciden.</span>'; return; }

  try {
    const user = firebase.auth().currentUser;
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, old);
    await user.reauthenticateWithCredential(cred);
    await user.updatePassword(nw);
    // No password stored in Firestore — only Firebase Auth
    msg.innerHTML = '<span style="color:var(--green)">Contraseña actualizada correctamente.</span>';
    ['prof-pass-old', 'prof-pass-new', 'prof-pass-conf'].forEach(id => document.getElementById(id).value = '');
  } catch(e) {
    msg.innerHTML = '<span style="color:var(--red)">Contraseña actual incorrecta o sesión expirada.</span>';
  }
}
