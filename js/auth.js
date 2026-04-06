// ═══ AUTH ═══

function showLoginErr(msg) {
  const el = document.getElementById('l-err');
  el.textContent = msg || 'Error al iniciar sesión';
  el.style.display = 'block';
}

async function doLogin() {
  const input = document.getElementById('l-user').value.trim();
  const p = document.getElementById('l-pass').value.trim();
  document.getElementById('l-err').style.display = 'none';
  if (!input || !p) { showLoginErr('Completá email y contraseña.'); return; }

  const btn = document.querySelector('.lbtn');
  btn.textContent = 'Ingresando...'; btn.disabled = true;

  try {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      showLoginErr('Firebase no cargó. Recargá la página.');
      btn.textContent = 'Ingresar'; btn.disabled = false;
      return;
    }

    let email = input;

    // If input doesn't look like an email, treat as username and look up real email
    if (!input.includes('@')) {
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('username', '==', input.toUpperCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        showLoginErr('Usuario no encontrado.');
        btn.textContent = 'Ingresar'; btn.disabled = false;
        return;
      }
      email = snapshot.docs[0].data().email;
    }

    await firebase.auth().signInWithEmailAndPassword(email.toLowerCase(), p);
  } catch (e) {
    console.error('Auth error:', e.code, e.message);
    const msgs = {
      'auth/user-not-found': 'No hay una cuenta con ese email.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-email': 'Email inválido.',
      'auth/invalid-credential': 'Email o contraseña incorrectos.',
      'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.',
    };
    showLoginErr(msgs[e.code] || ('Error: ' + e.code));
    btn.textContent = 'Ingresar'; btn.disabled = false;
  }
}

// ═══ FORGOT PASSWORD ═══
function showForgotPassword() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('forgot-password').style.display = 'flex';
  document.getElementById('fp-err').style.display = 'none';
  document.getElementById('fp-ok').style.display = 'none';
  document.getElementById('fp-email').value = '';
}

function hideForgotPassword() {
  document.getElementById('forgot-password').style.display = 'none';
  document.getElementById('login').style.display = 'flex';
}

async function doForgotPassword() {
  const email = document.getElementById('fp-email').value.trim();
  const errEl = document.getElementById('fp-err');
  const okEl = document.getElementById('fp-ok');
  const btn = document.getElementById('fp-btn');

  errEl.style.display = 'none';
  okEl.style.display = 'none';

  if (!email || !email.includes('@')) {
    errEl.textContent = 'Ingresá un email válido.';
    errEl.style.display = 'block';
    return;
  }

  btn.textContent = 'Enviando...'; btn.disabled = true;

  try {
    await firebase.auth().sendPasswordResetEmail(email);
    okEl.textContent = 'Te enviamos un email para restablecer tu contraseña. Revisá tu bandeja de entrada.';
    okEl.style.display = 'block';
  } catch (e) {
    const msgs = {
      'auth/user-not-found': 'No hay una cuenta con ese email.',
      'auth/invalid-email': 'Email inválido.',
      'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.',
    };
    errEl.textContent = msgs[e.code] || ('Error: ' + e.code);
    errEl.style.display = 'block';
  } finally {
    btn.textContent = 'Enviar enlace'; btn.disabled = false;
  }
}

function doLogout() {
  const mc = document.getElementById('mc'); if (mc) mc.innerHTML = '';
  const sb = document.getElementById('sb'); if (sb) sb.innerHTML = '';
  document.getElementById('boot-loader').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  if (typeof firebase !== 'undefined' && firebase.auth) firebase.auth().signOut();
}

// ═══ INIT ═══
document.getElementById('l-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('l-user').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
