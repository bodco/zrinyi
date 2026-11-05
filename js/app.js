import { STR, TOPICS, BADGE_ICONS, PARENTS } from './i18n.js';
import * as store from './store.js';
import * as L from './logic.js';
import * as R from './rewards.js';
import { owl, archie, archieScene, star, bone, setOutfit } from './mascot.js';

const GRADES = [2, 3, 4, 5, 6, 7, 8];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');
const fxRoot = document.getElementById('fx-root');
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const S = {
  lang: 'hu',
  data: {}, // grade -> problems[] | 'loading' | 'error'
  byId: {},
  sel: null, // selected option in practice quiz
  lockUntil: 0,
  modal: null,
  rv: null, // review state
  lastScreen: '',
  debug: new URLSearchParams(location.search).has('debug'),
  tick: null,
  lastTick: 0,
  cheerIdx: -1,
  cheerText: '',
  hintLock: 0,
  autoSaid: null, // {key, level}: Archie's line after an automatic hint
  autoFlash: null // {key, level}: one-shot highlight of the hint that just opened by itself
};
const regOf = (g) => L.regular(S.data[g]);

/* ---------------- helpers ---------------- */
const t = (k, ...a) => { const v = STR[S.lang][k]; return typeof v === 'function' ? v(...a) : v; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = (v) => (v == null ? '' : typeof v === 'string' || typeof v === 'number' ? String(v) : v[S.lang] || v.hu);
const band = (g) => (g <= 4 ? 'young' : g <= 6 ? 'mid' : 'teen');
const pct = (x) => `${Math.round(x * 100)}%`;
const topicName = (k) => (TOPICS[k] ? TOPICS[k][S.lang] : k);
const topicIcon = (k) => (TOPICS[k] ? TOPICS[k].icon : '•');
const fmtTime = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtDur = (sec) => { const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m} ${t('minutes')} ${s} ${t('seconds')}` : `${s} ${t('seconds')}`; };
const fmtDate = (iso, withTime) => {
  try { return new Intl.DateTimeFormat(S.lang === 'hu' ? 'hu-HU' : 'uk-UA', withTime ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { month: 'short', day: 'numeric' }).format(new Date(iso)); }
  catch (e) { return iso.slice(0, 10); }
};
const blanketIcon = (cls = '') => `<svg class="blk ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6 Q12 3 21 6 L20 18 Q12 21 4 18 Z" fill="#7DD3FC" stroke="#1E5A8A" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.5 5 L8 19.6 M15 4.9 L15.4 19.7 M3.6 11.5 Q12 9.5 20.5 11.5" stroke="#fff" stroke-width="1.7" fill="none"/><path d="M4.4 18.3 l-1 2 M8.5 19.5 l-.4 2 M12.5 19.8 v2 M16.5 19.4 l.5 2 M20 18.2 l1 2" stroke="#1E5A8A" stroke-width="1.2" stroke-linecap="round"/></svg>`;
// daily goal ring; when `to` is given the ring animates from val to to after render
const RING_R = 27, RING_C = 2 * Math.PI * RING_R;
const ringOff = (v, goal) => (RING_C * (1 - Math.min(1, v / Math.max(1, goal)))).toFixed(1);
function ringSVG(val, goal, to = null, cls = '') {
  const done = (to == null ? val : to) >= goal;
  return `<svg class="ring ${done && to == null ? 'done' : ''} ${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="${RING_R}" class="ring-bg"/>
    <circle cx="32" cy="32" r="${RING_R}" class="ring-fg" stroke-dasharray="${RING_C.toFixed(1)}" style="stroke-dashoffset:${ringOff(val, goal)}" transform="rotate(-90 32 32)" ${to != null ? `data-off="${ringOff(to, goal)}" data-done="${done ? 1 : 0}"` : ''}/></svg>`;
}
const rankName = (n) => t('rankNames')[Math.min(n, t('rankNames').length) - 1];
// review gate of a grade: {sid, n} or null. Pending problems that can no longer be reviewed are dropped first.
function gateOf(g) {
  const gr = store.grade(g);
  if (!gr.pendingReview) return null;
  if (Array.isArray(S.data[g])) L.prunePending(gr, (id) => !!S.byId[id]);
  const pr = L.reviewGate(gr);
  if (!pr) { store.save(); return null; }
  return { sid: pr.sid, n: L.pendingCount(gr) };
}
const gateHref = (g, gt) => `#/g/${g}/review/${gt.sid}`;
const gateToast = (gt) => toast(esc(t('gateTitle', gt.n)), 2800, 'point');
const starsRow = (n, cls = '') => `<span class="stars ${cls}" aria-label="${n}/3">${[1, 2, 3].map((i) => star(i <= n, `s${i}`)).join('')}</span>`;

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'parents') return { name: 'parents' };
  if (parts[0] === 'g' && GRADES.includes(+parts[1])) {
    return { name: parts[2] || 'home', g: +parts[1], arg: parts[3] || null };
  }
  return { name: 'start' };
}
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

function setLang(l) {
  S.lang = l === 'uk' ? 'uk' : 'hu';
  const st = store.load();
  st.lang = S.lang;
  store.save();
  document.documentElement.lang = S.lang === 'uk' ? 'uk' : 'hu';
  document.title = STR[S.lang].appName;
}

/* ---------------- data ---------------- */
async function loadGrade(g) {
  if (Array.isArray(S.data[g]) || S.data[g] === 'loading') return;
  S.data[g] = 'loading';
  try {
    const r = await fetch(`data/g${g}.json`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    const arr = await r.json();
    if (!Array.isArray(arr)) throw new Error('bad');
    S.data[g] = arr;
    for (const p of arr) S.byId[p.id] = p;
  } catch (e) {
    S.data[g] = 'error';
  }
  render();
}

/* ---------------- shared UI ---------------- */
function langToggle() {
  return `<div class="lang" role="group" aria-label="Nyelv / Мова">
    <button type="button" data-act="lang" data-l="hu" aria-pressed="${S.lang === 'hu'}" lang="hu">HU</button>
    <button type="button" data-act="lang" data-l="uk" aria-pressed="${S.lang === 'uk'}" lang="uk">UA</button>
  </div>`;
}

function topBar({ back, title, sub }) {
  return `<header class="top">
    ${back ? `<button class="icon-btn" data-act="nav" data-to="${back}" aria-label="${t('back')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>` : `<a class="brand" href="#/" aria-label="${t('home')}">${owl('happy', 'owl-xs')}<span class="bt"><b>Zrínyi</b><small>${S.lang === 'hu' ? 'gyakorló' : 'тренажер'}</small></span></a>`}
    ${title ? `<div class="top-title"><h1>${esc(title)}</h1>${sub ? `<span>${esc(sub)}</span>` : ''}</div>` : '<div class="top-title"></div>'}
    ${langToggle()}
  </header>`;
}

function bubble(html, mood = 'happy', cls = '') {
  return `<div class="say ${cls}">${owl(mood, 'owl-sm')}<div class="bubble">${html}</div></div>`;
}

// stack of opened hint levels (earlier levels stay visible), numbered "1/4", "2/4" ...
function hintStack(list, opened, flash = false) {
  if (!opened) return '';
  const n = list.length;
  return `<div class="hstack" role="list">${list.slice(0, opened).map((h, i) => `<div class="hb${flash && i === opened - 1 ? ' auto-new' : ''}" role="listitem" ${i === opened - 1 ? 'data-focus' : ''}>
    <span class="hb-ic" aria-hidden="true">${owl(i === opened - 1 ? 'think' : 'happy', 'owl-xs')}</span>
    <div class="hb-t"><small aria-label="${esc(t('hintLevelAria', i + 1, n))}"><span class="hnum">${t('hintLevel', i + 1, n)}</span></small><p>${esc(h)}</p></div></div>`).join('')}</div>`;
}
function hintButton(total, opened, act) {
  if (!total) return '';
  if (opened >= total) return `<button type="button" class="hintbtn" disabled>💡 ${t('hintNone')} <span class="hcount">${opened}/${total}</span></button>`;
  return `<button type="button" class="hintbtn" data-act="${act}">💡 ${t('hint')} <span class="hcount">${opened}/${total}</span></button>`;
}
// what Archie says and how he looks in the quiz header
function coachFor(s, opened, total) {
  const mock = s.mode === 'mock';
  if (mock) return { mood: s.idx === 0 ? 'wave' : 'happy', text: s.idx === 0 ? t('coachMock') : '' };
  if (opened > 0 && S.autoSaid && S.autoSaid.key === ahKeyQuiz(s) && S.autoSaid.level === opened) return { mood: 'think', text: t('autoSay') };
  if (opened > 0) {
    const arr = t('coachHint');
    return { mood: 'think', text: arr[Math.min(opened >= total ? 3 : opened - 1, arr.length - 1)] };
  }
  if (s.idx === 0) return { mood: 'wave', text: s.mode === 'challenge' ? t('coachChallenge') : t('coachStart') };
  if (S.cheerIdx === s.idx && S.cheerText) return { mood: 'cheer', text: S.cheerText };
  const arr = t('cheer');
  return { mood: s.idx % 2 ? 'happy' : 'point', text: arr[(s.idx * 3 + s.ids.length) % arr.length] };
}
function coachHTML(c, s) {
  return `<div class="coach ${s.mode === 'challenge' ? 'hard' : ''}" aria-live="polite">
    <span class="coach-ic" aria-hidden="true">${owl(c.mood, 'owl-coach')}</span>
    ${c.text ? `<div class="coach-b"><span>${esc(c.text)}</span></div>` : ''}</div>`;
}

function figureHTML(p) {
  if (!p.figure) return '';
  const m = /<svg[^>]*\swidth="([\d.]+)"/.exec(p.figure);
  const w = m ? Math.max(120, Math.min(340, +m[1])) : 260;
  return `<div class="fig" style="--fw:${w}px">${p.figure}</div>`;
}

function problemHTML(p, num, extra = '') {
  return `<div class="pcard" data-pid="${esc(p.id)}">
    <div class="pmeta"><span class="tchip">${topicIcon(p.topic)} ${esc(topicName(p.topic))}</span>${extra}${num ? `<span class="pnum">${num}</span>` : ''}</div>
    <p class="qtext">${esc(tx(p.q))}</p>
    ${figureHTML(p)}
  </div>`;
}

// opts: {selected, disabled:Set, correct, mine, act}
function optionsHTML(p, o = {}) {
  const vals = LETTERS.map((l) => tx(p.options[l]));
  const short = vals.every((v) => [...v].length <= 4);
  const dis = o.disabled || new Set();
  return `<div class="opts ${short ? 'opts-row' : 'opts-list'}" role="group">
    ${LETTERS.map((l, i) => {
      const cls = ['opt'];
      if (o.selected === l) cls.push('sel');
      if (dis.has(l)) cls.push('tried');
      if (o.correct === l) cls.push('right');
      if (o.mine === l && o.correct && o.correct !== l) cls.push('mine');
      const isDis = dis.has(l) || o.allDisabled;
      return `<button type="button" class="${cls.join(' ')}" data-act="${o.act || 'opt'}" data-l="${l}" ${isDis ? 'disabled' : ''} aria-pressed="${o.selected === l}">
        <span class="opt-l">${l}</span><span class="opt-v">${esc(vals[i])}</span>
        ${dis.has(l) ? `<span class="opt-note">${t('disabledChoice')}</span>` : ''}
        ${o.correct === l ? '<span class="opt-mark ok" aria-hidden="true">✓</span>' : ''}
      </button>`;
    }).join('')}
  </div>`;
}

function modalHTML() {
  const m = S.modal;
  if (!m) return '';
  let body = '';
  if (m.type === 'confirm') {
    body = `${m.outfit ? archieScene(m.mood || 'happy', 'owl-lg sc-modal', m.outfit) : owl(m.mood || 'think', 'owl-md')}<h2 id="mt">${esc(m.title)}</h2><p>${esc(m.text)}</p>
      <div class="mbtns"><button class="btn ghost" data-act="modal-no">${esc(m.no)}</button><button class="btn ${m.danger ? 'danger' : 'primary'}" data-act="modal-yes">${esc(m.yes)}</button></div>`;
  } else if (m.type === 'nickname') {
    const gr = store.grade(m.g);
    body = `${owl('happy', 'owl-md')}<h2 id="mt">${t('nicknameTitle')}</h2><p>${t('nicknameText')}</p>
      <form data-form="nickname"><input class="input" name="nick" maxlength="16" autocomplete="off" placeholder="${t('nicknamePh')}" value="${esc(gr.nickname || '')}" aria-label="${t('nicknamePh')}">
      <div class="mbtns"><button type="button" class="btn ghost" data-act="nick-skip">${t('skipIt')}</button><button type="submit" class="btn primary">${t('save')}</button></div></form>`;
  } else if (m.type === 'grid') {
    const s = activeSess();
    body = `<h2 id="mt">${t('grid')}</h2>
      <div class="qgrid">${s.ids.map((id, i) => `<button class="qcell ${s.answers[i] ? 'ans' : ''} ${i === s.idx ? 'cur' : ''}" data-act="jump" data-i="${i}" aria-label="${i + 1}: ${s.answers[i] ? t('answered') : t('notAnswered')}">${i + 1}${s.answers[i] ? `<small>${s.answers[i]}</small>` : ''}</button>`).join('')}</div>
      <div class="legend"><span><i class="lgd ans"></i>${t('answered')}</span><span><i class="lgd"></i>${t('notAnswered')}</span><span><i class="lgd cur"></i>${t('current')}</span></div>
      <div class="mbtns"><button class="btn ghost" data-act="modal-close">${t('back')}</button><button class="btn primary" data-act="mock-finish">${t('finish')}</button></div>`;
  } else if (m.type === 'pause') {
    body = `${owl('sleep', 'owl-lg')}<h2 id="mt">${t('paused')}</h2><p>${t('pausedText')}</p>
      <div class="mbtns one"><button class="btn primary big" data-act="unpause">${t('continue')}</button></div>`;
  }
  return `<div class="overlay ${m.type === 'pause' ? 'solid' : ''}" ${m.type !== 'pause' ? 'data-act="modal-bg"' : ''}><div class="modal ${m.type}" role="dialog" aria-modal="true" aria-labelledby="mt">${body}</div></div>`;
}

function openModal(m) { S.modal = m; renderModal(); }
function closeModal() { S.modal = null; renderModal(); }
function renderModal() {
  modalRoot.innerHTML = modalHTML();
  document.body.classList.toggle('modal-open', !!S.modal);
  const f = modalRoot.querySelector('input, .btn.primary');
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
  syncAutoHint();
}
function confirmBox(opts) {
  return new Promise((res) => { openModal(Object.assign({ type: 'confirm' }, opts, { resolve: res })); });
}

let toastTimer = null;
function toast(html, ms = 2200, mood = 'happy') {
  toastRoot.innerHTML = `<div class="toast">${owl(mood, 'owl-xs')}<span>${html}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastRoot.innerHTML = ''; }, ms);
}

