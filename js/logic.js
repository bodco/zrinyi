// Pure-ish game logic: problem selection, scoring, stats, badges.
export const PRACTICE_N = 10;
export const mockN = (g) => (g >= 7 ? 30 : 25);
export const MOCK_N = 25;
export const mockMinutes = (g) => (g <= 4 ? 60 : g <= 6 ? 75 : 90);
export const mockMax = (n) => 5 * n;

const rand = () => Math.random();
export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const isOpenMistake = (st) => !!st && st.wrong > 0 && !st.fixed;
export const isChallenge = (p) => p.level === 'challenge';
export const regular = (all) => all.filter((p) => !isChallenge(p));
// effective difficulty: challenge problems count as the hardest
export const dOf = (p) => (isChallenge(p) ? 3 : p.difficulty);
export const challengeSet = (all) => all.filter(isChallenge);
export const CHALLENGE_MAX = 5;
export const CHALLENGE_N = 8;
// grades whose data files are filled in; the others show a "coming soon" badge. Extend when new data lands.
export const READY_GRADES = [2, 5];
export const isReady = (g) => READY_GRADES.includes(+g);

// hint levels available for a problem: p.hints[lang] if present, else the single guiding hint
export function hintList(p, lang, fallback = true) {
  const h = p.hints && (p.hints[lang] || p.hints.hu);
  if (Array.isArray(h) && h.length) return h;
  if (!fallback) return [];
  const one = p.hint && (p.hint[lang] || p.hint.hu);
  return one ? [one] : [];
}

// Automatic hint timing. Returns the waiting time in ms before each hint level opens by
// itself: [gap to level 1, gap from level 1 to level 2, ...]. Gaps grow by 1.5x, each capped.
// context: 'quiz' (practice modes) or 'review' (mistake review try-again: shorter, the child met it before).
export const AUTO_HINT_BASE = { 1: 40000, 2: 60000, 3: 80000 };
export const AUTO_HINT_CAP = 180000;
export function autoHintDelays(p, grade, context = 'quiz') {
  const n = hintList(p, 'hu', context !== 'review').length;
  const d = Math.min(3, Math.max(1, Math.round(dOf(p)) || 1));
  let base = AUTO_HINT_BASE[d];
  if (+grade <= 3) base *= 1.2; // slower readers
  if (context === 'review') base *= 0.6;
  const out = [];
  let gap = base;
  for (let i = 0; i < n; i++) {
    out.push(Math.round(Math.min(gap, AUTO_HINT_CAP)));
    gap *= 1.5;
  }
  return out;
}

export function openMistakes(all, gr) {
  return regular(all).filter((p) => isOpenMistake(gr.problemStats[p.id]));
}

function recentIds(gr, nSessions = 3) {
  const set = new Set();
  gr.sessions.slice(-nSessions).forEach((s) => (s.items || []).forEach((it) => set.add(it.id)));
  return set;
}

// tier: 0 unseen, 1 wrong and not fixed, 2 seen before (older first), 3 seen in the last sessions
function ranker(gr) {
  const recent = recentIds(gr);
  return (p) => {
    const st = gr.problemStats[p.id];
    let tier;
    if (!st || !st.seen) tier = 0;
    else if (recent.has(p.id)) tier = 3;
    else if (isOpenMistake(st)) tier = 1;
    else tier = 2;
    const age = st && st.lastSeen ? st.lastSeen / 1e13 : 0; // older first inside tier 2
    return tier + (tier === 2 ? age * 0.5 : 0) + rand() * 0.4;
  };
}

function pickBalanced(pool, count, targets, rank) {
  const scored = pool.map((p) => ({ p, r: rank(p), real: !!(p.source && p.source.type === 'real') }));
  const chosen = new Set();
  const out = [];
  let nReal = 0, nGen = 0;
  // take k from cands (sorted by rank), keeping real and generated roughly even over the whole session
  const take = (cands, k) => {
    const real = cands.filter((x) => x.real), gen = cands.filter((x) => !x.real);
    while (k > 0 && (real.length || gen.length)) {
      let useReal;
      if (!real.length) useReal = false;
      else if (!gen.length) useReal = true;
      else {
        useReal = nReal < nGen ? true : nGen < nReal ? false : real[0].r <= gen[0].r;
        const under = useReal ? real[0] : gen[0], over = useReal ? gen[0] : real[0];
        // do not take a much worse (already seen) problem just to balance when the gap is small
        if (under.r - over.r >= 1 && Math.abs(nReal - nGen) < 2) useReal = !useReal;
      }
      const c = (useReal ? real : gen).shift();
      chosen.add(c.p.id); out.push(c.p);
      if (c.real) nReal++; else nGen++;
      k--;
    }
  };
  for (const d of [1, 2, 3]) {
    const cands = scored.filter((x) => dOf(x.p) === d && x.r < 3 && !chosen.has(x.p.id)).sort((a, b) => a.r - b.r);
    take(cands, targets[d] || 0);
  }
  if (out.length < count) {
    take(scored.filter((x) => !chosen.has(x.p.id)).sort((a, b) => a.r - b.r), count - out.length);
  }
  return out.slice(0, count);
}

