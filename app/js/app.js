import { LANGS, SCENARIOS, ARTICULATION, CLARITY, PACE_SCRIPT, PACE, COACH_INTRO } from './config.js';
import { MicEngine } from './audio.js';
import { Transcriber } from './recognition.js';
import { scoreSession, countFillers, compareToScript, words, normalize } from './metrics.js';
import { VoiceCoach, LiveCoach, buildFeedback } from './coach.js';
import { loadSessions, saveSession, clearSessions, loadPrefs, savePrefs, progress } from './storage.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

const MODE_LABEL = {
  pitch: 'Latihan Pitch',
  articulation: 'Artikulasi',
  clarity: 'Kejelasan Pelafalan',
  pace: 'Kecepatan Bicara'
};

const ASPECT_LABEL = {
  pace: 'Kecepatan', filler: 'Bebas kata pengisi', clarity: 'Kejelasan',
  projection: 'Proyeksi suara', variety: 'Variasi nada'
};

class App {
  constructor() {
    this.mic = new MicEngine();
    this.stt = new Transcriber();
    this.coach = new VoiceCoach();
    this.live = new LiveCoach();

    const prefs = loadPrefs();
    this.lang = prefs.lang || 'id-ID';
    this.coach.enabled = prefs.coachVoice !== false;
    this.liveVoice = prefs.liveVoice === true;
    this.coach.pickVoice(this.lang);
    this.live.lang = this.lang;

    this.session = null;     // { mode, item, startedAt }
    this.timerId = 0;
    this.lastResult = null;

    this.bindChrome();
    this.renderHome();
    this.checkSupport();
  }

  /* ---------- kerangka & pengaturan ---------- */

  bindChrome() {
    const langSel = $('#lang');
    Object.entries(LANGS).forEach(([code, v]) => langSel.append(new Option(v.label, code)));
    langSel.value = this.lang;
    langSel.onchange = () => {
      this.lang = langSel.value;
      this.coach.pickVoice(this.lang);
      this.live.lang = this.lang;
      this.persist();
      this.renderHome();
    };

    const voiceToggle = $('#coach-voice');
    voiceToggle.checked = this.coach.enabled;
    voiceToggle.onchange = () => { this.coach.enabled = voiceToggle.checked; if (!voiceToggle.checked) this.coach.shutUp(); this.persist(); };

    const liveToggle = $('#live-voice');
    liveToggle.checked = this.liveVoice;
    liveToggle.onchange = () => { this.liveVoice = liveToggle.checked; this.persist(); };

    $('#mic-request').onclick = () => this.enableMic();
    $('#nav-home').onclick = () => this.leaveSession();
    $('#clear-history').onclick = () => {
      if (confirm('Hapus semua riwayat latihan?')) { clearSessions(); this.renderHistory(); }
    };
  }

  persist() {
    savePrefs({ lang: this.lang, coachVoice: this.coach.enabled, liveVoice: this.liveVoice });
  }

  checkSupport() {
    const notes = [];
    if (!this.mic.supported) notes.push('Browser ini tidak bisa mengakses mikrofon. Pakai Chrome atau Edge terbaru.');
    if (!this.stt.supported) notes.push('Transkripsi langsung tidak tersedia di browser ini, jadi kata pengisi dan kecepatan bicara tidak dihitung. Analisis suara tetap jalan. Untuk fitur penuh, pakai Chrome atau Edge.');
    if (!this.coach.supported) notes.push('Suara asisten tidak tersedia di browser ini. Umpan balik tetap muncul sebagai teks.');
    if (location.protocol === 'file:') notes.push('Halaman dibuka langsung dari berkas. Mikrofon hanya aktif lewat http://localhost atau https. Jalankan: python3 -m http.server 8000');
    const box = $('#support-note');
    box.innerHTML = '';
    if (!notes.length) { box.hidden = true; return; }
    box.hidden = false;
    notes.forEach(n => box.append(el('p', null, n)));
  }

  async enableMic() {
    try {
      await this.mic.requestAccess();
      $('#mic-state').textContent = 'Mikrofon aktif';
      $('#mic-state').classList.add('on');
      $('#mic-request').hidden = true;
    } catch (e) {
      $('#mic-state').textContent = 'Izin mikrofon ditolak';
      alert('Aplikasi butuh izin mikrofon. Klik ikon gembok di address bar lalu izinkan mikrofon untuk situs ini.');
    }
  }

