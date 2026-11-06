// Reward loop (all local, per grade in gr.rw): Archie's bones (XP + currency), daily goal,
// streak blankets (freeze), ranks, weekly chest, surprise gifts and the wardrobe. Pure functions; dates are injectable for tests.
// Age bands (logic.js bandOf, YOUNG_MAX_GRADE): the young band gets more small wins, the scoring of answers is the same for all.
import { dayKey, dayDiff, addDays, rankOf, FREEZE_MAX, bandOf, isYoung, YOUNG_MAX_GRADE } from './logic.js';
export { bandOf, isYoung, YOUNG_MAX_GRADE };

export const BONES = {
  correct: 4, // every correct answer (as in the real contest)
  wrong: 1, // taken away for a wrong answer (as in the real contest); skipped = 0
  fixSelf: 5, // review: a WRONG answer fixed by yourself (a bit more than a correct answer; net -1 + 5 = 4, so answering wrong on purpose never pays)
  fixHint: 3, // review: a wrong answer fixed with hints
  fixSkipSelf: 3, // review: a SKIPPED problem fixed by yourself (less than solving it the first time, so skipping never pays)
  fixSkipHint: 2, // review: a skipped problem fixed with hints
  done: { quick: 5, mistakes: 5, challenge: 8, full: 15, mock: 20, topic: 5 }
};
// per band: shop price factor, rank-lock factor, chest days, daily goal options + default, surprise gifts
export const BANDS = {
  young: { priceK: 0.62, rankK: 0.6, chestDays: 3, chest: 40, goals: [20, 30, 50], goal: 20, surprise: true },
  older: { priceK: 1, rankK: 1, chestDays: 5, chest: 100, goals: [30, 50, 80], goal: 50, surprise: false }
};
export const bandCfg = (g) => BANDS[bandOf(g)];
export const goalsFor = (g) => bandCfg(g).goals;
export const defaultGoal = (g) => bandCfg(g).goal;
export const chestDays = (g) => bandCfg(g).chestDays;
export const chestBones = (g) => bandCfg(g).chest;
export const GOALS = BANDS.older.goals; // kept for older imports
export const CHEST_DAYS = BANDS.older.chestDays;
export const CHEST_BONES = BANDS.young.chest; // kept for older imports; use chestBones(g)
export const GOAL_BONUS = 5; // once a day, when the daily goal is reached (matters most for the young, whose goal is small)
// surprise gift box (young band): every SURPRISE_EVERY-th finished session, the amount comes from this list in turn
export const SURPRISE_EVERY = 3;
export const SURPRISE = [10, 6, 12, 8, 15, 5, 11, 7, 14, 9];
export const surpriseFor = (k) => SURPRISE[(k - 1) % SURPRISE.length]; // k-th surprise, 1-based
export const MIGRATE_PER_SESSION = 10;
export const BLANKET_PRICE = 60;

