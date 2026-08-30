import { FILLERS, PACE, AUDIO, WEIGHTS } from './config.js';

export const normalize = t => (t || '')
  .toLowerCase()
  .replace(/[.,!?;:"'`()\[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const words = t => normalize(t).split(' ').filter(Boolean);

/** Menghitung kata pengisi, termasuk frasa dua kata seperti "apa ya". */
export function countFillers(text, lang) {
  const padded = ' ' + normalize(text) + ' ';
  const found = {};
  let total = 0;
  for (const f of (FILLERS[lang] || [])) {
    const re = new RegExp('\\s' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s', 'g');
    const n = (padded.match(re) || []).length;
    if (n) { found[f] = n; total += n; }
  }
  // Bunyi ragu memanjang: "eeee", "mmmm", "aaaa"
  const stretched = (padded.match(/\s(e{2,}|m{2,}|a{3,}|h?mm+)\s/g) || []).length;
  if (stretched) { found['bunyi ragu'] = (found['bunyi ragu'] || 0) + stretched; total += stretched; }
  return { total, found };
}

export const wpm = (text, ms) => (ms > 0 ? words(text).length / (ms / 60000) : 0);

/**
 * Kemiripan kata per kata antara naskah target dan hasil ucapan
 * (Levenshtein pada level kata), plus daftar kata yang meleset.
 */
export function compareToScript(target, spoken) {
  const a = words(target), b = words(spoken);
  if (!a.length) return { accuracy: 0, missed: [], matched: [] };

  const dp = Array.from({ length: a.length + 1 }, () => new Int32Array(b.length + 1));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = fuzzyEqual(a[i - 1], b[j - 1]) ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  // Telusuri balik untuk menandai kata target yang tidak terucap dengan benar.
  const missed = [], matched = new Array(a.length).fill(false);
  let i = a.length, j = b.length;
  while (i > 0 && j > 0) {
    const cost = fuzzyEqual(a[i - 1], b[j - 1]) ? 0 : 1;
    if (dp[i][j] === dp[i - 1][j - 1] + cost) {
      if (cost === 0) matched[i - 1] = true; else missed.push(a[i - 1]);
      i--; j--;
    } else if (dp[i][j] === dp[i - 1][j] + 1) { missed.push(a[i - 1]); i--; }
    else j--;
  }
  while (i > 0) { missed.push(a[i - 1]); i--; }

  const accuracy = Math.max(0, 1 - dp[a.length][b.length] / a.length);
  return { accuracy, missed: missed.reverse(), matched, targetWords: a };
}

/** Toleransi kecil untuk imbuhan/typo pengenalan suara. */
function fuzzyEqual(x, y) {
  if (x === y) return true;
  if (Math.abs(x.length - y.length) > 2) return false;
  if (x.length < 4 || y.length < 4) return false;
  let d = 0, i = 0, j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { i++; j++; continue; }
    if (++d > 1) return false;
    if (x.length > y.length) i++;
    else if (y.length > x.length) j++;
    else { i++; j++; }
  }
  return d + (x.length - i) + (y.length - j) <= 1;
}

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Menghitung skor 0-100 per aspek + skor keseluruhan.
 * `scriptAccuracy` hanya ada pada mode dengan naskah target.
 */
export function scoreSession({ text, audio, lang, scriptAccuracy = null, confidence = null }) {
  const band = PACE[lang] || PACE['id-ID'];
  const minutes = audio.durationMs / 60000;
  const speed = minutes > 0 ? words(text).length / minutes : 0;
  const fillers = countFillers(text, lang);
  const fillerRate = minutes > 0 ? fillers.total / minutes : 0;

  const pace = speed === 0 ? 0
    : speed < band.min ? clamp(100 - (band.min - speed) * 1.6)
    : speed > band.max ? clamp(100 - (speed - band.max) * 1.6)
    : 100;

  const filler = clamp(100 - fillerRate * 16);

  let clarity;
  if (scriptAccuracy !== null) clarity = clamp(scriptAccuracy * 100);
  else if (confidence !== null) clarity = clamp(confidence * 100);
  else clarity = clamp(audio.voicedRatio * 120);

  const projection = clamp(audio.loudRatio * 100 * 1.15);
  const variety = clamp((audio.semitoneRange / AUDIO.minSemitoneRange) * 70 + 10);

  const parts = { pace, filler, clarity, projection, variety };
  const overall = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + parts[k] * w, 0)
  );

  return {
    overall,
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(v)])),
    stats: {
      wpm: Math.round(speed),
      band,
      wordCount: words(text).length,
      fillerCount: fillers.total,
      fillerList: fillers.found,
      fillerRate: +fillerRate.toFixed(1),
      pauseCount: audio.pauseCount,
      longPauses: audio.longPauses,
      semitoneRange: +audio.semitoneRange.toFixed(1),
      durationSec: Math.round(audio.durationMs / 1000),
      scriptAccuracy: scriptAccuracy === null ? null : Math.round(scriptAccuracy * 100)
    }
  };
}
