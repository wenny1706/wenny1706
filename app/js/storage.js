const KEY = 'sp-trainer-sessions-v1';
const PREF = 'sp-trainer-prefs-v1';

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

/** Rata-rata skor per aspek dari n sesi terakhir, untuk melihat kemajuan. */
export function progress(sessions, n = 10) {
  const recent = sessions.slice(0, n);
  if (!recent.length) return null;
  const keys = ['pace', 'filler', 'clarity', 'projection', 'variety'];
  const avg = k => Math.round(recent.reduce((s, x) => s + (x.parts?.[k] || 0), 0) / recent.length);
  return {
    count: recent.length,
    overall: Math.round(recent.reduce((s, x) => s + x.overall, 0) / recent.length),
    parts: Object.fromEntries(keys.map(k => [k, avg(k)])),
    best: Math.max(...recent.map(x => x.overall))
  };
}
