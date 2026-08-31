import { AUDIO } from './config.js';

/**
 * Asisten suara AI: berbicara memakai Web Speech Synthesis, memberi aba-aba
 * saat latihan, dan menyusun umpan balik setelah sesi.
 */
export class VoiceCoach {
  constructor() {
    this.enabled = true;
    this.lang = 'id-ID';
    this.rate = 1;
    this.voice = null;
    this.onSpeakStart = null;
    this.onSpeakEnd = null;
    this._loadVoices();
    if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => this._loadVoices();
  }

  get supported() { return !!window.speechSynthesis; }

  _loadVoices() {
    if (!this.supported) return;
    this.voices = speechSynthesis.getVoices();
    this.pickVoice(this.lang);
  }

  pickVoice(lang) {
    this.lang = lang;
    if (!this.voices || !this.voices.length) return;
    const base = lang.split('-')[0];
    this.voice =
      this.voices.find(v => v.lang === lang) ||
      this.voices.find(v => v.lang && v.lang.replace('_', '-').startsWith(base)) ||
      this.voices.find(v => v.default) || this.voices[0];
  }

  /** Mengucapkan teks. `interrupt` memotong ucapan yang sedang berjalan. */
  say(text, { interrupt = false } = {}) {
    if (!this.supported || !this.enabled || !text) return Promise.resolve();
    return new Promise(resolve => {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.lang;
      u.rate = this.rate;
      u.pitch = 1;
      if (this.voice) u.voice = this.voice;
      u.onstart = () => this.onSpeakStart && this.onSpeakStart();
      u.onend = u.onerror = () => { this.onSpeakEnd && this.onSpeakEnd(); resolve(); };
      speechSynthesis.speak(u);
    });
  }

  shutUp() { if (this.supported) speechSynthesis.cancel(); }
}

/**
 * Aturan koreksi langsung saat pengguna berbicara.
 * Dibatasi jedanya agar tidak mengganggu alur bicara.
 */
export class LiveCoach {
  constructor({ lang = 'id-ID', cooldownMs = 9000 } = {}) {
    this.lang = lang;
    this.cooldownMs = cooldownMs;
    this._last = 0;
    this._lastKey = '';
  }

  /** Mengembalikan satu petunjuk singkat atau null. */
  evaluate({ wpm, band, rms, silentMs, runMs, fillerRate, elapsedMs }) {
    const now = performance.now();
    if (elapsedMs < 6000) return null;
    if (now - this._last < this.cooldownMs) return null;

    const t = TIPS[this.lang] || TIPS['id-ID'];
    let key = null, msg = null;

    if (runMs > AUDIO.runTooLong * 1000) { key = 'nonstop'; msg = t.nonstop; }
    else if (silentMs > AUDIO.longPauseMs + 1200) { key = 'silence'; msg = t.silence; }
    else if (fillerRate >= 5) { key = 'filler'; msg = t.filler; }
    else if (wpm > band.max + 18) { key = 'fast'; msg = t.fast; }
    else if (wpm > 0 && wpm < band.min - 22) { key = 'slow'; msg = t.slow; }
    else if (rms > 0 && rms < AUDIO.quietRms * 0.7) { key = 'quiet'; msg = t.quiet; }

    if (!key || key === this._lastKey) return null;
    this._last = now;
    this._lastKey = key;
    return { key, msg };
  }

  reset() { this._last = 0; this._lastKey = ''; }
}

const TIPS = {
  'id-ID': {
    nonstop: 'Ambil napas. Berhenti di titik, jangan nyerocos.',
    silence: 'Ambil kembali. Lanjutkan kalimatmu.',
    filler: 'Terlalu banyak kata pengisi. Ganti dengan jeda diam.',
    fast: 'Terlalu cepat. Turunkan tempo.',
    slow: 'Terlalu pelan. Naikkan sedikit tempo.',
    quiet: 'Suara kurang terproyeksi. Bicara lebih lantang.'
  },
  'en-US': {
    nonstop: 'Take a breath. Stop at the full stop.',
    silence: 'Pick it back up. Finish your sentence.',
    filler: 'Too many fillers. Replace them with a silent pause.',
    fast: 'Too fast. Slow down.',
    slow: 'Too slow. Lift the tempo.',
    quiet: 'Your voice is too soft. Project more.'
  }
};

/**
 * Menyusun umpan balik akhir: satu kalimat ringkas untuk diucapkan,
 * dan daftar poin perbaikan untuk ditampilkan.
 */
