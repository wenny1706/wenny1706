import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { StageTabs } from '@/components/StageTabs';
import { createClient } from '@/lib/supabase/server';
import type { Client } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ClientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('*').eq('id', id).single();
  if (!data) notFound();
  const client = data as Client;

  const links = [
    client.website_url && { label: 'Website', href: client.website_url },
    client.socials?.linkedin && { label: 'LinkedIn', href: client.socials.linkedin },
    client.socials?.instagram && { label: 'Instagram', href: client.socials.instagram },
    client.socials?.tiktok && { label: 'TikTok', href: client.socials.tiktok },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <AppShell>
      {/* --- client identity header --- */}
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-line text-base font-bold text-ink"
          style={{ background: client.calendar_color }}
        >
          {client.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={client.logo_url} alt="" className="h-full w-full object-cover" />
            : client.name.slice(0, 2).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{client.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                 className="text-ink-muted underline-offset-2 hover:text-gold hover:underline">
                {l.label}
              </a>
            ))}
            <span className="flex items-center gap-1.5 text-ink-muted">
              <i className="inline-block h-3 w-3 rounded-full" style={{ background: client.brand_primary }} />
              <i className="inline-block h-3 w-3 rounded-full" style={{ background: client.brand_secondary }} />
              brand colours
            </span>
          </div>
        </div>

        <Link href={`/clients/${client.id}/settings`} className="dg-btn-ghost !py-2 text-xs">
          Edit details
        </Link>
      </div>

      <StageTabs clientId={client.id} />
      <div className="mt-6">{children}</div>
    </AppShell>
  );
}
