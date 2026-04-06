// ═══════════════════════════════════════════════════════════
// USUARIOS — gestión segura via API serverless
// ═══════════════════════════════════════════════════════════

async function apiCall(body) {
  const token = await window.fbGetToken();
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

function pgUsuarios() {
  let h = `<div class="ptitle">👥 Usuarios</div><div class="psub">Gestión de accesos y módulos</div>`;
  h += `<div class="card"><div class="ctitle">Usuarios activos (${USERS.length})</div>`;
  USERS.forEach((u, i) => {
    if (!u) return;
    const uid    = u.username || u.user || '??';
    const role   = u.role || '—';
    const cname  = u.chatName || '';
    const email  = u.email || '';
    const pages  = Array.isArray(u.pages) ? u.pages : [];
    const initials = uid.slice(0, 2);
    h += `<div class="user-card">
      <div class="av" style="background:${AVC[i%8]}22;color:${AVC[i%8]}">${initials}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500">${escapeHtml(uid)}
          <span class="badge bgray" style="font-size:10px">${escapeHtml(role)}</span>
        </div>
        <div style="font-size:11px;color:var(--text2);margin-top:1px">${escapeHtml(cname)}</div>
        ${email ? `<div style="font-size:10px;color:var(--text3);margin-top:2px">📧 ${escapeHtml(email)}</div>` : ''}
        <div style="margin-top:4px">${pages.map(p => `<span class="mod-tag">${PAGE_LABELS[p] || p}</span>`).join('')}</div>
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
    <div class="fc"><span class="fl">Usuario</span><input type="text" id="nu-u" style="width:130px" placeholder="Ej: FOTO" oninput="this.value=this.value.toUpperCase()"></div>
    <div class="fc" style="flex:1"><span class="fl">Email</span><input type="email" id="nu-email" style="width:100%" placeholder="correo@real.com"></div>
  </div>
  <div class="fr">
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
    <div>${ALL_PAGES.map(p => `<span class="mod-tag">${PAGE_ICONS[p]} ${PAGE_LABELS[p]}</span>`).join('')}</div>
  </div>`;

  h += `<div class="card" style="border-color:var(--border)">
    <div class="ctitle">🧹 Mantenimiento</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:.5rem">Detecta usuarios en Firestore cuya cuenta de Firebase Auth ya no existe y los desactiva.</div>
    <button class="btn btnsm" id="orphan-btn" onclick="cleanOrphans()">Limpiar huérfanos</button>
    <div id="orphan-msg" style="font-size:12px;margin-top:6px;min-height:14px"></div>
  </div>`;
  return h;
}

// ─── Agregar usuario via API serverless ───
async function addUser() {
  const u     = document.getElementById('nu-u')?.value.trim().toUpperCase();
  const email = document.getElementById('nu-email')?.value.trim();
  const p     = document.getElementById('nu-p')?.value.trim();
  const cn    = document.getElementById('nu-cn')?.value.trim() || u;
  const r     = document.getElementById('nu-r')?.value;
  const msg   = document.getElementById('u-msg');
  const btn   = document.getElementById('nu-btn');

  if (!u) { msg.innerHTML = '<span style="color:var(--red)">El usuario es obligatorio.</span>'; return; }
  if (!email || !email.includes('@') || !email.includes('.')) {
    msg.innerHTML = '<span style="color:var(--red)">Ingresá un email válido.</span>'; return;
  }
  if (!p || p.length < 6) { msg.innerHTML = '<span style="color:var(--red)">La contraseña debe tener al menos 6 caracteres.</span>'; return; }

  // Client-side uniqueness check
  if (USERS.find(x => (x.username || x.user) === u)) {
    msg.innerHTML = '<span style="color:var(--red)">Ya existe un usuario con ese nombre.</span>'; return;
  }
  if (USERS.find(x => x.email === email.toLowerCase())) {
    msg.innerHTML = '<span style="color:var(--red)">Ya existe un usuario con ese email.</span>'; return;
  }

  msg.innerHTML = '<span style="color:var(--text2)">⏳ Creando usuario...</span>';
  btn.disabled = true;

  try {
    await apiCall({
      action: 'create',
      username: u,
      email: email,
      password: p,
      role: r,
      chatName: cn,
      pages: ['boom', 'chat', 'perfil'],
    });

    // Re-sync USERS from Firestore (source of truth)
    if (window.fbReloadUsers) await window.fbReloadUsers();

    msg.innerHTML = `<span style="color:var(--accent)">✓ Usuario <strong>${escapeHtml(u)}</strong> creado correctamente.</span>`;
    document.getElementById('nu-u').value = '';
    document.getElementById('nu-email').value = '';
    document.getElementById('nu-p').value = '';
    document.getElementById('nu-cn').value = '';
    renderPage('usuarios');
  } catch(e) {
    msg.innerHTML = `<span style="color:var(--red)">Error: ${escapeHtml(e.message)}</span>`;
  } finally {
    btn.disabled = false;
  }
}

// ─── Editar usuario (rol + chatname + módulos) ───
function openUserEdit(idx) {
  editUsrIdx = idx;
  const u = USERS[idx];
  if (!u) return;
  if (!Array.isArray(u.pages)) u.pages = ['perfil'];
  document.getElementById('m-usr-edit-ttl').textContent = '✏️ Editar — ' + (u.username || u.user || '');
  document.getElementById('m-usr-edit-msg').textContent = '';

  const isAdmin = u.role === 'Admin Console';
  const roles = ['Barra', 'Públicas', 'CM', 'Administración', 'Producción', 'Fotografía', 'Trafic', 'Otro', 'Admin Console'];

  document.getElementById('m-usr-edit-body').innerHTML = `
    <div class="fr" style="margin-bottom:.5rem">
      <div class="fc" style="flex:1"><span class="fl">Nombre en chat</span>
        <input type="text" id="ue-cn" style="width:100%" value="${escapeHtml(u.chatName || '')}"></div>
      <div class="fc" style="flex:1"><span class="fl">Rol</span>
        <select id="ue-role" style="width:100%" ${isAdmin ? 'disabled' : ''}>
          ${roles.map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="fr" style="margin-bottom:.5rem">
      <div class="fc" style="flex:1"><span class="fl">Email</span>
        <input type="text" id="ue-email" style="width:100%;color:var(--text2)" value="${escapeHtml(u.email || '')}" readonly>
      </div>
      <div class="fc" style="flex:1"><span class="fl">Username</span>
        <input type="text" id="ue-username" style="width:100%;font-weight:600;letter-spacing:.04em;text-transform:uppercase"
          value="${escapeHtml(u.username || u.user || '')}" ${isAdmin ? 'readonly' : ''}
          oninput="this.value=this.value.toUpperCase()">
      </div>
    </div>
    <div class="ctitle" style="font-size:12px;margin:.75rem 0 .5rem">Módulos</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:1rem">
      ${ALL_PAGES.filter(p => p !== 'usuarios' || isAdmin).map(p => {
        const on = u.pages.includes(p);
        return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
          <button class="chkbtn ${on ? 'on' : ''}" id="umod-${p}" onclick="toggleUmod('${p}')">${on ? '✓' : ''}</button>
          <span style="font-size:12px">${PAGE_ICONS[p] || ''} ${PAGE_LABELS[p] || p}</span>
        </div>`;
      }).join('')}
    </div>
    ${!isAdmin ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);padding:1rem;margin-top:.5rem">
      <div class="ctitle" style="font-size:12px;margin:0 0 .75rem">🔐 Restablecer contraseña</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:.5rem">Se cambia directamente en Firebase Auth. No se guarda la contraseña en la base de datos.</div>
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
  const on = btn.classList.toggle('on');
  btn.textContent = on ? '✓' : '';
}

