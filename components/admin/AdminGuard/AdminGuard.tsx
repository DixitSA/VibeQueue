'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AdminGuardProps {
  /** Venue this dashboard instance manages — must appear in the signed-in
   *  user's admins/{uid}.venueIds allowlist for them to see the dashboard. */
  venueId: string;
  children: React.ReactNode;
}

export default function AdminGuard({ venueId, children }: AdminGuardProps) {
  const [user, setUser]             = useState<User | null>(null);
  const [checkingAuth, setChecking] = useState(true);
  // Result of the admins/{uid} allowlist check, tagged with the uid it was
  // computed for — lets us derive "still checking" without ever needing to
  // set a loading flag synchronously inside the effect body below.
  const [authCheck, setAuthCheck] = useState<{ uid: string; authorized: boolean } | null>(null);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsubscribe;
  }, []);

  // Once a user is signed in (which — per hooks/useAuth.ts — includes every
  // anonymous patron on the public pages, since they share the same Firebase
  // Auth instance) verify they're actually an admin for THIS venue via the
  // client-readable admins/{uid} allowlist doc (firestore.rules only allows
  // a user to read their own admins/{uid} doc). Without this, `if (user)`
  // alone would let any patron who's visited the public site see the
  // dashboard shell.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDoc(doc(db, 'admins', user.uid))
      .then((snap) => {
        if (cancelled) return;
        const venueIds = (snap.data()?.venueIds ?? []) as string[];
        const authorized = snap.exists() && Array.isArray(venueIds) && venueIds.includes(venueId);
        setAuthCheck({ uid: user.uid, authorized });
      })
      .catch(() => {
        if (!cancelled) setAuthCheck({ uid: user.uid, authorized: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user, venueId]);

  const isAuthorized          = !!user && authCheck?.uid === user.uid && authCheck.authorized;
  const checkingAuthorization = !!user && authCheck?.uid !== user.uid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Invalid email or password.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Still resolving initial auth state, or checking the admin allowlist —
  // avoid a flash of the sign-in form or the dashboard.
  if (checkingAuth || (user && checkingAuthorization)) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
        <svg className="w-6 h-6 text-cream/20 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (user && isAuthorized) return <>{children}</>;

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-cream font-display text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-cream/30 text-xs uppercase tracking-widest mt-2 font-bold">Secure Access Required</p>
        </div>

        {user && !isAuthorized && (
          <p className="text-red-500 text-[10px] uppercase tracking-widest font-bold text-center mb-4 animate-in fade-in slide-in-from-top-1">
            Not authorized for this venue. Sign in with an admin account.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
            autoComplete="username"
            className="
              w-full bg-cream/[0.03] border-2 rounded-xl px-6 py-4
              text-cream text-center font-display
              outline-none transition-all duration-300
              border-cream/10 focus:border-emerald/50
            "
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className={`
              w-full bg-cream/[0.03] border-2 rounded-xl px-6 py-4
              text-cream text-center font-display
              outline-none transition-all duration-300
              ${error ? 'border-red-500/50 shake' : 'border-cream/10 focus:border-emerald/50'}
            `}
          />
          {error && (
            <p className="text-red-500 text-[10px] uppercase tracking-widest font-bold text-center animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cream text-charcoal font-display font-bold py-4 rounded-xl hover:bg-emerald hover:text-white transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <p className="text-cream/10 text-[9px] uppercase tracking-[0.2em] text-center mt-12 font-bold">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