// Wardrobe. Wearables (harness | body | hat | neck | eyes) show on every Archie; scene items
// (toy | bowl | house | trophy | bed) only where Archie is shown large (archieScene); 'bg' is a backdrop behind the
// hero sections only. 'navy' is Archie's own harness (free). price and rank are the BASE values (older band);
// the young band pays priceFor() and needs rankNeed() (both scaled, see BANDS). wave: 2 = added in v11.
// Prices and ranks were set with tests/econ_sim.mjs. Items already bought always stay owned.
export const ITEMS = [
  { id: 'navy', slot: 'harness', price: 0, color: '#2B3A67' },
  { id: 'red', slot: 'harness', price: 70, rank: 2, color: '#DC2626' },
  { id: 'green', slot: 'harness', price: 70, rank: 3, color: '#16A34A' },
  { id: 'pink', slot: 'harness', price: 70, rank: 4, color: '#EC4899' },
  { id: 'gold', slot: 'harness', price: 180, rank: 7, color: '#E0A400' },
  { id: 'sw_red', slot: 'body', price: 120, rank: 4 },
  { id: 'sw_blue', slot: 'body', price: 150, rank: 6 },
  { id: 'sw_green', slot: 'body', price: 180, rank: 7 },
  { id: 'sw_rainbow', slot: 'body', price: 300, rank: 9, premium: 1 },
  { id: 'bowtie', slot: 'neck', price: 80, rank: 2 },
  { id: 'scarf', slot: 'neck', price: 130, rank: 5 },
  { id: 'glasses', slot: 'eyes', price: 90, rank: 3 },
  { id: 'cap', slot: 'hat', price: 120, rank: 4 },
  { id: 'crown', slot: 'hat', price: 380, rank: 9, premium: 1 },
  { id: 'toy_small', slot: 'toy', price: 50 },
  { id: 'toy_big', slot: 'toy', price: 150, rank: 6 },
  { id: 'toy_gold', slot: 'toy', price: 260, rank: 8, premium: 1 },
  { id: 'bowl_blue', slot: 'bowl', price: 30 },
  { id: 'bowl_red', slot: 'bowl', price: 80, rank: 3 },
  { id: 'bowl_green', slot: 'bowl', price: 90, rank: 5 },
  { id: 'bowl_pink', slot: 'bowl', price: 90, rank: 6 },
  { id: 'bowl_gold', slot: 'bowl', price: 220, rank: 8, premium: 1 },
  { id: 'house_wood', slot: 'house', price: 130, rank: 5 },
  { id: 'house_red', slot: 'house', price: 200, rank: 7 },
  { id: 'house_blue', slot: 'house', price: 240, rank: 8 },
  { id: 'house_castle', slot: 'house', price: 420, rank: 10, premium: 1 },
  // wave 2 (v11)
  { id: 'headphones', slot: 'hat', price: 200, rank: 9, wave: 2 },
  { id: 'sunglasses', slot: 'eyes', price: 200, rank: 9, wave: 2 },
  { id: 'tie', slot: 'neck', price: 180, rank: 10, wave: 2 },
  { id: 'ball', slot: 'toy', price: 180, rank: 10, wave: 2 },
  { id: 'raincoat', slot: 'body', price: 240, rank: 10, wave: 2 },
  { id: 'bg_park', slot: 'bg', price: 240, rank: 11, wave: 2 },
  { id: 'hat_pirate', slot: 'hat', price: 260, rank: 11, wave: 2 },
  { id: 'frisbee', slot: 'toy', price: 200, rank: 11, wave: 2 },
  { id: 'goggles', slot: 'eyes', price: 260, rank: 12, wave: 2 },
  { id: 'bed', slot: 'bed', price: 280, rank: 12, wave: 2 },
  { id: 'hat_safari', slot: 'hat', price: 280, rank: 12, wave: 2 },
  { id: 'medal', slot: 'neck', price: 320, rank: 13, wave: 2 },
  { id: 'bg_beach', slot: 'bg', price: 300, rank: 13, wave: 2 },
  { id: 'cape', slot: 'body', price: 400, rank: 13, wave: 2 },
  { id: 'hat_wizard', slot: 'hat', price: 900, rank: 14, wave: 2, premium: 1 },
  { id: 'bg_space', slot: 'bg', price: 450, rank: 14, wave: 2 },
  { id: 'trophy', slot: 'trophy', price: 900, rank: 14, wave: 2, premium: 1 }
];
export const itemById = (id) => ITEMS.find((x) => x.id === id) || null;
export const WEAR_SLOTS = ['harness', 'body', 'hat', 'neck', 'eyes'];
export const SCENE_SLOTS = ['toy', 'bowl', 'house', 'trophy', 'bed'];
export const BG_SLOTS = ['bg'];
export const SLOTS = WEAR_SLOTS.concat(SCENE_SLOTS, BG_SLOTS);
const round5 = (x) => Math.round(x / 5) * 5;
// price and rank lock for a grade (g missing = base values)
export function priceFor(it, g) {
  if (!it || !it.price) return 0;
  const k = bandCfg(g).priceK;
  return k === 1 ? it.price : Math.max(5, round5(it.price * k));
}
export function rankNeed(it, g) {
  const r = (it && it.rank) || 1;
  const k = bandCfg(g).rankK;
  return k === 1 ? r : Math.max(1, Math.round(r * k));
}
export const priceOf = (rw, it) => priceFor(it, rw && rw.g);
// can this item be bought at the child's level?
export const unlocked = (rw, it) => rankOf((rw && rw.earned) || 0).n >= rankNeed(it, rw && rw.g);
// ids that can be bought at this level (for the "new!" marks after a level-up)
const unlockedIds = (rw, oldRules = false) => ITEMS.filter((it) => oldRules ? !it.wave && rankOf(rw.earned || 0).n >= ((it.rank) || 1) : unlocked(rw, it)).map((x) => x.id);
// unlocked, not owned and not yet seen in the shop
export const newItems = (rw) => ITEMS.filter((it) => it.price > 0 && unlocked(rw, it) && !rw.owned.includes(it.id) && !(rw.seen || []).includes(it.id)).map((x) => x.id);
export function markSeen(rw) { const s = new Set(rw.seen || []); for (const id of unlockedIds(rw)) s.add(id); rw.seen = [...s]; }

