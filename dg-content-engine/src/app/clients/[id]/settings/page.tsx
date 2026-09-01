import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateClientAction } from '../../actions';
import { LogoUploader } from '@/components/LogoUploader';
import { DeleteClientForm } from '@/components/DeleteClientForm';
import { SaveButton } from '@/components/SaveButton';
import type { Client } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ClientSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('*').eq('id', id).single();
  if (!data) notFound();
  const c = data as Client;

  return (
    <div className="space-y-5">
      <form action={updateClientAction} className="dg-card max-w-2xl space-y-5 p-5 sm:p-6">
        <input type="hidden" name="id" value={c.id} />
        <h2 className="text-lg font-semibold">Client details</h2>

        <LogoUploader clientId={c.id} initialUrl={c.logo_url} />

        <div className="space-y-1.5">
          <label className="dg-label" htmlFor="name">Client name</label>
          <input id="name" name="name" required defaultValue={c.name} className="dg-input" />
        </div>

        <div className="space-y-1.5">
          <label className="dg-label" htmlFor="website_url">Website</label>
          <input id="website_url" name="website_url" defaultValue={c.website_url ?? ''} className="dg-input" placeholder="https://…" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {([
            ['linkedin', 'LinkedIn'],
            ['instagram', 'Instagram'],
            ['tiktok', 'TikTok'],
          ] as const).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <label className="dg-label" htmlFor={key}>{label}</label>
              <input id={key} name={key} defaultValue={c.socials?.[key] ?? ''} className="dg-input" placeholder="@handle or link" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {([
            ['brand_primary', 'Brand colour 1', c.brand_primary],
            ['brand_secondary', 'Brand colour 2', c.brand_secondary],
            ['calendar_color', 'Calendar colour', c.calendar_color],
          ] as const).map(([key, label, val]) => (
            <div key={key} className="space-y-1.5">
              <label className="dg-label" htmlFor={key}>{label}</label>
              <input id={key} name={key} type="color" defaultValue={val}
                className="h-11 w-full cursor-pointer rounded-xl border border-ink-line bg-[#141414] p-1" />
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          Calendar colour is how this client is colour-coded on the dashboard calendar.
        </p>

        <SaveButton label="Save details" />
      </form>

      <div className="dg-card flex max-w-2xl flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium text-white">Danger zone</p>
          <p className="text-xs text-ink-muted">Removing a client deletes all of their content too.</p>
        </div>
        <DeleteClientForm id={c.id} name={c.name} />
      </div>
    </div>
  );
}