async function saveUserEdit() {
  const u = USERS[editUsrIdx];
  if (!u) return;
  const msg   = document.getElementById('m-usr-edit-msg');
  const btnOk = document.querySelector('#m-usr-edit .mrow .btn.btnp');
  if (btnOk) { btnOk.disabled = true; btnOk.textContent = 'Guardando...'; }

  const cn = document.getElementById('ue-cn')?.value.trim() || u.chatName || '';
  const roleEl = document.getElementById('ue-role');
  const role = (roleEl && !roleEl.disabled) ? roleEl.value : u.role;

  const pages = ALL_PAGES.filter(p => {
    const btn = document.getElementById('umod-' + p);
    return btn?.classList.contains('on');
  });
  if (!pages.includes('perfil')) pages.push('perfil');

  // Read username
  const unameEl = document.getElementById('ue-username');
  let newUser = u.username || u.user;
  if (unameEl && !unameEl.readOnly) {
    const val = unameEl.value.trim().toUpperCase();
    if (val && val !== (u.username || u.user)) {
      if (USERS.find((x, i) => (x.username || x.user) === val && i !== editUsrIdx)) {
        if (msg) msg.innerHTML = '<span style="color:var(--red)">Ya existe un usuario con ese nombre.</span>';
        if (btnOk) { btnOk.disabled = false; btnOk.textContent = 'Guardar cambios'; }
        return;
      }
      newUser = val;
    }
  }

  // Update local USERS
  USERS[editUsrIdx].chatName = cn;
  USERS[editUsrIdx].role = role;
  USERS[editUsrIdx].pages = pages;
  USERS[editUsrIdx].username = newUser;
  USERS[editUsrIdx].user = newUser;

  try {
    // Save to Firestore users collection
    if (window._fbOK && u.uid) {
      await firebase.firestore().collection('users').doc(u.uid).update({
        chatName: cn,
        displayName: cn,
        role: role,
        pages: pages,
        username: newUser,
        updatedAt: new Date().toISOString(),
      });
    }
    if (msg) msg.innerHTML = '<span style="color:var(--accent)">✓ Guardado correctamente.</span>';
    document.getElementById('m-usr-edit').style.display = 'none';
    renderPage('usuarios');
  } catch(e) {
    if (msg) msg.innerHTML = `<span style="color:var(--red)">Error al guardar: ${escapeHtml(e.message)}</span>`;
  } finally {
    if (btnOk) { btnOk.disabled = false; btnOk.textContent = 'Guardar cambios'; }
  }
}