// easy to hard: difficulty asc, then real problems by source.no asc, generated ones after them in random order
function orderKey(p) { return p.source && p.source.type === 'real' ? [0, p.source.no || 0] : [1, 0]; }
export function easyToHard(list) {
  return shuffle(list).sort((a, b) => {
    if (dOf(a) !== dOf(b)) return dOf(a) - dOf(b);
    const ka = orderKey(a), kb = orderKey(b);
    if (ka[0] !== kb[0]) return ka[0] - kb[0];
    return ka[1] - kb[1];
  });
}

// practice level per grade: 'contest' (default, county-round mix incl. hardest problems) or 'easy' (gentler)
export const LEVELS = ['contest', 'easy'];
export const levelOf = (gr) => (gr && gr.level === 'easy' ? 'easy' : 'contest');
export function practiceTargets(g, level = 'contest') {
  if (level === 'contest') return { 1: 3, 2: 4, 3: 3 };
  return g <= 3 ? { 1: 5, 2: 4, 3: 1 } : { 1: 4, 2: 4, 3: 2 };
}

// challenge mode: up to CHALLENGE_MAX challenge problems plus the hardest regular difficulty-3 ones, CHALLENGE_N in total
function pickChallenge(all, rank) {
  const ch = challengeSet(all).map((p) => ({ p, r: rank(p) })).sort((a, b) => a.r - b.r).slice(0, CHALLENGE_MAX).map((x) => x.p);
  const need = CHALLENGE_N - ch.length;
  const hard = regular(all).filter((p) => p.difficulty === 3)
    .sort((a, b) => ((b.source && b.source.type === 'real' ? b.source.no || 0 : 0) - (a.source && a.source.type === 'real' ? a.source.no || 0 : 0)))
    .slice(0, need + 6)
    .map((p) => ({ p, r: rank(p) })).sort((a, b) => a.r - b.r).slice(0, need).map((x) => x.p);
  return [...easyToHard(hard), ...easyToHard(ch)];
}
export const challengeCount = (all) => (challengeSet(all).length ? Math.min(CHALLENGE_N, all.length) : 0);

export function selectProblems(all, gr, mode, topic) {
  const rank = ranker(gr);
  const g = all[0] ? all[0].grade : 5;
  if (mode === 'challenge') return pickChallenge(all, rank);
  const level = levelOf(gr);
  const reg = level === 'contest' ? all : regular(all);
  if (mode === 'mistakes') {
    const pool = openMistakes(all, gr).sort((a, b) => (gr.problemStats[a.id].lastSeen || 0) - (gr.problemStats[b.id].lastSeen || 0));
    return easyToHard(pool.slice(0, PRACTICE_N));
  }
  if (mode === 'mock') {
    const n = mockN(g);
    const tg = n === 30 ? { 1: 9, 2: 12, 3: 9 } : { 1: 8, 2: 10, 3: 7 };
    return easyToHard(pickBalanced(reg, n, tg, rank));
  }
  const pool = mode === 'topic' ? reg.filter((p) => p.topic === topic) : reg;
  return easyToHard(pickBalanced(pool, PRACTICE_N, practiceTargets(g, level), rank));
}

export function newSession(grade, mode, topic, problems) {
  return {
    grade, mode, topic: topic || null,
    ids: problems.map((p) => p.id),
    answers: problems.map(() => null), // letter or null
    hints: problems.map(() => 0), // hint levels opened per problem
    idx: 0,
    elapsed: 0, // ms, excluding pauses
    started: Date.now(),
    limit: mode === 'mock' ? mockMinutes(grade) * 60000 : 0
  };
}

export function scoreOf(c, w, n = MOCK_N) { return 4 * c - w + n; }

export function starsOf(acc) { return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0; }

