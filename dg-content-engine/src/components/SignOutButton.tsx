'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="dg-btn-ghost !px-3 !py-1.5 text-xs"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.push('/login');
        router.refresh();
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
