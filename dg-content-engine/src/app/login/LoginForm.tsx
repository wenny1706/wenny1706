'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError('That email or password did not work. Please try again.');
      setBusy(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="dg-card space-y-4 p-6">
      <div className="space-y-1.5">
        <label className="dg-label" htmlFor="email">Email</label>
        <input
          id="email" type="email" required autoComplete="email" className="dg-input"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@digitalgeekz.com"
        />
      </div>
      <div className="space-y-1.5">
        <label className="dg-label" htmlFor="password">Password</label>
        <input
          id="password" type="password" required autoComplete="current-password" className="dg-input"
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-[#4A2020] bg-[#1E1414] px-3 py-2 text-sm text-[#E58C8C]">
          {error}
        </p>
      )}
      <button type="submit" className="dg-btn-primary w-full" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