export function dayKey(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function dayDiff(a, b) {
  const pa = new Date(a + 'T12:00:00'), pb = new Date(b + 'T12:00:00');
  return Math.round((pb - pa) / 86400000);
}

export function currentStreak(gr) {
  const st = gr.streak;
  if (!st || !st.last) return 0;
  const d = dayDiff(st.last, dayKey());
  return d <= 1 ? st.count : 0;
}

// Commit a finished session; returns {record, newBadges}
export function finishSession(gr, sess, byId, topicsInData) {
  const items = sess.ids.map((id, i) => {
    const p = byId[id];
    const a = sess.answers[i];
    const h = (sess.hints && sess.hints[i]) || 0;
    const it = { id, a, ok: a ? a === p.answer : null };
    if (h > 0) it.h = h;
    return it;
  });
  const correct = items.filter((x) => x.ok === true).length;
  const wrong = items.filter((x) => x.ok === false).length;
  const skipped = items.length - correct - wrong;
  const now = Date.now();
  for (const it of items) {
    const st = gr.problemStats[it.id] || (gr.problemStats[it.id] = { seen: 0, correct: 0, wrong: 0, fixed: false, lastSeen: 0 });
    st.seen++;
    st.lastSeen = now;
    if (it.h) { st.hintsUsed = (st.hintsUsed || 0) + it.h; if (it.ok === true) st.hintOk = (st.hintOk || 0) + 1; }
    if (it.ok === true) {
      st.correct++;
      if (st.wrong > 0 && !st.fixed) { st.fixed = true; gr.fixedTotal = (gr.fixedTotal || 0) + 1; it.fx = 1; }
    } else if (it.ok === false) {
      st.wrong++;
      st.fixed = false;
    } else {
      st.skipped = (st.skipped || 0) + 1;
    }
  }
  const n = items.length;
  const record = {
    id: now.toString(36), date: new Date(now).toISOString(), mode: sess.mode, topic: sess.topic,
    n, correct, wrong, skipped, acc: n ? correct / n : 0,
    score: sess.mode === 'mock' ? scoreOf(correct, wrong, sess.ids.length) : null,
    timeSec: Math.round(sess.elapsed / 1000), items
  };
  gr.sessions.push(record);
  // streak
  const today = dayKey();
  if (!gr.streak || !gr.streak.last) gr.streak = { last: today, count: 1 };
  else {
    const d = dayDiff(gr.streak.last, today);
    if (d === 1) gr.streak = { last: today, count: gr.streak.count + 1 };
    else if (d !== 0) gr.streak = { last: today, count: 1 };
  }
  gr.active = null;
  const newBadges = checkBadges(gr, byId, topicsInData);
  return { record, newBadges };
}

export function markFixed(gr, id) {
  const st = gr.problemStats[id];
  if (!st) return false;
  if (st.fixed) return false;
  st.fixed = true;
  gr.fixedTotal = (gr.fixedTotal || 0) + 1;
  return true;
}

export const BADGE_ORDER = ['first', 'streak3', 'streak7', 'perfect', 'fix10', 'sessions10', 'explorer', 'mockDone', 'mock100'];

export function checkBadges(gr, byId, topicsInData) {
  const have = new Set(gr.badges.map((b) => b.id));
  const s = gr.sessions;
  const triedTopics = new Set();
  for (const id in gr.problemStats) if (byId[id]) triedTopics.add(byId[id].topic);
  const cond = {
    first: s.length >= 1,
    streak3: gr.streak.count >= 3,
    streak7: gr.streak.count >= 7,
    perfect: s.some((x) => x.n >= 10 && x.correct === x.n),
    fix10: (gr.fixedTotal || 0) >= 10,
    sessions10: s.length >= 10,
    explorer: topicsInData && topicsInData.length > 0 && topicsInData.every((t) => triedTopics.has(t)),
    mockDone: s.some((x) => x.mode === 'mock'),
    mock100: s.some((x) => x.mode === 'mock' && x.score >= 100)
  };
  const earned = [];
  for (const id of BADGE_ORDER) {
    if (cond[id] && !have.has(id)) { gr.badges.push({ id, date: new Date().toISOString() }); earned.push(id); }
  }
  return earned;
}

export function gradeSummary(gr) {
  const all = gr.sessions;
  const s = all.filter((x) => x.mode !== 'challenge'); // challenge rounds do not count towards accuracy
  const n = s.reduce((a, x) => a + x.n, 0);
  const c = s.reduce((a, x) => a + x.correct, 0);
  return {
    sessions: all.length,
    acc: n ? c / n : null,
    streak: currentStreak(gr),
    last: s[s.length - 1] || null,
    bestStars: s.length ? Math.max(...s.map((x) => starsOf(x.acc))) : 0,
    unaided: Object.values(gr.problemStats).reduce((a, x) => a + Math.max(0, (x.correct || 0) - (x.hintOk || 0)), 0),
    bestMock: s.filter((x) => x.mode === 'mock').reduce((m, x) => Math.max(m, x.score), -1)
  };
}

export function topicMastery(all, gr) {
  const t = {};
  for (const p of all) {
    const e = t[p.topic] || (t[p.topic] = { total: 0, c: 0, a: 0 });
    e.total++;
    const st = gr.problemStats[p.id];
    if (st) { e.c += st.correct + (st.fixed && st.correct === 0 ? 1 : 0); e.a += st.correct + st.wrong + (st.skipped || 0); }
  }
  for (const k in t) t[k].pct = t[k].a ? Math.min(1, t[k].c / t[k].a) : null;
  return t;
}
