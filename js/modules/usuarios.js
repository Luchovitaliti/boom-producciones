// ═══════════════════════════════════════════════════════════
// USUARIOS — gestión completa con Firebase Auth via REST
// ═══════════════════════════════════════════════════════════
const _FB_KEY = 'AIzaSyCJ3JlOH7cWId3t4pe_7WuuyqptWk7VXE0';

function pgUsuarios() {
  let h = `<div class="ptitle">👥 Usuarios</div><div class="psub">Gestión de accesos y módulos</div>`;
  h += `<div class="card"><div class="ctitle">Usuarios activos (${USERS.length})</div>`;
  USERS.forEach((u, i) => {
    if(!u) return;
    const uid   = u.user   || '??';
    const role  = u.role   || '—';
    const cname = u.chatName || '';
    const pages = Array.isArray(u.pages) ? u.pages : [];
    const initials = uid.slice(0,2);
    h += `<div class="user-card">
      <div class="av" style="background:${AVC[i%8]}22;color:${AVC[i%8]}">${initials}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500">${uid}
          <span class="badge bgray" style="font-size:10px">${role}</span>
        </div>
        <div style="font-size:11px;color:var(--text2);margin-top:1px">${cname}</div>
        <div style="margin-top:4px">${pages.map(p=>`<span class="mod-tag">${PAGE_LABELS[p]||p}</span>`).join('')}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn btnsm btnp" onclick="openUserEdit(${i})">✏️ Editar</button>
        ${role !== 'Admin Console' ? `<button class="btn btnsm btnd" onclick="delUser(${i})">Eliminar</button>` : ''}
      </div>
    </div>`;
  });
  h += `</div>`;

  h += `<div class="card"><div class="ctitle">Agregar usuario</div>
  <div class="fr">
    <div class="fc"><span class="fl">Usuario</span><input type="text" id="nu-u" style="width:130px" placeholder="Ej: FOTO"></div>
    <div class="fc"><span class="fl">Contraseña</span><input type="password" id="nu-p" style="width:140px" placeholder="Mínimo 6 caracteres"></div>
    <div class="fc"><span class="fl">Nombre en chat</span><input type="text" id="nu-cn" style="width:150px" placeholder="Ej: Fotógrafo"></div>
    <div class="fc"><span class="fl">Rol</span>
      <select id="nu-r" style="width:160px">
        <option value="Barra">Barra</option>
        <option value="Públicas">Públicas</option>
        <option value="CM">CM</option>
        <option value="Administración">Administración</option>
        <option value="Producción">Producción</option>
        <option value="Fotografía">Fotografía</option>
        <option value="Trafic">Trafic</option>
        <option value="Otro">Otro</option>
      </select>
    </div>
    <div class="fc" style="justify-content:flex-end">
      <button class="btn btnp" onclick="addUser()" id="nu-btn">Agregar</button>
    </div>
  </div>
  <div id="u-msg" style="font-size:12px;margin-top:4px;line-height:1.5"></div></div>`;

  h += `<div class="card" style="border-color:var(--border)">
    <div class="ctitle">Módulos disponibles</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:.5rem">Usá el botón <strong>Editar</strong> en cada usuario para asignar módulos y cambiar su rol.</div>
    <div>${ALL_PAGES.map(p=>`<span class="mod-tag">${PAGE_ICONS[p]} ${PAGE_LABELS[p]}</span>`).join('')}</div>
  </div>`;
  return h;
}

