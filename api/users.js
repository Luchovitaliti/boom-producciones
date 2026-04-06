// ═══ /api/users — Admin user management (create, update, delete) ═══
const { auth, db } = require('./_admin');

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
    const caller = await verifyAdmin(req);
    const { action, ...payload } = req.body;

    switch (action) {
      case 'create': return await createUser(req, res, payload, caller);
      case 'resetPassword': return await resetPassword(req, res, payload);
      case 'delete': return await deleteUser(req, res, payload);
      case 'updateEmail': return await updateEmail(req, res, payload);
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

async function deleteUser(req, res, { uid }) {
  if (!uid) return res.status(400).json({ error: 'uid is required' });
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

async function updateEmail(req, res, { uid, newEmail }) {
  if (!uid || !newEmail) return res.status(400).json({ error: 'uid and newEmail are required' });
  await auth.updateUser(uid, { email: newEmail.toLowerCase() });
  await db.collection('users').doc(uid).update({ email: newEmail.toLowerCase(), updatedAt: new Date().toISOString() });
  return res.status(200).json({ ok: true });
}
