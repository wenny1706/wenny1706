import { FILLERS, PACE, AUDIO, WEIGHTS, PAUSE_MS } from './config.js';

export const normalize = t => (t || '')
  .toLowerCase()
  .replace(/[.,!?;:"'`()\[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const words = t => normalize(t).split(' ').filter(Boolean);

/** Menghitung kata pengisi, termasuk frasa dua kata seperti "apa ya". */
export function countFillers(text, lang, extra = []) {
  const padded = ' ' + normalize(text) + ' ';
  const found = {};
  let total = 0;
  const list = [...(FILLERS[lang] || []), ...extra.map(x => normalize(x)).filter(Boolean)];
  for (const f of new Set(list)) {
    const re = new RegExp('\\s' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s', 'g');
    const n = (padded.match(re) || []).length;
    if (n) { found[f] = n; total += n; }
  }
  // Bunyi ragu memanjang: "eeee", "mmmm", "aaaa"
  const stretched = (padded.match(/\s(e{2,}|m{2,}|a{3,}|h?mm+)\s/g) || []).length;
  if (stretched) { found['bunyi ragu'] = (found['bunyi ragu'] || 0) + stretched; total += stretched; }
  return { total, found };
}

/**
 * Memecah naskah menjadi token kata sambil mempertahankan tanda bacanya,
 * supaya tanda baca tetap terlihat di layar dan bisa dijadikan tanda ambil napas.
 * Urutan token sengaja dibuat sama persis dengan hasil words(), agar penilaian
 * per kata tetap cocok indeksnya.
 */
export function tokenize(text) {
  const chunks = (text || '').trim().split(/\s+/).filter(Boolean);
  const tokens = chunks.map(chunk => {
    const m = chunk.match(/^[^\p{L}\p{N}]*(.*?)([^\p{L}\p{N}]*)$/u);
    const word = (m ? m[1] : chunk);
    const trail = (m ? m[2] : '');
    const mark = ['...', '?', '!', '.', ';', ':', ','].find(k => trail.includes(k)) || '';
    return { word, punct: trail, mark, pause: PAUSE_MS[mark] || 0 };
  }).filter(t => t.word);

  // Jaring pengaman: kalau jumlahnya tidak cocok, jangan pakai token.
  if (tokens.length !== words(text).length) return null;

  // Tanda baca di kata terakhir tidak perlu dijadikan tempat ambil napas.
  if (tokens.length) tokens[tokens.length - 1].pause = 0;
  return tokens;
}

/** Berapa kali seharusnya berhenti mengambil napas pada satu naskah. */
export function expectedBreaths(text) {
  const t = tokenize(text);
  return t ? t.filter(x => x.pause > 0).length : 0;
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
 * Menilai ritme bicara: seberapa wajar panjang satu tarikan napas, dan
 * (kalau ada naskah) seberapa patuh berhenti di tanda baca.
 */
function scoreRhythm(audio, expected, coverage) {
  const avg = audio.avgRunMs / 1000;
  const max = audio.maxRunMs / 1000;
  if (!audio.runCount || avg === 0) return { score: 0, avg, max };

  let base;
  if (avg < AUDIO.runIdealMin) base = 40 + (avg / AUDIO.runIdealMin) * 55;   // terputus-putus
  else if (avg <= AUDIO.runIdealMax) base = 100;
  else base = 100 - (avg - AUDIO.runIdealMax) * 9;                            // nyerocos

  if (max > AUDIO.runTooLong) base -= Math.min(30, (max - AUDIO.runTooLong) * 3);

  // Kepatuhan pada tanda baca, hanya untuk mode dengan naskah.
  if (expected > 0) {
    const target = Math.max(1, Math.round(expected * clamp(coverage, 0, 1)));
    const ratio = Math.min(1, audio.breaths / target);
    base = base * 0.5 + ratio * 100 * 0.5;
  }
  return { score: clamp(base), avg, max };
}

/**
 * Menghitung skor 0-100 per aspek + skor keseluruhan.
 * `scriptAccuracy` hanya ada pada mode dengan naskah target.
 */
export function scoreSession({ text, audio, lang, scriptAccuracy = null, confidence = null,
                               script = null, extraFillers = [], manualFillers = 0 }) {
  const band = PACE[lang] || PACE['id-ID'];
  const minutes = audio.durationMs / 60000;
  const speed = minutes > 0 ? words(text).length / minutes : 0;
  const fillers = countFillers(text, lang, extraFillers);
  // Hitungan manual dipakai kalau lebih besar, supaya yang terlewat mesin tetap terhitung
  // tanpa menghitung dua kali kata yang sama.
  const fillerTotal = Math.max(fillers.total, manualFillers);
  const fillerRate = minutes > 0 ? fillerTotal / minutes : 0;

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
  // Energi: suara yang dinamis (ada tekanan dan pelemahan) terdengar bersemangat.
  // Terlalu rata berarti datar, terlalu liar berarti tidak terkendali.
  const cv = audio.rmsCv || 0;
  const energy = clamp(cv <= 0.35 ? (cv / 0.35) * 85
    : cv <= 0.85 ? 85 + (1 - Math.abs(cv - 0.55) / 0.3) * 15
    : Math.max(35, 100 - (cv - 0.85) * 70));
  const variety = clamp((audio.semitoneRange / AUDIO.minSemitoneRange) * 70 + 10);

  const expected = script ? expectedBreaths(script) : 0;
  // Seberapa banyak naskah yang benar-benar dibaca. Kalau transkrip tidak tersedia
  // (browser tanpa pengenalan suara), diperkirakan dari lama bicara.
  let coverage = 1;
  if (script) {
    const targetWords = Math.max(1, words(script).length);
    coverage = words(text).length
      ? words(text).length / targetWords
      : audio.durationMs / ((targetWords / band.ideal) * 60000);
  }
  const rhythmInfo = scoreRhythm(audio, expected, coverage);
  const rhythm = rhythmInfo.score;

  const parts = { pace, filler, clarity, rhythm, projection, variety, energy };
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
      fillerCount: fillerTotal,
      fillerAuto: fillers.total,
      fillerManual: manualFillers,
      fillerList: fillers.found,
      fillerRate: +fillerRate.toFixed(1),
      pauseCount: audio.pauseCount,
      longPauses: audio.longPauses,
      semitoneRange: +audio.semitoneRange.toFixed(1),
      breaths: audio.breaths,
      expectedBreaths: expected ? Math.max(1, Math.round(expected * clamp(coverage, 0, 1))) : 0,
      avgRunSec: +rhythmInfo.avg.toFixed(1),
      dynamics: +(audio.rmsCv || 0).toFixed(2),
      maxRunSec: +rhythmInfo.max.toFixed(1),
      durationSec: Math.round(audio.durationMs / 1000),
      scriptAccuracy: scriptAccuracy === null ? null : Math.round(scriptAccuracy * 100)
    }
  };
}