export function blankRw(g) {
  const rw = { bones: 0, earned: 0, goal: defaultGoal(g), days: {}, goalDays: 0, freezes: 0, frozen: [], chests: {}, owned: ['navy'], outfit: { harness: 'navy' }, lvlSeen: 1, mig: 1, g: +g || 0, sc: 0, fixN: 0, seen: [], v11: 1 };
  markSeen(rw);
  return rw;
}

// Create or repair gr.rw. Older saves (no rw) get 10 bones per finished session, once (flag mig).
export function ensureRw(gr, g) {
  let rw = gr.rw;
  if (!rw || typeof rw !== 'object') {
    rw = gr.rw = blankRw(g);
    const n = (gr.sessions || []).length;
    rw.bones = rw.earned = n * MIGRATE_PER_SESSION;
    rw.lvlSeen = rankOf(rw.earned).n;
    rw.sc = n;
    markSeen(rw);
    return rw;
  }
  if (g) rw.g = +g;
  // v11 migration, once: session counter for the surprises, young default goal 30 -> 20, and the items the child could
  // already buy before v11 count as seen (so the new band prices / wave 2 show up as "new!")
  if (!rw.v11) {
    rw.v11 = 1;
    rw.sc = (gr.sessions || []).length;
    if (isYoung(rw.g) && rw.goal === 30) rw.goal = defaultGoal(rw.g);
    rw.seen = Array.isArray(rw.owned) ? unlockedIds(rw, true) : [];
  }
  const b = blankRw(rw.g || g);
  for (const k in b) if (rw[k] === undefined || rw[k] === null || typeof rw[k] !== typeof b[k]) rw[k] = b[k];
  if (!Array.isArray(rw.owned)) rw.owned = ['navy'];
  if (!Array.isArray(rw.seen)) rw.seen = [];
  if (!rw.owned.includes('navy')) rw.owned.unshift('navy');
  rw.owned = rw.owned.filter((id) => itemById(id));
  for (const s of Object.keys(rw.outfit)) { const it = itemById(rw.outfit[s]); if (!SLOTS.includes(s) || !it || it.slot !== s || !rw.owned.includes(rw.outfit[s])) delete rw.outfit[s]; }
  if (!rw.outfit.harness) rw.outfit.harness = 'navy';
  const goals = goalsFor(rw.g);
  if (!goals.includes(rw.goal)) rw.goal = BANDS.young.goals.concat(BANDS.older.goals).includes(rw.goal) ? goals.reduce((a, x) => (Math.abs(x - rw.goal) < Math.abs(a - rw.goal) ? x : a)) : defaultGoal(rw.g);
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
  let goalBonus = 0;
  if (goalHit) { rw.goalDays = (rw.goalDays || 0) + 1; goalBonus = GOAL_BONUS; rw.bones += goalBonus; rw.earned += goalBonus; }
  // the weekly chest is not paid automatically: it becomes READY (2) and the child opens it on the home screen (claimChest -> 1)
  const chest = 0;
  let chestReady = false;
  const wk = weekKey(today);
  if (opts.countsForDay !== false && !rw.chests[wk] && activeDaysThisWeek(rw, today) >= chestDays(rw.g)) {
    rw.chests[wk] = 2;
    chestReady = true;
  }
  const levelAfter = rankOf(rw.earned).n;
  const levelUp = levelAfter > rw.lvlSeen ? levelAfter : 0;
  if (levelUp) rw.lvlSeen = levelAfter;
  pruneDays(rw, today);
  return { n, chest, chestReady, goal: rw.goal, dayBefore: before.day, dayAfter: after.day, goalHit, goalBonus, levelBefore: before.level, levelUp, earnedBefore: before.earned, earnedAfter: rw.earned };
}
// open a ready weekly chest (any week still listed); returns {n, levelUp} or null
export function claimChest(gr) {
  const rw = gr.rw;
  const wk = Object.keys(rw.chests || {}).sort().reverse().find((k) => rw.chests[k] === 2);
  if (!wk) return null;
  rw.chests[wk] = 1;
  const n = chestBones(rw.g);
  const res = { n, levelUp: 0 };
  addGift(rw, res, n);
  return res;
}
export const chestState = (rw, today = dayKey()) => (Object.values(rw.chests || {}).includes(2) ? 'ready' : rw.chests && rw.chests[weekKey(today)] === 1 ? 'opened' : 'closed');
// extra bones that are not practice (surprise gift): bones + level, not the daily goal
function addGift(rw, res, n) {
  rw.bones += n; rw.earned += n;
  const lv = rankOf(rw.earned).n;
  if (lv > rw.lvlSeen) { rw.lvlSeen = lv; res.levelUp = lv; }
  res.earnedAfter = rw.earned;
}