export function buildFeedback(result, lang, mode) {
  const id = lang === 'id-ID';
  const s = result.stats, p = result.parts;
  const good = [], fix = [];

  if (p.pace >= 80) good.push(id ? `Kecepatan pas di ${s.wpm} kata per menit.` : `Pace on target at ${s.wpm} wpm.`);
  else if (s.wpm > s.band.max) fix.push(id
    ? `Kecepatan ${s.wpm} kpm terlalu cepat. Target ${s.band.min}-${s.band.max}. Beri jeda satu detik di setiap akhir kalimat.`
    : `${s.wpm} wpm is too fast. Aim for ${s.band.min}-${s.band.max}. Add a one second pause at each full stop.`);
  else fix.push(id
    ? `Kecepatan ${s.wpm} kpm terlalu lambat. Target ${s.band.min}-${s.band.max}. Kurangi jeda di tengah kalimat.`
    : `${s.wpm} wpm is too slow. Aim for ${s.band.min}-${s.band.max}. Cut the mid sentence pauses.`);

  if (s.fillerCount === 0) good.push(id ? 'Nol kata pengisi. Bersih.' : 'Zero filler words. Clean.');
  else {
    const top = Object.entries(s.fillerList).sort((a, b) => b[1] - a[1])[0];
    fix.push(id
      ? `${s.fillerCount} kata pengisi, paling sering "${top[0]}" (${top[1]}x). Ganti dengan diam sejenak.`
      : `${s.fillerCount} fillers, mostly "${top[0]}" (${top[1]}x). Replace them with silence.`);
  }

  if (s.scriptAccuracy !== null) {
    if (s.scriptAccuracy >= 90) good.push(id ? `Pelafalan ${s.scriptAccuracy}% tepat.` : `Pronunciation ${s.scriptAccuracy}% accurate.`);
    else fix.push(id
      ? `Pelafalan baru ${s.scriptAccuracy}% tepat. Ulangi kata yang ditandai merah, pelan-pelan dulu.`
      : `Pronunciation is ${s.scriptAccuracy}% accurate. Repeat the words marked red, slowly first.`);
  } else if (p.clarity < 70) {
    fix.push(id ? 'Kejelasan kata kurang. Akhiri setiap kata, jangan menelan suku kata terakhir.'
                : 'Clarity is low. Finish every word, do not swallow the last syllable.');
  }

  if (s.expectedBreaths > 0 && s.breaths < s.expectedBreaths * 0.6) {
    fix.push(id
      ? `Kamu cuma berhenti ${s.breaths} kali, padahal naskahnya punya ${s.expectedBreaths} tanda baca. Setiap koma berhenti sekejap, setiap titik ambil napas.`
      : `You paused only ${s.breaths} times, but the script has ${s.expectedBreaths} punctuation marks. Pause briefly at every comma, breathe at every full stop.`);
  } else if (p.rhythm >= 80) {
    good.push(id ? `Ritme napasmu stabil, rata-rata ${s.avgRunSec} detik per tarikan.`
                 : `Steady rhythm, ${s.avgRunSec} seconds per breath on average.`);
  } else if (s.maxRunSec > 15) {
    fix.push(id
      ? `Ada bagian sepanjang ${s.maxRunSec} detik yang kamu ucapkan tanpa berhenti sama sekali. Itu terdengar nyerocos dan bikin klien capek mendengar. Potong jadi kalimat pendek.`
      : `One stretch ran ${s.maxRunSec} seconds without a single pause. That sounds rushed. Break it into short sentences.`);
  } else if (p.rhythm < 60 && s.avgRunSec < 2.5) {
    fix.push(id
      ? `Kalimatmu terpotong-potong, rata-rata cuma ${s.avgRunSec} detik sekali bicara. Selesaikan satu kalimat penuh sebelum berhenti.`
      : `Your delivery is choppy, only ${s.avgRunSec} seconds per stretch. Finish a full sentence before stopping.`);
  }

  if (p.projection < 65) fix.push(id
    ? 'Volume kurang stabil. Bicara dari perut, arahkan suara ke orang terjauh di ruangan.'
    : 'Volume is unstable. Speak from the diaphragm, aim at the furthest person in the room.');
  else if (p.projection >= 85) good.push(id ? 'Proyeksi suara kuat dan stabil.' : 'Strong, steady projection.');

  if (p.variety < 55) fix.push(id
    ? `Nada terdengar datar (${s.semitoneRange} semitone). Tekankan satu kata kunci per kalimat.`
    : `Your tone is flat (${s.semitoneRange} semitones). Stress one key word per sentence.`);
  else if (p.variety >= 80) good.push(id ? 'Intonasi hidup, tidak monoton.' : 'Lively intonation, not monotone.');

  if (s.longPauses > 2) fix.push(id
    ? `${s.longPauses} jeda panjang. Siapkan kalimat penghubung agar tidak menggantung.`
    : `${s.longPauses} long pauses. Prepare bridge sentences so you do not stall.`);

  const verdict = id
    ? (result.overall >= 85 ? 'Siap dibawa ke klien.'
      : result.overall >= 70 ? 'Sudah bagus, tinggal dirapikan.'
      : result.overall >= 55 ? 'Fondasinya ada, perlu latihan lagi.'
      : 'Masih perlu banyak pengulangan. Jangan berhenti di sini.')
    : (result.overall >= 85 ? 'Ready for the client.'
      : result.overall >= 70 ? 'Good, just tighten it.'
      : result.overall >= 55 ? 'The base is there, keep drilling.'
      : 'Needs more repetition. Keep going.');

  const spoken = id
    ? `Skor kamu ${result.overall} dari seratus. ${verdict} ${fix[0] || good[0] || ''}`
    : `Your score is ${result.overall} out of one hundred. ${verdict} ${fix[0] || good[0] || ''}`;

  return { good, fix, verdict, spoken };
}