  show(screen) {
    $$('.screen').forEach(s => s.hidden = s.id !== 'screen-' + screen);
  }

  /* ---------- beranda ---------- */

  renderHome() {
    this.show('home');
    const grid = $('#mode-grid');
    grid.innerHTML = '';

    const cards = [
      { mode: 'pitch', icon: '🎯', title: 'Latihan Pitch', desc: 'Skenario nyata di depan klien atau investor, lengkap dengan sesi tanya jawab dadakan dari asisten AI.' },
      { mode: 'articulation', icon: '👄', title: 'Artikulasi', desc: 'Kalimat sulit untuk melenturkan lidah dan bibir. Dinilai per kata.' },
      { mode: 'clarity', icon: '🔊', title: 'Kejelasan Pelafalan', desc: 'Baca kalimat pitching. Kata yang tidak jelas ditandai merah.' },
      { mode: 'pace', icon: '⏱️', title: 'Kecepatan Bicara', desc: 'Ikuti penunjuk tempo agar tidak terlalu cepat atau terlalu lambat.' }
    ];

    cards.forEach(c => {
      const card = el('button', 'mode-card');
      card.append(el('span', 'mode-icon', c.icon), el('h3', null, c.title), el('p', null, c.desc));
      card.onclick = () => this.openMode(c.mode);
      grid.append(card);
    });

    this.renderProgress();
    this.renderHistory();
  }

  renderProgress() {
    const box = $('#progress-box');
    const p = progress(loadSessions());
    box.innerHTML = '';
    if (!p) { box.append(el('p', 'muted', 'Belum ada data. Selesaikan satu latihan untuk melihat kemajuan.')); return; }
    box.append(el('div', 'big-stat', String(p.overall)));
    box.append(el('p', 'muted', `Rata-rata ${p.count} sesi terakhir. Skor terbaik ${p.best}.`));
    const list = el('div', 'mini-bars');
    Object.entries(p.parts).forEach(([k, v]) => {
      const row = el('div', 'mini-bar');
      row.append(el('span', 'mini-label', ASPECT_LABEL[k]));
      const track = el('div', 'track');
      const fill = el('div', 'fill');
      fill.style.width = v + '%';
      fill.dataset.level = v >= 80 ? 'good' : v >= 60 ? 'mid' : 'low';
      track.append(fill);
      row.append(track, el('span', 'mini-val', String(v)));
      list.append(row);
    });
    box.append(list);
  }

  renderHistory() {
    const list = $('#history-list');
    const sessions = loadSessions();
    list.innerHTML = '';
    if (!sessions.length) { list.append(el('p', 'muted', 'Riwayat latihan akan muncul di sini.')); return; }
    sessions.slice(0, 12).forEach(s => {
      const row = el('div', 'history-row');
      const score = el('span', 'chip', String(s.overall));
      score.dataset.level = s.overall >= 80 ? 'good' : s.overall >= 60 ? 'mid' : 'low';
      const meta = el('div', 'history-meta');
      meta.append(el('strong', null, s.title || MODE_LABEL[s.mode] || s.mode));
      meta.append(el('span', 'muted', `${new Date(s.at).toLocaleString('id-ID')} · ${s.stats.durationSec} detik · ${s.stats.wpm} kpm · ${s.stats.fillerCount} kata pengisi`));
      row.append(score, meta);
      list.append(row);
    });
  }

  /* ---------- pemilihan latihan ---------- */

  openMode(mode) {
    this.show('picker');
    $('#picker-title').textContent = MODE_LABEL[mode];
    const list = $('#picker-list');
    list.innerHTML = '';
    $('#picker-back').onclick = () => this.renderHome();

    const items = this.itemsFor(mode);
    items.forEach(item => {
      const b = el('button', 'pick-item');
      b.append(el('strong', null, item.title));
      if (item.brief) b.append(el('span', 'muted', item.brief));
      if (item.seconds) b.append(el('span', 'tag', `${item.seconds} detik`));
      b.onclick = () => this.prepare(mode, item);
      list.append(b);
    });
  }

