import { LANGS, SCENARIOS, ARTICULATION, CLARITY, PACE_SCRIPT, RHYTHM_SCRIPT, PACE, COACH_INTRO,
         TOPICS, CARD_TIMING, OUTLINES, TAP_FILLERS } from './config.js';
import { MicEngine } from './audio.js';
import { Transcriber } from './recognition.js';
import { scoreSession, countFillers, compareToScript, words, tokenize } from './metrics.js';
import { VoiceCoach, LiveCoach, buildFeedback } from './coach.js';
import { loadSessions, saveSession, clearSessions, loadPrefs, savePrefs, progress,
         loadOutlines, saveOutline, deleteOutline, rateLastSession } from './storage.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

const MODE_LABEL = {
  pitch: 'Latihan Pitch',
  cards: 'Kartu Dadakan',
  outline: 'Kerangka Pitch',
  articulation: 'Artikulasi',
  clarity: 'Kejelasan Pelafalan',
  pace: 'Kecepatan & Ritme'
};

const ASPECT_LABEL = {
  clarity: 'Kejelasan', pace: 'Kecepatan', filler: 'Bebas kata pengisi',
  rhythm: 'Ritme & jeda', variety: 'Variasi nada', projection: 'Proyeksi suara',
  energy: 'Energi suara'
};

const SELF_LABEL = {
  confidence: 'Rasa percaya diri',
  energy: 'Energi & semangat',
  message: 'Kejelasan pesanmu'
};

class App {
  constructor() {
    this.mic = new MicEngine();
    this.stt = new Transcriber();
    this.coach = new VoiceCoach();
    this.live = new LiveCoach();

    const prefs = loadPrefs();
    this.lang = prefs.lang || 'id-ID';
    this.customFillers = prefs.customFillers || [];
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
    const fillerInput = $('#custom-fillers');
    fillerInput.value = this.customFillers.join(', ');
    $('#save-fillers').onclick = () => {
      this.customFillers = fillerInput.value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 15);
      fillerInput.value = this.customFillers.join(', ');
      this.persist();
      $('#save-fillers').textContent = 'Tersimpan';
      setTimeout(() => { $('#save-fillers').textContent = 'Simpan'; }, 1500);
    };

