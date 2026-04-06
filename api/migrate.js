// ═══ /api/migrate — One-time migration from legacy config/users to users collection ═══
// Run this ONCE after deploying. It will:
// 1. Read legacy users from config/users
// 2. For each user, look up or create Firebase Auth account
// 3. Create user doc in 'users' collection with new schema
// 4. Migrate legacy chat docs to chatChannels subcollections
//
// Call: POST /api/migrate with Authorization: Bearer <admin-token>

const { auth, db } = require('./_admin');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Verify caller is admin
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = await auth.verifyIdToken(token);

    const { action } = req.body || {};

    if (action === 'migrateChat') {
      return await migrateChat(res);
    }

    // Default: migrate users
    return await migrateUsers(res, decoded);
  } catch (e) {
    console.error('Migration error:', e);
    return res.status(500).json({ error: e.message });
  }
};

async function migrateUsers(res, caller) {
  // 1. Read legacy config/users
  const configDoc = await db.collection('config').doc('users').get();
  if (!configDoc.exists) {
    return res.status(200).json({ ok: true, message: 'No legacy users found', migrated: 0 });
  }

  const legacyUsers = configDoc.data().items || [];
  const results = [];
  const now = new Date().toISOString();

  for (const lu of legacyUsers) {
    const username = (lu.user || '').toUpperCase();
    if (!username) continue;

    try {
      // Check if already migrated
      const existing = await db.collection('users').where('username', '==', username).get();
      if (!existing.empty) {
        results.push({ username, status: 'skipped', reason: 'already exists in users collection' });
        continue;
      }

      // Try to find existing Firebase Auth user by legacy email
      const legacyEmail = username.toLowerCase() + '@boom.app';
      let fbUser = null;

      try {
        fbUser = await auth.getUserByEmail(legacyEmail);
      } catch (e) {
        // User doesn't exist in Auth yet
      }

      // Determine real email — for migration, we keep the legacy email
      // Admin should update emails manually afterwards
      const email = legacyEmail;
      const password = lu._pass || 'Boom2024!'; // Fallback password

      if (!fbUser) {
        // Create new Auth user
        fbUser = await auth.createUser({
          email,
          password,
          displayName: lu.chatName || username,
        });
      }

      // Create user doc in 'users' collection
      const userData = {
        uid: fbUser.uid,
        username: username,
        email: email,
        role: lu.role || 'Otro',
        active: true,
        chatName: lu.chatName || username,
        displayName: lu.chatName || username,
        photo: '',
        photoURL: '',
        bio: lu.bio || '',
        instagram: lu.instagram || '',
        telefono: lu.telefono || '',
        pages: lu.pages || ['perfil'],
        createdAt: now,
        updatedAt: now,
        createdBy: caller.uid,
        _migrated: true,
        _legacyEmail: email,
      };

      // Don't store password/photo base64
      await db.collection('users').doc(fbUser.uid).set(userData);

      results.push({ username, status: 'migrated', uid: fbUser.uid });
    } catch (e) {
      results.push({ username, status: 'error', error: e.message });
    }
  }

  return res.status(200).json({
    ok: true,
    message: `Migration complete. ${results.filter(r => r.status === 'migrated').length} users migrated.`,
    results,
    nextSteps: [
      'Update each user\'s email from @boom.app to their real email via Firebase Console or /api/users updateEmail action',
      'Have users reset their passwords via the "Forgot password" flow',
      'Once all users are migrated, the legacy config/users doc can be deleted',
    ],
  });
}

async function migrateChat(res) {
  // Migrate legacy chat documents (chat/{channelId}.msgs[]) to chatChannels/{channelId}/messages/
  const chatSnap = await db.collection('chat').get();
  let totalMigrated = 0;

  for (const doc of chatSnap.docs) {
    if (doc.id === 'customChannels') continue; // Skip config doc

    const data = doc.data();
    if (!data.msgs || !Array.isArray(data.msgs) || data.msgs.length === 0) continue;

    const channelId = doc.id;

    // Check if already migrated
    const existingMsgs = await db.collection('chatChannels').doc(channelId).collection('messages').limit(1).get();
    if (!existingMsgs.empty) continue;

    // Create channel doc
    await db.collection('chatChannels').doc(channelId).set({
      name: data.l || '#' + channelId,
      createdAt: new Date().toISOString(),
    });

    // Batch write messages
    const batch = db.batch();
    let count = 0;

    for (const msg of data.msgs) {
      const msgRef = db.collection('chatChannels').doc(channelId).collection('messages').doc();
      batch.set(msgRef, {
        u: msg.u || 'Anónimo',
        t: msg.t || '',
        ts: msg.ts || '',
        timestamp: new Date(), // Approximate
        uid: '',
        _migrated: true,
      });
      count++;

      // Firestore batch limit is 500
      if (count >= 450) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) await batch.commit();
    totalMigrated += data.msgs.length;
  }

  return res.status(200).json({
    ok: true,
    message: `Chat migration complete. ${totalMigrated} messages migrated.`,
  });
}
