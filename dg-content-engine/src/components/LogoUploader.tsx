'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Uploads a logo straight to Supabase storage and keeps the resulting public
 * URL in a hidden field, so the surrounding form saves it like any other value.
 */
export function LogoUploader({ clientId, initialUrl }: { clientId: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `logos/${clientId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true });

    if (upErr) {
      setError('Upload failed. Check the file is an image under 5 MB.');
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    setUrl(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name="logo_url" value={url} />
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-line bg-[#141414] text-xs text-ink-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : 'No logo'}
      </span>
      <div className="space-y-1.5">
        <label className="dg-btn-ghost cursor-pointer text-xs">
          {busy ? 'Uploading…' : url ? 'Replace logo' : 'Upload logo'}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
        </label>
        {url && (
          <button type="button" onClick={() => setUrl('')} className="block text-xs text-ink-muted hover:text-gold">
            Remove logo
          </button>
        )}
        {error && <p className="text-xs text-[#E58C8C]">{error}</p>}
      </div>
    </div>
  );
}