  itemsFor(mode) {
    if (mode === 'pitch') return SCENARIOS.map(s => ({ ...s }));
    if (mode === 'articulation') return (ARTICULATION[this.lang] || []).map((t, i) => ({ id: 'art' + i, title: `Latihan ${i + 1}`, brief: t, script: t }));
    if (mode === 'clarity') return (CLARITY[this.lang] || []).map((t, i) => ({ id: 'cla' + i, title: `Kalimat ${i + 1}`, brief: t, script: t }));
    if (mode === 'pace') {
      const script = PACE_SCRIPT[this.lang];
      const band = PACE[this.lang];
      return [
        { id: 'pace-ideal', title: `Tempo ideal (${band.ideal} kpm)`, brief: 'Ikuti sorotan kata. Ini kecepatan yang nyaman didengar klien.', script, target: band.ideal },
        { id: 'pace-slow', title: `Tempo tenang (${band.min} kpm)`, brief: 'Untuk membuka presentasi dan menekankan angka penting.', script, target: band.min },
        { id: 'pace-fast', title: `Tempo energik (${band.max} kpm)`, brief: 'Untuk bagian cerita dan demo produk.', script, target: band.max }
      ];
    }
    return [];
  }

  /* ---------- sesi latihan ---------- */

  async prepare(mode, item) {
    this.show('session');
    this.session = { mode, item, qaAsked: false };

    if (mode === 'pitch' && item.random) {
      item = { ...item, brief: item.brief + '\n\nTopik: ' + item.random[Math.floor(Math.random() * item.random.length)] };
      this.session.item = item;
    }

    $('#session-title').textContent = item.title;
    $('#session-brief').textContent = item.brief || '';
    $('#coach-cue').textContent = '';
    $('#transcript').textContent = '';
    $('#timer').textContent = '0:00';
    $('#timer-label').textContent = item.seconds ? `Waktu (target ${item.seconds} detik)` : 'Waktu';
    $('#wpm').textContent = '0';
    $('#filler-count').textContent = '0';
    $('#level-fill').style.width = '0%';
    $('#btn-stop').hidden = true;
    $('#btn-start').hidden = false;
    $('#btn-start').textContent = 'Mulai bicara';

    const scriptBox = $('#script-box');
    scriptBox.innerHTML = '';
    if (item.script) {
      scriptBox.hidden = false;
      words(item.script).forEach((w, i) => {
        const span = el('span', 'w', w);
        span.dataset.i = i;
        scriptBox.append(span, document.createTextNode(' '));
      });
    } else scriptBox.hidden = true;

    $('#btn-start').onclick = () => this.start();
    $('#btn-stop').onclick = () => this.finish();
    $('#session-back').onclick = () => this.leaveSession();

    const intro = COACH_INTRO[this.lang]?.[mode];
    if (intro) { $('#coach-cue').textContent = intro; this.coach.say(intro, { interrupt: true }); }
  }

  async start() {
    try {
      await this.mic.start({ record: true });
    } catch (e) {
      alert('Tidak bisa mengakses mikrofon: ' + e.message);
      return;
    }
    $('#mic-state').textContent = 'Mikrofon aktif';
    $('#mic-state').classList.add('on');
    $('#mic-request').hidden = true;

    this.coach.shutUp();
    this.live.reset();
    this.stt.start(this.lang);
    this.stt.onUpdate = (fin, itm) => this.onTranscript(fin, itm);

    this.session.startedAt = performance.now();
    this.session.pacerIndex = 0;
    $('#btn-start').hidden = true;
    $('#btn-stop').hidden = false;
    $('#recording-dot').hidden = false;

    this.mic.onFrame = f => { $('#level-fill').style.width = Math.round(f.level * 100) + '%'; this._frame = f; };
    this.timerId = setInterval(() => this.tick(), 200);
  }

  onTranscript(fin, interim) {
    const box = $('#transcript');
    box.innerHTML = '';
    box.append(document.createTextNode(fin + ' '));
    if (interim) box.append(el('span', 'interim', interim));
    box.scrollTop = box.scrollHeight;

    if (this.session?.item?.script) this.markScript(fin + ' ' + interim);
  }

  /** Menandai kata naskah yang sudah terucap dengan benar. */
  markScript(spoken) {
    const cmp = compareToScript(this.session.item.script, spoken);
    $$('#script-box .w').forEach((span, i) => {
      span.classList.toggle('hit', !!cmp.matched[i]);
    });
  }