function confetti(n = 70) {
  if (reduceMotion()) return;
  const colors = ['#FFC83D', '#FF6FA3', '#2DD4BF', '#38BDF8', '#8B5CF6', '#F97316', '#84CC16'];
  let html = '';
  for (let i = 0; i < n; i++) {
    const c = colors[i % colors.length];
    const left = Math.random() * 100, delay = Math.random() * 0.6, dur = 1.8 + Math.random() * 1.4, rot = Math.random() * 720 - 360, size = 6 + Math.random() * 8, drift = Math.random() * 120 - 60;
    html += `<i style="left:${left}%;background:${c};width:${size}px;height:${size * 0.6}px;animation-delay:${delay}s;animation-duration:${dur}s;--rot:${rot}deg;--dx:${drift}px;border-radius:${i % 3 ? 2 : 50}%"></i>`;
  }
  const box = document.createElement('div');
  box.className = 'confetti';
  box.innerHTML = html;
  fxRoot.appendChild(box);
  setTimeout(() => box.remove(), 3800);
}

/* ---------------- screens ---------------- */
function screenStart() {
  const st = store.load();
  const tiles = GRADES.map((g) => {
    const gr = st.grades[String(g)];
    let info = '';
    if (gr && gr.sessions && gr.sessions.length) {
      const sum = L.gradeSummary(gr);
      const last = sum.last;
      if (last) info = `<span class="tile-stats">${starsRow(L.starsOf(last.acc), 'sm')}<span>${t('lastScore')}: ${last.mode === 'mock' ? `${last.score} ${t('points')}` : pct(last.acc)}</span></span>`;
    }
    const nick = gr && gr.nickname ? `<span class="tile-nick">${esc(gr.nickname)}</span>` : '';
    const soon = !L.isReady(g);
    return `<button class="gtile gt${g} ${soon ? 'soon' : ''}" data-act="nav" data-to="#/g/${g}">
      <span class="gnum">${g}.</span><span class="glabel">${t('grade')}</span>${soon ? `<span class="soon-pill">${t('soon')}</span>` : `${nick}${info}`}
    </button>`;
  }).join('');
  return `${topBar({})}
  <main class="wrap start">
    <section class="hero">
      ${owl('wave', 'owl-hero bob')}
      <div><h1 class="h-big">${t('chooseGrade')}</h1><p class="lead">${t('tagline')}</p></div>
    </section>
    <nav class="gtiles" aria-label="${t('chooseGrade')}">${tiles}
      <button class="gtile parents" data-act="nav" data-to="#/parents"><span class="picon" aria-hidden="true">👪</span><span class="glabel">${t('parents')}</span></button>
    </nav>
  </main>`;
}

function screenParents() {
  return `${topBar({ back: '#/', title: t('parentsTitle') })}
  <main class="wrap prose">${bubble(esc(t('parentsSay')), 'point', 'parents-say')}${PARENTS[S.lang]}
    <p class="center"><button class="btn primary" data-act="nav" data-to="#/">${t('chooseGrade')}</button></p>
  </main>`;
}

function loadingOrError(g) {
  const d = S.data[g];
  if (d === 'error') {
    return `${topBar({ back: '#/', title: t('gradeN', g) })}<main class="wrap center-col">${owl('oops', 'owl-lg')}<p class="lead">${t('loadError')}</p><button class="btn primary" data-act="retry-load" data-g="${g}">${t('retry')}</button></main>`;
  }
  return `${topBar({ back: '#/', title: t('gradeN', g) })}<main class="wrap center-col" aria-busy="true">${owl('think', 'owl-lg bob')}<p class="lead">${t('loading')}</p><div class="dots"><i></i><i></i><i></i></div></main>`;
}

function comingSoon(g) {
  return `${topBar({ back: '#/', title: t('gradeN', g) })}
  <main class="wrap center-col soon">${owl('sleep', 'owl-hero')}<h1 class="h-big">${t('comingSoonTitle')}</h1><p class="lead">${t('comingSoonText', g)}</p>
  <button class="btn primary big" data-act="nav" data-to="#/">${t('otherGrade')}</button></main>`;
}

