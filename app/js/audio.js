import { AUDIO } from './config.js';

/**
 * Membungkus akses mikrofon: level suara, deteksi jeda, perkiraan nada dasar
 * (untuk mengukur monoton), dan perekaman untuk diputar ulang.
 */
export class MicEngine {
  constructor() {
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.recorder = null;
    this.chunks = [];
    this.raf = 0;
    this.onFrame = null;

    this.reset();
  }

  reset() {
    this.frames = 0;
    this.voicedFrames = 0;
    this.loudFrames = 0;
    this.rmsSum = 0;
    this.peakRms = 0;
    this.pitches = [];
    this.pauses = [];
    this.longPauses = 0;
    this._silenceStart = null;
    this.startedAt = 0;
    this.lastBlob = null;
  }

  get supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /** Meminta izin mikrofon. Dipanggil dari aksi klik pengguna. */
  async requestAccess() {
    if (!this.supported) throw new Error('Browser ini tidak mendukung akses mikrofon.');
    if (this.stream && this.stream.active) return this.stream;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false }
    });
    return this.stream;
  }

  async start({ record = true } = {}) {
    await this.requestAccess();
    this.reset();
    this.startedAt = performance.now();

    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.6;
    source.connect(this.analyser);
    this._buf = new Float32Array(this.analyser.fftSize);

    if (record && window.MediaRecorder) {
      this.chunks = [];
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t));
      try {
        this.recorder = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
        this.recorder.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
        this.recorder.start(250);
      } catch { this.recorder = null; }
    }

    this._loop();
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this._closePause(performance.now());
    return new Promise(resolve => {
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.onstop = () => {
          this.lastBlob = new Blob(this.chunks, { type: this.recorder.mimeType || 'audio/webm' });
          resolve(this.lastBlob);
        };
        this.recorder.stop();
      } else resolve(null);
    });
  }

  /** Melepas mikrofon sepenuhnya (lampu mic browser mati). */
  release() {
    cancelAnimationFrame(this.raf);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.ctx && this.ctx.state !== 'closed') this.ctx.close();
    this.ctx = null;
  }

  _loop() {
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      if (!this.analyser) return;
      this.analyser.getFloatTimeDomainData(this._buf);

      let sum = 0;
      for (let i = 0; i < this._buf.length; i++) sum += this._buf[i] * this._buf[i];
      const rms = Math.sqrt(sum / this._buf.length);
      const now = performance.now();

      this.frames++;
      this.rmsSum += rms;
      if (rms > this.peakRms) this.peakRms = rms;

      if (rms >= AUDIO.silenceRms) {
        this.voicedFrames++;
        if (rms >= AUDIO.quietRms) this.loudFrames++;
        this._closePause(now);
        const f0 = this._detectPitch(this._buf, this.ctx.sampleRate);
        if (f0) this.pitches.push(f0);
      } else if (this._silenceStart === null) {
        this._silenceStart = now;
      }

      if (this.onFrame) {
        this.onFrame({
          rms,
          level: Math.min(1, rms / 0.25),
          silentMs: this._silenceStart ? now - this._silenceStart : 0
        });
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  _closePause(now) {
    if (this._silenceStart === null) return;
    const dur = now - this._silenceStart;
    this._silenceStart = null;
    if (dur >= AUDIO.pauseMs) {
      this.pauses.push(dur);
      if (dur >= AUDIO.longPauseMs) this.longPauses++;
    }
  }

  /** Autokorelasi sederhana untuk memperkirakan nada dasar suara (80-350 Hz). */
  _detectPitch(buf, sampleRate) {
    const minLag = Math.floor(sampleRate / 350);
    const maxLag = Math.floor(sampleRate / 80);
    let best = -1, bestCorr = 0, prevCorr = 1;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      for (let i = 0; i < buf.length - lag; i++) corr += buf[i] * buf[i + lag];
      corr /= (buf.length - lag);
      if (corr > bestCorr && corr > prevCorr) { bestCorr = corr; best = lag; }
      prevCorr = corr;
    }
    if (best < 0 || bestCorr < 0.002) return null;
    return sampleRate / best;
  }

  /** Ringkasan metrik audio untuk laporan akhir. */
  summary() {
    const durationMs = this.startedAt ? performance.now() - this.startedAt : 0;
    const voicedRatio = this.frames ? this.voicedFrames / this.frames : 0;
    const loudRatio = this.voicedFrames ? this.loudFrames / this.voicedFrames : 0;
    let semitoneRange = 0, medianHz = 0;
    if (this.pitches.length > 8) {
      const sorted = [...this.pitches].sort((a, b) => a - b);
      const p10 = sorted[Math.floor(sorted.length * 0.1)];
      const p90 = sorted[Math.floor(sorted.length * 0.9)];
      medianHz = sorted[Math.floor(sorted.length / 2)];
      semitoneRange = 12 * Math.log2(p90 / p10);
    }
    return {
      durationMs,
      avgRms: this.frames ? this.rmsSum / this.frames : 0,
      peakRms: this.peakRms,
      voicedRatio,
      loudRatio,
      pauseCount: this.pauses.length,
      longPauses: this.longPauses,
      avgPauseMs: this.pauses.length ? this.pauses.reduce((a, b) => a + b, 0) / this.pauses.length : 0,
      semitoneRange,
      medianHz
    };
  }
}
