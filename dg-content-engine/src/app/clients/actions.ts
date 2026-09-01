'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_BANNED_WORDS } from '@/lib/types';

function str(form: FormData, key: string) {
  return (form.get(key) as string | null)?.trim() ?? '';
}

/** Create a client and seed its voice vault with the default banned words. */
export async function createClientAction(form: FormData) {
  const supabase = await createClient();
  const name = str(form, 'name');
  if (!name) return;

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name,
      brand_primary: str(form, 'brand_primary') || '#E8BE5C',
      brand_secondary: str(form, 'brand_secondary') || '#F3E3B3',
      calendar_color: str(form, 'calendar_color') || '#E8BE5C',
      website_url: str(form, 'website_url') || null,
      socials: {
        linkedin: str(form, 'linkedin'),
        instagram: str(form, 'instagram'),
        tiktok: str(form, 'tiktok'),
      },
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Could not create the client.');

  await supabase.from('client_profiles').insert({
    client_id: data.id,
    banned_words: DEFAULT_BANNED_WORDS,
  });

  revalidatePath('/clients');
  redirect(`/clients/${data.id}/listen`);
}

export async function updateClientAction(form: FormData) {
  const supabase = await createClient();
  const id = str(form, 'id');
  await supabase
    .from('clients')
    .update({
      name: str(form, 'name'),
      brand_primary: str(form, 'brand_primary'),
      brand_secondary: str(form, 'brand_secondary'),
      calendar_color: str(form, 'calendar_color'),
      website_url: str(form, 'website_url') || null,
      logo_url: str(form, 'logo_url') || null,
      socials: {
        linkedin: str(form, 'linkedin'),
        instagram: str(form, 'instagram'),
        tiktok: str(form, 'tiktok'),
      },
    })
    .eq('id', id);

  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`, 'layout');
}

/** Deletes the client and everything attached to it. Confirmed in the UI first. */
export async function deleteClientAction(form: FormData) {
  const supabase = await createClient();
  await supabase.from('clients').delete().eq('id', str(form, 'id'));
  revalidatePath('/clients');
  redirect('/clients');
}

export async function saveProfileAction(form: FormData) {
  const supabase = await createClient();
  const clientId = str(form, 'client_id');

  const samples = [0, 1, 2, 3, 4].map((i) => str(form, `sample_${i}`));
  const banned = str(form, 'banned_words')
    .split(/[\n,]/)
    .map((w) => w.trim())
    .filter(Boolean);

  await supabase.from('client_profiles').upsert({
    client_id: clientId,
    writing_samples: samples,
    voice_rules: str(form, 'voice_rules'),
    banned_words: banned,
    target_audience: str(form, 'target_audience'),
    offer_note: str(form, 'offer_note'),
    updated_at: new Date().toISOString(),
  });

  revalidatePath(`/clients/${clientId}/profile`);
}
