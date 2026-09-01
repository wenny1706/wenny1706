import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/PageHeading';
import { createClientAction } from '../actions';

export default function NewClientPage() {
  return (
    <AppShell>
      <PageHeading title="New client" subtitle="You can change any of this later." />
      <form action={createClientAction} className="dg-card max-w-2xl space-y-5 p-5 sm:p-6">
        <div className="space-y-1.5">
          <label className="dg-label" htmlFor="name">Client name *</label>
          <input id="name" name="name" required className="dg-input" placeholder="e.g. Toko Sinar Jaya" />
        </div>

        <div className="space-y-1.5">
          <label className="dg-label" htmlFor="website_url">Website</label>
          <input id="website_url" name="website_url" className="dg-input" placeholder="https://…" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['linkedin', 'LinkedIn'],
            ['instagram', 'Instagram'],
            ['tiktok', 'TikTok'],
          ].map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <label className="dg-label" htmlFor={key}>{label}</label>
              <input id={key} name={key} className="dg-input" placeholder="@handle or link" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['brand_primary', 'Brand colour 1', '#E8BE5C'],
            ['brand_secondary', 'Brand colour 2', '#F3E3B3'],
            ['calendar_color', 'Calendar colour', '#E8BE5C'],
          ].map(([key, label, def]) => (
            <div key={key} className="space-y-1.5">
              <label className="dg-label" htmlFor={key}>{label}</label>
              <input id={key} name={key} type="color" defaultValue={def}
                className="h-11 w-full cursor-pointer rounded-xl border border-ink-line bg-[#141414] p-1" />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" className="dg-btn-primary">Create client</button>
          <Link href="/clients" className="dg-btn-ghost">Cancel</Link>
        </div>
      </form>
    </AppShell>
  );
}
