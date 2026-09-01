import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/PageHeading';
import { STAGES } from '@/lib/types';

export default function HowToPage() {
  return (
    <AppShell>
      <PageHeading title="How to use this" subtitle="The short version. A fuller guide arrives in Phase 5." />
      <div className="dg-card space-y-4 p-5 sm:p-6">
        <ol className="space-y-4 text-sm">
          <li>
            <span className="font-semibold text-gold">1. Add a client.</span>{' '}
            <span className="text-ink-muted">Clients → New client. Name, links and colours.</span>
          </li>
          <li>
            <span className="font-semibold text-gold">2. Fill the voice vault.</span>{' '}
            <span className="text-ink-muted">
              Inside the client, open PROFILE. Paste 5 real writing samples and the voice rules.
              This is what stops drafts sounding like AI.
            </span>
          </li>
          <li>
            <span className="font-semibold text-gold">3. Work the engine, in order.</span>
            <ul className="mt-2 space-y-1 text-ink-muted">
              {STAGES.map((s) => (
                <li key={s.slug}>
                  <span className="font-mono text-xs tracking-[0.1em] text-white">{s.label}</span>
                  {' — '}{s.blurb}
                </li>
              ))}
            </ul>
          </li>
        </ol>
      </div>
    </AppShell>
  );
}
