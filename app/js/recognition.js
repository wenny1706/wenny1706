/**
 * Pembungkus Web Speech API untuk transkripsi langsung.
 * Menangani auto-restart karena Chrome menghentikan sesi secara berkala.
 */
export class Transcriber {
  constructor() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.SR = SR;
    this.rec = null;
    this.running = false;
    this.wantRunning = false;
    this.lang = 'id-ID';
    this.finalText = '';
    this.interim = '';
    this.confidences = [];
    this.onUpdate = null;
    this.onError = null;
  }

  get supported() { return !!this.SR; }

  reset() {
    this.finalText = '';
    this.interim = '';
    this.confidences = [];
  }

  start(lang = this.lang) {
    if (!this.supported) return false;
    this.lang = lang;
    this.reset();
    this.wantRunning = true;
    this._spawn();
    return true;
  }

  _spawn() {
    const rec = new this.SR();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const alt = res[0];
        if (res.isFinal) {
          this.finalText += (this.finalText ? ' ' : '') + alt.transcript.trim();
          if (typeof alt.confidence === 'number' && alt.confidence > 0) this.confidences.push(alt.confidence);
        } else {
          interim += alt.transcript;
        }
      }
      this.interim = interim.trim();
      if (this.onUpdate) this.onUpdate(this.finalText, this.interim);
    };

    rec.onerror = e => {
      // "no-speech" dan "aborted" wajar terjadi, jangan ganggu pengguna.
      if (['no-speech', 'aborted', 'network'].includes(e.error)) return;
      if (this.onError) this.onError(e.error);
    };

    rec.onend = () => {
      this.running = false;
      if (this.wantRunning) setTimeout(() => { if (this.wantRunning) this._spawn(); }, 150);
    };

    try {
      rec.start();
      this.running = true;
      this.rec = rec;
    } catch { /* sudah berjalan */ }
  }

  stop() {
    this.wantRunning = false;
    if (this.rec) { try { this.rec.stop(); } catch {} }
    this.running = false;
    const text = (this.finalText + ' ' + this.interim).trim();
    this.interim = '';
    return text;
  }

  get avgConfidence() {
    if (!this.confidences.length) return null;
    return this.confidences.reduce((a, b) => a + b, 0) / this.confidences.length;
  }
}