// Bones for a finished session record follow the real Zrínyi scoring:
// +4 for a correct answer, -1 for a wrong one, 0 for a skipped one.
// In the mock contest everybody also starts with as many points as there are problems,
// so the bones equal the Zrínyi score. Never negative.
export function sessionBones(rec) {
  const items = rec.items || [];
  const correct = items.filter((x) => x.ok === true).length;
  const wrong = items.filter((x) => x.ok === false).length;
  const unaided = items.filter((x) => x.ok === true && !x.h).length;
  const parts = { correct: correct * BONES.correct, wrong: -wrong * BONES.wrong, start: rec.mode === 'mock' ? items.length : 0 };
  const total = Math.max(0, parts.correct + parts.wrong + parts.start);
  return { total, parts, correct, wrong, unaided };
}

export function awardSession(gr, rec, streakRes = {}, today = dayKey()) {
  const b = sessionBones(rec);
  rec.bones = b.total;
  const res = addBones(gr, b.total, today);
  const rw = gr.rw;
  rw.sc = (rw.sc || 0) + 1;
  res.surprise = 0;
  if (bandCfg(rw.g).surprise && rw.sc % SURPRISE_EVERY === 0) {
    res.surprise = surpriseFor(rw.sc / SURPRISE_EVERY);
    addGift(rw, res, res.surprise);
  }
  // sessions until the next surprise (for the results screen), 0 when the band has none
  res.surpriseIn = bandCfg(rw.g).surprise ? SURPRISE_EVERY - (rw.sc % SURPRISE_EVERY) : 0;
  return Object.assign(res, { parts: b.parts, correct: b.correct, wrong: b.wrong, unaided: b.unaided, freezeUsed: streakRes.freezeUsed || 0, freezeEarned: streakRes.freezeEarned || 0 });
}

// Review: a mistake fixed during the guided review. Each problem of a session pays once (item.rb flag).
export function fixPay(item, withHints) {
  const skipped = !!item && item.ok !== false;
  return skipped ? (withHints ? BONES.fixSkipHint : BONES.fixSkipSelf) : (withHints ? BONES.fixHint : BONES.fixSelf);
}
export function awardReviewFix(gr, item, withHints, today = dayKey()) {
  if (!item || item.rb) return null;
  item.rb = 1;
  gr.rw.fixN = (gr.rw.fixN || 0) + 1;
  return addBones(gr, fixPay(item, withHints), today);
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
  const price = priceOf(rw, it);
  if (!it || rw.owned.includes(id) || rw.bones < price || !unlocked(rw, it)) return false;
  rw.bones -= price;
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
// outfit for the mascot: {harness: color, body, hat, neck, eyes, toy, bowl, house, trophy, bed, bg} (ids, null when empty)
export function outfitFor(rw) {
  if (!rw) return null;
  const o = rw.outfit || {};
  const h = itemById(o.harness);
  const out = { harness: h ? h.color : null };
  for (const s of SLOTS) if (s !== 'harness') out[s] = o[s] || null;
  return out;
}
// the look with one item tried on (shop preview, buy dialog)
export function lookWith(rw, it) {
  return Object.assign({}, outfitFor(rw), { [it.slot]: it.slot === 'harness' ? it.color : it.id });
}