function screenHome(g) {
  const all = S.data[g];
  const gr = store.grade(g);
  const rw = gr.rw;
  const sum = L.gradeSummary(gr);
  const mist = L.openMistakes(all, gr).length;
  const nch = L.challengeCount(all);
  const today = L.dayKey();
  const tb = R.todayBones(rw, today);
  const lv = L.rankOf(rw.earned);
  const act = gr.active && gr.active.ids.every((id) => S.byId[id]) ? gr.active : null;
  const done = act ? act.answers.filter((a, i) => i < act.idx || a).length : 0;
  const goalOk = tb >= rw.goal;
  const say = gateOf(g) ? t('homeSayGate') : act && act.mode === 'full' ? t('homeSayFull') : mist ? t('homeSayMist', mist) : goalOk ? t('homeSayGoal') : sum.streak >= 2 ? t('homeSayStreak', sum.streak) : sum.sessions ? t('homeSayBack') : t('homeSayNew');
  const mm = L.mockMinutes(g);
  const nPaper = Math.min(L.mockN(g), regOf(g).length);
  const prot = L.streakProtected(gr, today);
  const frozen = new Set(rw.frozen || []);
  const wk = R.weekDays(today);
  const actN = R.activeDaysThisWeek(rw, today);
  const chestOpen = !!rw.chests[R.weekKey(today)];
  const wd = t('weekdays');
  const gt = gateOf(g);
  // mode card: when the review gate is on, practice modes are locked (a tap explains why instead of starting)
  const modeBtn = (cls, act, attrs, inner, go = '') => gt && cls !== 'm-mist'
    ? `<button class="mode ${cls} locked" data-act="gated" aria-label="${esc(inner.label)}: ${esc(t('lockedMode'))}">${inner.html}<span class="lock" aria-hidden="true">🔒</span></button>`
    : `<button class="mode ${cls}" data-act="${act}" ${attrs}>${inner.html}${go}</button>`;
  const mi = (icon, label, sub) => ({ label, html: `<span class="mi" aria-hidden="true">${icon}</span><span class="mt"><b>${label}</b><small>${sub}</small></span>` });
  const goArrow = '<span class="go" aria-hidden="true">›</span>';
  return `${topBar({ back: '#/', title: t('gradeN', g) })}
  <main class="wrap home">
    ${gt ? `<section class="gate" aria-live="polite">
      ${owl('point', 'owl-md')}
      <div class="gate-t"><h2>${esc(t('gateTitle', gt.n))}</h2><p>${esc(t('gateSub'))}</p></div>
      <button class="btn primary big" data-act="nav" data-to="${gateHref(g, gt)}">🔍 ${t('gateBtn')}</button>
    </section>` : ''}
    <section class="greet ${R.outfitFor(rw).house ? 'has-house' : ''}">
      ${archieScene(gt ? 'point' : mist ? 'point' : goalOk || sum.streak >= 2 ? 'cheer' : 'wave', 'owl-lg sc-home bob')}
      <div class="greet-txt">
        <h2 class="h-big">${esc(t('hello', gr.nickname))}</h2>
        <p class="greet-say">${esc(say)}</p>
        <button class="link" data-act="edit-name">✎ ${t('editName')}</button>
      </div>
    </section>
    <section class="rank" aria-label="${esc(t('levelN', lv.n))}">
      <span class="lv-num" aria-hidden="true">${lv.n}</span>
      <div class="rank-t">
        <b>${esc(rankName(lv.n))}</b>
        <span class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${lv.need || 1}" aria-valuenow="${lv.max ? 1 : lv.into}"><i style="width:${lv.max ? 100 : Math.round((lv.into / lv.need) * 100)}%"></i></span>
        <small>${t('levelN', lv.n)} · ${lv.max ? t('maxLevel') : t('toNext', lv.into, lv.need)}</small>
      </div>
      <button class="bones-pill" data-act="nav" data-to="#/g/${g}/shop" aria-label="${esc(t('shopTitle'))}: ${esc(t('bonesN', rw.bones))}">${bone()}<b>${rw.bones}</b></button>
    </section>
    <section class="today" aria-label="${t('todayGoal')}">
      <div class="today-top">
        <div class="ring-box">${ringSVG(tb, rw.goal)}<span class="ring-c">${goalOk ? '<b class="ok">✓</b>' : `<b>${tb}</b><small>/${rw.goal}</small>`}</span></div>
        <div class="today-t">
          <b>${t('todayGoal')}</b>
          <small>${goalOk ? t('goalDone') : `${t('goalOf', tb, rw.goal)} · ${t('goalLeft', rw.goal - tb)}`}</small>
          <span class="streak ${sum.streak ? 'on' : ''}"><span aria-hidden="true">🔥</span> ${esc(t('streakN', sum.streak))}</span>
          ${prot ? `<span class="safe">${blanketIcon()} ${t('streakSafe')}</span>` : rw.freezes ? `<span class="safe">${blanketIcon()} ${t('blanketN', rw.freezes)}</span>` : ''}
        </div>
      </div>
      <div class="week" aria-label="${t('weekTitle')}">
        <ol class="wk-days">${wk.map((d, i) => {
          const on = (rw.days[d] || 0) > 0, fz = !on && frozen.has(d);
          return `<li class="${on ? 'on' : ''} ${fz ? 'fz' : ''} ${d === today ? 'now' : ''} ${d > today ? 'fut' : ''}"><i aria-hidden="true">${on ? '🔥' : fz ? blanketIcon() : ''}</i><small>${wd[i]}</small></li>`;
        }).join('')}</ol>
        <div class="chest ${chestOpen ? 'open' : ''}"><span aria-hidden="true">🎁</span><small>${chestOpen ? t('chestReady') : t('weekChest', Math.min(actN, R.CHEST_DAYS), R.CHEST_DAYS)}</small></div>
      </div>
    </section>
    ${act ? `<section class="resume">
      <div><b>${t('resumeTitle')}</b><span>${esc(t('modeNames')[act.mode])}${act.topic ? `: ${esc(topicName(act.topic))}` : ''}. ${t('resumeText', done, act.ids.length)}</span></div>
      <div class="row"><button class="btn ghost sm" data-act="discard">${t('discard')}</button><button class="btn primary sm" data-act="resume">${t('resume')}</button></div>
    </section>` : ''}
    <section class="modes">
      ${modeBtn('m-quick', 'start', 'data-mode="quick"', mi('⚡', t('modeQuick'), t('modeQuickSub')), goArrow)}
      ${modeBtn('m-full', 'start', 'data-mode="full"', mi('📝', t('modeFull'), t('modeFullSub', nPaper)), goArrow)}
      ${modeBtn('m-mock', 'nav', `data-to="#/g/${g}/mock"`, mi('🏆', t('modeMock'), t('modeMockSub', nPaper, mm)))}
      ${nch ? modeBtn('m-chal', 'start', 'data-mode="challenge"', mi('🚀', t('modeChallenge'), t('modeChallengeSub', nch))) : ''}
      <button class="mode m-mist" data-act="start" data-mode="mistakes" ${mist ? '' : 'disabled'}><span class="mi" aria-hidden="true">🔧</span><span class="mt"><b>${t('modeMistakes')}</b><small>${t('modeMistakesSub', mist)}</small></span>${mist ? `<span class="badge-n">${mist}</span>` : ''}</button>
      <button class="mode m-shop" data-act="nav" data-to="#/g/${g}/shop"><span class="mi" aria-hidden="true">${owl('happy', 'owl-mi')}</span><span class="mt"><b>${t('modeShop')}</b><small>${t('modeShopSub')}</small></span></button>
      <button class="mode m-prog" data-act="nav" data-to="#/g/${g}/progress"><span class="mi" aria-hidden="true">📈</span><span class="mt"><b>${t('modeProgress')}</b><small>${t('modeProgressSub')}</small></span></button>
    </section>
    <section class="levelsw" aria-label="${t('levelTitle')}">
      <span class="lv-t">${t('levelTitle')}</span>
      <div class="seg" role="group">${L.LEVELS.map((lv) => `<button type="button" data-act="level" data-lv="${lv}" aria-pressed="${L.levelOf(gr) === lv}">${t('level_' + lv)}</button>`).join('')}</div>
      <small class="lv-d">${t('levelDesc_' + L.levelOf(gr))}</small>
    </section>
    <section class="autosw">
      <button type="button" class="sw-row" role="switch" aria-checked="${autoOn(gr)}" data-act="autohints">
        <span class="sw-t"><b>💡 ${t('autoTitle')}</b><small>${t(autoOn(gr) ? 'autoDesc_on' : 'autoDesc_off')}</small></span>
        <span class="sw" aria-hidden="true"><i></i></span>
      </button>
    </section>
  </main>`;
}

function screenShop(g) {
  const gr = store.grade(g);
  const rw = gr.rw;
  const names = t('items');
  const card = (it) => {
    const owned = rw.owned.includes(it.id);
    const worn = rw.outfit[it.slot] === it.id;
    const open = R.unlocked(rw, it);
    const look = R.lookWith(rw, it);
    const scene = R.SCENE_SLOTS.includes(it.slot);
    // scene previews show only the item tried on, so the small picture stays readable
    const prevLook = scene ? Object.assign({}, look, { toy: null, bowl: null, house: null, [it.slot]: it.id }) : look;
    let btn;
    if (worn && it.id === 'navy') btn = `<span class="worn-l">✓ ${t('wearing')}</span>`;
    else if (worn) btn = `<button class="btn ghost sm" data-act="wear" data-id="${it.id}">${t('takeOff')}</button>`;
    else if (owned) btn = `<button class="btn second sm" data-act="wear" data-id="${it.id}">${t('wear')}</button>`;
    else if (!open) btn = `<button class="btn ghost sm buy" disabled aria-label="${esc(names[it.id])}: ${esc(t('rankLockAria', R.rankNeed(it)))}">🔒 ${esc(t('rankLock', R.rankNeed(it)))}</button><small class="need">${bone()} ${it.price}</small>`;
    else if (rw.bones >= it.price) btn = `<button class="btn primary sm buy" data-act="buy" data-id="${it.id}" aria-label="${esc(names[it.id])}: ${esc(t('bonesN', it.price))}">${bone()} ${it.price}</button>`;
    else btn = `<button class="btn ghost sm buy" disabled aria-label="${esc(names[it.id])}: ${esc(t('bonesN', it.price))}">${bone()} ${it.price}</button><small class="need">${t('needMore', it.price - rw.bones)}</small>`;
    return `<li class="item ${worn ? 'worn' : ''} ${owned ? 'owned' : ''} ${!open && !owned ? 'locked' : ''} ${scene ? 'scene' : ''} ${it.premium ? 'premium' : ''}">
      ${worn && it.id !== 'navy' ? `<span class="item-tag">✓ ${t('wearing')}</span>` : it.premium && !owned ? `<span class="item-tag prem">✨ ${t('premium')}</span>` : ''}
      <span class="item-prev">${(scene ? archieScene : archie)('happy', 'owl-item', prevLook)}</span>
      <b>${esc(names[it.id])}</b>${btn}</li>`;
  };
  const shelf = (slot) => {
    const list = R.ITEMS.filter((it) => it.slot === slot).sort((x, y) => x.price - y.price);
    const have = list.filter((it) => rw.owned.includes(it.id) && it.price > 0).length, all = list.filter((it) => it.price > 0).length;
    return `<section class="shelf" data-slot="${slot}"><h3><span>${t('slots')[slot]}</span><small>${have}/${all}</small></h3><ul class="items">${list.map(card).join('')}</ul></section>`;
  };
  const group = (key, slots) => `<div class="shop-group"><h2 class="sg-h"><span aria-hidden="true">${key === 'wear' ? '👕' : '🏡'}</span> ${t('slotGroups')[key]}</h2>${slots.map(shelf).join('')}</div>`;
  const canBlanket = rw.freezes < L.FREEZE_MAX;
  return `${topBar({ back: `#/g/${g}`, title: t('shopTitle'), sub: gr.nickname ? `${gr.nickname}, ${t('gradeN', g)}` : t('gradeN', g) })}
  <main class="wrap shop">
    <section class="shop-hero ${R.outfitFor(rw).house ? 'has-house' : ''}">
      ${archieScene('cheer', 'owl-hero sc-shop pop')}
      <div class="shop-hero-t">
        <span class="bones-pill big" aria-label="${esc(t('bonesN', rw.bones))}">${bone()}<b>${rw.bones}</b></span>
        <p>${esc(t('shopSay'))}</p>
      </div>
    </section>
    ${group('wear', R.WEAR_SLOTS)}
    ${group('home', ['house', 'toy', 'bowl'])}
    <section class="shelf extra"><h3><span>${t('slots').extra}</span></h3>
      <div class="blanket-card">
        <span class="blk-big">${blanketIcon()}</span>
        <div class="bc-t"><b>${t('blanketName')}</b><small>${t('blanketDesc')}</small><span class="bc-n">${blanketIcon('sm')} ${rw.freezes}/${L.FREEZE_MAX}</span></div>
        ${!canBlanket ? `<span class="worn-l">${t('blanketMax')}</span>` : rw.bones >= R.BLANKET_PRICE
          ? `<button class="btn primary sm buy" data-act="buy" data-id="blanket" aria-label="${esc(t('blanketName'))}: ${esc(t('bonesN', R.BLANKET_PRICE))}">${bone()} ${R.BLANKET_PRICE}</button>`
          : `<div class="bc-b"><button class="btn ghost sm buy" disabled>${bone()} ${R.BLANKET_PRICE}</button><small class="need">${t('needMore', R.BLANKET_PRICE - rw.bones)}</small></div>`}
      </div>
    </section>
  </main>`;
}

function screenMockIntro(g) {
  const all = S.data[g];
  const n = Math.min(L.mockN(g), regOf(g).length);
  const mm = L.mockMinutes(g);
  return `${topBar({ back: `#/g/${g}`, title: t('mockIntroTitle') })}
  <main class="wrap mock-intro">
    ${bubble(`<b>${t('mockIntroLead', n, mm)}</b>`, 'happy')}
    <section class="card">
      <h2>${t('scoringTitle')}</h2>
      <ul class="scoring">
        <li><span>${t('scStart')}</span><b class="sc-base">25</b></li>
        <li><span>✅ ${t('scCorrect')}</span><b class="sc-plus">+4</b></li>
        <li><span>❌ ${t('scWrong')}</span><b class="sc-minus">-1</b></li>
        <li><span>⏭️ ${t('scSkip')}</span><b class="sc-zero">0</b></li>
      </ul>
      <p class="muted">${t('scMax', L.mockMax(n))}</p>
      <p class="tipline">💡 ${t('scTip')}</p>
    </section>
    <ul class="rules">${t('mockRules').map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    <div class="cta-bottom"><button class="btn primary big" data-act="start" data-mode="mock">${t('start')} ⏱ ${mm} ${t('minutes')}</button></div>
  </main>`;
}

function activeSess() {
  const r = route();
  if (!r.g) return null;
  const gr = store.grade(r.g);
  return gr.active;
}

const hintList = (p) => L.hintList(p, S.lang);

function screenQuiz(g) {
  const s = activeSess();
  const p = S.byId[s.ids[s.idx]];
  const n = s.ids.length;
  const mock = s.mode === 'mock';
  let bar;
  if (mock) {
    const left = s.limit - s.elapsed;
    const answered = s.answers.filter(Boolean).length;
    bar = `<div class="qprog"><div class="pbar"><i style="width:${(answered / n) * 100}%"></i></div></div>
      <button class="timer ${left < 60000 ? 'crit' : left < 300000 ? 'warn' : ''}" data-act="pause" aria-label="${t('pause')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg><span id="timer">${fmtTime(left)}</span></button>`;
  } else if (n > 12) { // full training: a continuous bar, 25-30 steps do not fit on a phone
    bar = `<div class="qprog"><div class="pbar" aria-hidden="true"><i style="width:${(s.idx / n) * 100}%"></i></div><span class="qcount">${s.idx + 1}/${n}</span></div>`;
  } else {
    const yb = band(g) === 'young';
    bar = `<div class="qprog"><ol class="steps" aria-label="${s.idx + 1}/${n}">${s.ids.map((_, i) => `<li class="${i < s.idx ? 'done' : i === s.idx ? 'cur' : ''}">${yb && i < s.idx ? star(true) : ''}</li>`).join('')}</ol><span class="qcount">${s.idx + 1}/${n}</span></div>`;
  }
  const opts = mock
    ? optionsHTML(p, { selected: s.answers[s.idx] })
    : optionsHTML(p, { selected: S.sel });
  const actions = mock
    ? `<button class="btn ghost icon" data-act="mock-prev" ${s.idx === 0 ? 'disabled' : ''} aria-label="${t('prev')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
       <button class="btn ghost gridbtn" data-act="grid"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg> ${s.idx + 1}/${n}</button>
       ${s.idx === n - 1
         ? `<button class="btn primary grow" data-act="mock-finish">${t('finish')}</button>`
         : `<button class="btn ${s.answers[s.idx] ? 'primary' : 'second'} grow" data-act="mock-next">${s.answers[s.idx] ? t('next') : t('skip')} ›</button>`}`
    : `<button class="btn second" data-act="skip">${t('skip')}</button>
       <button class="btn primary grow" data-act="done" ${S.sel ? '' : 'disabled'}>${t('done')} ✓</button>`;
  if (!s.hints) s.hints = s.ids.map(() => 0);
  const hl = hintList(p);
  const opened = Math.min(s.hints[s.idx] || 0, hl.length);
  const hintBlock = mock ? '' : `${hintStack(hl, opened, isFlash(ahKeyQuiz(s), opened))}${hintButton(hl.length, opened, 'hint')}`;
  const coach = coachHTML(coachFor(s, opened, hl.length), s);
  const dbg = S.debug ? `<div class="debug"><button data-act="dbg-fill">DEBUG: auto-fill + finish</button>${mock ? '<button data-act="dbg-timeup">DEBUG: time up</button>' : ''}</div>` : '';
  return `<header class="top qbar">
    <button class="icon-btn" data-act="quit" aria-label="${t('quit')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    ${bar}
    ${langToggle()}
  </header>
  <main class="wrap quiz ${mock ? 'is-mock' : ''} m-${s.mode}">
    ${coach}
    <div class="qcol">${problemHTML(p, `${t('question')} ${s.idx + 1}`)}${hintBlock}</div>
    <div class="acol">
      ${!mock && !S.sel ? `<p class="hintline">${t('pickAnswer')}</p>` : ''}
      ${opts}
      ${mock && s.answers[s.idx] ? `<button class="link clear" data-act="mock-clear">${t('clearAnswer')}</button>` : ''}
      ${dbg}
    </div>
  </main>
  <div class="actionbar"><div class="actionbar-in">${actions}</div></div>`;
}