// ─── Reset contraseña via API ───
async function resetUserPass(idx) {
  const u = USERS[idx];
  const p1 = document.getElementById('ue-pass1')?.value.trim();
  const p2 = document.getElementById('ue-pass2')?.value.trim();
  const msg = document.getElementById('ue-pass-msg');

  if (!p1 || p1.length < 6) { msg.innerHTML = '<span style="color:var(--red)">Mínimo 6 caracteres.</span>'; return; }
  if (p1 !== p2) { msg.innerHTML = '<span style="color:var(--red)">Las contraseñas no coinciden.</span>'; return; }

  if (!u.uid) { msg.innerHTML = '<span style="color:var(--red)">Este usuario no tiene UID. Necesita ser migrado.</span>'; return; }

  msg.innerHTML = '<span style="color:var(--text2)">⏳ Procesando...</span>';

  try {
    await apiCall({ action: 'resetPassword', uid: u.uid, newPassword: p1 });
    msg.innerHTML = `<span style="color:var(--accent)">✓ Contraseña de ${escapeHtml(u.username || u.user)} actualizada.</span>`;
    document.getElementById('ue-pass1').value = '';
    document.getElementById('ue-pass2').value = '';
  } catch(e) {
    msg.innerHTML = `<span style="color:var(--red)">Error: ${escapeHtml(e.message)}</span>`;
  }
}

// ─── Eliminar usuario via API ───
async function delUser(i) {
  const u = USERS[i];
  if (!confirm(`¿Eliminar usuario ${u.username || u.user}?\n\nSe eliminará de Firebase Auth y se desactivará en la base de datos.`)) return;

  if (!u.uid) {
    // Legacy user without uid - just remove from local
    USERS.splice(i, 1);
    renderPage('usuarios');
    return;
  }

  try {
    await apiCall({ action: 'delete', uid: u.uid });
    // Re-sync USERS from Firestore (source of truth)
    if (window.fbReloadUsers) await window.fbReloadUsers();
    renderPage('usuarios');
  } catch(e) {
    alert('Error al eliminar: ' + e.message);
  }
}

// ─── Limpiar huérfanos via API ───
async function cleanOrphans() {
  const msg = document.getElementById('orphan-msg');
  const btn = document.getElementById('orphan-btn');
  msg.innerHTML = '<span style="color:var(--text2)">⏳ Buscando huérfanos...</span>';
  btn.disabled = true;

  try {
    const result = await apiCall({ action: 'cleanOrphans' });
    if (result.cleaned === 0) {
      msg.innerHTML = '<span style="color:var(--accent)">✓ No se encontraron huérfanos.</span>';
    } else {
      // Re-sync USERS from Firestore after cleanup
      if (window.fbReloadUsers) await window.fbReloadUsers();
      const names = result.details.map(d => d.username || d.uid).join(', ');
      msg.innerHTML = `<span style="color:var(--accent)">✓ ${result.cleaned} huérfano(s) desactivado(s): ${escapeHtml(names)}</span>`;
      renderPage('usuarios');
    }
  } catch(e) {
    msg.innerHTML = `<span style="color:var(--red)">Error: ${escapeHtml(e.message)}</span>`;
  } finally {
    btn.disabled = false;
  }
}

// ─── HTML escaping helper ───
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
