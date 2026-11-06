// Persistent state in localStorage key "zrinyi.v1". All access wrapped in try/catch;
// falls back to in-memory state if storage is unavailable.
import { ensureRw } from './rewards.js';
const KEY = 'zrinyi.v1';
const MAX_SESSIONS = 200;
const KEEP_ITEMS = 30; // keep per-problem details only for the most recent sessions

let state = null;
// Several tabs / an installed app / a page restored from the back-forward cache can hold an OLD copy of the state in memory.
// To stop such a stale copy from overwriting newer progress, every grade carries a revision counter `rev`.
// A tab may only write a grade whose stored revision is still the one it loaded; otherwise the stored (newer) grade wins
// and this tab reloads it. As a last guard, a write never lowers a grade's earned bones (except reset/import/restore).
let base = {}; // grade -> rev this tab loaded
let snap = {}; // grade -> JSON this tab last loaded or wrote
let allowDown = new Set(); // grades allowed to go backwards on the next save (reset, import, restore)
let onExternal = null; // app callback when newer data from another tab was loaded
const BAK = 'zrinyi.v1.bak';
const BAK_DAYS = 10;

function blank() {
  return { lang: null, grades: {} };
}

export function blankGrade() {
  return { nickname: '', asked: false, sessions: [], problemStats: {}, badges: [], streak: { last: null, count: 0 }, fixedTotal: 0, active: null, rw: null, pendingReview: null, rev: 0 };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    const st = raw ? JSON.parse(raw) : null;
    return st && typeof st === 'object' && st.grades && typeof st.grades === 'object' ? st : null;
  } catch (e) { return null; }
}
function remember() {
  base = {}; snap = {};
  for (const [k, g] of Object.entries(state.grades)) { base[k] = +g.rev || 0; snap[k] = JSON.stringify(g); }
}
const earnedOf = (g) => (g && g.rw ? +g.rw.earned || 0 : 0);

export function load() {
  if (state) return state;
  state = readRaw() || blank();
  remember();
  return state;
}

export function onExternalChange(fn) { onExternal = fn; }

// Re-read storage; if another tab wrote newer data, adopt it. Returns true when something changed.
export function refresh() {
  if (!state) { load(); return false; }
  const st = readRaw();
  if (!st) return false;
  let changed = false;
  for (const [k, g] of Object.entries(st.grades)) {
    if ((+g.rev || 0) > (base[k] || 0) || !state.grades[k]) { state.grades[k] = g; base[k] = +g.rev || 0; snap[k] = JSON.stringify(g); changed = true; }
  }
  if (st.lang && st.lang !== state.lang) { state.lang = st.lang; }
  return changed;
}

function backup(st) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    let list = JSON.parse(localStorage.getItem(BAK) || '[]');
    if (!Array.isArray(list)) list = [];
    const prev = list.find((x) => x.day === day);
    const keep = {};
    // per grade, keep the best (highest earned) copy of the day
    for (const [k, g] of Object.entries(st.grades)) {
      const old = prev && prev.grades && prev.grades[k];
      keep[k] = old && earnedOf(old) > earnedOf(g) ? old : g;
    }
    list = list.filter((x) => x.day !== day);
    list.push({ day, at: Date.now(), grades: keep });
    list.sort((a, b) => (a.day < b.day ? -1 : 1));
    list = list.slice(-BAK_DAYS);
    localStorage.setItem(BAK, JSON.stringify(list));
  } catch (e) { /* backups are best effort (quota) */ }
}

export function save() {
  try {
    for (const g of Object.values(state.grades)) {
      if (g.sessions.length > MAX_SESSIONS) g.sessions = g.sessions.slice(-MAX_SESSIONS);
      const n = g.sessions.length;
      g.sessions.forEach((s, i) => { if (i < n - KEEP_ITEMS && s.items) delete s.items; });
    }
    const stored = readRaw() || blank();
    let external = false;
    const out = { lang: state.lang, grades: {} };
    const keys = new Set([...Object.keys(stored.grades), ...Object.keys(state.grades)]);
    for (const k of keys) {
      const mine = state.grades[k], theirs = stored.grades[k];
      const theirRev = theirs ? +theirs.rev || 0 : -1;
      if (!mine) { out.grades[k] = theirs; continue; }
      const json = JSON.stringify(mine);
      const dirty = json !== snap[k];
      const stale = theirs && theirRev > (base[k] || 0);
      const lowers = theirs && earnedOf(mine) < earnedOf(theirs) && !allowDown.has(k);
      if (stale || (dirty && lowers)) {
        // someone else saved a newer copy: keep theirs, drop this tab's stale copy
        out.grades[k] = theirs; state.grades[k] = theirs; base[k] = theirRev; snap[k] = JSON.stringify(theirs);
        external = true;
        continue;
      }
      if (dirty || !theirs) { mine.rev = Math.max(theirRev, base[k] || 0) + 1; }
      out.grades[k] = mine; base[k] = +mine.rev || 0; snap[k] = JSON.stringify(mine);
    }
    allowDown.clear();
    localStorage.setItem(KEY, JSON.stringify(out));
    backup(out);
    if (external && onExternal) setTimeout(() => onExternal(), 0);
  } catch (e) { /* storage full or blocked: keep in memory */ }
}

// Backups of one grade (newest first) for the parents' restore button
export function backups(g) {
  try {
    const list = JSON.parse(localStorage.getItem(BAK) || '[]');
    return (Array.isArray(list) ? list : []).filter((x) => x.grades && x.grades[String(g)]).map((x) => ({ day: x.day, grade: x.grades[String(g)] })).reverse();
  } catch (e) { return []; }
}
export function restore(g, day) {
  const b = backups(g).find((x) => x.day === day);
  if (!b) return false;
  const k = String(g);
  const cur = load().grades[k];
  state.grades[k] = Object.assign({}, b.grade, { active: null, rev: Math.max(+(cur && cur.rev) || 0, +b.grade.rev || 0) + 1 });
  base[k] = state.grades[k].rev - 1; // so this save is not treated as stale
  snap[k] = '';
  allowDown.add(k);
  save();
  return true;
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
  const k = String(g);
  const old = s.grades[k];
  s.grades[k] = Object.assign(blankGrade(), { nickname: keepName, asked: true, rev: (+(old && old.rev) || 0) });
  allowDown.add(k);
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
  for (const [k, v] of Object.entries(grades)) {
    const old = s.grades[k];
    v.rev = +(old && old.rev) || 0;
    s.grades[k] = v;
    allowDown.add(k);
  }
  save();
}