function sessionById(gr, id) {
  if (!id) return gr.sessions[gr.sessions.length - 1];
  return gr.sessions.find((s) => s.id === id) || null;
}

function screenResults(g, id) {
  const gr = store.grade(g);
  const rec = sessionById(gr, id);
  if (!rec || !rec.items) { setTimeout(() => go(`#/g/${g}`), 0); return ''; }
  const idx = gr.sessions.indexOf(rec);
  const prev = gr.sessions.slice(0, idx).filter((x) => x.mode === rec.mode && (rec.mode !== 'topic' || x.topic === rec.topic));
  const mock = rec.mode === 'mock';
  const stars = L.starsOf(rec.acc);
  const chal = rec.mode === 'challenge';
  let cmp;
  if (rec.mode === 'challenge') cmp = '';
  else if (!prev.length) cmp = t('firstTime');
  else {
    const best = mock ? Math.max(...prev.map((x) => x.score)) : Math.max(...prev.map((x) => x.acc));
    const mine = mock ? rec.score : rec.acc;
    cmp = mine > best ? `🎉 ${t('newRecord')} <span class="muted">${t('prevBest', mock ? `${best} ${t('points')}` : pct(best))}</span>` : t('prevBest', mock ? `${best} ${t('points')}` : pct(best));
  }
  const title = chal ? t('resChallenge').split('!')[0] + '!' : stars === 3 ? t('resultsGreat') : stars === 2 ? t('resultsGood') : stars === 1 ? t('resultsOk') : t('resultsLow');
  // per topic
  const tp = {};
  rec.items.forEach((it) => { const p = S.byId[it.id]; if (!p) return; const e = tp[p.topic] || (tp[p.topic] = { c: 0, n: 0 }); e.n++; if (it.ok) e.c++; });
  const toReview = rec.items.filter((x) => !x.ok).length;
  const hintedN = rec.items.filter((x) => x.h).length;
  const rsay = chal ? t('resChallenge') : stars === 3 && !toReview ? t('resSayPerfect') : hintedN ? t('resSayHints', hintedN) : toReview ? t('resSayMist') : '';
  const newB = S.newBadges && S.newBadges.sid === rec.id ? S.newBadges.ids : [];
  const gt = gateOf(g);
  return `${topBar({ back: `#/g/${g}`, title: t('modeNames')[rec.mode] + (rec.topic ? `: ${topicName(rec.topic)}` : '') })}
  <main class="wrap results">
    <section class="rhero s${stars}">
      ${archieScene(stars >= 1 || chal ? 'cheer' : 'oops', 'owl-lg sc-res pop')}
      <h2 class="h-big">${title}</h2>
      ${chal ? '' : starsRow(stars, 'lg pop-stars')}
      ${mock ? `<div class="bigscore"><b>${rec.score}</b><span>/ ${L.mockMax(rec.n)} ${t('points')}</span><small>${t('zrinyiScore')}</small></div>` : `<div class="bigscore"><b>${rec.correct}</b><span>/ ${rec.n}</span></div>`}
      <div class="rchips">
        <span class="rc ok">✓ ${rec.correct} ${t('correct')}</span>
        <span class="rc bad">✗ ${rec.wrong} ${t('wrong')}</span>
        <span class="rc skip">⏭ ${rec.skipped} ${t('skipped')}</span>
      </div>
      <p class="rmeta">⏱ ${t('timeSpent')}: ${fmtDur(rec.timeSec)}${rec.bones != null && !(S.rwFx && S.rwFx.sid === rec.id) ? ` · <span class="rbones">${bone()} ${esc(t('plusBones', rec.bones))}</span>` : ''}</p>
      ${cmp ? `<p class="rcmp">${cmp}</p>` : ''}
    </section>
    ${rewardBlock(rec)}
    ${rsay && !chal ? bubble(esc(rsay), toReview ? 'point' : 'cheer', 'rsay') : ''}
    ${newB.length ? `<section class="newbadges"><h3>${t('newBadge')}</h3>${newB.map((b) => `<div class="nb"><span>${BADGE_ICONS[b]}</span><b>${esc(t('badgeDefs')[b][0])}</b></div>`).join('')}</section>` : ''}
    <div class="cta-col">
      ${gt ? `<button class="btn primary big gate-btn" data-act="nav" data-to="${gateHref(g, gt)}">🔍 ${t('gateBtn')} (${gt.n})</button>`
        : toReview ? `<button class="btn primary big" data-act="nav" data-to="#/g/${g}/review/${rec.id}">🔍 ${t('reviewMistakes')} (${toReview})</button>` : `<p class="perfect">${t('noMistakes')}</p>`}
      <div class="row">${gt ? '' : `<button class="btn second" data-act="again" data-mode="${rec.mode}" data-topic="${rec.topic || ''}">↻ ${t('again')}</button>`}<button class="btn ghost" data-act="nav" data-to="#/g/${g}">${t('home')}</button></div>
    </div>
    <section class="card">
      <h3>${t('byTopic')}</h3>
      <div class="tsum">${Object.entries(tp).map(([k, e]) => `<span class="tsc ${e.c === e.n ? 'full' : e.c === 0 ? 'zero' : ''}">${topicIcon(k)} ${esc(topicName(k))} <b>${e.c}/${e.n}</b></span>`).join('')}</div>
    </section>
    <section class="card">
      <h3>${t('allProblems')}</h3>
      <ol class="plist">${rec.items.map((it, i) => {
        const p = S.byId[it.id];
        if (!p) return '';
        const st = it.ok ? 'ok' : it.ok === false ? 'bad' : 'skip';
        const ic = it.ok ? '✓' : it.ok === false ? '✗' : '⏭';
        const hn = Math.max(it.h || 0, it.rh || 0);
        const bulb = hn ? `<span class="hbulb" role="img" aria-label="${esc(t('hintMark', hn))}" title="${esc(t('hintMark', hn))}">💡 ${hn}</span>` : '';
        const head = `<span class="pst ${st}" aria-hidden="true">${ic}</span><span class="pn">${i + 1}.</span><span class="ptx">${topicIcon(p.topic)} ${esc(tx(p.q))}</span>${bulb}`;
        if (it.ok) {
          return `<li><details><summary>${head}<span class="more">${t('showSolution')}</span></summary>
            <div class="pdet">${problemHTML(p)}${optionsHTML(p, { correct: p.answer, allDisabled: true })}
            <ol class="sol">${p.steps[S.lang].map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
            <div class="tipcard"><b>💡 ${t('rememberIt')}</b><p>${esc(tx(p.tip))}</p></div></div></details></li>`;
        }
        return `<li><button class="prow" data-act="nav" data-to="#/g/${g}/review/${rec.id}/${i}">${head}<span class="more">›</span></button></li>`;
      }).join('')}</ol>
    </section>
  </main>`;
}

function rewardBlock(rec) {
  const fx = S.rwFx && S.rwFx.sid === rec.id ? S.rwFx : null;
  if (!fx) return '';
  const anim = !fx.animated && !reduceMotion();
  const p = fx.parts || {};
  const chips = [
    p.correct ? `<span class="pc">✓ ${esc(t('partCorrect', fx.correct))} <b>+${p.correct}</b></span>` : '',
    p.wrong ? `<span class="pc">✗ ${esc(t('partWrong', fx.wrong))} <b>${p.wrong}</b></span>` : '',
    p.start ? `<span class="pc">🏁 ${esc(t('partStart'))} <b>+${p.start}</b></span>` : ''
  ].join('');
  const lvNow = L.rankOf(fx.earnedAfter);
  return `<section class="reward" aria-label="${t('bonesTitle')}">
    <div class="rw-row">
      <div class="rw-count">${bone('bone-lg')}<div><b class="count" ${anim ? `data-to="${fx.n}"` : ''}>+${anim ? 0 : fx.n}</b><small>${t('bonesTitle')}</small></div></div>
      <div class="rw-ring"><div class="ring-box">${anim ? ringSVG(fx.dayBefore, fx.goal, fx.dayAfter) : ringSVG(fx.dayAfter, fx.goal)}<span class="ring-c"><b>${Math.min(fx.dayAfter, 999)}</b><small>/${fx.goal}</small></span></div><small>${fx.dayAfter >= fx.goal ? t('goalDone') : t('todayGoal')}</small></div>
    </div>
    ${chips ? `<div class="rw-parts">${chips}</div>` : ''}
    <div class="rw-lv"><span class="lv-num sm" aria-hidden="true">${lvNow.n}</span><span class="xpbar"><i style="width:${lvNow.max ? 100 : Math.round((lvNow.into / lvNow.need) * 100)}%"></i></span><small>${esc(rankName(lvNow.n))}</small></div>
  </section>
  ${fx.levelUp ? `<section class="levelup">${owl('cheer', 'owl-lg pop')}<div><h3>${t('levelUpTitle')}</h3><p>${esc(t('levelUpText', fx.levelUp, rankName(fx.levelUp)))}</p></div></section>` : ''}
  ${fx.chest ? `<section class="chestcard"><span class="chest-ic" aria-hidden="true">🎁</span><div><h3>${t('chestTitle')}</h3><p>${esc(t('chestText', fx.chest))}</p></div></section>` : ''}
  ${fx.freezeUsed ? `<p class="rinfo">${blanketIcon()} ${esc(t('freezeUsed', fx.freezeUsed))}</p>` : ''}
  ${fx.freezeEarned ? `<p class="rinfo">${blanketIcon()} ${esc(t('freezeEarned'))}</p>` : ''}`;
}
// count-up and ring fill on the results screen, once per finished session
function animateRewards() {
  const fx = S.rwFx;
  if (!fx || fx.animated) return;
  const el = app.querySelector('.reward .count[data-to]');
  const ring = app.querySelector('.reward .ring-fg[data-off]');
  fx.animated = true;
  if (!el && !ring) return;
  if (ring) requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.stroke = ''; ring.style.strokeDashoffset = ring.dataset.off;
    if (ring.dataset.done === '1') setTimeout(() => ring.closest('.ring') && ring.closest('.ring').classList.add('done'), 1100);
  }));
  if (el) {
    const to = +el.dataset.to, t0 = performance.now(), dur = 900;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = `+${Math.round(to * (1 - Math.pow(1 - k, 3)))}`;
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

/* ---------- review ---------- */
function initReview(g, sid, startAt) {
  const gr = store.grade(g);
  const rec = sessionById(gr, sid);
  if (!rec || !rec.items) return null;
  let list = rec.items.map((it, i) => ({ ...it, n: i + 1 })).filter((x) => !x.ok && S.byId[x.id]);
  // opened from the gate (no start problem): only the problems still to do
  const pr = L.reviewGate(gr);
  if (startAt == null && pr && pr.sid === rec.id) { const left = list.filter((x) => pr.ids.includes(x.id)); if (left.length) list = left; }
  let i = 0;
  if (startAt != null) { const k = list.findIndex((x) => x.n === +startAt + 1); if (k >= 0) i = k; }
  S.rv = { g, sid: rec.id, list, i, solvedSelf: 0, solvedHints: 0, bones: 0, card: null, done: false };
  newCard();
  return S.rv;
}
function newCard() {
  const rv = S.rv;
  const it = rv.list[rv.i];
  rv.card = { tried: it.a ? [it.a] : [], sel: null, status: 'trying', showSol: false, steps: 0, orig: it.a, hl: 0 };
}

function screenReview(g, sid, startAt) {
  if (!S.rv || S.rv.g !== g || (sid && S.rv.sid !== sid)) {
    if (!initReview(g, sid, startAt)) { setTimeout(() => go(`#/g/${g}`), 0); return ''; }
  }
  const rv = S.rv;
  if (!rv.list.length) { setTimeout(() => go(`#/g/${g}/results/${rv.sid}`), 0); return ''; }
  if (rv.done) return reviewDone(g);
  const it = rv.list[rv.i];
  const p = S.byId[it.id];
  const c = rv.card;
  const n = rv.list.length;
  const parts = [];
  // a. what the child chose
  if (c.orig) {
    parts.push(bubble(`<b>${t('understandWhy')}</b><span class="mine-pill">${t('yourAnswer')}: <b>(${c.orig}) ${esc(tx(p.options[c.orig]))}</b></span><p>${esc(tx(p.why[c.orig]))}</p>`, 'think', 'warm'));
  } else {
    parts.push(bubble(`<p>${t('skippedBefore')}</p>`, 'happy'));
  }
  // b. hint
  parts.push(`<div class="hintcard"><b>💡 ${t('hintTitle')}</b><p>${esc(tx(p.hint))}</p></div>`);
  // hint ladder: stepwise tips, never the answer; the solution flow below stays as it was
  const ladder = L.hintList(p, S.lang, false);
  if (ladder.length && c.status === 'trying') {
    const rk = ahKeyReview(rv);
    const autoLine = c.hl && S.autoSaid && S.autoSaid.key === rk && S.autoSaid.level === c.hl;
    if (c.hl < ladder.length || autoLine) parts.push(bubble(esc(autoLine ? t('autoSay') : c.hl ? t('rvTogether2') : t('rvTogether')), c.hl ? 'think' : 'point', 'together'));
    parts.push(hintStack(ladder, c.hl, isFlash(rk, c.hl)));
    parts.push(hintButton(ladder.length, c.hl, 'rv-hint'));
  } else if (ladder.length && c.hl) {
    parts.push(hintStack(ladder, c.hl));
  }
  // retries feedback
  const extraTries = c.tried.slice(c.orig ? 1 : 0);
  extraTries.forEach((l, k) => {
    const last = k === extraTries.length - 1;
    const more = c.status === 'trying';
    parts.push(bubble(`<b>${t('notYet')}</b><span class="mine-pill">(${l}) ${esc(tx(p.options[l]))}</span><p>${esc(tx(p.why[l]))}</p>${last && more ? `<p class="muted">${t('oneMore')}</p>` : ''}${last && c.status === 'failed' ? `<p><b>${t('letsSolve')}</b></p>` : ''}`, 'oops', 'warm', ''));
  });
  const opts = optionsHTML(p, {
    selected: c.status === 'trying' ? c.sel : null,
    disabled: new Set(c.tried),
    correct: (c.status === 'solved') || (c.showSol && c.steps >= p.steps[S.lang].length) ? p.answer : null,
    allDisabled: c.status !== 'trying',
    act: 'rv-opt'
  });
  const recItem = (sessionById(store.grade(g), rv.sid) || { items: [] }).items[it.n - 1];
  const pay = recItem && !recItem.rb ? R.fixPay(recItem, !!c.hl) : 0;
  const payChip = pay ? `<span class="fixpay" title="${esc(t('fixPay'))}" aria-label="${esc(t('fixPay'))}: ${esc(t('plusBones', pay))}">+${pay} ${bone()}</span>` : '';
  const tryTitle = c.status === 'trying' ? `<h3 class="trytitle">${c.tried.length ? t('tryAgain') : t('tryNow')} <small>${c.tried.length ? t('tryAgainSub') : ''}</small>${payChip}</h3>` : '';
  let celebrate = '';
  if (c.status === 'solved') {
    celebrate = `<div class="celebrate" data-focus>${owl('cheer', 'owl-md pop')}<div><h3>${c.hl ? t('fixedHintsTitle') : c.orig ? t('fixedYourself') : t('solvedNow')}</h3><p>${t('fixedText')}</p>${c.paid ? `<span class="fixpay got">+${c.paid} ${bone()}</span>` : ''}</div></div>`;
  }
  let sol = '';
  if (c.showSol) {
    const steps = p.steps[S.lang];
    sol = `<section class="solution"><h3>${owl(c.status === 'failed' ? 'oops' : 'think', 'owl-xs')} ${t('solution')}</h3><ol class="sol steps-rev">${steps.slice(0, c.steps).map((x, k) => `<li class="${k === c.steps - 1 ? 'new' : ''}" ${k === c.steps - 1 ? 'data-focus' : ''}><span class="sn">${k + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol>
      ${c.steps < steps.length ? `<p class="muted stepcount">${t('stepN', c.steps, steps.length)}</p>` : ''}</section>`;
    if (c.steps >= steps.length) sol += `<div class="tipcard" data-focus><b>📌 ${t('rememberIt')}</b><p>${esc(tx(p.tip))}</p></div>`;
  }
  // action bar
  let action;
  const last = rv.i === n - 1;
  const nextBtn = `<button class="btn primary grow" data-act="rv-next">${last ? t('finishReview') : t('nextMistake')} ›</button>`;
  if (c.status === 'trying') action = `<button class="btn primary grow" data-act="rv-check" ${c.sel ? '' : 'disabled'}>${t('check')} ✓</button>`;
  else if (c.showSol && c.steps < p.steps[S.lang].length) action = `<button class="btn primary grow" data-act="rv-step">${t('nextStep')} ›</button>`;
  else if (c.status === 'solved' && !c.showSol) action = `<button class="btn second" data-act="rv-sol">${t('showSteps')}</button>${nextBtn}`;
  else action = nextBtn;

  // order: problem, bubbles, hint, options (with try title), celebration, solution
  const optsBlock = `${tryTitle}${opts}`;
  return `${topBar({ back: `#/g/${g}/results/${rv.sid}`, title: t('reviewTitle'), sub: t('reviewOf', rv.i + 1, n) })}
  <div class="rvprog"><i style="width:${((rv.i + (c.status === 'trying' ? 0 : 1)) / n) * 100}%"></i></div>
  <main class="wrap review">
    ${problemHTML(p, `${t('question')} ${it.n}`, it.h ? `<span class="hmark" title="${esc(t('hintMark', it.h))}">💡 ${it.h}</span>` : '')}
    ${parts.join('')}
    ${optsBlock}
    ${celebrate}
    ${sol}
  </main>
  <div class="actionbar"><div class="actionbar-in">${action}</div></div>`;
}

function reviewDone(g) {
  const rv = S.rv;
  const x = rv.solvedSelf, z = rv.solvedHints, y = rv.list.length;
  return `${topBar({ back: `#/g/${g}`, title: t('reviewTitle') })}
  <main class="wrap center-col rdone">
    ${owl(x || z ? 'cheer' : 'happy', 'owl-hero pop')}
    <h1 class="h-big">${t('reviewDoneTitle')}</h1>
    <div class="bigscore"><b>${x}</b><span>/ ${y} ${t('reviewDoneSelf')}</span></div>
    ${z || rv.bones ? `<div class="rchips">${z ? `<span class="rc hint">💡 ${z} ${t('reviewDoneHints')}</span>` : ''}${rv.bones ? `<span class="rc bones">${bone()} ${esc(t('plusBones', rv.bones))}</span>` : ''}</div>` : ''}
    <p class="lead">${x ? t('reviewDoneText', x, y) : t('reviewDoneZero')}</p>
    ${bubble(esc(t('rvDoneSay')), 'cheer')}
    ${z ? `<p class="lead sm">${t('fixedWithHintsLine', z)}</p>` : ''}
    <div class="cta-col">
      ${gateOf(g) ? `<button class="btn primary big" data-act="nav" data-to="${gateHref(g, gateOf(g))}">🔍 ${t('gateBtn')} (${gateOf(g).n})</button>` : `<button class="btn primary big" data-act="start" data-mode="quick">⚡ ${t('modeQuick')}</button>`}
      <div class="row"><button class="btn second" data-act="nav" data-to="#/g/${g}/progress">📈 ${t('modeProgress')}</button><button class="btn ghost" data-act="nav" data-to="#/g/${g}">${t('home')}</button></div>
    </div>
  </main>`;
}

/* ---------- progress ---------- */
function chartSVG(sessions) {
  const pts = sessions.slice(-20);
  if (!pts.length) return '';
  const W = 320, H = 150, pl = 40, pr = 10, pt = 12, pb = 24;
  const iw = W - pl - pr, ih = H - pt - pb;
  const x = (i) => pl + (pts.length === 1 ? iw / 2 : (i * iw) / (pts.length - 1));
  const y = (v) => pt + ih * (1 - v);
  const grid = [0, 0.5, 1].map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="cg"/><text x="${pl - 6}" y="${y(v) + 4}" class="cl" text-anchor="end">${v * 100}%</text>`).join('');
  const line = pts.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(s.acc).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const dots = pts.map((s, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(s.acc).toFixed(1)}" r="${s.mode === 'mock' ? 5.5 : 4}" class="cd ${s.mode}"><title>${fmtDate(s.date)}: ${pct(s.acc)}</title></circle>`).join('');
  const labels = pts.map((s, i) => (i === 0 || i === pts.length - 1 || (pts.length > 6 && i === Math.floor(pts.length / 2))) ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" class="cl" text-anchor="${i === 0 && pts.length > 1 ? 'start' : i === pts.length - 1 && pts.length > 1 ? 'end' : 'middle'}">${fmtDate(s.date)}</text>` : '').join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('accuracyOverTime')}">
    <defs><linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ca1"/><stop offset="1" class="ca2"/></linearGradient></defs>
    ${grid}<path d="${area}" fill="url(#cgrad)"/><path d="${line}" class="cline"/>${dots}${labels}</svg>`;
}

function screenProgress(g) {
  const all = S.data[g];
  const gr = store.grade(g);
  const sum = L.gradeSummary(gr);
  const m = L.topicMastery(L.regular(all), gr);
  const have = new Set(gr.badges.map((b) => b.id));
  const hist = gr.sessions.slice().reverse().slice(0, 40);
  return `${topBar({ back: `#/g/${g}`, title: t('progressTitle'), sub: gr.nickname ? `${gr.nickname}, ${t('gradeN', g)}` : t('gradeN', g) })}
  <main class="wrap progress">
    ${bubble(esc(t('progressSay', sum.sessions)), sum.sessions ? 'cheer' : 'think')}
    <section class="stats3 six">
      <div class="stat"><b>${sum.sessions}</b><span>${t('statSessions')}</span></div>
      <div class="stat"><b>${sum.acc == null ? '-' : pct(sum.acc)}</b><span>${t('statAccuracy')}</span></div>
      <div class="stat"><b>${sum.streak}${sum.streak ? ' 🔥' : ''}</b><span>${t('statStreak')}</span></div>
      <div class="stat"><b>${sum.bestMock >= 0 ? sum.bestMock : '-'}</b><span>${t('bestMock')}</span></div>
      <div class="stat"><b>${gr.rw.earned}</b><span>${t('statBones')}</span></div>
      <div class="stat"><b>${L.rankOf(gr.rw.earned).n}</b><span>${t('statLevel')}</span></div>
    </section>
    ${sum.sessions ? `<p class="unaided">💡 <b>${sum.unaided}</b> ${t('unaided')}</p>` : ''}
    <section class="levelsw goalsw" aria-label="${t('goalTitle')}">
      <span class="lv-t">🎯 ${t('goalTitle')}</span>
      <div class="seg three" role="group">${R.GOALS.map((v) => `<button type="button" data-act="goal" data-v="${v}" aria-pressed="${gr.rw.goal === v}"><b>${v}</b> ${t('goalNames')[v]}</button>`).join('')}</div>
      <small class="lv-d">${t('goalDesc')}</small>
    </section>
    <div class="pgrid">
      <section class="card">
        <h3>${t('accuracyOverTime')}</h3>
        ${gr.sessions.some((x) => x.mode !== 'challenge') ? chartSVG(gr.sessions.filter((x) => x.mode !== 'challenge')) : bubble(t('emptySay'), 'sleep') + `<p class="muted">${t('noSessions')}</p>`}
      </section>
      <section class="card">
        <h3>${t('topicMastery')}</h3>
        <ul class="mastery">${Object.keys(TOPICS).filter((k) => m[k]).map((k) => `<li><span class="ml">${topicIcon(k)} ${esc(topicName(k))}</span><span class="bar"><i style="width:${m[k].pct == null ? 0 : Math.round(m[k].pct * 100)}%"></i></span><span class="mv">${m[k].pct == null ? '-' : pct(m[k].pct)}</span></li>`).join('')}</ul>
      </section>
    </div>
    <section class="card">
      <h3>${t('badges')} <small class="muted">${have.size}/${L.BADGE_ORDER.length}</small></h3>
      <ul class="badges">${L.BADGE_ORDER.map((b) => `<li class="${have.has(b) ? 'on' : 'off'}"><span class="bi" aria-hidden="true">${have.has(b) ? BADGE_ICONS[b] : '🔒'}</span><b>${esc(t('badgeDefs')[b][0])}</b><small>${esc(t('badgeDefs')[b][1])}</small></li>`).join('')}</ul>
    </section>
    <section class="card">
      <h3>${t('history')}</h3>
      ${hist.length ? `<ul class="hist">${hist.map((s) => {
        const inner = `<span class="hd">${fmtDate(s.date, true)}</span><span class="hm">${esc(t('modeNames')[s.mode])}${s.topic ? `: ${topicIcon(s.topic)}` : ''}</span><span class="hr">${s.mode === 'mock' ? `<b>${s.score}</b> ${t('points')}` : `<b>${s.correct}/${s.n}</b>`}</span>${starsRow(L.starsOf(s.acc), 'sm')}`;
        return `<li>${s.items ? `<button class="hrow" data-act="nav" data-to="#/g/${g}/results/${s.id}">${inner}</button>` : `<div class="hrow">${inner}</div>`}</li>`;
      }).join('')}</ul>` : `<p class="muted">${t('noSessions')}</p>`}
    </section>
    <section class="card data">
      <p class="muted">${t('transferNote')}</p>
      <div class="row wrap-row">
        <button class="btn second" data-act="export">⬇ ${t('exportBtn')}</button>
        <label class="btn second filebtn">⬆ ${t('importBtn')}<input type="file" accept="application/json,.json" data-change="import" hidden></label>
      </div>
      <button class="btn danger-ghost" data-act="reset">${t('resetBtn')}</button>
    </section>
  </main>`;
}

/* ---------------- render ---------------- */
function render() {
  const r = route();
  const g = r.g;
  document.body.className = `band-${g ? band(g) : 'start'} ${g ? `g${g}` : ''} scr-${r.name}`;
  if (S.modal && S.modal.type !== 'confirm' && S.modal.type !== 'nickname') {
    // grid / pause modals belong to the quiz
    if (r.name !== 'quiz') S.modal = null;
  }
  // a nickname prompt belongs to one grade's home screen; drop it when navigating elsewhere
  if (S.modal && S.modal.type === 'nickname' && (S.modal.g !== g || r.name !== 'home')) S.modal = null;
  // Archie wears the outfit of the grade on screen (each sibling has their own); plain Archie elsewhere
  setOutfit(g && store.hasGrade(g) ? R.outfitFor(store.grade(g).rw) : null);
  let html = '';
  if (r.name === 'start') html = screenStart();
  else if (r.name === 'parents') html = screenParents();
  else {
    const d = S.data[g];
    if (!Array.isArray(d)) { html = loadingOrError(g); loadGrade(g); }
    else if (!d.length) html = comingSoon(g);
    else {
      const gr = store.grade(g);
      if (r.name === 'quiz' && !(gr.active && gr.active.ids.every((id) => S.byId[id]))) { setTimeout(() => go(`#/g/${g}`), 0); return; }
      if (r.name === 'quiz' && gr.active.paused && !S.modal) S.modal = { type: 'pause' };
      if (r.name === 'home') html = screenHome(g);
      else if (r.name === 'shop') html = screenShop(g);
      else if (r.name === 'mock') html = screenMockIntro(g);
      else if (r.name === 'quiz') html = screenQuiz(g);
      else if (r.name === 'results') html = screenResults(g, r.arg);
      else if (r.name === 'review') html = screenReview(g, r.arg, location.hash.split('/')[5]);
      else if (r.name === 'progress') html = screenProgress(g);
      else html = screenHome(g);
      if (r.name === 'home' && !gr.asked && !S.modal) S.modal = { type: 'nickname', g };
    }
  }
  const key = location.hash + '|' + (S.rv ? `${S.rv.i}` : '') + '|' + (r.name === 'quiz' ? activeSess() && activeSess().idx : '');
  const changed = key !== S.lastScreen;
  S.lastScreen = key;
  app.innerHTML = html;
  if (changed) {
    app.classList.remove('enter');
    void app.offsetWidth;
    app.classList.add('enter');
    if (!S.keepScroll) window.scrollTo(0, 0);
    const h = app.querySelector('h1, h2');
    if (h && document.activeElement === document.body) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  S.keepScroll = false;
  if (r.name === 'results') animateRewards();
  renderModal();
  manageTicker(r);
  const flashed = S.autoFlash;
  S.autoFlash = null;
  if (flashed) afterAutoHint();
  const f = app.querySelectorAll('[data-focus]');
  if (S.scrollToFocus && f.length) {
    S.scrollToFocus = false;
    const el = f[f.length - 1];
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const bar = document.querySelector('.actionbar');
      const limit = window.innerHeight - (bar ? bar.offsetHeight : 0) - 12;
      if (rect.bottom > limit || rect.top < 60) window.scrollBy({ top: rect.bottom - limit + (rect.top < 60 ? 0 : 0), behavior: reduceMotion() ? 'auto' : 'smooth' });
    }, 40);
  }
}

