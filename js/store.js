// Persistent state in localStorage key "zrinyi.v1". All access wrapped in try/catch;
// falls back to in-memory state if storage is unavailable.
import { ensureRw } from './rewards.js';
const KEY = 'zrinyi.v1';
const MAX_SESSIONS = 200;
const KEEP_ITEMS = 30; // keep per-problem details only for the most recent sessions

let state = null;

function blank() {
  return { lang: null, grades: {} };
}

export function blankGrade() {
  return { nickname: '', asked: false, sessions: [], problemStats: {}, badges: [], streak: { last: null, count: 0 }, fixedTotal: 0, active: null, rw: null, pendingReview: null };
}

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : blank();
    if (!state || typeof state !== 'object' || typeof state.grades !== 'object') state = blank();
  } catch (e) {
    state = blank();
  }
  return state;
}

export function save() {
  try {
    for (const g of Object.values(state.grades)) {
      if (g.sessions.length > MAX_SESSIONS) g.sessions = g.sessions.slice(-MAX_SESSIONS);
      const n = g.sessions.length;
      g.sessions.forEach((s, i) => { if (i < n - KEEP_ITEMS && s.items) delete s.items; });
    }
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* storage full or blocked: keep in memory */ }
}

export function grade(g) {
  const s = load();
  const k = String(g);
  if (!s.grades[k]) s.grades[k] = blankGrade();
  const gr = s.grades[k];
  // fill missing fields from older versions
  const b = blankGrade();
  for (const f in b) if (gr[f] === undefined) gr[f] = b[f];
  const migrating = !gr.rw && gr.sessions.length > 0;
  ensureRw(gr, g); // rewards (bones, goal, wardrobe); migrates older saves once
  if (migrating) save();
  return gr;
}

export function hasGrade(g) {
  const s = load();
  return !!s.grades[String(g)];
}

export function resetGrade(g) {
  const s = load();
  const keepName = s.grades[String(g)] ? s.grades[String(g)].nickname : '';
  s.grades[String(g)] = Object.assign(blankGrade(), { nickname: keepName, asked: true });
  save();
}

export function exportData() {
  const s = load();
  return { app: 'zrinyi-gyakorlo', version: 2, exported: new Date().toISOString(), grades: s.grades };
}

export function parseImport(obj) {
  if (!obj || obj.app !== 'zrinyi-gyakorlo' || typeof obj.grades !== 'object' || !obj.grades) return null;
  const out = {};
  for (const [k, v] of Object.entries(obj.grades)) {
    if (!/^[2-8]$/.test(k) || !v || !Array.isArray(v.sessions) || typeof v.problemStats !== 'object') continue;
    out[k] = Object.assign(blankGrade(), v, { active: null });
    if (out[k].pendingReview && !Array.isArray(out[k].pendingReview.ids)) out[k].pendingReview = null;
    ensureRw(out[k], k); // files from older versions get their starting bones; broken reward fields are repaired
  }
  return Object.keys(out).length ? out : null;
}

export function applyImport(grades) {
  const s = load();
  for (const [k, v] of Object.entries(grades)) s.grades[k] = v;
  save();
}
