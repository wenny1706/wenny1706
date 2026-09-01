'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STAGES } from '@/lib/types';

/**
 * The 5-stage Digital Geekz engine. This order and these names are the IP —
 * do not rename them to generic marketing words.
 */
export function StageTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const tabs = [
    ...STAGES.map((s) => ({ href: `${base}/${s.slug}`, label: s.label, blurb: s.blurb })),
    { href: `${base}/profile`, label: 'PROFILE', blurb: 'Voice vault' },
  ];

  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-1 rounded-2xl border border-ink-line bg-ink-soft p-1">
        {tabs.map((t, i) => {
          const active = pathname === t.href;
          const isStage = i < STAGES.length;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={[
                'group relative flex flex-col rounded-xl px-3.5 py-2 transition sm:px-4',
                active ? 'bg-gold text-ink' : 'text-ink-muted hover:bg-[#222] hover:text-gold',
                !isStage && !active ? 'text-[#6E6E6E]' : '',
              ].join(' ')}
            >
              <span className="text-xs font-bold tracking-[0.12em]">{t.label}</span>
              <span className={['text-[10px]', active ? 'text-ink/70' : 'text-[#5C5C5C]'].join(' ')}>
                {t.blurb}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
