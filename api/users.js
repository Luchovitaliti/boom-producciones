// ═══ /api/users — Admin user management (create, update, delete) ═══
const { auth, db, _initError } = require('./_admin');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function verifyAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = await auth.verifyIdToken(token);

  // Try by doc ID = uid first
  let userDoc = await db.collection('users').doc(decoded.uid).get();

  // Fallback: query by email (covers cases where doc ID ≠ Auth UID)
  if (!userDoc.exists) {
    const snap = await db.collection('users')
      .where('email', '==', decoded.email)
      .where('active', '==', true)
      .limit(1)
      .get();
    if (!snap.empty) userDoc = snap.docs[0];
  }

  if (!userDoc || !userDoc.exists || userDoc.data().role !== 'Admin Console') {
    throw new Error('Unauthorized: admin role required');
  }
  return decoded;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (_initError) {
    return res.status(500).json({ error: 'Firebase Admin no inicializado: ' + _initError.message });
  }

  const { action, ...payload } = req.body;

  // Public action — no auth required
  if (action === 'checkEmailForRecovery') {
    return await checkEmailForRecovery(req, res, payload);
  }

  // All other actions require admin
  try {
    const caller = await verifyAdmin(req);

    switch (action) {
      case 'create': return await createUser(req, res, payload, caller);
      case 'resetPassword': return await resetPassword(req, res, payload);
      case 'delete': return await deleteUser(req, res, payload, caller);
      case 'updateEmail': return await updateEmail(req, res, payload);
      case 'updateUser': return await updateUser(req, res, payload, caller);
      case 'cleanOrphans': return await cleanOrphans(req, res);
      default: return res.status(400).json({ error: 'Unknown action: ' + action });
    }
  } catch (e) {
    console.error('API /users error:', e.message);
    const status = e.message.includes('Unauthorized') ? 403 : 400;
    return res.status(status).json({ error: e.message });
  }
};

async function createUser(req, res, { username, email, password, role, chatName, pages }, caller) {
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check username uniqueness in Firestore
  const existing = await db.collection('users').where('username', '==', username.toUpperCase()).get();
  if (!existing.empty) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Check email uniqueness
  try {
    await auth.getUserByEmail(email);
    return res.status(400).json({ error: 'Email already registered in Firebase Auth' });
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
  }

  // Create Firebase Auth user
  const fbUser = await auth.createUser({
    email: email.toLowerCase(),
    password,
    displayName: chatName || username,
  });

  // Create Firestore user document
  const now = new Date().toISOString();
  const userData = {
    uid: fbUser.uid,
    username: username.toUpperCase(),
    email: email.toLowerCase(),
    role: role || 'Otro',
    active: true,
    chatName: chatName || username,
    displayName: chatName || username,
    photo: '',
    photoURL: '',
    bio: '',
    instagram: '',
    telefono: '',
    pages: pages || ['boom', 'chat', 'perfil'],
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

async function deleteUser(req, res, { uid }, caller) {
  if (!uid) return res.status(400).json({ error: 'uid is required' });
  if (uid === caller.uid) return res.status(400).json({ error: 'Cannot delete yourself' });
  // Delete from Auth
  try {
    await auth.deleteUser(uid);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
  }
  // Mark as inactive in Firestore (soft delete)
  await db.collection('users').doc(uid).update({ active: false, updatedAt: new Date().toISOString() });
  return res.status(200).json({ ok: true });
}

async function cleanOrphans(req, res) {
  const snap = await db.collection('users').where('active', '==', true).get();
  let cleaned = 0;
  const details = [];

  for (const doc of snap.docs) {
    const uid = doc.id;
    try {
      await auth.getUser(uid);
      // User exists in Auth — nothing to do
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        await db.collection('users').doc(uid).update({
          active: false,
          updatedAt: new Date().toISOString(),
          _deactivatedReason: 'orphan-cleanup',
        });
        cleaned++;
        details.push({ uid, username: doc.data().username || '' });
      }
      // Other errors: skip silently
    }
  }

  return res.status(200).json({ ok: true, cleaned, details });
}

async function checkEmailForRecovery(req, res, { email }) {
  if (!email) return res.status(400).json({ error: 'email is required' });
  const snap = await db.collection('users')
    .where('email', '==', email.toLowerCase())
    .where('active', '==', true)
    .limit(1)
    .get();
  return res.status(200).json({ exists: !snap.empty });
}

async function updateUser(req, res, { uid, chatName, role, pages, username }, caller) {
  if (!uid) return res.status(400).json({ error: 'uid is required' });

  // Prevent non-admins from setting Admin Console role
  const targetDoc = await db.collection('users').doc(uid).get();
  if (!targetDoc.exists) return res.status(404).json({ error: 'User not found' });

  // Only existing admins can grant/keep Admin Console role
  const targetData = targetDoc.data();
  if (role === 'Admin Console' && targetData.role !== 'Admin Console') {
    // Verify caller is truly admin (already verified by verifyAdmin, but double-check)
    const callerDoc = await db.collection('users').doc(caller.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'Admin Console') {
      return res.status(403).json({ error: 'Only admins can assign Admin Console role' });
    }
  }

  const update = { updatedAt: new Date().toISOString() };
  if (chatName !== undefined) { update.chatName = chatName; update.displayName = chatName; }
  if (role !== undefined) update.role = role;
  if (pages !== undefined) update.pages = pages;
  if (username !== undefined) update.username = username.toUpperCase();

  await db.collection('users').doc(uid).update(update);
  return res.status(200).json({ ok: true });
}

async function updateEmail(req, res, { uid, newEmail }) {
  if (!uid || !newEmail) return res.status(400).json({ error: 'uid and newEmail are required' });
  await auth.updateUser(uid, { email: newEmail.toLowerCase() });
  await db.collection('users').doc(uid).update({ email: newEmail.toLowerCase(), updatedAt: new Date().toISOString() });
  return res.status(200).json({ ok: true });
}
