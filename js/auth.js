// ═══ AUTH ═══
function showLoginErr(msg){
  const el=document.getElementById('l-err');
  el.textContent=msg||'Error al iniciar sesión';
  el.style.display='block';
}
async function doLogin(){
  const u=document.getElementById('l-user').value.trim().toUpperCase();
  const p=document.getElementById('l-pass').value.trim();
  document.getElementById('l-err').style.display='none';
  if(!u||!p){showLoginErr('Completá usuario y contraseña.');return;}
  const btn=document.querySelector('.lbtn');
  btn.textContent='Ingresando...';btn.disabled=true;
  try{
    if(typeof firebase==='undefined'||!firebase.auth){showLoginErr('Firebase no cargó. Recargá la página.');btn.textContent='Ingresar';btn.disabled=false;return;}
    await firebase.auth().signInWithEmailAndPassword(u.toLowerCase()+'@boom.app',p);
  }catch(e){
    console.error('Auth error:',e.code,e.message);
    const msgs={'auth/user-not-found':'Usuario no encontrado.','auth/wrong-password':'Contraseña incorrecta.','auth/invalid-email':'Email inválido.','auth/invalid-credential':'Usuario o contraseña incorrectos.','auth/too-many-requests':'Demasiados intentos. Esperá un momento.'};
    showLoginErr(msgs[e.code]||('Error: '+e.code));
    btn.textContent='Ingresar';btn.disabled=false;
  }
}
function doLogout(){
  // Limpiar UI inmediatamente, sin esperar a Firebase
  const mc=document.getElementById('mc'); if(mc) mc.innerHTML='';
  const sb=document.getElementById('sb'); if(sb) sb.innerHTML='';
  document.getElementById('boot-loader').style.display='flex';
  document.getElementById('app').style.display='none';
  if(typeof firebase!=='undefined'&&firebase.auth) firebase.auth().signOut();
}

// ═══ INIT ═══
document.getElementById('l-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