// ─── Agregar usuario ───
async function addUser() {
  const u    = document.getElementById('nu-u')?.value.trim().toUpperCase();
  const p    = document.getElementById('nu-p')?.value.trim();
  const cn   = document.getElementById('nu-cn')?.value.trim() || u;
  const r    = document.getElementById('nu-r')?.value;
  const msg  = document.getElementById('u-msg');
  const btn  = document.getElementById('nu-btn');

  if (!u || !p) { msg.innerHTML = '<span style="color:var(--red)">Completá usuario y contraseña.</span>'; return; }
  if (p.length < 6) { msg.innerHTML = '<span style="color:var(--red)">La contraseña debe tener al menos 6 caracteres.</span>'; return; }
  if (USERS.find(x => x.user === u)) { msg.innerHTML = '<span style="color:var(--red)">Ya existe un usuario con ese nombre.</span>'; return; }

  const email = u.toLowerCase() + '@boom.app';
  msg.innerHTML = '<span style="color:var(--text2)">⏳ Creando usuario en Firebase...</span>';
  btn.disabled = true;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${_FB_KEY}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email, password:p, returnSecureToken:false}) }
    );
    const data = await res.json();
    if (data.error) {
      const errMap = {
        'EMAIL_EXISTS':       'Este usuario ya existe en Firebase Auth.',
        'WEAK_PASSWORD':      'Contraseña muy débil. Usá al menos 6 caracteres.',
        'INVALID_EMAIL':      'Email inválido.',
        'TOO_MANY_ATTEMPTS_TRY_LATER': 'Demasiados intentos. Esperá unos minutos.',
      };
      throw new Error(errMap[data.error.message] || data.error.message);
    }

    USERS.push({user:u, role:r, chatName:cn, photo:'', bio:'', instagram:'', telefono:'',
                _pass:p, pages:['boom','chat','perfil']});
    if (window._fbOK) window.fbSave.users?.();

    msg.innerHTML = `<span style="color:var(--accent)">✓ Usuario <strong>${u}</strong> creado correctamente.</span>`;
    document.getElementById('nu-u').value  = '';
    document.getElementById('nu-p').value  = '';
    document.getElementById('nu-cn').value = '';
    renderPage('usuarios');
  } catch(e) {
    msg.innerHTML = `<span style="color:var(--red)">Error: ${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
}

// ─── Editar usuario (rol + chatname + módulos + reset pass) ───
function openUserEdit(idx) {
  editUsrIdx = idx;
  const u = USERS[idx];
  if(!u) return;
  if(!Array.isArray(u.pages)) u.pages = ['perfil'];
  document.getElementById('m-usr-edit-ttl').textContent = '✏️ Editar — ' + (u.user||'');
  document.getElementById('m-usr-edit-msg').textContent = '';

  const isAdmin = u.role === 'Admin Console';
  const roles = ['Barra','Públicas','CM','Administración','Producción','Fotografía','Trafic','Otro','Admin Console'];

  document.getElementById('m-usr-edit-body').innerHTML = `
    <div class="fr" style="margin-bottom:.5rem">
      <div class="fc" style="flex:1"><span class="fl">Nombre en chat</span>
        <input type="text" id="ue-cn" style="width:100%" value="${u.chatName||''}"></div>
      <div class="fc" style="flex:1"><span class="fl">Rol</span>
        <select id="ue-role" style="width:100%" ${isAdmin?'disabled':''}>
          ${roles.map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="ctitle" style="font-size:12px;margin:.75rem 0 .5rem">Módulos</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:1rem">
      ${ALL_PAGES.filter(p => p !== 'usuarios' || isAdmin).map(p => {
        const on = u.pages.includes(p);
        return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
          <button class="chkbtn ${on?'on':''}" id="umod-${p}" onclick="toggleUmod('${p}')">${on?'✓':''}</button>
          <span style="font-size:12px">${PAGE_ICONS[p]||''} ${PAGE_LABELS[p]||p}</span>
        </div>`;
      }).join('')}
    </div>
    ${!isAdmin ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);padding:1rem;margin-top:.5rem">
      <div class="ctitle" style="font-size:12px;margin:0 0 .6rem">🔑 Resetear contraseña</div>
      <div class="fr">
        <div class="fc" style="flex:1"><span class="fl">Nueva contraseña</span>
          <input type="password" id="ue-pass1" style="width:100%" placeholder="Mínimo 6 caracteres"></div>
        <div class="fc" style="flex:1"><span class="fl">Confirmar</span>
          <input type="password" id="ue-pass2" style="width:100%" placeholder="Repetir contraseña"></div>
      </div>
      <button class="btn btnsm" style="margin-top:.5rem" onclick="resetUserPass(${idx})">🔑 Cambiar contraseña</button>
      <div id="ue-pass-msg" style="font-size:12px;margin-top:6px;min-height:14px"></div>
    </div>` : ''}
  `;
  document.getElementById('m-usr-edit').style.display = 'flex';
}

function toggleUmod(p) {
  const btn = document.getElementById('umod-' + p);
  const on  = btn.classList.toggle('on');
  btn.textContent = on ? '✓' : '';
}

function saveUserEdit() {
  const u = USERS[editUsrIdx];
  const cn = document.getElementById('ue-cn')?.value.trim();
  if (cn) { u.chatName = cn; }
  const roleEl = document.getElementById('ue-role');
  if (roleEl && !roleEl.disabled) u.role = roleEl.value;

  u.pages = ALL_PAGES.filter(p => {
    const btn = document.getElementById('umod-' + p);
    return btn?.classList.contains('on');
  });
  if (!u.pages.includes('perfil')) u.pages.push('perfil');

  // Sync to USERS array and save
  const idx = USERS.findIndex(x => x.user === u.user);
  if (idx !== -1) USERS[idx] = u;
  if (window._fbOK) window.fbSave.users?.();

  document.getElementById('m-usr-edit').style.display = 'none';
  document.getElementById('m-usr-edit-msg').textContent = '';
  renderPage('usuarios');
}

// ─── Reset contraseña ───
async function resetUserPass(idx) {
  const u = USERS[idx];
  const p1 = document.getElementById('ue-pass1')?.value.trim();
  const p2 = document.getElementById('ue-pass2')?.value.trim();
  const msg = document.getElementById('ue-pass-msg');

  if (!p1 || p1.length < 6) { msg.innerHTML='<span style="color:var(--red)">Mínimo 6 caracteres.</span>'; return; }
  if (p1 !== p2) { msg.innerHTML='<span style="color:var(--red)">Las contraseñas no coinciden.</span>'; return; }

  msg.innerHTML = '<span style="color:var(--text2)">⏳ Procesando...</span>';

  const email = u.user.toLowerCase() + '@boom.app';
  const storedPass = u._pass || '';

  try {
    // 1. Sign in as the user via REST (using stored password) to get their ID token
    if (!storedPass) throw new Error('No hay contraseña almacenada. Creá al usuario nuevamente o actualizá en Firebase Console.');

    const signIn = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${_FB_KEY}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email, password:storedPass, returnSecureToken:true}) }
    );
    const signInData = await signIn.json();
    if (signInData.error) throw new Error('Error al autenticar usuario: ' + (signInData.error.message || ''));

    // 2. Update password using user's ID token
    const upd = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${_FB_KEY}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({idToken:signInData.idToken, password:p1, returnSecureToken:false}) }
    );
    const updData = await upd.json();
    if (updData.error) throw new Error(updData.error.message || 'Error al cambiar contraseña.');

    // 3. Update stored password in Firestore
    u._pass = p1;
    const fidx = USERS.findIndex(x => x.user === u.user);
    if (fidx !== -1) USERS[fidx]._pass = p1;
    if (window._fbOK) window.fbSave.users?.();

    msg.innerHTML = `<span style="color:var(--accent)">✓ Contraseña de ${u.user} actualizada correctamente.</span>`;
    document.getElementById('ue-pass1').value = '';
    document.getElementById('ue-pass2').value = '';
  } catch(e) {
    msg.innerHTML = `<span style="color:var(--red)">Error: ${e.message}</span>`;
  }
}

function delUser(i) {
  if (!confirm(`¿Eliminar usuario ${USERS[i].user}?\n\nNota: se elimina de la app. La cuenta en Firebase Auth sigue activa.`)) return;
  USERS.splice(i, 1);
  if (window._fbOK) window.fbSave.users?.();
  renderPage('usuarios');
}
