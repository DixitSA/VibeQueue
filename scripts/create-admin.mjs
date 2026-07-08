#!/usr/bin/env node
// ─── create-admin.mjs ─────────────────────────────────────────────────────
// One-off operator tool: creates a Firebase Auth user (email/password) and
// writes their `admins/{uid}` Firestore allowlist doc so they can sign in to
// the /admin Command Center for the given venue(s).
//
// This script uses the Firebase Admin SDK and the SAME service-account env
// vars already used by lib/firebaseAdmin.ts:
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY
//
// Make sure these are set in your shell (e.g. by loading .env.local) before
// running this script. It talks directly to your live Firebase project.
//
// ── Usage ──────────────────────────────────────────────────────────────────
//
//   node scripts/create-admin.mjs --email owner@venue.com --password 'S3cret!' --venues demo-taproom
//
//   Flags:
//     --email     Admin's sign-in email (required)
//     --password  Admin's sign-in password (required, Firebase requires >= 6 chars)
//     --venues    Comma-separated list of venue IDs this admin manages (required)
//                 e.g. --venues demo-taproom,other-venue
//
//   Env var fallbacks (used if the matching flag is omitted):
//     ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_VENUE_IDS (comma-separated)
//
// If a Firebase Auth user with that email already exists, this script will
// reuse it (rather than failing) and just (re)write the admins/{uid} doc —
// so it's also safe to use to add/change venue access for an existing admin.
//
// ── Example ──────────────────────────────────────────────────────────────
//
//   node scripts/create-admin.mjs \
//     --email owner@vibequeue.app \
//     --password "correct-horse-battery-staple" \
//     --venues demo-taproom
//
// ─────────────────────────────────────────────────────────────────────────

import admin from 'firebase-admin';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const email = args.email || process.env.ADMIN_EMAIL;
  const password = args.password || process.env.ADMIN_PASSWORD;
  const venuesRaw = args.venues || process.env.ADMIN_VENUE_IDS;

  if (!email || !password || !venuesRaw) {
    console.error(
      '[create-admin] Missing required input.\n\n' +
      'Usage:\n' +
      '  node scripts/create-admin.mjs --email <email> --password <password> --venues <venueId1,venueId2>\n\n' +
      'Or set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_VENUE_IDS env vars.',
    );
    process.exit(1);
  }

  const venueIds = venuesRaw.split(',').map((v) => v.trim()).filter(Boolean);
  if (venueIds.length === 0) {
    console.error('[create-admin] --venues must contain at least one venue ID.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`[create-admin] Found existing Firebase Auth user for ${email} (uid: ${uid}). Reusing it.`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    const created = await auth.createUser({ email, password });
    uid = created.uid;
    console.log(`[create-admin] Created new Firebase Auth user for ${email} (uid: ${uid}).`);
  }

  // Union with any venueIds the admin already has, rather than overwriting —
  // re-running this script to grant a new venue must not silently revoke
  // previously granted ones.
  const existingDoc = await db.collection('admins').doc(uid).get();
  const existingVenueIds = (existingDoc.exists && Array.isArray(existingDoc.data()?.venueIds))
    ? existingDoc.data().venueIds
    : [];
  const mergedVenueIds = Array.from(new Set([...existingVenueIds, ...venueIds]));

  await db.collection('admins').doc(uid).set({ venueIds: mergedVenueIds }, { merge: true });
  console.log(`[create-admin] Wrote admins/${uid} = { venueIds: ${JSON.stringify(mergedVenueIds)} }`);
  console.log('[create-admin] Done. This user can now sign in at /admin for the listed venue(s).');
}

main().catch((err) => {
  console.error('[create-admin] Failed:', err);
  process.exit(1);
});
