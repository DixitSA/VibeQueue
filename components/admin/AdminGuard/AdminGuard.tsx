'use client';

import React, { useState, useEffect } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);

  // In a real app, you'd check this against a hashed PIN in Firestore
  // For this "Harden" phase, we use an env var check via a Server Action or just a simple check
  const CORRECT_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';

  useEffect(() => {
    const savedAuth = localStorage.getItem('vibequeue_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsAuthorized(true);
      localStorage.setItem('vibequeue_admin_auth', 'true');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  if (isAuthorized) return <>{children}</>;

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Access PIN"
              autoFocus
              className={`
                w-full bg-cream/[0.03] border-2 rounded-xl px-6 py-4
                text-cream text-center text-2xl tracking-[0.5em] font-display
                outline-none transition-all duration-300
                ${error ? 'border-red-500/50 shake' : 'border-cream/10 focus:border-emerald/50'}
              `}
            />
            {error && (
              <p className="text-red-500 text-[10px] uppercase tracking-widest font-bold text-center mt-3 animate-in fade-in slide-in-from-top-1">
                Invalid Access Pin
              </p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-cream text-charcoal font-display font-bold py-4 rounded-xl hover:bg-emerald hover:text-white transition-all duration-300 active:scale-[0.98]"
          >
            Unlock Dashboard
          </button>
        </form>

        <p className="text-cream/10 text-[9px] uppercase tracking-[0.2em] text-center mt-12 font-bold">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
