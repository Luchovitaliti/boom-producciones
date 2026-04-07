// ═══ /api/bootstrap — One-time: creates admin doc in Firestore keyed by Auth UID ═══
// Call once from browser console after login:
//   const token = await window.fbGetToken();
//   const r = await fetch('/api/bootstrap', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:'{}' });
//   console.log(await r.json());

const { auth, db, _initError } = require('./_admin');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (_initError) return res.status(500).json({ error: _initError.message });

  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email;

    // Check if doc already exists with this UID
    const existing = await db.collection('users').doc(uid).get();
    if (existing.exists) {
      return res.status(200).json({ ok: true, status: 'already_exists', uid, role: existing.data().role });
    }

    // Check if there's a doc with matching email but wrong ID
    const byEmail = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!byEmail.empty) {
      const oldDoc = byEmail.docs[0];
      const oldData = oldDoc.data();
      // Copy to correct ID and delete old
      await db.collection('users').doc(uid).set({ ...oldData, uid });
      await db.collection('users').doc(oldDoc.id).delete();
      return res.status(200).json({ ok: true, status: 'fixed', uid, oldDocId: oldDoc.id, role: oldData.role });
    }

    // No doc at all — create fresh admin doc
    const now = new Date().toISOString();
    await db.collection('users').doc(uid).set({
      uid,
      username: 'ADMIN',
      email: email,
      role: 'Admin Console',
      active: true,
      chatName: 'Administrador',
      displayName: 'Administrador',
      photo: '', photoURL: '', bio: '', instagram: '', telefono: '',
      pages: ['dashboard','barra','adminfin','recaudacion','liderpub','publicas','trafic','cm','boom','chat','proveedores','kpi','dev','usuarios','perfil'],
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
    });
    return res.status(200).json({ ok: true, status: 'created', uid });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
