// ═══ /api/users — Admin user management (create, update, delete) ═══
const { auth, db } = require('./_admin');
const ALLOWED_ROLES = new Set(['Barra', 'Públicas', 'CM', 'Administración', 'Producción', 'Fotografía', 'Trafic', 'Otro', 'Admin Console']);
const ALLOWED_PAGES = new Set(['dashboard', 'barra', 'recaudacion', 'cm', 'chat', 'boom', 'publicas', 'usuarios', 'perfil', 'kpi', 'dev', 'trafic', 'proveedores', 'liderpub', 'adminfin']);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function verifyAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = await auth.verifyIdToken(token);
  // Check caller is admin in Firestore
  const userDoc = await db.collection('users').doc(decoded.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'Admin Console') {
    throw new Error('Unauthorized: admin role required');
  }
  return decoded;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, ...payload } = req.body;
    if (action === 'checkEmail') return await checkEmail(res, payload);

    const caller = await verifyAdmin(req);

    switch (action) {
      case 'create': return await createUser(req, res, payload, caller);
      case 'resetPassword': return await resetPassword(req, res, payload);
      case 'delete': return await deleteUser(req, res, payload);
      case 'updateUser': return await updateUser(req, res, payload);
      default: return res.status(400).json({ error: 'Unknown action: ' + action });
    }
  } catch (e) {
    console.error('API /users error:', e.message);
    const status = e.message.includes('Unauthorized') ? 403 : 400;
    return res.status(status).json({ error: e.message });
  }
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || '').trim().toUpperCase();
}

function sanitizePages(pages) {
  const inPages = Array.isArray(pages) ? pages : [];
  const out = [];
  inPages.forEach((p) => {
    if (typeof p !== 'string') return;
    const key = p.trim();
    if (!ALLOWED_PAGES.has(key)) return;
    if (!out.includes(key)) out.push(key);
  });
  if (!out.includes('perfil')) out.push('perfil');
  return out;
}

function validateRole(role) {
  if (!ALLOWED_ROLES.has(role)) throw new Error('Rol inválido');
  return role;
}

async function assertUniqueUsername(username, excludeUid = null) {
  const snap = await db.collection('users').where('username', '==', username).get();
  const conflict = snap.docs.find((d) => d.id !== excludeUid);
  if (conflict) throw new Error('Username already exists');
}

async function assertUniqueEmail(email, excludeUid = null) {
  const snap = await db.collection('users').where('email', '==', email).get();
  const conflict = snap.docs.find((d) => d.id !== excludeUid);
  if (conflict) throw new Error('Email already exists');
}

async function createUser(req, res, { username, email, password, role, chatName, pages }, caller) {
  const cleanUsername = normalizeUsername(username);
  const cleanEmail = normalizeEmail(email);
  const cleanPages = sanitizePages(pages);
  const cleanRole = validateRole(role || 'Otro');
  const cleanChatName = String(chatName || cleanUsername).trim();

  if (!cleanUsername || !cleanEmail || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  await assertUniqueUsername(cleanUsername);
  await assertUniqueEmail(cleanEmail);

  // Check email uniqueness
  try {
    await auth.getUserByEmail(cleanEmail);
    return res.status(400).json({ error: 'Email already registered in Firebase Auth' });
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
  }

  // Create Firebase Auth user
  const fbUser = await auth.createUser({
    email: cleanEmail,
    password,
    displayName: cleanChatName,
  });

  // Create Firestore user document
  const now = new Date().toISOString();
  const userData = {
    uid: fbUser.uid,
    username: cleanUsername,
    email: cleanEmail,
    role: cleanRole,
    active: true,
    chatName: cleanChatName,
    displayName: cleanChatName,
    photo: '',
    photoURL: '',
    bio: '',
    instagram: '',
    telefono: '',
    pages: cleanPages.length ? cleanPages : ['boom', 'chat', 'perfil'],
    createdAt: now,
    updatedAt: now,
    createdBy: caller.uid,
  };
  await db.collection('users').doc(fbUser.uid).set(userData);

  return res.status(200).json({ ok: true, uid: fbUser.uid, user: userData });
}

async function resetPassword(req, res, { uid, newPassword }) {
  if (!uid || !newPassword) {
    return res.status(400).json({ error: 'uid and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  await auth.updateUser(uid, { password: newPassword });
  return res.status(200).json({ ok: true });
}

async function deleteUser(req, res, { uid }) {
  if (!uid) return res.status(400).json({ error: 'uid is required' });
  // Delete from Auth
  try {
    await auth.deleteUser(uid);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
  }
  // Mark as inactive in Firestore (soft delete)
  await db.collection('users').doc(uid).set({
    active: false,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  return res.status(200).json({ ok: true });
}

async function updateUser(req, res, { uid, username, email, displayName, role, pages, chatName, active }) {
  if (!uid) return res.status(400).json({ error: 'uid is required' });
  const docRef = db.collection('users').doc(uid);
  const snap = await docRef.get();
  if (!snap.exists) return res.status(404).json({ error: 'User profile not found' });

  const updates = { updatedAt: new Date().toISOString() };
  const authUpdates = {};

  if (typeof username !== 'undefined') {
    const cleanUsername = normalizeUsername(username);
    if (!cleanUsername) return res.status(400).json({ error: 'username is required' });
    await assertUniqueUsername(cleanUsername, uid);
    updates.username = cleanUsername;
  }

  if (typeof email !== 'undefined') {
    const cleanEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    await assertUniqueEmail(cleanEmail, uid);
    try {
      const existingAuthUser = await auth.getUserByEmail(cleanEmail);
      if (existingAuthUser.uid !== uid) return res.status(400).json({ error: 'Email already exists' });
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }
    updates.email = cleanEmail;
    authUpdates.email = cleanEmail;
  }

  if (typeof role !== 'undefined') updates.role = validateRole(role);
  if (typeof pages !== 'undefined') updates.pages = sanitizePages(pages);
  if (typeof chatName !== 'undefined') updates.chatName = String(chatName || '').trim();
  if (typeof displayName !== 'undefined') updates.displayName = String(displayName || '').trim();
  if (typeof active !== 'undefined') updates.active = !!active;

  if (typeof updates.displayName !== 'undefined') authUpdates.displayName = updates.displayName;
  else if (typeof updates.chatName !== 'undefined') authUpdates.displayName = updates.chatName;

  if (Object.keys(authUpdates).length > 0) {
    await auth.updateUser(uid, authUpdates);
  }

  await docRef.set(updates, { merge: true });
  return res.status(200).json({ ok: true });
}

async function checkEmail(res, { email }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const snap = await db.collection('users')
    .where('email', '==', cleanEmail)
    .where('active', '==', true)
    .limit(1)
    .get();
  return res.status(200).json({ ok: true, exists: !snap.empty });
}
