// ═══ Firebase Admin SDK — shared initializer for all API routes ═══
const admin = require('firebase-admin');

let _initError = null;

if (!admin.apps.length) {
  try {
    const cred = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!cred) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var not set. Add it in Vercel → Settings → Environment Variables.');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(cred)),
    });
  } catch (e) {
    _initError = e;
  }
}

const auth = _initError ? null : admin.auth();
const db   = _initError ? null : admin.firestore();

module.exports = { admin, auth, db, _initError };
