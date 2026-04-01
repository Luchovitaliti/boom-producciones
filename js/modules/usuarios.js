// ═══════════════════════════════════════════════════════════
// USUARIOS — gestión completa con Firebase Auth via REST
// ═══════════════════════════════════════════════════════════
const _FB_KEY = 'AIzaSyCJ3JlOH7cWId3t4pe_7WuuyqptWk7VXE0';

function pgUsuarios() {
  let h = `<div class="ptitle">👥 Usuarios</div><div class="psub">Gestión de accesos y módulos</div>`;
  h += `<div class="card"><div class="ctitle">Usuarios activos (${USERS.length})</div>`;
  USERS.forEach((u, i) => {
    h += `<div class="user-card">
      <div class="av" style="background:${AVC[i%8]}22;color:${AVC[i%8]}">${u.user.slice(0,2)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${u.user}
          <span class="badge bgray" style="font-size:10px">${u.role}</span>
        </div>
        <div style="font-size:11px;color:var(--text2);margin-top:1px">${u.chatName}</div>
        <div style="margin-top:4px">${u.pages.map(p=>`<span class="mod-tag">${PAGE_LABELS[p]||p}</span>`).join('')}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn btnsm" onclick="openUserMods(${i})">Módulos</button>
        ${u.role !== 'Admin Console' ? `<button class="btn btnsm btnd" onclick="delUser(${i})">Eliminar</button>` : ''}
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
    <div style="font-size:12px;color:var(--text2);margin-bottom:.5rem">Usá el botón <strong>Módulos</strong> en cada usuario para asignar accesos.</div>
    <div>${ALL_PAGES.map(p=>`<span class="mod-tag">${PAGE_ICONS[p]} ${PAGE_LABELS[p]}</span>`).join('')}</div>
  </div>`;
  return h;
}

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
    // Crear en Firebase Auth via REST API — no desloguea al admin
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${_FB_KEY}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password: p, returnSecureToken: false})
      }
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

    // Agregar al array local
    USERS.push({user:u, role:r, chatName:cn, photo:'', bio:'', instagram:'', telefono:'', pages:['boom','chat','perfil']});
    if (window._fbOK) window.fbSave.users?.();

    msg.innerHTML = `<span style="color:var(--accent)">✓ Usuario <strong>${u}</strong> creado correctamente. Ya puede iniciar sesión con su contraseña.</span>`;

    // Limpiar campos
    document.getElementById('nu-u').value = '';
    document.getElementById('nu-p').value = '';
    document.getElementById('nu-cn').value = '';

    renderPage('usuarios');
  } catch(e) {
    msg.innerHTML = `<span style="color:var(--red)">Error: ${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
}

function openUserMods(idx) {
  editUsrIdx = idx;
  const u = USERS[idx];
  document.getElementById('m-usr-ttl').textContent = 'Módulos de ' + u.user;
  document.getElementById('m-usr-body').innerHTML =
    `<div style="font-size:12px;color:var(--text2);margin-bottom:.75rem">Tildá los módulos a los que tendrá acceso este usuario.</div>` +
    ALL_PAGES.filter(p => p !== 'usuarios' || u.role === 'Admin Console').map(p => {
      const on = u.pages.includes(p);
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
        <button class="chkbtn ${on ? 'on' : ''}" id="umod-${p}" onclick="toggleUmod('${p}')">${on ? '✓' : ''}</button>
        <span style="font-size:13px">${PAGE_ICONS[p]} ${PAGE_LABELS[p]}</span>
      </div>`;
    }).join('');
  document.getElementById('m-usr').style.display = 'flex';
}

function toggleUmod(p) {
  const btn = document.getElementById('umod-' + p);
  const on  = btn.classList.toggle('on');
  btn.textContent = on ? '✓' : '';
}

function saveUserMods() {
  const u = USERS[editUsrIdx];
  u.pages = ALL_PAGES.filter(p => {
    const btn = document.getElementById('umod-' + p);
    return btn?.classList.contains('on');
  });
  // Ensure perfil is always included
  if (!u.pages.includes('perfil')) u.pages.push('perfil');
  if (window._fbOK) window.fbSave.users?.();
  document.getElementById('m-usr').style.display = 'none';
  renderPage('usuarios');
}

function delUser(i) {
  if (!confirm(`¿Eliminar usuario ${USERS[i].user}?\n\nNota: se eliminará de la app pero su cuenta de Firebase Auth sigue activa hasta que la borres manualmente en Firebase Console.`)) return;
  USERS.splice(i, 1);
  if (window._fbOK) window.fbSave.users?.();
  renderPage('usuarios');
}
