// ═══════════════════════════════════════════════════════════
// PERFIL DE USUARIO
// ═══════════════════════════════════════════════════════════
function pgPerfil(){
  return`<div class="ptitle">👤 Mi perfil</div><div class="psub">Tus datos personales y configuración</div>
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
function initPerfil(){
  const u=CU;
  const col=AVC[USERS.indexOf(u)%8];
  const el=document.getElementById('prof-av-preview');
  if(u.photo){el.innerHTML=`<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">`;}
  else{el.textContent=ini(u.chatName);el.style.color=col;}
  document.getElementById('prof-display-name').textContent=u.chatName;
  document.getElementById('prof-display-role').textContent=u.role+' · '+u.user;
  document.getElementById('prof-display-bio').textContent=u.bio||'Sin bio todavía.';
  document.getElementById('prof-chatname').value=u.chatName;
  document.getElementById('prof-ig').value=u.instagram||'';
  document.getElementById('prof-tel').value=u.telefono||'';
  document.getElementById('prof-bio').value=u.bio||'';
  document.getElementById('prof-mods').innerHTML=u.pages.filter(p=>p!=='perfil').map(p=>`<span class="mod-tag">${PAGE_ICONS[p]} ${PAGE_LABELS[p]||p}</span>`).join('');
}
function handlePhotoUpload(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    CU.photo=e.target.result;
    const idx=USERS.findIndex(u=>u.user===CU.user);
    if(idx!==-1) USERS[idx].photo=e.target.result;
    const el=document.getElementById('prof-av-preview');
    if(el)el.innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
    updateTopbarAvatar();
    document.getElementById('prof-msg').innerHTML='<span style="color:var(--accent)">Foto lista — hacé clic en Guardar cambios.</span>';
  };
  reader.readAsDataURL(file);
}
function saveProfile(){
  const cn=document.getElementById('prof-chatname').value.trim();
  if(!cn){document.getElementById('prof-msg').innerHTML='<span style="color:var(--red)">El nombre no puede estar vacío.</span>';return;}
  CU.chatName=cn;
  CU.instagram=document.getElementById('prof-ig').value.trim();
  CU.telefono=document.getElementById('prof-tel').value.trim();
  CU.bio=document.getElementById('prof-bio').value.trim();
  // Sync CU back into USERS array (puede estar desincronizado tras fbLoad)
  const idx=USERS.findIndex(u=>u.user===CU.user);
  if(idx!==-1){
    USERS[idx].chatName=CU.chatName;
    USERS[idx].instagram=CU.instagram;
    USERS[idx].telefono=CU.telefono;
    USERS[idx].bio=CU.bio;
    USERS[idx].photo=CU.photo;
  }
  document.getElementById('prof-display-name').textContent=cn;
  document.getElementById('prof-display-bio').textContent=CU.bio||'Sin bio todavía.';
  updateTopbarAvatar();
  document.getElementById('prof-msg').innerHTML='<span style="color:var(--green)">Perfil guardado correctamente.</span>';
  if(window._fbOK)window.fbSave.users?.();
}
async function savePassword(){
  const old=document.getElementById('prof-pass-old').value;
  const nw=document.getElementById('prof-pass-new').value;
  const conf=document.getElementById('prof-pass-conf').value;
  const msg=document.getElementById('prof-pass-msg');
  if(!nw||nw.length<6){msg.innerHTML='<span style="color:var(--red)">La nueva contraseña debe tener al menos 6 caracteres.</span>';return;}
  if(nw!==conf){msg.innerHTML='<span style="color:var(--red)">Las contraseñas no coinciden.</span>';return;}
  try{
    const user=firebase.auth().currentUser;
    const cred=firebase.auth.EmailAuthProvider.credential(user.email,old);
    await user.reauthenticateWithCredential(cred);
    await user.updatePassword(nw);
    // Sync _pass en Firestore para que admin pueda resetear si hace falta
    const idx=USERS.findIndex(u=>u.user===CU.user);
    if(idx!==-1){ USERS[idx]._pass=nw; CU._pass=nw; if(window._fbOK)window.fbSave.users?.(); }
    msg.innerHTML='<span style="color:var(--green)">Contraseña actualizada correctamente.</span>';
    ['prof-pass-old','prof-pass-new','prof-pass-conf'].forEach(id=>document.getElementById(id).value='');
  }catch(e){
    msg.innerHTML='<span style="color:var(--red)">Contraseña actual incorrecta o sesión expirada.</span>';
  }
}
