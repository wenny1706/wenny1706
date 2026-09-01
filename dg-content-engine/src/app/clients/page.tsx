import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeading, EmptyState } from '@/components/PageHeading';
import { createClient } from '@/lib/supabase/server';
import type { Client } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('*').order('name');
  const clients = (data ?? []) as Client[];

  return (
    <AppShell>
      <PageHeading
        title="Clients"
        subtitle={`${clients.length} client${clients.length === 1 ? '' : 's'} in the engine`}
        action={<Link href="/clients/new" className="dg-btn-primary">+ New client</Link>}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          hint="Add your first client to open their workspace. Each client gets the full LISTEN → PLAN → CREATE → PUBLISH → LEARN engine."
          action={<Link href="/clients/new" className="dg-btn-primary mt-1">+ Add your first client</Link>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}/listen`}
              className="dg-card group flex items-center gap-3 p-4 transition hover:border-gold/50"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line text-sm font-bold text-ink"
                style={{ background: c.calendar_color }}
              >
                {c.logo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                  : c.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-white group-hover:text-gold">{c.name}</span>
                <span className="block truncate text-xs text-ink-muted">
                  {c.website_url ?? 'No website set'}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