/* ---------------- quiz flow ---------------- */
async function startSession(mode, topic) {
  const r = route();
  const g = r.g;
  const all = S.data[g];
  const gr = store.grade(g);
  const gt = mode !== 'mistakes' ? gateOf(g) : null;
  if (gt) { gateToast(gt); if (route().name !== 'home') go(`#/g/${g}`); return; }
  const old = gr.active && gr.active.ids.every((id) => S.byId[id]) ? gr.active : null;
  if (old && (old.idx > 0 || old.answers.some(Boolean))) {
    const done = old.answers.filter((a, i) => i < old.idx || a).length;
    const ok = await confirmBox({ title: t('replaceTitle'), text: t('replaceText', t('modeNames')[old.mode], done, old.ids.length), yes: t('replaceYes'), no: t('cancel'), mood: 'think' });
    if (!ok || route().g !== g) return;
  }
  const probs = L.selectProblems(all, gr, mode, topic);
  if (!probs.length) { toast(esc(t('modeMistakesSub', 0)), 2500, 'think'); go(`#/g/${g}`); return; }
  gr.active = L.newSession(g, mode, topic, probs);
  store.save();
  S.sel = null;
  S.lockUntil = Date.now() + 300;
  S.modal = null;
  go(`#/g/${g}/quiz`);
}

