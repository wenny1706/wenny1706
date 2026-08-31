const KEY = 'sp-trainer-sessions-v1';
const PREF = 'sp-trainer-prefs-v1';
const OUTLINE = 'sp-trainer-outlines-v1';

export function loadSessions() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export function saveSession(entry) {
  const all = loadSessions();
  all.unshift(entry);
  const trimmed = all.slice(0, 50);
  try { localStorage.setItem(KEY, JSON.stringify(trimmed)); } catch {}
  return trimmed;
}

export function clearSessions() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF)) || {}; }
  catch { return {}; }
}

export function savePrefs(prefs) {
  try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch {}
}

/** Kerangka pitch yang sudah diisi pengguna. */
export function loadOutlines() {
  try { return JSON.parse(localStorage.getItem(OUTLINE)) || []; }
  catch { return []; }
}

/** Menyimpan atau memperbarui satu kerangka berdasarkan id-nya. */
export function saveOutline(entry) {
  const all = loadOutlines();
  const i = all.findIndex(o => o.id === entry.id);
  if (i >= 0) all[i] = entry; else all.unshift(entry);
  try { localStorage.setItem(OUTLINE, JSON.stringify(all.slice(0, 30))); } catch {}
  return all;
}

export function deleteOutline(id) {
  const all = loadOutlines().filter(o => o.id !== id);
  try { localStorage.setItem(OUTLINE, JSON.stringify(all)); } catch {}
  return all;
}

/** Menambahkan penilaian diri ke sesi terakhir yang tersimpan. */
export function rateLastSession(rating) {
  const all = loadSessions();
  if (!all.length) return;
  all[0].self = rating;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

/** Rata-rata skor per aspek dari n sesi terakhir, untuk melihat kemajuan. */
export function progress(sessions, n = 10) {
  const recent = sessions.slice(0, n);
  if (!recent.length) return null;
  const keys = ['clarity', 'pace', 'filler', 'rhythm', 'variety', 'projection', 'energy'];
  const avg = k => Math.round(recent.reduce((s, x) => s + (x.parts?.[k] || 0), 0) / recent.length);
  const rated = recent.filter(x => x.self);
  const selfAvg = k => Math.round(rated.reduce((s, x) => s + (x.self[k] || 0), 0) / rated.length * 10) / 10;

  return {
    count: recent.length,
    overall: Math.round(recent.reduce((s, x) => s + x.overall, 0) / recent.length),
    parts: Object.fromEntries(keys.map(k => [k, avg(k)])),
    best: Math.max(...recent.map(x => x.overall)),
    self: rated.length
      ? { count: rated.length, confidence: selfAvg('confidence'), energy: selfAvg('energy'), message: selfAvg('message') }
      : null
  };
}
