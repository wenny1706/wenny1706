export const CHANNELS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'ig_feed', label: 'IG feed' },
  { value: 'ig_reels', label: 'IG reels' },
  { value: 'tiktok', label: 'TikTok' },
] as const;

export const STAGES = [
  { slug: 'listen',  label: 'LISTEN',  blurb: 'Raw material in' },
  { slug: 'plan',    label: 'PLAN',    blurb: 'Pillars & monthly map' },
  { slug: 'create',  label: 'CREATE',  blurb: 'Draft pipeline' },
  { slug: 'publish', label: 'PUBLISH', blurb: 'Feed plan & queue' },
  { slug: 'learn',   label: 'LEARN',   blurb: 'Monthly report' },
] as const;

/** Default banned-word list applied to every new client. Editable per client. */
export const DEFAULT_BANNED_WORDS = [
  'leverage', 'seamless', 'game-changer', 'unlock', 'supercharge',
  'revolutionize', 'synergy', 'holistic', 'robust', 'in today’s digital landscape',
];

export type Client = {
  id: string;
  name: string;
  logo_url: string | null;
  brand_primary: string;
  brand_secondary: string;
  calendar_color: string;
  website_url: string | null;
  socials: { linkedin?: string; instagram?: string; tiktok?: string };
  is_active: boolean;
  created_at: string;
};

export type ClientProfile = {
  client_id: string;
  writing_samples: string[];
  voice_rules: string;
  banned_words: string[];
  target_audience: string;
  offer_note: string;
};

// ---------------------------------------------------------------------------
// v2 PLACEHOLDER — AI generation
// ---------------------------------------------------------------------------
// In version 2 an AI draft generator will live here. It will read the client's
// voice vault (writing samples, voice rules, banned words, audience, offer) plus
// the LISTEN notes for raw material, and return draft text for a CREATE card.
// Nothing in version 1 calls it, and no API key is needed to run this app today.
//
// export async function generateDraft(input: {
//   profile: ClientProfile;
//   notes: string[];
//   topic: string;
//   channel: string;
// }): Promise<string> { /* call the model API here */ }
