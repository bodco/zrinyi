// Reward loop (all local, per grade in gr.rw): Archie's bones (XP + currency), daily goal,
// streak blankets (freeze), ranks, weekly chest and the wardrobe. Pure functions; dates are injectable for tests.
import { dayKey, dayDiff, addDays, rankOf, FREEZE_MAX } from './logic.js';

export const GOALS = [30, 50, 80];
export const defaultGoal = (g) => (+g <= 3 ? 30 : 50);
export const BONES = {
  correct: 2, // every correct answer
  unaided: 1, // extra for a correct answer without hints
  fixSelf: 3, // review: fixed by yourself
  fixHint: 1, // review: fixed with hints
  done: { quick: 5, mistakes: 5, challenge: 8, full: 15, mock: 20, topic: 5 }
};
export const CHEST_DAYS = 5;
export const CHEST_BONES = 40;
export const MIGRATE_PER_SESSION = 10;
export const BLANKET_PRICE = 60;

// Wardrobe. slot: harness | hat | neck | eyes. 'navy' is Archie's own harness (free).
export const ITEMS = [
  { id: 'navy', slot: 'harness', price: 0, color: '#2B3A67' },
  { id: 'red', slot: 'harness', price: 40, color: '#DC2626' },
  { id: 'green', slot: 'harness', price: 40, color: '#16A34A' },
  { id: 'pink', slot: 'harness', price: 40, color: '#EC4899' },
  { id: 'gold', slot: 'harness', price: 150, color: '#E0A400' },
  { id: 'bowtie', slot: 'neck', price: 60 },
  { id: 'scarf', slot: 'neck', price: 120 },
  { id: 'glasses', slot: 'eyes', price: 80 },
  { id: 'cap', slot: 'hat', price: 100 },
  { id: 'crown', slot: 'hat', price: 500 }
];
export const itemById = (id) => ITEMS.find((x) => x.id === id) || null;
export const SLOTS = ['harness', 'hat', 'neck', 'eyes'];

export function blankRw(g) {
  return { bones: 0, earned: 0, goal: defaultGoal(g), days: {}, goalDays: 0, freezes: 0, frozen: [], chests: {}, owned: ['navy'], outfit: { harness: 'navy' }, lvlSeen: 1, mig: 1 };
}

// Create or repair gr.rw. Older saves (no rw) get 10 bones per finished session, once (flag mig).
export function ensureRw(gr, g) {
  let rw = gr.rw;
  if (!rw || typeof rw !== 'object') {
    rw = gr.rw = blankRw(g);
    const n = (gr.sessions || []).length;
    rw.bones = rw.earned = n * MIGRATE_PER_SESSION;
    rw.lvlSeen = rankOf(rw.earned).n;
    return rw;
  }
  const b = blankRw(g);
  for (const k in b) if (rw[k] === undefined || rw[k] === null || typeof rw[k] !== typeof b[k]) rw[k] = b[k];
  if (!Array.isArray(rw.owned)) rw.owned = ['navy'];
  if (!rw.owned.includes('navy')) rw.owned.unshift('navy');
  rw.owned = rw.owned.filter((id) => itemById(id));
  for (const s of Object.keys(rw.outfit)) if (!SLOTS.includes(s) || !rw.owned.includes(rw.outfit[s])) delete rw.outfit[s];
  if (!rw.outfit.harness) rw.outfit.harness = 'navy';
  if (!GOALS.includes(rw.goal)) rw.goal = defaultGoal(g);
  rw.bones = Math.max(0, Math.floor(+rw.bones || 0));
  rw.earned = Math.max(rw.bones, Math.floor(+rw.earned || 0));
  rw.freezes = Math.min(FREEZE_MAX, Math.max(0, Math.floor(+rw.freezes || 0)));
  return rw;
}