  tick() {
    const s = this.session;
    if (!s?.startedAt) return;
    const elapsed = performance.now() - s.startedAt;
    const sec = Math.floor(elapsed / 1000);
    $('#timer').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

    const text = (this.stt.finalText + ' ' + this.stt.interim).trim();
    const minutes = elapsed / 60000;
    const speed = minutes > 0.08 ? Math.round(words(text).length / minutes) : 0;
    const band = PACE[this.lang];
    $('#wpm').textContent = String(speed);
    $('#wpm').dataset.level = speed === 0 ? '' : (speed < band.min ? 'low' : speed > band.max ? 'low' : 'good');

    const fillers = countFillers(text, this.lang);
    $('#filler-count').textContent = String(fillers.total);

    // penunjuk tempo untuk mode kecepatan
    if (s.mode === 'pace' && s.item.target) {
      const idx = Math.floor((elapsed / 60000) * s.item.target);
      const spans = $$('#script-box .w');
      if (idx !== s.pacerIndex) {
        s.pacerIndex = idx;
        spans.forEach((sp, i) => sp.classList.toggle('pacer', i === idx));
        if (spans[idx]) spans[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      if (idx >= spans.length) this.finish();
    }

    // batas waktu skenario
    if (s.mode === 'pitch' && s.item.seconds && sec >= s.item.seconds + 15) this.finish();

    const cue = this.live.evaluate({
      wpm: speed, band,
      rms: this._frame?.rms || 0,
      silentMs: this._frame?.silentMs || 0,
      fillerRate: minutes > 0.1 ? fillers.total / minutes : 0,
      elapsedMs: elapsed
    });
    if (cue) {
      const line = $('#coach-cue');
      line.textContent = cue.msg;
      line.classList.remove('flash'); void line.offsetWidth; line.classList.add('flash');
      if (this.liveVoice) this.coach.say(cue.msg, { interrupt: true });
    }
  }

  async finish() {
    clearInterval(this.timerId);
    this.timerId = 0;
    $('#recording-dot').hidden = true;
    const text = this.stt.stop();
    const blob = await this.mic.stop();
    const audio = this.mic.summary();
    const item = this.session.item;

    let scriptAccuracy = null, missed = [], cmp = null;
    if (item.script) {
      cmp = compareToScript(item.script, text);
      scriptAccuracy = cmp.accuracy;
      missed = cmp.missed;
    }

    // Sesi terlalu singkat atau tanpa suara tidak layak dinilai.
    const tooShort = audio.durationMs < 5000;
    const noVoice = audio.voicedRatio < 0.12 && !words(text).length;
    if (tooShort || noVoice) {
      const msg = tooShort
        ? 'Sesi terlalu singkat untuk dinilai. Bicara minimal lima detik.'
        : 'Tidak ada suara yang terdeteksi. Periksa mikrofon lalu coba lagi.';
      $('#coach-cue').textContent = msg;
      $('#btn-stop').hidden = true;
      $('#btn-start').hidden = false;
      $('#btn-start').textContent = 'Coba lagi';
      this.coach.say(msg, { interrupt: true });
      return;
    }

    const result = scoreSession({
      text, audio, lang: this.lang,
      scriptAccuracy,
      confidence: this.stt.avgConfidence
    });
    const feedback = buildFeedback(result, this.lang, this.session.mode);
    this.lastResult = { result, feedback, text, blob, item, mode: this.session.mode, missed, cmp };

    saveSession({
      at: Date.now(), mode: this.session.mode, title: item.title,
      overall: result.overall, parts: result.parts, stats: result.stats
    });

    this.renderReport();
    this.coach.say(feedback.spoken, { interrupt: true });
  }

  leaveSession() {
    clearInterval(this.timerId);
    this.timerId = 0;
    this.stt.stop();
    this.coach.shutUp();
    if (this.mic.raf) this.mic.stop();
    $('#recording-dot').hidden = true;
    this.renderHome();
  }

  /* ---------- laporan ---------- */

  renderReport() {
    const { result, feedback, text, blob, item, missed, mode } = this.lastResult;
    this.show('report');

    $('#score-value').textContent = String(result.overall);
    const ring = $('#score-ring');
    ring.style.setProperty('--pct', result.overall);
    ring.dataset.level = result.overall >= 80 ? 'good' : result.overall >= 60 ? 'mid' : 'low';
    $('#verdict').textContent = feedback.verdict;
    $('#report-title').textContent = `${MODE_LABEL[mode]} · ${item.title}`;

    const bars = $('#score-bars');
    bars.innerHTML = '';
    Object.entries(result.parts).forEach(([k, v]) => {
      const row = el('div', 'mini-bar');
      row.append(el('span', 'mini-label', ASPECT_LABEL[k]));
      const track = el('div', 'track'), fill = el('div', 'fill');
      fill.style.width = v + '%';
      fill.dataset.level = v >= 80 ? 'good' : v >= 60 ? 'mid' : 'low';
      track.append(fill);
      row.append(track, el('span', 'mini-val', String(v)));
      bars.append(row);
    });

    const s = result.stats;
    const stats = $('#report-stats');
    stats.innerHTML = '';
    const statItems = [
      ['Durasi', `${s.durationSec} detik`],
      ['Jumlah kata', String(s.wordCount)],
      ['Kecepatan', `${s.wpm} kpm (target ${s.band.min}-${s.band.max})`],
      ['Kata pengisi', `${s.fillerCount} (${s.fillerRate}/menit)`],
      ['Jeda panjang', String(s.longPauses)],
      ['Variasi nada', `${s.semitoneRange} semitone`]
    ];
    if (s.scriptAccuracy !== null) statItems.push(['Ketepatan naskah', `${s.scriptAccuracy}%`]);
    statItems.forEach(([k, v]) => {
      const b = el('div', 'stat');
      b.append(el('span', 'muted', k), el('strong', null, v));
      stats.append(b);
    });

    const fb = $('#feedback-list');
    fb.innerHTML = '';
    if (feedback.fix.length) {
      fb.append(el('h4', null, 'Yang perlu diperbaiki'));
      const ul = el('ul');
      feedback.fix.forEach(t => ul.append(el('li', 'fix', t)));
      fb.append(ul);
    }
    if (feedback.good.length) {
      fb.append(el('h4', null, 'Yang sudah bagus'));
      const ul = el('ul');
      feedback.good.forEach(t => ul.append(el('li', 'good', t)));
      fb.append(ul);
    }

    // transkrip: sorot kata pengisi, atau naskah dengan kata yang meleset
    const tBox = $('#report-transcript');
    tBox.innerHTML = '';
    if (item.script) {
      const cmp = this.lastResult.cmp;
      cmp.targetWords.forEach((w, i) => {
        const span = el('span', cmp.matched[i] ? 'w hit' : 'w miss', w);
        tBox.append(span, document.createTextNode(' '));
      });
      if (missed.length) tBox.append(el('p', 'muted', 'Kata merah belum terucap jelas. Ulangi pelan-pelan, lalu percepat.'));
    } else if (text) {
      const fillerSet = new Set(Object.keys(countFillers(text, this.lang).found));
      words(text).forEach(w => {
        const span = el('span', fillerSet.has(w) ? 'w miss' : 'w', w);
        tBox.append(span, document.createTextNode(' '));
      });
    } else {
      tBox.append(el('p', 'muted', this.stt.supported
        ? 'Tidak ada kata yang tertangkap. Bicara lebih dekat ke mikrofon.'
        : 'Browser ini tidak mendukung transkripsi langsung, jadi kata pengisi dan kecepatan bicara tidak dihitung.'));
    }

    const player = $('#playback');
    if (blob && blob.size) {
      if (player.src) URL.revokeObjectURL(player.src);
      player.src = URL.createObjectURL(blob);
      $('#playback-wrap').hidden = false;
    } else $('#playback-wrap').hidden = true;

    // sesi tanya jawab dari asisten AI setelah pitch
    const qa = $('#qa-box');
    qa.innerHTML = '';
    const qs = item.questions;
    if (mode === 'pitch' && qs && qs.length) {
      qa.hidden = false;
      qa.append(el('h4', null, 'Latihan tanya jawab'));
      qa.append(el('p', 'muted', 'Asisten akan menanyakan pertanyaan sulit dari klien. Jawab dalam 30 detik.'));
      const question = el('p', 'qa-q', '');
      const ask = el('button', 'btn ghost', 'Ajukan pertanyaan');
      ask.onclick = () => {
        const q = qs[Math.floor(Math.random() * qs.length)];
        question.textContent = q;
        this.coach.say(q, { interrupt: true });
      };
      const answer = el('button', 'btn', 'Jawab sekarang');
      answer.onclick = () => {
        const q = question.textContent || qs[0];
        this.prepare('pitch', { id: 'qa', title: 'Jawab pertanyaan klien', brief: q, seconds: 30 });
      };
      qa.append(question, el('div', 'row', ''));
      qa.lastChild.append(ask, answer);
    } else qa.hidden = true;

    $('#btn-repeat').onclick = () => this.prepare(mode, item);
    $('#btn-home').onclick = () => this.renderHome();
    $('#btn-replay-feedback').onclick = () => this.coach.say(feedback.spoken, { interrupt: true });
  }
}

window.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