    $('#clear-history').onclick = () => {
      if (confirm('Hapus semua riwayat latihan?')) { clearSessions(); this.renderHistory(); }
    };
  }

  persist() {
    savePrefs({ lang: this.lang, coachVoice: this.coach.enabled, liveVoice: this.liveVoice,
                customFillers: this.customFillers });
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
      { mode: 'cards', icon: '🎲', title: 'Kartu Dadakan', desc: 'Topik acak, 15 detik berpikir, 60 detik bicara. Melatih berpikir sambil berdiri.' },
      { mode: 'outline', icon: '🧱', title: 'Kerangka Pitch', desc: 'Susun isi pitch pakai pola Hook, Cerita, Poin, Ajakan. Lalu latihan dengan pemandu waktu tiap bagian.' },
      { mode: 'articulation', icon: '👄', title: 'Artikulasi', desc: 'Kalimat sulit untuk melenturkan lidah dan bibir. Dinilai per kata.' },
      { mode: 'clarity', icon: '🔊', title: 'Kejelasan Pelafalan', desc: 'Baca kalimat pitching. Kata yang tidak jelas ditandai merah.' },
      { mode: 'pace', icon: '⏱️', title: 'Kecepatan & Ritme', desc: 'Ikuti penunjuk tempo, dan berhenti di setiap tanda baca supaya tidak nyerocos.' }
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

    if (p.self) {
      const self = el('p', 'muted');
      self.textContent = `Penilaian dirimu (${p.self.count} sesi): percaya diri ${p.self.confidence}/5, `
        + `energi ${p.self.energy}/5, kejelasan pesan ${p.self.message}/5.`;
      box.append(self);
    }
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
    if (mode === 'outline') return this.openOutlineBuilder();
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
    if (mode === 'cards') {
      const groups = TOPICS[this.lang] || {};
      const all = Object.values(groups).flat();
      return [
        { id: 'cards-all', title: 'Acak dari semua kategori', brief: `${all.length} topik siap diundi.`, topics: all,
          prep: CARD_TIMING.prep, seconds: CARD_TIMING.speak, hardStop: true },
        ...Object.entries(groups).map(([name, list]) => ({
          id: 'cards-' + name, title: name, brief: `${list.length} topik.`, topics: list,
          prep: CARD_TIMING.prep, seconds: CARD_TIMING.speak, hardStop: true
        }))
      ];
    }
    if (mode === 'articulation') return (ARTICULATION[this.lang] || []).map((t, i) => ({ id: 'art' + i, title: `Latihan ${i + 1}`, brief: t, script: t }));
    if (mode === 'clarity') return (CLARITY[this.lang] || []).map((t, i) => ({ id: 'cla' + i, title: `Kalimat ${i + 1}`, brief: t, script: t }));
    if (mode === 'pace') {
      const script = PACE_SCRIPT[this.lang];
      const rhythm = RHYTHM_SCRIPT[this.lang];
      const band = PACE[this.lang];
      const howto = 'Ikuti sorotan kata. Berhenti setiap ketemu garis miring: / sebentar saja, // ambil napas.';
      return [
        { id: 'pace-rhythm', title: 'Ritme & jeda (kalimat pendek)', brief: 'Naskah penuh titik. Latihan paling pas kalau kamu cenderung nyerocos. ' + howto, script: rhythm, target: band.ideal },
        { id: 'pace-ideal', title: `Tempo ideal (${band.ideal} kpm)`, brief: 'Kecepatan yang paling nyaman didengar klien. ' + howto, script, target: band.ideal },
        { id: 'pace-slow', title: `Tempo tenang (${band.min} kpm)`, brief: 'Untuk membuka presentasi dan menekankan angka penting. ' + howto, script, target: band.min },
        { id: 'pace-fast', title: `Tempo energik (${band.max} kpm)`, brief: 'Untuk bagian cerita dan demo produk. ' + howto, script, target: band.max }
      ];
    }
    return [];
  }

  /* ---------- penyusun kerangka pitch ---------- */

  openOutlineBuilder(preset = null) {
    this.show('outline');
    const sel = $('#outline-template');
    if (!sel.options.length) OUTLINES.forEach(o => sel.append(new Option(o.title, o.id)));
    sel.value = preset?.templateId || sel.value || OUTLINES[0].id;
    $('#outline-name').value = preset?.name || '';
    this.editingOutlineId = preset?.id || null;

    const draw = () => this.renderOutlineFields(preset && preset.templateId === sel.value ? preset : null);
    sel.onchange = () => { this.editingOutlineId = null; draw(); };
    draw();

    $('#outline-back').onclick = () => this.renderHome();
    $('#outline-save').onclick = () => this.saveCurrentOutline();
    $('#outline-practice').onclick = () => this.practiceOutline();
    this.renderOutlineList();
  }

  renderOutlineFields(preset) {
    const tpl = OUTLINES.find(o => o.id === $('#outline-template').value);
    $('#outline-desc').textContent = tpl.desc;
    const box = $('#outline-fields');
    box.innerHTML = '';
    tpl.sections.forEach((sec, i) => {
      const wrap = el('div', 'field');
      wrap.append(el('label', null, `${sec.name} — ${sec.seconds} detik`));
      wrap.append(el('p', 'muted', sec.hint));
      const ta = el('textarea');
      ta.rows = 2;
      ta.placeholder = 'Tulis kalimatmu sendiri di sini';
      ta.value = preset?.sections?.[i]?.text || '';
      ta.dataset.i = i;
      wrap.append(ta);
      box.append(wrap);
    });
    const total = tpl.sections.reduce((a, s2) => a + s2.seconds, 0);
    $('#outline-total').textContent = `Total ${total} detik.`;
  }

  currentOutline() {
    const tpl = OUTLINES.find(o => o.id === $('#outline-template').value);
    const texts = $$('#outline-fields textarea').map(t => t.value.trim());
    return {
      id: this.editingOutlineId || 'o' + Date.now(),
      templateId: tpl.id,
      name: $('#outline-name').value.trim() || tpl.title,
      sections: tpl.sections.map((sec, i) => ({ ...sec, text: texts[i] || '' }))
    };
  }

  saveCurrentOutline() {
    const o = this.currentOutline();
    this.editingOutlineId = o.id;
    saveOutline(o);
    this.renderOutlineList();
    $('#outline-save').textContent = 'Tersimpan';
    setTimeout(() => { $('#outline-save').textContent = 'Simpan kerangka'; }, 1500);
  }

  practiceOutline() {
    const o = this.currentOutline();
    const total = o.sections.reduce((a, s2) => a + s2.seconds, 0);
    this.prepare('outline', {
      id: o.id, title: o.name, seconds: total, sections: o.sections,
      brief: 'Ikuti bagian yang disorot. Asisten akan memberi aba-aba setiap ganti bagian.'
    });
  }

  renderOutlineList() {
    const box = $('#outline-list');
    box.innerHTML = '';
    const all = loadOutlines();
    if (!all.length) { box.append(el('p', 'muted', 'Belum ada kerangka tersimpan.')); return; }
    all.forEach(o => {
      const row = el('div', 'history-row');
      const meta = el('div', 'history-meta');
      meta.append(el('strong', null, o.name));
      meta.append(el('span', 'muted', o.sections.map(x => x.name).join(' → ')));
      const openBtn = el('button', 'btn ghost small', 'Buka');
      openBtn.onclick = () => this.openOutlineBuilder(o);
      const delBtn = el('button', 'btn ghost small', 'Hapus');
      delBtn.onclick = () => { deleteOutline(o.id); this.renderOutlineList(); };
      row.append(meta, openBtn, delBtn);
      box.append(row);
    });
  }

  /* ---------- sesi latihan ---------- */

  async prepare(mode, item) {
    this.show('session');
    this.session = { mode, item, qaAsked: false };

    if (mode === 'cards') {
      this.session.item = item;
      setTimeout(() => this.drawCard(item), 50);
    } else $('#session-brief').classList.remove('topic-card');

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
    this.session.tokens = null;
    if (item.script) {
      scriptBox.hidden = false;
      this.session.tokens = this.renderScript(scriptBox, item.script);
    } else scriptBox.hidden = true;

    // penanda bagian untuk latihan dengan kerangka
    const track = $('#outline-track');
    track.innerHTML = '';
    if (item.sections) {
      track.hidden = false;
      item.sections.forEach((sec, i) => {
        const card = el('div', 'osec');
        card.dataset.i = i;
        card.append(el('strong', null, `${sec.name} · ${sec.seconds} dtk`));
        card.append(el('p', null, sec.text || sec.hint));
        track.append(card);
      });
    } else track.hidden = true;

    this.buildTapRow();
    $('#gauge-needle').style.left = '0%';
    $('#gauge-needle').style.opacity = '0';

    const oldDraw = $('#btn-draw');
    if (oldDraw) oldDraw.remove();
    if (mode === 'cards') {
      const draw = el('button', 'btn ghost', 'Kartu lain');
      draw.id = 'btn-draw';
      draw.onclick = () => this.drawCard(item);
      $('#btn-start').parentNode.insertBefore(draw, $('#btn-start'));
    }

    $('#btn-start').onclick = () => (item.prep ? this.beginPrep(item.prep) : this.start());
    $('#btn-stop').onclick = () => this.finish();
    $('#session-back').onclick = () => this.leaveSession();

    const intro = COACH_INTRO[this.lang]?.[mode];
    if (intro) { $('#coach-cue').textContent = intro; this.coach.say(intro, { interrupt: true }); }
  }

  /** Mengundi satu topik kartu dadakan dan menampilkannya. */
  drawCard(item) {
    const topic = item.topics[Math.floor(Math.random() * item.topics.length)];
    this.session.topic = topic;
    $('#session-brief').textContent = topic;
    $('#session-brief').classList.add('topic-card');
    this.coach.say(topic, { interrupt: true });
    return topic;
  }

  /** Waktu berpikir sebelum bicara, khusus kartu dadakan. */
  beginPrep(sec) {
    const cue = $('#coach-cue');
    const btn = $('#btn-start');
    let left = sec;
    cue.textContent = `Waktu berpikir: ${left} detik`;
    btn.textContent = 'Lewati, mulai sekarang';
    btn.onclick = () => { clearInterval(this.prepId); this.start(); };
    this.coach.say(`Kamu punya ${sec} detik untuk berpikir. Susun poin, alasan, lalu contoh.`, { interrupt: true });
    this.prepId = setInterval(() => {
      left--;
      cue.textContent = `Waktu berpikir: ${left} detik`;
      if (left <= 3 && left > 0) this.coach.say(String(left));
      if (left <= 0) { clearInterval(this.prepId); this.coach.say('Mulai.', { interrupt: true }); this.start(); }
    }, 1000);
  }

  /** Tombol untuk mencatat sendiri kata pengisi yang terdengar saat latihan. */
  buildTapRow() {
    const box = $('#tap-buttons');
    box.innerHTML = '';
    this.manualFillers = {};
    $('#tap-total').textContent = '0';
    const base = TAP_FILLERS[this.lang] || [];
    const list = [...new Set([...this.customFillers, ...base])].slice(0, 6);
    list.forEach(word => {
      const b = el('button', 'tap-btn');
      b.append(el('span', 'tap-word', word), el('span', 'tap-count', '0'));
      b.onclick = () => {
        this.manualFillers[word] = (this.manualFillers[word] || 0) + 1;
        b.querySelector('.tap-count').textContent = String(this.manualFillers[word]);
        const total = Object.values(this.manualFillers).reduce((a, c) => a + c, 0);
        $('#tap-total').textContent = String(total);
      };
      box.append(b);
    });
  }

  /**
   * Menggambar naskah lengkap dengan tanda bacanya, lalu menyisipkan tanda
   * ambil napas: "/" untuk berhenti sebentar, "//" untuk tarik napas.
   */
  renderScript(box, script) {
    const tokens = tokenize(script);
    if (!tokens) {
      // Naskah tidak bisa dipetakan per kata, tampilkan apa adanya.
      box.textContent = script;
      return null;
    }
    tokens.forEach((tok, i) => {
      const span = el('span', 'w', tok.word + tok.punct);
      span.dataset.i = i;
      box.append(span);
      if (tok.pause) {
        const mark = el('span', 'breath', tok.pause >= 600 ? '//' : '/');
        mark.dataset.i = i;
        mark.title = tok.pause >= 600 ? 'Tarik napas' : 'Berhenti sebentar';
        box.append(' ', mark, ' ');
      } else box.append(' ');
    });
    return tokens;
  }

  /** Jadwal penunjuk tempo: tiap kata dapat jatah waktu, tiap tanda baca dapat jeda. */
  buildSchedule(tokens, targetWpm) {
    const perWord = 60000 / targetWpm;
    let t = 0;
    const steps = [];
    tokens.forEach((tok, i) => {
      steps.push({ type: 'w', i, until: (t += perWord) });
      if (tok.pause) steps.push({ type: 'p', i, until: (t += tok.pause) });
    });
    return steps;
  }

  async start() {
    clearInterval(this.prepId);
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
    this.session.pacerStep = -1;
    this.session.schedule = (this.session.mode === 'pace' && this.session.tokens && this.session.item.target)
      ? this.buildSchedule(this.session.tokens, this.session.item.target) : null;
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

    const fillers = countFillers(text, this.lang, this.customFillers);
    const manual = Object.values(this.manualFillers || {}).reduce((a, c) => a + c, 0);
    $('#filler-count').textContent = String(Math.max(fillers.total, manual));

    // jarum kecepatan: 0% terlalu lambat, 50% pas, 100% terlalu cepat
    const lo = band.min - 40, hi = band.max + 40;
    const pos = speed ? Math.max(0, Math.min(100, ((speed - lo) / (hi - lo)) * 100)) : 0;
    $('#gauge-needle').style.left = pos + '%';
    $('#gauge-needle').style.opacity = speed ? '1' : '0';

    // penunjuk tempo: menyorot kata, lalu berhenti di tanda ambil napas
    if (s.schedule) {
      let step = s.pacerStep;
      while (step + 1 < s.schedule.length && elapsed > s.schedule[step + 1].until) step++;
      if (step !== s.pacerStep) {
        s.pacerStep = step;
        const cur = s.schedule[step + 1];
        $$('#script-box .w, #script-box .breath').forEach(sp => sp.classList.remove('pacer'));
        if (cur) {
          const sel = cur.type === 'w' ? '.w' : '.breath';
          const node = $(`#script-box ${sel}[data-i="${cur.i}"]`);
          if (node) {
            node.classList.add('pacer');
            node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      }
      if (step + 1 >= s.schedule.length) { this.finish(); return; }
    }

    // penunjuk bagian saat latihan dengan kerangka
    if (s.item.sections) {
      let acc = 0, active = s.item.sections.length - 1;
      for (let i = 0; i < s.item.sections.length; i++) {
        acc += s.item.sections[i].seconds;
        if (sec < acc) { active = i; break; }
      }
      if (active !== s.activeSection) {
        s.activeSection = active;
        $$('#outline-track .osec').forEach((c, i) => c.classList.toggle('active', i === active));
        const name = s.item.sections[active].name;
        $('#coach-cue').textContent = `Sekarang bagian: ${name}`;
        this.coach.say(`Bagian ${name}.`, { interrupt: true });
      }
      if (sec >= acc + 20) { this.finish(); return; }
    }

    // batas waktu skenario
    if (s.item.hardStop && s.item.seconds && sec >= s.item.seconds) { this.finish(); return; }
    if (s.mode === 'pitch' && s.item.seconds && sec >= s.item.seconds + 15) this.finish();

    const cue = this.live.evaluate({
      wpm: speed, band,
      rms: this._frame?.rms || 0,
      silentMs: this._frame?.silentMs || 0,
      runMs: this._frame?.runMs || 0,
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
      confidence: this.stt.avgConfidence,
      script: item.script || null,
      extraFillers: this.customFillers,
      manualFillers: Object.values(this.manualFillers || {}).reduce((a, c) => a + c, 0)
    });
    const feedback = buildFeedback(result, this.lang, this.session.mode);
    this.lastResult = { result, feedback, text, blob, item, mode: this.session.mode, missed, cmp };

    saveSession({
      at: Date.now(), mode: this.session.mode, title: this.session.topic || item.title,
      overall: result.overall, parts: result.parts, stats: result.stats
    });

    this.renderReport();
    this.coach.say(feedback.spoken, { interrupt: true });
  }

  /** Tiga penilaian diri 1-5, disimpan bersama sesi supaya bisa dibandingkan. */
  renderSelfRating() {
    const box = $('#self-rate');
    box.innerHTML = '';
    $('#self-saved').hidden = true;
    this.selfRating = {};
    Object.entries(SELF_LABEL).forEach(([key, label]) => {
      const row = el('div', 'rate-row');
      row.append(el('span', 'rate-label', label));
      const group = el('div', 'rate-stars');
      for (let n = 1; n <= 5; n++) {
        const b = el('button', 'star', String(n));
        b.onclick = () => {
          this.selfRating[key] = n;
          [...group.children].forEach((c, i) => c.classList.toggle('on', i < n));
          rateLastSession(this.selfRating);
          $('#self-saved').hidden = false;
        };
        group.append(b);
      }
      row.append(group);
      box.append(row);
    });
  }

  /**
   * Menyalin ringkasan sesi ke papan klip, siap ditempel ke Claude untuk
   * analisis lanjutan. Aplikasi ini sendiri tidak mengirim apa pun ke internet.
   */
  async copyForClaude() {
    const { result, text, item, mode } = this.lastResult;
    const s = result.stats;
    const lines = [
      'Saya sedang melatih public speaking untuk pitching di depan klien.',
      'Berikut hasil sesi latihan terakhir saya, diukur otomatis dari rekaman suara.',
      '',
      `Jenis latihan: ${MODE_LABEL[mode]} — ${this.session?.topic || item.title}`,
      `Durasi: ${s.durationSec} detik, ${s.wordCount} kata`,
      `Kecepatan: ${s.wpm} kata per menit (target ${s.band.min}-${s.band.max})`,
      `Kata pengisi: ${s.fillerCount} (${s.fillerRate} per menit)`,
      `Ritme: rata-rata ${s.avgRunSec} detik sekali tarikan napas, terpanjang ${s.maxRunSec} detik`,
      s.expectedBreaths ? `Berhenti di tanda baca: ${s.breaths} dari ${s.expectedBreaths}` : '',
      `Variasi nada: ${s.semitoneRange} semitone. Dinamika volume: ${s.dynamics}`,
      `Skor per aspek: ${Object.entries(result.parts).map(([k, v]) => `${ASPECT_LABEL[k]} ${v}`).join(', ')}`,
      `Skor keseluruhan: ${result.overall} dari 100`,
      Object.keys(this.selfRating || {}).length
        ? `Penilaian diri saya (1-5): ${Object.entries(this.selfRating).map(([k, v]) => `${SELF_LABEL[k]} ${v}`).join(', ')}`
        : '',
      '',
      'Transkrip apa adanya:',
      text || '(tidak ada transkrip)',
      '',
      'Tolong nilai isi dan cara penyampaian saya: apakah pesannya jelas, apakah pembukaannya menarik,',
      'bagian mana yang bertele-tele, dan apa satu perubahan yang paling berdampak untuk latihan berikutnya.'
    ].filter(Boolean).join('\n');

    const btn = $('#btn-copy-claude');
    try {
      await navigator.clipboard.writeText(lines);
      btn.textContent = 'Tersalin, tinggal tempel ke Claude';
    } catch {
      btn.textContent = 'Gagal menyalin, teks ditampilkan di bawah';
      const pre = el('pre', 'copy-fallback', lines);
      btn.parentNode.after(pre);
    }
    setTimeout(() => { btn.textContent = 'Salin ringkasan untuk Claude'; }, 3000);
  }

  leaveSession() {
    clearInterval(this.timerId);
    clearInterval(this.prepId);
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
      ['Kata pengisi', s.fillerManual
        ? `${s.fillerCount} (mesin ${s.fillerAuto}, kamu catat ${s.fillerManual})`
        : `${s.fillerCount} (${s.fillerRate}/menit)`],
      ['Jeda panjang', String(s.longPauses)],
      ['Variasi nada', `${s.semitoneRange} semitone`],
      ['Napas per tarikan', `${s.avgRunSec} detik (terpanjang ${s.maxRunSec})`],
      ['Dinamika volume', String(s.dynamics)]
    ];
    if (s.expectedBreaths > 0) statItems.push(['Berhenti di tanda baca', `${s.breaths} dari ${s.expectedBreaths}`]);
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
      const toks = tokenize(item.script);
      cmp.targetWords.forEach((w, i) => {
        const tok = toks ? toks[i] : null;
        const span = el('span', cmp.matched[i] ? 'w hit' : 'w miss', tok ? tok.word + tok.punct : w);
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

    this.renderSelfRating();
    $('#btn-copy-claude').onclick = () => this.copyForClaude();
    $('#btn-repeat').onclick = () => this.prepare(mode, item);
    $('#btn-home').onclick = () => this.renderHome();
    $('#btn-replay-feedback').onclick = () => this.coach.say(feedback.spoken, { interrupt: true });
  }
}

window.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