// Monday of the week as a day key
export function weekKey(today = dayKey()) {
  const d = new Date(today + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  return addDays(today, -dow);
}
export function weekDays(today = dayKey()) {
  const mon = weekKey(today);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}
export function activeDaysThisWeek(rw, today = dayKey()) {
  return weekDays(today).filter((d) => d <= today && (rw.days[d] || 0) > 0).length;
}
export const todayBones = (rw, today = dayKey()) => rw.days[today] || 0;

function pruneDays(rw, today) {
  for (const k of Object.keys(rw.days)) if (dayDiff(k, today) > 70) delete rw.days[k];
  const ck = Object.keys(rw.chests).sort();
  while (ck.length > 12) delete rw.chests[ck.shift()];
}

// Add bones earned by practice. Returns what changed so the UI can celebrate.
export function addBones(gr, n, today = dayKey(), opts = {}) {
  const rw = gr.rw;
  const before = { day: todayBones(rw, today), level: rankOf(rw.earned).n, earned: rw.earned };
  rw.bones += n;
  rw.earned += n;
  if (opts.countsForDay !== false) rw.days[today] = (rw.days[today] || 0) + n;
  const after = { day: todayBones(rw, today), level: rankOf(rw.earned).n };
  const goalHit = before.day < rw.goal && after.day >= rw.goal;
  if (goalHit) rw.goalDays = (rw.goalDays || 0) + 1;
  let chest = 0;
  const wk = weekKey(today);
  if (opts.countsForDay !== false && !rw.chests[wk] && activeDaysThisWeek(rw, today) >= CHEST_DAYS) {
    rw.chests[wk] = 1;
    chest = CHEST_BONES;
    rw.bones += chest;
    rw.earned += chest;
  }
  const levelAfter = rankOf(rw.earned).n;
  const levelUp = levelAfter > rw.lvlSeen ? levelAfter : 0;
  if (levelUp) rw.lvlSeen = levelAfter;
  pruneDays(rw, today);
  return { n, chest, goal: rw.goal, dayBefore: before.day, dayAfter: after.day, goalHit, levelBefore: before.level, levelUp, earnedBefore: before.earned, earnedAfter: rw.earned };
}

// Bones for a finished session record (never negative; wrong answers simply give 0)
export function sessionBones(rec) {
  const items = rec.items || [];
  const correct = items.filter((x) => x.ok === true).length;
  const unaided = items.filter((x) => x.ok === true && !x.h).length;
  const answered = items.filter((x) => x.ok !== null).length;
  const parts = { correct: correct * BONES.correct, unaided: unaided * BONES.unaided, done: 0 };
  // the completion bonus needs a real try: at least half of the problems answered
  if (items.length && answered * 2 >= items.length) parts.done = BONES.done[rec.mode] || 5;
  return { total: parts.correct + parts.unaided + parts.done, parts, correct, unaided };
}

export function awardSession(gr, rec, streakRes = {}, today = dayKey()) {
  const b = sessionBones(rec);
  rec.bones = b.total;
  const res = addBones(gr, b.total, today);
  return Object.assign(res, { parts: b.parts, correct: b.correct, unaided: b.unaided, freezeUsed: streakRes.freezeUsed || 0, freezeEarned: streakRes.freezeEarned || 0 });
}

// Review: a mistake fixed during the guided review. Each problem of a session pays once (item.rb flag).
export function awardReviewFix(gr, item, withHints, today = dayKey()) {
  if (!item || item.rb) return null;
  item.rb = 1;
  return addBones(gr, withHints ? BONES.fixHint : BONES.fixSelf, today);
}

// Wardrobe
export function buy(gr, id) {
  const rw = gr.rw;
  if (id === 'blanket') {
    if (rw.freezes >= FREEZE_MAX || rw.bones < BLANKET_PRICE) return false;
    rw.bones -= BLANKET_PRICE; rw.freezes++;
    return true;
  }
  const it = itemById(id);
  if (!it || rw.owned.includes(id) || rw.bones < it.price) return false;
  rw.bones -= it.price;
  rw.owned.push(id);
  rw.outfit[it.slot] = id;
  return true;
}
export function toggleWear(gr, id) {
  const rw = gr.rw, it = itemById(id);
  if (!it || !rw.owned.includes(id)) return false;
  if (rw.outfit[it.slot] === id) { if (it.slot === 'harness') rw.outfit.harness = 'navy'; else delete rw.outfit[it.slot]; }
  else rw.outfit[it.slot] = id;
  return true;
}
// outfit for the mascot: {harness: color, hat, neck, eyes}
export function outfitFor(rw) {
  if (!rw) return null;
  const o = rw.outfit || {};
  const h = itemById(o.harness);
  return { harness: h ? h.color : null, hat: o.hat || null, neck: o.neck || null, eyes: o.eyes || null };
}