function locked() { return Date.now() < S.lockUntil; }

function advance() {
  const s = activeSess();
  s.idx++;
  S.sel = null;
  S.hintLock = 0; // the double-tap guard belongs to the previous problem
  S.lockUntil = Date.now() + 380;
  if (s.idx >= s.ids.length) { s.idx = s.ids.length - 1; finishQuiz(); return; }
  store.save();
  if (s.mode !== 'mock' && s.idx % 5 === 0) {
    const arr = t('cheer');
    S.cheerIdx = s.idx;
    S.cheerText = arr[Math.floor(Math.random() * arr.length)];
  }
  render();
}

function finishQuiz(timeUp) {
  const r = route();
  const g = r.g;
  const gr = store.grade(g);
  const s = gr.active;
  if (!s) return;
  tickNow();
  const topicsInData = [...new Set(regOf(g).map((p) => p.topic))];
  const { record, newBadges, streakRes } = L.finishSession(gr, s, S.byId, topicsInData);
  const fx = R.awardSession(gr, record, streakRes);
  const more = L.checkBadges(gr, S.byId, topicsInData); // badges tied to bones, levels and the chest
  store.save();
  S.newBadges = { sid: record.id, ids: newBadges.concat(more) };
  S.rwFx = Object.assign({ sid: record.id, animated: false }, fx);
  S.modal = null;
  S.rv = null;
  go(`#/g/${g}/results/${record.id}`);
  if (timeUp) toast(t('timeUp'), 3000, 'oops');
  if (L.starsOf(record.acc) >= 2 || fx.levelUp || fx.chest) setTimeout(() => confetti(), 250);
}

