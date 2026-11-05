// Google Analytics 4 for zrinyi.bodco.pm: anonymous learning-behaviour events.
// Never sent: nicknames, answers typed as text, anything a child writes. Only ids of problems,
// letters A-E, counts and times. Each device gets a random id (localStorage "zrinyi.did"),
// sent as user_id and user property device_id; one child = device + grade (learner_id),
// because siblings on one device use different grades.
// Off on localhost and other hosts; ?ga turns it on anywhere (testing), ?debug adds GA DebugView.

const GA_ID = 'G-DDQG89BBRH';
const DID_KEY = 'zrinyi.did';
const qs = new URLSearchParams(location.search);
const ON = location.hostname === 'zrinyi.bodco.pm' || qs.has('ga');
const DEBUG = qs.has('debug');

function rid() {
  try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* older browsers */ }
  return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
let did = null;
try { did = localStorage.getItem(DID_KEY); if (!did) { did = rid(); localStorage.setItem(DID_KEY, did); } } catch (e) { did = did || rid(); }
export const deviceId = did;

let ctxFn = () => ({});
export function setContext(fn) { ctxFn = fn; }

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
if (ON) {
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  gtag('js', new Date());
  gtag('config', GA_ID, {
    send_page_view: false, // the app sends one page_view per screen (hash routes)
    user_id: did,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    debug_mode: DEBUG || undefined
  });
  gtag('set', 'user_properties', { device_id: did, display_mode: standalone ? 'standalone' : 'browser' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

export function ev(name, params = {}) {
  if (!ON) return;
  const c = ctxFn() || {};
  const p = { ...params };
  if (c.grade && p.grade == null) p.grade = c.grade;
  if (c.grade && p.learner_id == null) p.learner_id = `${did}.g${c.grade}`;
  if (c.lang && p.ui_lang == null) p.ui_lang = c.lang;
  for (const k of Object.keys(p)) if (p[k] === undefined || p[k] === null) delete p[k];
  try { gtag('event', name, p); } catch (e) { /* never break the app */ }
}

export function setUser(props) { if (ON) gtag('set', 'user_properties', props); }

// one page_view per screen; ids in the hash (session ids) are folded so screens group well
let lastPage = '';
export function page(r) {
  const path = r.name === 'start' ? '/' : r.name === 'parents' ? '/parents' : `/g/${r.g}/${r.name}`;
  if (path === lastPage) return;
  lastPage = path;
  ev('page_view', { page_location: `${location.origin}${path}`, page_path: path, page_title: r.name, screen: r.name });
}

/* ---------- per-problem timing ----------
   T[pid] collects, for the problem on screen, visible time, time away (tab hidden), how often the
   child left the tab, how often the chosen option changed and when the first option was picked. */
let T = {}, cur = null, curKey = '', shownAt = 0;
const now = () => Date.now();
function close() {
  if (cur && shownAt) { T[cur].ms += now() - shownAt; }
  shownAt = 0;
}
export function focusProblem(sessKey, pid) {
  if (sessKey !== curKey) { close(); T = {}; cur = null; curKey = sessKey; }
  if (cur === pid && shownAt) return;
  close();
  cur = pid;
  if (!T[pid]) T[pid] = { ms: 0, away: 0, leaves: 0, changes: 0, first: null, views: 0 };
  T[pid].views++;
  shownAt = document.hidden ? 0 : now();
}
export function blurProblem() { close(); cur = null; }
export function picked(pid) {
  const t = T[pid];
  if (!t) return;
  t.changes++;
  if (t.first == null) t.first = t.ms + (shownAt ? now() - shownAt : 0);
}
export function stats(pid) {
  const t = T[pid];
  if (!t) return {};
  const ms = t.ms + (cur === pid && shownAt ? now() - shownAt : 0);
  return { time_ms: ms, away_ms: t.away, tab_leaves: t.leaves, option_changes: Math.max(0, t.changes - 1), first_pick_ms: t.first == null ? undefined : t.first, views: t.views };
}
export function speedBucket(ms) {
  const s = ms / 1000;
  return s < 3 ? 'a_lt3s' : s < 10 ? 'b_3-10s' : s < 30 ? 'c_10-30s' : s < 60 ? 'd_30-60s' : s < 180 ? 'e_1-3m' : 'f_gt3m';
}

// leaving the tab in the middle of a problem (calculator, search, a parent's phone...)
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (cur && shownAt) {
      close(); hiddenAt = now();
      T[cur].leaves++;
      ev('tab_hidden', { problem_id: cur, ...(ctxFn().problem || {}) });
    }
  } else if (hiddenAt) {
    const away = now() - hiddenAt; hiddenAt = 0;
    if (cur && T[cur]) { T[cur].away += away; shownAt = now(); }
    ev('tab_return', { problem_id: cur || undefined, away_ms: away, away_bucket: speedBucket(away) });
  }
});

// time on site until the page goes away, and JS errors (bugs children hit)
window.addEventListener('error', (e) => {
  ev('js_error', { message: String((e && e.message) || 'error').slice(0, 100), source: String((e && e.filename) || '').split('/').pop().slice(0, 40), line: e && e.lineno });
});
