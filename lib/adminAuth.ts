// ─── Admin Auth Guard ──────────────────────────────────────────────────────
// Server-only helper used by every privileged Server Action to verify that
// the caller is a signed-in Firebase user AND is listed as an admin for the
// requested venue via the `admins/{uid}` Firestore allowlist.
//
// Doc shape: admins/{uid} = { venueIds: string[] }
// The array shape supports a single admin managing multiple venues.

import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * Verifies the given Firebase ID token and confirms the resulting user is an
 * admin for `venueId`. Throws if the token is invalid/expired or the user is
 * not authorized for that venue.
 *
 * @returns the verified user's uid.
 */
export async function requireAdmin(idToken: string, venueId: string): Promise<string> {
  if (!idToken) {
    throw new Error('[VibeQueue] Not authenticated: missing ID token.');
  }

  let uid: string;
  try {
    // checkRevoked ensures a disabled/revoked admin account is rejected
    // immediately, rather than accepting an already-issued token until it
    // naturally expires (up to ~1 hour).
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    uid = decoded.uid;
  } catch {
    throw new Error('[VibeQueue] Not authenticated: invalid, expired, or revoked ID token.');
  }

  const adminSnap = await adminDb.collection('admins').doc(uid).get();
  if (!adminSnap.exists) {
    throw new Error('[VibeQueue] Forbidden: user is not an admin.');
  }

  const venueIds = (adminSnap.data()?.venueIds ?? []) as string[];
  if (!Array.isArray(venueIds) || !venueIds.includes(venueId)) {
    throw new Error(`[VibeQueue] Forbidden: user is not an admin for venue "${venueId}".`);
  }

  return uid;
}
