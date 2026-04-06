// ═══ Firebase Admin SDK — shared initializer for all API routes ═══
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const cred = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!cred) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var not set');

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(cred)),
  });
}

const auth = admin.auth();
const db   = admin.firestore();

module.exports = { admin, auth, db };