function tickNow() {
  const s = activeSess();
  const now = Date.now();
  if (s && !s.paused && S.lastTick) s.elapsed += now - S.lastTick;
  S.lastTick = now;
}

function manageTicker(r) {
  const s = r.name === 'quiz' ? activeSess() : null;
  if (!s) { if (S.tick) { tickNow(); clearInterval(S.tick); S.tick = null; S.lastTick = 0; } return; }
  if (S.tick) return;
  S.lastTick = Date.now();
  let n = 0;
  S.tick = setInterval(() => {
    const cur = route().name === 'quiz' ? activeSess() : null;
    if (!cur) return;
    tickNow();
    if (cur.mode === 'mock') {
      const left = cur.limit - cur.elapsed;
      const el = document.getElementById('timer');
      if (el) {
        el.textContent = fmtTime(left);
        const btn = el.parentElement;
        btn.classList.toggle('warn', left < 300000 && left >= 60000);
        btn.classList.toggle('crit', left < 60000);
      }
      if (left <= 0) { finishQuiz(true); return; }
    }
    if (++n % 5 === 0) store.save();
  }, 1000);
}

/* ---------------- automatic hints ---------------- */
// Timer state lives outside render, keyed by session + problem, so re-renders (e.g. language switch)
// neither reset nor duplicate it. One timer at most; it pauses while the tab is hidden or a modal is open.
const autoOn = (gr) => gr.autoHints !== false;
const AH_SCALE = S.debug ? 0.01 : 1; // ?debug: 100x faster for testing
let AH = null; // {key, opened, remaining, deadline, tid, restart}
const ahKeyQuiz = (s) => `q:${s.grade}:${s.started}:${s.idx}`;
const ahKeyReview = (rv) => `r:${rv.g}:${rv.sid}:${rv.i}`;
const isFlash = (key, level) => !!(S.autoFlash && S.autoFlash.key === key && S.autoFlash.level === level);

function openQuizHint() {
  const s = activeSess();
  if (!s || s.mode === 'mock') return false;
  if (!s.hints) s.hints = s.ids.map(() => 0);
  const total = hintList(S.byId[s.ids[s.idx]]).length;
  if ((s.hints[s.idx] || 0) >= total) return false;
  s.hints[s.idx] = (s.hints[s.idx] || 0) + 1;
  store.save();
  return true;
}
function openReviewHint() {
  const rv = S.rv;
  if (!rv || rv.done) return false;
  const c = rv.card, it = rv.list[rv.i], p = S.byId[it.id];
  if (c.status !== 'trying' || c.hl >= L.hintList(p, S.lang, false).length) return false;
  c.hl++;
  const gr = store.grade(rv.g);
  const st = gr.problemStats[it.id];
  if (st) st.hintsUsed = (st.hintsUsed || 0) + 1;
  const rec = sessionById(gr, rv.sid);
  const item = rec && rec.items && rec.items.find((x) => x.id === it.id);
  if (item) item.rh = c.hl;
  store.save();
  return true;
}

