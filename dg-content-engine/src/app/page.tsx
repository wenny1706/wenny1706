import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/PageHeading';
import { createClient } from '@/lib/supabase/server';
import { STAGES } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function Dashboard() {
  if (!CONFIGURED) return <SetupNotice />;

  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('id, name, calendar_color').order('name');
  const clients = data ?? [];

  return (
    <AppShell>
      <PageHeading
        title="Dashboard"
        subtitle="The calendar, status board and needs-attention strip land in Phase 3."
        action={<Link href="/clients/new" className="dg-btn-primary">+ New client</Link>}
      />

      <div className="dg-card mb-5 p-5 sm:p-6">
        <p className="text-xs font-bold tracking-[0.2em] text-gold">THE ENGINE</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
          {STAGES.map((s, i) => (
            <span key={s.slug} className="flex items-center gap-2">
              <span className="rounded-lg border border-ink-line px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-white">
                {s.label}
              </span>
              {i < STAGES.length - 1 && <span className="text-gold">→</span>}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          Every client workspace runs on these five stages, always in this order.
        </p>
      </div>

      <h2 className="dg-label mb-3">Your clients</h2>
      {clients.length === 0 ? (
        <div className="dg-card px-6 py-12 text-center">
          <p className="text-base font-medium text-white">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Add your first client and their workspace opens with the full engine inside.
          </p>
          <Link href="/clients/new" className="dg-btn-primary mt-4">+ Add your first client</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}/listen`}
              className="dg-card flex items-center gap-3 p-4 transition hover:border-gold/50">
              <i className="h-8 w-1.5 rounded-full" style={{ background: c.calendar_color }} />
              <span className="truncate font-medium text-white">{c.name}</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/** Shown when the Supabase keys have not been added yet. */
function SetupNotice() {
  return (
    <div className="mx-auto max-w-lg px-5 py-20">
      <div className="dg-card p-6">
        <p className="text-xs font-bold tracking-[0.2em] text-gold">SETUP</p>
        <h1 className="mt-2 text-xl font-semibold">Almost there</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The app is running, but it is not connected to your database yet. Add these two settings
          and it will come to life:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="rounded-lg border border-ink-line bg-[#141414] px-3 py-2 font-mono text-xs text-gold-soft">
            NEXT_PUBLIC_SUPABASE_URL
          </li>
          <li className="rounded-lg border border-ink-line bg-[#141414] px-3 py-2 font-mono text-xs text-gold-soft">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </li>
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          On Vercel: Project → Settings → Environment Variables. On your own laptop: a file called
          <span className="text-gold-soft"> .env.local</span>.
        </p>
      </div>
    </div>
  );
}
