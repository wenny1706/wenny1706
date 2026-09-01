import { createClient } from '@/lib/supabase/server';
import { saveProfileAction } from '../../actions';
import { DEFAULT_BANNED_WORDS, type ClientProfile } from '@/lib/types';
import { SaveButton } from '@/components/SaveButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('client_profiles').select('*').eq('client_id', id).maybeSingle();

  const p: ClientProfile = (data as ClientProfile) ?? {
    client_id: id,
    writing_samples: [],
    voice_rules: '',
    banned_words: DEFAULT_BANNED_WORDS,
    target_audience: '',
    offer_note: '',
  };

  return (
    <form action={saveProfileAction} className="space-y-5">
      <input type="hidden" name="client_id" value={id} />

      <div className="dg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">The voice vault</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Everything that makes a draft sound like this client instead of like AI. Read this tab
          before you write, and paste it into your Claude chat as context.
        </p>
      </div>

      {/* --- writing samples --- */}
      <div className="dg-card space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="font-medium text-white">5 writing samples</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Paste their real posts, emails or WhatsApp messages. Real words beat any description.
          </p>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <label className="dg-label" htmlFor={`sample_${i}`}>Sample {i + 1}</label>
            <textarea
              id={`sample_${i}`} name={`sample_${i}`} rows={4} className="dg-input resize-y font-normal"
              defaultValue={p.writing_samples?.[i] ?? ''}
              placeholder={i === 0 ? 'Paste one of their real posts here…' : ''}
            />
          </div>
        ))}
      </div>

      {/* --- rules --- */}
      <div className="dg-card space-y-4 p-5 sm:p-6">
        <div className="space-y-1.5">
          <label className="dg-label" htmlFor="voice_rules">Voice rules</label>
          <p className="text-xs text-ink-muted">Sentence style, favourite phrases, things they would never say.</p>
          <textarea id="voice_rules" name="voice_rules" rows={6} className="dg-input resize-y"
            defaultValue={p.voice_rules}
            placeholder={'Short sentences. Says "team" not "guys". Never uses exclamation marks. Always ends with a question.'} />
        </div>

        <div className="space-y-1.5">
          <label className="dg-label" htmlFor="banned_words">Banned words</label>
          <p className="text-xs text-ink-muted">One per line, or separated by commas. Pre-filled with your defaults.</p>
          <textarea id="banned_words" name="banned_words" rows={6} className="dg-input resize-y"
            defaultValue={(p.banned_words?.length ? p.banned_words : DEFAULT_BANNED_WORDS).join('\n')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="dg-label" htmlFor="target_audience">Target audience</label>
            <textarea id="target_audience" name="target_audience" rows={4} className="dg-input resize-y"
              defaultValue={p.target_audience} placeholder="Who are we writing for?" />
          </div>
          <div className="space-y-1.5">
            <label className="dg-label" htmlFor="offer_note">Offer</label>
            <textarea id="offer_note" name="offer_note" rows={4} className="dg-input resize-y"
              defaultValue={p.offer_note} placeholder="What are they actually selling?" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <SaveButton label="Save voice vault" />
      </div>
    </form>
  );
}