// what the auto-hint timer should be doing right now, or null when it must not run
function ahContext() {
  const r = route();
  if (!r.g || !Array.isArray(S.data[r.g])) return null;
  const gr = store.grade(r.g);
  if (!autoOn(gr)) return null;
  if (r.name === 'quiz') {
    const s = gr.active;
    if (!s || s.mode === 'mock' || !s.ids.every((id) => S.byId[id])) return null;
    const p = S.byId[s.ids[s.idx]];
    const total = hintList(p).length;
    const opened = Math.min((s.hints && s.hints[s.idx]) || 0, total);
    return { key: ahKeyQuiz(s), opened, total, delays: L.autoHintDelays(p, r.g, 'quiz'), open: openQuizHint };
  }
  if (r.name === 'review') {
    const rv = S.rv;
    if (!rv || rv.g !== r.g || rv.done || !rv.list.length || !rv.card || rv.card.status !== 'trying') return null;
    const p = S.byId[rv.list[rv.i].id];
    const total = L.hintList(p, S.lang, false).length;
    return { key: ahKeyReview(rv), opened: Math.min(rv.card.hl, total), total, delays: L.autoHintDelays(p, r.g, 'review'), open: openReviewHint };
  }
  return null;
}
function ahStop() {
  if (AH && AH.tid) { clearTimeout(AH.tid); AH.tid = null; AH.remaining = Math.max(0, AH.deadline - Date.now()); }
}
function syncAutoHint() {
  const ctx = ahContext();
  if (!ctx || ctx.opened >= ctx.total) { ahStop(); AH = null; return; }
  const gap = Math.max(50, Math.round((ctx.delays[ctx.opened] || 60000) * AH_SCALE));
  if (!AH || AH.key !== ctx.key) { ahStop(); AH = { key: ctx.key, opened: ctx.opened, remaining: gap, deadline: 0, tid: null }; }
  else if (AH.opened !== ctx.opened || AH.restart) { ahStop(); AH.opened = ctx.opened; AH.remaining = gap; }
  AH.restart = false;
  const paused = document.hidden || !!S.modal;
  if (paused) { ahStop(); return; }
  if (!AH.tid) {
    AH.deadline = Date.now() + AH.remaining;
    AH.tid = setTimeout(ahFire, AH.remaining);
  }
}
// the child is actively working (picked an option, or tried again): start the current gap over
function ahRestartGap() { if (AH) { ahStop(); AH.restart = true; } syncAutoHint(); }
function ahFire() {
  if (!AH) return;
  AH.tid = null;
  const ctx = ahContext();
  if (!ctx || ctx.key !== AH.key || ctx.opened !== AH.opened || ctx.opened >= ctx.total) { syncAutoHint(); return; }
  if (document.hidden || S.modal) { AH.remaining = 0; return; }
  if (!ctx.open()) { syncAutoHint(); return; }
  const level = ctx.opened + 1;
  S.hintLock = Date.now() + 600; // a tap landing at the same moment must not open a second level
  S.autoSaid = { key: ctx.key, level };
  S.autoFlash = { key: ctx.key, level };
  S.keepScroll = true;
  render(); // render re-syncs: the next gap starts now
}
// show the hint that just opened without pulling the answer buttons out of reach
function afterAutoHint() {
  const hbs = app.querySelectorAll('.hb.auto-new');
  const el = hbs[hbs.length - 1];
  if (!el) return;
  const btn = app.querySelector('.hintbtn');
  const nudge = () => {
    if (!btn) return;
    btn.classList.remove('nudge'); void btn.offsetWidth; btn.classList.add('nudge');
    setTimeout(() => btn.classList.remove('nudge'), 2600);
  };
  const bar = document.querySelector('.actionbar');
  const top = (document.querySelector('.top') || {}).offsetHeight || 0;
  const limit = window.innerHeight - (bar ? bar.offsetHeight : 0) - 8;
  const rect = el.getBoundingClientRect();
  if (rect.top >= top && rect.bottom <= limit) return; // already in view
  const small = window.innerHeight < 700 || window.innerWidth < 480;
  if (small) { nudge(); return; }
  const delta = rect.bottom > limit ? rect.bottom - limit : rect.top - top - 8;
  const opts = app.querySelector('.opts');
  if (opts) {
    const o = opts.getBoundingClientRect();
    if (o.top - delta > limit - 60 || o.bottom - delta < top + 60) { nudge(); return; } // options would leave the screen
  }
  window.scrollBy({ top: delta, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

/* review gate: the current review card is finished (fixed, or the whole solution was seen) */
function rvItemDone() {
  const rv = S.rv;
  if (!rv || !rv.list[rv.i]) return;
  const gr = store.grade(rv.g);
  const opened = L.reviewItemDone(gr, rv.list[rv.i].id);
  store.save();
  if (opened) setTimeout(() => toast(esc(t('gateOpen')), 2800, 'cheer'), 900);
}
function failedSeen() {
  const rv = S.rv, c = rv && rv.card;
  if (!c || c.status !== 'failed' || c.doneMarked) return;
  const p = S.byId[rv.list[rv.i].id];
  if (c.steps >= p.steps[S.lang].length) { c.doneMarked = true; rvItemDone(); }
}

/* ---------------- actions ---------------- */
const A = {
  nav(el) { go(el.dataset.to); },
  lang(el) { setLang(el.dataset.l); S.keepScroll = true; S.lastScreen = location.hash + '|' + (S.rv ? `${S.rv.i}` : '') + '|' + (route().name === 'quiz' ? activeSess() && activeSess().idx : ''); render(); },
  'retry-load'(el) { S.data[+el.dataset.g] = undefined; render(); },
  'edit-name'() { openModal({ type: 'nickname', g: route().g }); },
  'nick-skip'() { const gr = store.grade(route().g); gr.asked = true; store.save(); closeModal(); },
  level(el) { const gr = store.grade(route().g); gr.level = el.dataset.lv; store.save(); S.keepScroll = true; render(); },
  start(el) { startSession(el.dataset.mode, el.dataset.topic); },
  gated() { const gt = gateOf(route().g); if (gt) gateToast(gt); else render(); },
  hint() {
    if (Date.now() < S.hintLock) return;
    if (!openQuizHint()) return;
    S.hintLock = Date.now() + 300;
    S.keepScroll = true; S.scrollToFocus = true;
    render();
  },
  'rv-hint'() {
    if (Date.now() < S.hintLock) return;
    if (!openReviewHint()) return;
    S.hintLock = Date.now() + 300;
    S.keepScroll = true; S.scrollToFocus = true;
    render();
  },
  autohints() {
    const gr = store.grade(route().g);
    gr.autoHints = !autoOn(gr);
    store.save();
    S.keepScroll = true;
    render();
  },
  'rv-giveup'() {
    if (locked()) return;
    const c = S.rv.card;
    if (c.status !== 'trying') return;
    c.status = 'failed'; c.showSol = true; c.steps = 1; c.sel = null;
    failedSeen();
    S.lockUntil = Date.now() + 300;
    S.keepScroll = true; S.scrollToFocus = true;
    render();
  },
  again(el) { startSession(el.dataset.mode, el.dataset.topic || null); },
  resume() { S.sel = null; S.lockUntil = Date.now() + 300; go(`#/g/${route().g}/quiz`); },
  async discard() {
    const ok = await confirmBox({ title: t('quitTitle'), text: t('quitText'), yes: t('discard'), no: t('stay'), danger: true });
    if (!ok) return;
    const gr = store.grade(route().g); gr.active = null; store.save(); render();
  },
  opt(el) {
    if (locked()) return;
    const s = activeSess();
    const l = el.dataset.l;
    if (s.mode === 'mock') { s.answers[s.idx] = l; store.save(); }
    else { S.sel = l; ahRestartGap(); }
    S.keepScroll = true;
    render();
  },
  done() { if (locked() || !S.sel) return; const s = activeSess(); s.answers[s.idx] = S.sel; advance(); },
  skip() { if (locked()) return; const s = activeSess(); s.answers[s.idx] = null; advance(); },
  async quit() {
    const s = activeSess();
    if (s && s.mode === 'full') {
      const keep = await confirmBox({ title: t('quitFullTitle'), text: t('quitFullText'), yes: t('quitFullYes'), no: t('stay'), mood: 'sleep' });
      if (!keep) return;
      tickNow(); S.sel = null; store.save();
      go(`#/g/${route().g}`);
      return;
    }
    const ok = await confirmBox({ title: t('quitTitle'), text: t('quitText'), yes: t('leave'), no: t('stay'), mood: 'oops', danger: true });
    if (!ok) return;
    const g = route().g;
    const gr = store.grade(g);
    if (gr.active === s) gr.active = null;
    store.save();
    go(`#/g/${g}`);
  },
  'mock-next'() { if (locked()) return; const s = activeSess(); if (s.idx < s.ids.length - 1) { s.idx++; S.lockUntil = Date.now() + 250; store.save(); render(); } },
  'mock-prev'() { if (locked()) return; const s = activeSess(); if (s.idx > 0) { s.idx--; S.lockUntil = Date.now() + 250; store.save(); render(); } },
  'mock-clear'() { const s = activeSess(); s.answers[s.idx] = null; store.save(); S.keepScroll = true; render(); },
  grid() { openModal({ type: 'grid' }); },
  jump(el) { const s = activeSess(); s.idx = +el.dataset.i; store.save(); S.modal = null; render(); },
  async 'mock-finish'() {
    const s = activeSess();
    const u = s.answers.filter((a) => !a).length;
    S.modal = null;
    const ok = await confirmBox({ title: t('finishTitle'), text: t('finishText', u), yes: t('finishYes'), no: t('finishNo'), mood: u ? 'think' : 'cheer' });
    if (ok) finishQuiz();
  },
  pause() { tickNow(); const s = activeSess(); s.paused = true; store.save(); openModal({ type: 'pause' }); },
  unpause() { const s = activeSess(); S.lastTick = Date.now(); s.paused = false; store.save(); closeModal(); },
  'modal-yes'() { const m = S.modal; closeModal(); m && m.resolve && m.resolve(true); },
  'modal-no'() { const m = S.modal; closeModal(); m && m.resolve && m.resolve(false); },
  'modal-close'() { closeModal(); },
  'modal-bg'(el, ev) { if (ev.target !== el) return; const m = S.modal; if (m && m.type === 'nickname') { A['nick-skip'](); return; } closeModal(); m && m.resolve && m.resolve(false); },
  'dbg-fill'() {
    const s = activeSess();
    s.ids.forEach((id, i) => {
      if (i < s.idx && s.mode !== 'mock') return;
      const p = S.byId[id];
      const r = Math.random();
      s.answers[i] = r < 0.6 ? p.answer : r < 0.85 ? LETTERS.find((l) => l !== p.answer) : null;
    });
    s.elapsed += 123000;
    finishQuiz();
  },
  'dbg-timeup'() { const s = activeSess(); s.elapsed = s.limit - 3000; },
  // review
  'rv-opt'(el) { if (locked()) return; const c = S.rv.card; if (c.status !== 'trying' || c.tried.includes(el.dataset.l)) return; c.sel = el.dataset.l; ahRestartGap(); S.keepScroll = true; render(); },
  'rv-check'() {
    if (locked()) return;
    const rv = S.rv, c = rv.card, it = rv.list[rv.i], p = S.byId[it.id];
    if (!c.sel) return;
    S.lockUntil = Date.now() + 400;
    if (c.sel === p.answer) {
      c.status = 'solved';
      if (c.hl) rv.solvedHints++; else rv.solvedSelf++;
      const gr = store.grade(rv.g);
      const st = gr.problemStats[it.id];
      if (st && st.wrong > 0) L.markFixed(gr, it.id);
      const rec = sessionById(gr, rv.sid);
      const got = R.awardReviewFix(gr, rec && rec.items ? rec.items[it.n - 1] : null, !!c.hl);
      if (got) c.paid = got.n;
      L.checkBadges(gr, S.byId, [...new Set(regOf(rv.g).map((q) => q.topic))]);
      store.save();
      rvItemDone();
      if (got) {
        rv.bones += got.n + got.chest;
        const msg = got.levelUp ? `${t('levelUpTitle')} ${rankName(got.levelUp)}` : got.goalHit ? t('goalHitToast') : got.chest ? t('chestTitle') : t('plusBones', got.n);
        setTimeout(() => toast(`${bone()} ${esc(msg)}`, 2200, 'cheer'), 60);
      }
      confetti(40);
    } else {
      c.tried.push(c.sel);
      if (c.tried.length >= 2) { c.status = 'failed'; c.showSol = true; c.steps = 1; failedSeen(); }
      else ahRestartGap();
    }
    c.sel = null;
    S.keepScroll = true; S.scrollToFocus = true;
    render();
    if (c.status !== 'solved' && c.status !== 'failed') {
      const b = app.querySelectorAll('.say.warm'); const el = b[b.length - 1];
      if (el) el.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  },
  'rv-sol'() { const c = S.rv.card; c.showSol = true; c.steps = 1; S.keepScroll = true; S.scrollToFocus = true; render(); },
  'rv-step'() { if (locked()) return; S.lockUntil = Date.now() + 250; const c = S.rv.card; c.steps++; failedSeen(); S.keepScroll = true; S.scrollToFocus = true; render(); },
  'rv-next'() {
    if (locked()) return;
    const rv = S.rv;
    S.lockUntil = Date.now() + 400;
    if (rv.i >= rv.list.length - 1) { rv.done = true; render(); if (rv.solvedSelf) confetti(); return; }
    rv.i++;
    S.hintLock = 0;
    newCard();
    render();
  },
  goal(el) { const gr = store.grade(route().g); gr.rw.goal = +el.dataset.v; store.save(); S.keepScroll = true; render(); },
  // wardrobe
  async buy(el) {
    const g = route().g;
    const gr = store.grade(g);
    const id = el.dataset.id;
    const it = R.itemById(id);
    const price = id === 'blanket' ? R.BLANKET_PRICE : it.price;
    const name = id === 'blanket' ? t('blanketName') : t('items')[id];
    const look = it ? R.lookWith(gr.rw, it) : null;
    const ok = await confirmBox({ title: t('buyTitle', name), text: t('buyText', price, gr.rw.bones - price), yes: t('buyYes'), no: t('cancel'), mood: 'happy', outfit: look });
    if (!ok || !R.buy(gr, id)) return;
    store.save();
    S.keepScroll = true;
    render();
    confetti(40);
    toast(esc(t('bought')), 2200, 'cheer');
  },
  wear(el) { const gr = store.grade(route().g); if (R.toggleWear(gr, el.dataset.id)) { store.save(); S.keepScroll = true; render(); } },
  // progress
  export() {
    const data = JSON.stringify(store.exportData(), null, 1);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `zrinyi-haladas-${L.dayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(t('exportOk'));
  },
  async reset() {
    const g = route().g;
    const ok = await confirmBox({ title: t('resetTitle'), text: t('resetText', g), yes: t('resetYes'), no: t('cancel'), mood: 'oops', danger: true });
    if (!ok) return;
    store.resetGrade(g);
    render();
  }
};

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { if (el.tagName === 'A') ev.preventDefault(); fn(el, ev); }
});

document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('[data-form="nickname"]');
  if (!f) return;
  ev.preventDefault();
  const g = S.modal && S.modal.g;
  if (!g) return;
  const gr = store.grade(g);
  gr.nickname = (f.nick.value || '').trim().slice(0, 16);
  gr.asked = true;
  store.save();
  closeModal();
  render();
});

document.addEventListener('change', async (ev) => {
  const inp = ev.target.closest('[data-change="import"]');
  if (!inp || !inp.files || !inp.files[0]) return;
  let parsed = null;
  try { parsed = store.parseImport(JSON.parse(await inp.files[0].text())); } catch (e) { parsed = null; }
  inp.value = '';
  if (!parsed) { toast(t('importBad'), 3000, 'oops'); return; }
  const gs = Object.keys(parsed).sort().map((k) => t('gradeN', k)).join(', ');
  const ok = await confirmBox({ title: t('importTitle'), text: t('importText', gs), yes: t('importYes'), no: t('cancel') });
  if (!ok) return;
  store.applyImport(parsed);
  render();
  toast(t('importOk'), 2500, 'cheer');
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && S.modal && S.modal.type !== 'pause') {
    if (S.modal.type === 'nickname') A['nick-skip']();
    else { const m = S.modal; closeModal(); m.resolve && m.resolve(false); }
    return;
  }
  // keyboard shortcuts in quiz: A-E / 1-5 select, Enter confirm
  const r = route();
  if (S.modal || (r.name !== 'quiz' && r.name !== 'review')) return;
  if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
  const k = ev.key.toUpperCase();
  const idx = LETTERS.indexOf(k) >= 0 ? LETTERS.indexOf(k) : '12345'.indexOf(k);
  if (idx >= 0) {
    const b = app.querySelector(`.opt[data-l="${LETTERS[idx]}"]:not([disabled])`);
    if (b) b.click();
  }
});

window.addEventListener('hashchange', () => { S.rv = null; render(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && route().name === 'quiz' && activeSess()) { tickNow(); store.save(); } syncAutoHint(); });

/* ---------------- boot ---------------- */
(function boot() {
  const st = store.load();
  let l = st.lang;
  if (!l) l = 'hu';
  setLang(l);
  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
