// server/firebaseAdmin.ts
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, 'firebase-service-account.json');

// Solution temporaire : initialiser seulement si le fichier existe
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
    console.log('[FirebaseAdmin] Firebase Admin initialisé avec succès');
  }
} else {
  console.warn('[FirebaseAdmin] Fichier service account non trouvé. Firebase désactivé.');
}

export default admin;