// Archie (Arcsi / Арчі): a cartoon brown-and-white Jack Russell terrier, original inline SVG.
// Collar color follows the theme (--owl). moods: happy, think, cheer, sleep, oops
// The exported name `owl` is kept for backwards compatibility with app.js.
const BROWN = '#B8692E', BROWN_D = '#8A4A1C', INK = '#2A1E17', WHITE = '#FFFDF8', LINE = '#5B3A22';

// Outfit from the wardrobe: {harness: color, body: sweater id, hat: 'cap'|'crown', neck: 'bowtie'|'scarf', eyes: 'glasses',
// toy, bowl, house: scene item ids}. app.js calls setOutfit() when the grade changes, so every Archie on screen wears
// the same things. Wearables show on every Archie (archie()); scene items (toy, bowl, house) only in archieScene(),
// which the big hero spots use (grade home, results, shop). Both keep the signature (mood, cls, outfit = current).
let OUTFIT = null;
export function setOutfit(o) { OUTFIT = o || null; }
export function getOutfit() { return OUTFIT; }

const ACC = {
  // drawn before the head, so the muzzle overlaps the knot
  scarf: `<g class="acc acc-scarf"><path d="M39 70 Q60 83 81 70 L83 81 Q60 95 37 81 Z" fill="#F97316" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M44 80 L39 101 L50 103 L53 85 Z" fill="#F97316" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M41 76 L39 82 M47 79 L45 86 M74 79 L76 86 M79 76 L81 82 M42 93 L50 95" stroke="#FFF3D6" stroke-width="2.4" stroke-linecap="round"/></g>`,
  bowtie: `<g class="acc acc-bow"><path d="M60 86 L47 79 Q45 86 47 93 Z M60 86 L73 79 Q75 86 73 93 Z" fill="#E5484D" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="56" y="82" width="8" height="8" rx="2.5" fill="#C62F35" stroke="${LINE}" stroke-width="1.3"/>
    <circle cx="51" cy="84" r="1.3" fill="#fff" opacity=".8"/><circle cx="69" cy="88" r="1.3" fill="#fff" opacity=".8"/></g>`,
  glasses: `<g class="acc acc-glasses" fill="rgba(255,255,255,.22)" stroke="${INK}" stroke-width="2.3" stroke-linecap="round">
    <circle cx="47" cy="40" r="8.6"/><circle cx="73" cy="40" r="8.6"/><path d="M55.5 39 Q60 35.5 64.5 39 M38.6 38 L34 35.5 M81.4 38 L86 35.5" fill="none"/></g>`,
  cap: `<g class="acc acc-cap"><path d="M38 26 C38 3 82 3 82 26 Z" fill="#2F80ED" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M60 6 L60 25 M48 9 Q46 17 47 25" stroke="#1D5FBF" stroke-width="1.4" fill="none"/>
    <path d="M36 24 Q60 30 82 23 Q97 21 101 27 Q88 33 60 32 Q44 32 35 28 Z" fill="#1D5FBF" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M70 13 h8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
    <circle cx="60" cy="5.500" r="2.6" fill="#FFC83D" stroke="${LINE}" stroke-width="1.2"/></g>`,
  crown: `<g class="acc acc-crown"><path d="M42 21 L39 3 L50 11 L60 -1 L70 11 L81 3 L78 21 Z" fill="#FFC83D" stroke="#9A6A12" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M42 17 L78 17" stroke="#E0A400" stroke-width="2.4"/>
    <circle cx="60" cy="11" r="2.6" fill="#E5484D"/><circle cx="49" cy="15" r="1.9" fill="#38BDF8"/><circle cx="71" cy="15" r="1.9" fill="#22C55E"/>
    <circle cx="39" cy="3" r="2" fill="#FFE58A" stroke="#9A6A12" stroke-width="1"/><circle cx="60" cy="-1" r="2" fill="#FFE58A" stroke="#9A6A12" stroke-width="1"/><circle cx="81" cy="3" r="2" fill="#FFE58A" stroke="#9A6A12" stroke-width="1"/></g>`
};


// Sweaters (slot 'body'): drawn on the torso, under the harness. Each: base color, rib color, pattern (inside the torso clip).
const RAINBOW = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6'];
const starPath = (cx, cy, r) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)} `;
  }
  return d + 'Z';
};
const SWEATER = {
  sw_red: { c: '#E5484D', rib: '#C62F35', pat: `<path d="M0 79 Q60 87 120 79 M0 88 Q60 96 120 88" stroke="#FFFDF8" stroke-width="3.8" fill="none"/>` },
  sw_blue: { c: '#3B82F6', rib: '#2563EB', pat: [74, 81, 88].map((y) => Array.from({ length: 9 }, (_, i) => `M${33 + i * 6} ${y + (i % 2) * 0} l3 3.2 l3 -3.2`).join(' ')).map((d) => `<path d="${d}" stroke="#BFDBFE" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('') },
  sw_green: { c: '#22A55B', rib: '#15803D', pat: `<path d="${starPath(45.5, 93, 4.6)}" fill="#FFC83D" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/><path d="${starPath(75, 93, 4.6)}" fill="#FFC83D" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>` },
  sw_rainbow: { c: RAINBOW[0], rib: '#7C3AED', pat: RAINBOW.map((col, i) => `<path d="M0 ${68 + i * 5.5} Q60 ${75 + i * 5.5} 120 ${68 + i * 5.5}" stroke="${col}" stroke-width="5.8" fill="none"/>`).join('') }
};
function sweaterSVG(kind, id) {
  const w = SWEATER[kind];
  if (!w) return '';
  const ribs = Array.from({ length: 17 }, (_, i) => `M${36 + i * 3} 94 v9`).join(' ');
  return `<g class="acc acc-sweater acc-${kind}"><g clip-path="url(#${id}b)"><g clip-path="url(#${id}t)">
      <rect x="20" y="60" width="80" height="50" fill="${w.c}"/>${w.pat}
      <path d="M0 95 Q60 101 120 95 L120 110 L0 110 Z" fill="${w.rib}"/>
      <path d="${ribs}" stroke="#000" stroke-opacity=".16" stroke-width="1.1"/>
    </g><path d="M0 100 Q60 106 120 100" stroke="${LINE}" stroke-width="1.8" fill="none"/></g>
    <path d="BODYPATH" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round" clip-path="url(#${id}t)"/></g>`;
}

// Scene items, in Archie's coordinates (he sits in 0..120 x 0..124, the ground is at y = 122).
const boneToy = (cx, cy, len, r, rot, fill, line, extra = '') => `<g transform="rotate(${rot} ${cx} ${cy})">
    <g fill="${fill}" stroke="${line}" stroke-width="1.8" stroke-linejoin="round">
      <circle cx="${cx - len / 2}" cy="${cy - r * 0.78}" r="${r}"/><circle cx="${cx - len / 2}" cy="${cy + r * 0.78}" r="${r}"/>
      <circle cx="${cx + len / 2}" cy="${cy - r * 0.78}" r="${r}"/><circle cx="${cx + len / 2}" cy="${cy + r * 0.78}" r="${r}"/></g>
    <rect x="${cx - len / 2}" y="${cy - r * 0.85}" width="${len}" height="${r * 1.7}" fill="${fill}"/>
    <path d="M${cx - len / 2 + r * 0.3} ${cy - r * 0.85} H${cx + len / 2 - r * 0.3} M${cx - len / 2 + r * 0.3} ${cy + r * 0.85} H${cx + len / 2 - r * 0.3}" stroke="${line}" stroke-width="1.8" stroke-linecap="round"/>
    ${extra}</g>`;
const sparkle = (x, y, r, c = '#FFF7C2') => `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z" fill="${c}" stroke="#C48A00" stroke-width=".9" stroke-linejoin="round"/>`;
const TOYS = {
  toy_small: () => boneToy(5, 118.5, 18, 3.6, -10, WHITE, LINE, `<path d="M0 116.2 H8" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9" transform="rotate(-10 5 118.5)"/>`),
  toy_big: () => boneToy(1, 116, 28, 5.4, -12, '#F3D9A4', LINE, `<path d="M-6 114.5 q2 2 4 0 M3 117.5 q2 2 4 0" stroke="#C99A55" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M-9 113 H5" stroke="#FFF3D6" stroke-width="1.6" stroke-linecap="round"/>`),
  toy_gold: () => boneToy(3, 117.5, 22, 4.4, -10, '#FFC83D', '#8A5A12', `<path d="M-5 115.2 H9" stroke="#FFF1B0" stroke-width="1.8" stroke-linecap="round"/>`) + sparkle(-8, 104, 4) + sparkle(17, 106, 3)
};
const BOWLS = { bowl_blue: ['#3B82F6', '#93C5FD'], bowl_red: ['#E5484D', '#FCA5A5'], bowl_green: ['#22A55B', '#86EFAC'], bowl_pink: ['#EC4899', '#F9A8D4'], bowl_gold: ['#F5B800', '#FFE58A'] };
function bowlSVG(kind) {
  const b = BOWLS[kind];
  if (!b) return '';
  const [c, l] = b;
  const kib = [[114, 108.6], [119.5, 107.4], [125, 108.2], [130.5, 107.3], [135, 108.8], [117, 110], [128, 110.2]];
  const paw = (x, y) => `<g fill="${l}"><ellipse cx="${x}" cy="${y + 1.4}" rx="3" ry="2.4"/><circle cx="${x - 3.3}" cy="${y - 2}" r="1.3"/><circle cx="${x}" cy="${y - 3.1}" r="1.3"/><circle cx="${x + 3.3}" cy="${y - 2}" r="1.3"/></g>`;
  return `<g class="scn scn-bowl scn-${kind}">
    <path d="M103 111 L107.5 122 Q124 126.500 140.5 122 L145 111 Z" fill="${c}" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
    ${paw(124, 117.6)}
    <ellipse cx="124" cy="110.6" rx="21.5" ry="4.6" fill="${l}" stroke="${LINE}" stroke-width="1.8"/>
    <ellipse cx="124" cy="110.4" rx="17" ry="2.9" fill="#7A4316"/>
    ${kib.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#B8692E" stroke="#6B3A14" stroke-width=".8"/>`).join('')}
    ${kind === 'bowl_gold' ? sparkle(146, 102, 4) + sparkle(102, 104, 2.8) : ''}</g>`;
}
// Kennels: front view, door in the middle, Archie sits in front of its right side.
function houseSVG(kind) {
  if (kind === 'house_castle') {
    const merlons = (x0, x1, y, w = 8) => { let d = `M${x0} ${y + 7}`; for (let x = x0; x < x1 - 0.1; x += w * 2) d += ` V${y} H${Math.min(x + w, x1)} V${y + 7} H${Math.min(x + w * 2, x1)}`; return d + ` V${y + 7}`; };
    const stones = [52, 64, 76, 88, 100, 112].map((y, i) => `M-54 ${y} H30 ` + Array.from({ length: 6 }, (_, k) => `M${-48 + k * 14 + (i % 2) * 7} ${y} v-12`).join(' ')).join(' ');
    return `<g class="scn scn-house scn-house_castle">
      <path d="${merlons(-56, 32, 34)} V122 H-56 Z" fill="#CBD2DC" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="${stones}" stroke="#9AA4B5" stroke-width="1.1" fill="none"/>
      <path d="M-70 122 V30 H-44 V122 Z" fill="#B8C0CD" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M-73 31 L-57 -4 L-41 31 Z" fill="#8B5CF6" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M-62 30 L-57 -1" stroke="#C4B5FD" stroke-width="2" stroke-linecap="round"/>
      <path d="M-57 -4 V-24" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M-56 -24 L-42 -20 L-56 -15 Z" fill="#E5484D" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>
      <rect x="-61" y="48" width="8" height="14" rx="4" fill="#3B2414" stroke="${LINE}" stroke-width="1.4"/>
      <path d="M-34 122 V90 A20 20 0 0 1 6 90 V122 Z" fill="#3B2414" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M-34 90 A20 20 0 0 1 6 90" stroke="#8A93A5" stroke-width="3.6" fill="none"/>
      <path d="M-24 122 V96 M-14 122 V92 M-4 122 V96" stroke="#5B3A22" stroke-width="1.2" opacity=".5"/>
      <path d="M-29 46 h10 v8 h-10 Z M-5 46 h10 v8 h-10 Z" fill="#FFC83D" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>
</g>`;
  }
  const C = {
    house_wood: { wall: '#D9A066', roof: '#8A5A2B', roofL: '#B07A40', line: '#A8743C' },
    house_red: { wall: '#FFF1DC', roof: '#E5484D', roofL: '#FF8A8E', line: '#E7CFA8' },
    house_blue: { wall: '#8EC5FF', roof: '#2B4C9B', roofL: '#5B7BD5', line: '#6AA8EE' }
  }[kind];
  if (!C) return '';
  const planks = kind === 'house_blue' ? '' : `<path d="M-56 70 H32 M-56 82 H32 M-56 94 H32 M-56 106 H32" stroke="${C.line}" stroke-width="1.3"/>`;
  const plate = kind === 'house_red' ? `<g class="plate"><rect x="-36" y="50" width="48" height="14" rx="3" fill="#F3D9A4" stroke="${LINE}" stroke-width="1.5"/>
      <text x="-12" y="61" text-anchor="middle" font-family="Nunito, Manrope, sans-serif" font-weight="900" font-size="10" letter-spacing=".6" fill="${LINE}">ARCHIE</text></g>` : '';
  const win = kind === 'house_blue' ? `<circle cx="-12" cy="40" r="7.5" fill="#E8F6FF" stroke="${LINE}" stroke-width="1.6"/><path d="M-12 32.5 V47.5 M-19.5 40 H-4.5" stroke="${LINE}" stroke-width="1.4"/><path d="M-16 37 q2 -3 5 -3" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>` : '';
  const flower = (x, y, pc) => `<path d="M${x} 122 V${y + 3}" stroke="#16A34A" stroke-width="1.6" stroke-linecap="round"/><path d="M${x} ${y + 10} q-4 -1 -5 -4 q4 0 5 4" fill="#22C55E" stroke="#15803D" stroke-width=".8"/>
      <g fill="${pc}" stroke="${LINE}" stroke-width=".9">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + 2.9 * Math.cos((a * Math.PI) / 180)).toFixed(2)}" cy="${(y + 2.9 * Math.sin((a * Math.PI) / 180)).toFixed(2)}" r="2.3"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="1.7" fill="#FFC83D"/>`;
  const flowers = kind === 'house_blue' ? flower(-61, 108, '#F472B6') + flower(-52, 112, '#FDE047') + flower(-44, 106, '#F9A8D4') + flower(12, 112, '#FDE047') : '';
  return `<g class="scn scn-house scn-${kind}">
    <path d="M-56 122 V58 L-12 14 L32 58 V122 Z" fill="${C.wall}" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
    ${planks}
    <path d="M-30 122 V90 A18 18 0 0 1 6 90 V122 Z" fill="#3B2414" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M-26 122 V91 A14 14 0 0 1 -12 76" stroke="#5B3A22" stroke-width="2" fill="none" opacity=".7"/>
    ${plate}${win}
    <path d="M-66 56 L-12 2 L42 56 L42 69 L-12 15 L-66 69 Z" fill="${C.roof}" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M-60 57 L-12 9 L36 57" stroke="${C.roofL}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${flowers}</g>`;
}
const hasScene = (o) => !!(o && (o.toy || o.bowl || o.house));

let _aid = 0;
// Archie's drawing in his own 0..120 x 0..124 box: {defs, g}
function archieParts(mood, outfit) {
  const id = 'ar-hc' + (++_aid);
  const S = `stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;
  const o = outfit || {};
  const NAVY = o.harness || 'var(--owl-harness,#2B3A67)';
  const M = mood === 'wave' || mood === 'point' ? 'happy' : mood;
  const dark = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/><circle cx="${x + 1.6}" cy="${y - 2}" r="1.8" fill="#fff"/>`;
  const eyes = {
    happy: dark(47, 40, 4.6, 5.4) + dark(73, 40, 4.6, 5.4),
    think: dark(48, 39, 4.5, 5.2) + dark(74, 39, 4.5, 5.2) +
      `<path d="M41 30 q6 -4 12 -1 M68 28 q6 -3 12 1" stroke="${BROWN_D}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    cheer: `<path d="M41 42 q6 -9 12 0 M67 42 q6 -9 12 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    sleep: `<path d="M41 40 q6 5 12 0 M67 40 q6 5 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    oops: dark(47, 41, 4.6, 5.4) + dark(73, 41, 4.6, 5.4) +
      `<path d="M40 31 l11 3 M80 31 l-11 3" stroke="${BROWN_D}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  }[M] || '';
  const mouth = {
    happy: `<path d="M60 67 L60 70 M52 70 Q56 77 60 70 Q64 77 68 70" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M56.5 74 Q60 84 63.5 74 Q60 72 56.5 74 Z" fill="#F07A8A" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,
    think: `<path d="M60 67 L60 70 M54 72 Q60 75 67 70" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`,
    cheer: `<path d="M60 67 L60 69 M52 69 Q60 71 68 69 Q67 83 60 83 Q53 83 52 69 Z" fill="${INK}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M55 78 Q60 73 65 78 Q63 83 60 83 Q57 83 55 78 Z" fill="#F07A8A"/>`,
    sleep: `<path d="M60 67 L60 70 M53 71 Q56.5 74 60 70 Q63.5 74 67 71" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    oops: `<path d="M60 67 L60 70" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/><ellipse cx="60" cy="74" rx="3.6" ry="3.2" fill="${INK}"/>`
  }[M] || '';
  // brown button ears folded forward/down at the sides; perky when cheering
  const ears = M === 'cheer'
    ? `<path d="M38 26 C30 18 28 8 32 2 C40 3 48 10 50 20 Z" fill="${BROWN}" ${S}/>
       <path d="M82 26 C90 18 92 8 88 2 C80 3 72 10 70 20 Z" fill="${BROWN}" ${S}/>`
    : `<path d="M42 17 C34 14 25 21 23 32 C22 40 26 46 31 45 C38 42 43 32 46 22 Z" fill="${BROWN}" ${S}/>
       <path d="M31 45 C33 38 38 28 42 17" stroke="${BROWN_D}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
       <path d="M78 17 C86 14 95 21 97 32 C98 40 94 46 89 45 C82 42 77 32 74 22 Z" fill="${BROWN}" ${S}/>
       <path d="M89 45 C87 38 82 28 78 17" stroke="${BROWN_D}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
  // Body: a pear-shaped sitting body, two hind legs as round haunches with feet, two front legs.
  // A raised paw (wave/point/think) REPLACES the right front leg: a bent foreleg from the shoulder.
  const leg = (x) => `<path d="M${x} 97 L${x} 113 C${x} 119.500 ${x + 9} 119.500 ${x + 9} 113 L${x + 9} 97" fill="${WHITE}" ${S}/>
    <path d="M${x + 3} 116 v2.500 M${x + 6} 116 v2.500" stroke="${LINE}" stroke-width="1.200" stroke-linecap="round"/>`;
  const arm = (x1, y1, cx, cy, x2, y2, px, py, pads) => {
    const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
    return `<path d="${d}" stroke="${LINE}" stroke-width="12.400" fill="none" stroke-linecap="round"/>
      <circle cx="${x1}" cy="${y1}" r="6.400" fill="${WHITE}"/>
      <path d="${d}" stroke="${WHITE}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <ellipse cx="${px}" cy="${py}" rx="6.600" ry="6" fill="${WHITE}" ${S}/>` +
      (pads ? `<ellipse cx="${px}" cy="${py + 1.600}" rx="2.600" ry="2" fill="#E9A6A0"/><circle cx="${px - 3}" cy="${py - 2.600}" r="1.200" fill="#E9A6A0"/><circle cx="${px}" cy="${py - 3.400}" r="1.200" fill="#E9A6A0"/><circle cx="${px + 3}" cy="${py - 2.600}" r="1.200" fill="#E9A6A0"/>`
        : `<path d="M${px - 2} ${py + 2} v2.400 M${px + 2} ${py + 2} v2.400" stroke="${LINE}" stroke-width="1.200" stroke-linecap="round"/>`);
  };
  const waving = mood === 'wave' || mood === 'point';
  const pawUp = mood === 'think' ? arm(70, 101, 81, 100, 78, 91, 77, 87, false)
    : waving ? arm(68, 98, 85, 97, 87, 79, 88, 73, true) + `<path d="M95 63 l2.500 -4 M98 71 l5 -1" stroke="#FFC83D" stroke-width="2.600" stroke-linecap="round"/>`
      : '';
  const BODY = 'M46 68 C40 76 36 92 37 106 C37 113 41 117 47 117 L73 117 C79 117 83 113 83 106 C84 92 80 76 74 68 Z';
  const body = `
    <ellipse cx="37" cy="104" rx="9.500" ry="12" fill="${WHITE}" ${S}/>
    <ellipse cx="83" cy="104" rx="9.500" ry="12" fill="${WHITE}" ${S}/>
    <ellipse cx="32" cy="116.500" rx="8" ry="4.200" fill="${WHITE}" ${S}/>
    <ellipse cx="88" cy="116.500" rx="8" ry="4.200" fill="${WHITE}" ${S}/>
    <path d="${BODY}" fill="${WHITE}" ${S}/>
    <g clip-path="url(#${id}b)">
      <path d="M45 66 C37 74 35 86 36 96 C42 93 48 84 51 72 Z" fill="${BROWN}"/>
      <path d="M75 66 C83 74 85 86 84 96 C78 93 72 84 69 72 Z" fill="${BROWN}"/>
    </g>
    <path d="${BODY}" fill="none" ${S}/>
    ${leg(48)}
    ${pawUp ? '' : leg(63)}
    ${o.body && SWEATER[o.body] ? sweaterSVG(o.body, id).replace('BODYPATH', BODY) : ''}`;
  // a raised paw comes out of a sweater sleeve: the first part of the foreleg in sweater color, with a ribbed cuff
  const sh = waving ? [67, 97.6, 74.5, 96.8] : null; // the thinking paw is tucked in: no sleeve
  const SWc = o.body && SWEATER[o.body];
  const sleeve = sh && SWc ? (() => {
    const [x0, y0, x1, y1] = sh, c = o.body === 'sw_rainbow' ? RAINBOW[4] : SWc.c;
    const d = `M${x0} ${y0} L${x1} ${y1}`, ux = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0), uy = (y1 - y0) / Math.hypot(x1 - x0, y1 - y0);
    return `<path d="${d}" stroke="${LINE}" stroke-width="13.6"/><path d="${d}" stroke="${c}" stroke-width="10.2"/><circle cx="${x0}" cy="${y0}" r="6.8" fill="${c}" clip-path="url(#${id}t)"/>
      <path d="M${(x1 - ux * 1.8 + uy * 4.6).toFixed(2)} ${(y1 - uy * 1.8 - ux * 4.6).toFixed(2)} L${(x1 - ux * 1.8 - uy * 4.6).toFixed(2)} ${(y1 - uy * 1.8 + ux * 4.6).toFixed(2)}" stroke="${SWc.rib}" stroke-width="2.6" stroke-linecap="round"/>`;
  })() : '';
  const tail = mood === 'sleep'
    ? `<path d="M86 108 C98 112 106 106 108 98" stroke="${LINE}" stroke-width="7.6" fill="none" stroke-linecap="round"/>
       <path d="M86 108 C98 112 106 106 108 98" stroke="${WHITE}" stroke-width="4.8" fill="none" stroke-linecap="round"/>
       <path d="M86 108 C90 110 93 111 96 110.500" stroke="${BROWN}" stroke-width="4.8" fill="none" stroke-linecap="round"/>`
    : `<g class="ar-tail"><path d="M84 106 C98 104 102 88 98 72" stroke="${LINE}" stroke-width="8" fill="none" stroke-linecap="round"/>
       <path d="M84 106 C98 104 102 88 98 72" stroke="${WHITE}" stroke-width="5" fill="none" stroke-linecap="round"/>
       <path d="M84 106 C91 105.500 96 102 99 96" stroke="${BROWN}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
  const extra = mood === 'sleep'
    ? `<text x="92" y="24" fill="var(--owl-dark,#6D28D9)" font-family="sans-serif" font-weight="900" font-size="15">z</text><text x="102" y="13" fill="var(--owl-dark,#6D28D9)" font-family="sans-serif" font-weight="900" font-size="11">z</text>`
    : mood === 'cheer'
      ? `<path d="M12 30 l4 -4 M8 44 l6 0 M108 30 l-4 -4 M112 44 l-6 0" stroke="#FFC83D" stroke-width="3" stroke-linecap="round"/>`
      : '';
  const HEAD = 'M60 13 C44 13 34 24 34 38 C34 48 39 54 43 60 C45 70 50 80 60 80 C70 80 75 70 77 60 C81 54 86 48 86 38 C86 24 76 13 60 13 Z';
  const defs = `<clipPath id="${id}"><path d="${HEAD}"/></clipPath><clipPath id="${id}b"><path d="${BODY}"/></clipPath><clipPath id="${id}t"><path d="M-10 -40 H130 V100 Q60 106 -10 100 Z"/></clipPath>`;
  const g = `<g class="owl-body-g">
    ${tail}
    ${body}
    <!-- harness -->
    <path d="M42 80 Q60 92 78 80 L78 86 Q60 98 42 86 Z" fill="${NAVY}" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M60 92 L60 106" stroke="${NAVY}" stroke-width="3.5" stroke-linecap="round"/>
    ${o.neck === 'bowtie' ? '' : `<circle cx="60" cy="91" r="5" fill="#FFC83D" stroke="${LINE}" stroke-width="1.3"/><circle cx="60" cy="91" r="2" fill="${NAVY}"/>`}
    ${o.neck === 'scarf' ? ACC.scarf : ''}
    ${pawUp}${sleeve}
    <!-- head: brown with white blaze and long white muzzle -->
    <path d="${HEAD}" fill="${BROWN}"/>
    <g clip-path="url(#${id})">
      <path d="M56 12 L64 12 C64.500 26 66 36 70 47 C72 52 75 57 74 66 C74 74 70 81 60 81 C50 81 46 74 46 66 C45 57 48 52 50 47 C54 36 55.5 26 56 12 Z" fill="${WHITE}"/>
    </g>
    <path d="${HEAD}" fill="none" ${S}/>
    ${ears}
    <!-- nose -->
    <path d="M51 61 C51 56.5 69 56.5 69 61 C69 66 64 68 60 68 C56 68 51 66 51 61 Z" fill="${INK}"/>
    <ellipse cx="56.5" cy="59" rx="2.8" ry="1.1" fill="#fff" opacity=".6"/>
    ${eyes}
    ${mouth}
    ${o.eyes && ACC[o.eyes] ? ACC[o.eyes] : ''}
    ${o.neck === 'bowtie' ? ACC.bowtie : ''}
    ${o.hat && ACC[o.hat] ? ACC[o.hat] : ''}
    ${extra}
  </g>`;
  return { defs, g };
}

// Archie alone (headers, coach strips, bubbles, toasts): wearables only.
export function archie(mood = 'happy', cls = '', outfit = OUTFIT) {
  const { defs, g } = archieParts(mood, outfit);
  return `<svg class="owl archie owl-${mood} ${cls}" viewBox="0 0 120 124" role="img" aria-label="Archie" focusable="false">
  <defs>${defs}</defs>${g}</svg>`;
}

// Archie at home: wearables plus his scene items (kennel behind him, toy and bowl next to him).
// Only for the spots where he is shown large. Without scene items it is the same as archie().
export function sceneBox(o) {
  const minX = o.house ? (o.house === 'house_castle' ? -78 : -70) : o.toy ? -22 : 0;
  const maxX = o.bowl ? 150 : 120;
  const minY = o.house === 'house_castle' ? -28 : o.house ? -3 : 0;
  return { x: minX, y: minY, w: maxX - minX, h: 128 - minY };
}
export function archieScene(mood = 'happy', cls = '', outfit = OUTFIT) {
  const o = outfit || {};
  if (!hasScene(o)) return archie(mood, cls, outfit);
  const { defs, g } = archieParts(mood, o);
  const b = sceneBox(o);
  const ground = `<ellipse cx="${b.x + b.w / 2}" cy="122.5" rx="${b.w / 2 - 3}" ry="4.6" fill="#5B3A22" opacity=".1"/>`;
  return `<svg class="owl archie archie-scene owl-${mood} ${cls}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" style="--ar:${(b.w / b.h).toFixed(4)};--sk:${(b.h / 124).toFixed(4)}" role="img" aria-label="Archie" focusable="false">
  <defs>${defs}</defs>${ground}${o.house ? houseSVG(o.house) : ''}${o.toy && TOYS[o.toy] ? `<g class="scn scn-toy scn-${o.toy}">${TOYS[o.toy]()}</g>` : ''}${g}${o.bowl ? bowlSVG(o.bowl) : ''}</svg>`;
}

export const owl = archie;

// Archie's bone: the reward currency icon
export function bone(cls = '') {
  const shape = (f, st, w) => `<g transform="rotate(-35 12 12)" fill="${f}" stroke="${st}" stroke-width="${w}"><rect x="5.5" y="9.6" width="13" height="4.8" rx="1.6"/><circle cx="5.6" cy="9.4" r="2.9"/><circle cx="5.6" cy="14.6" r="2.9"/><circle cx="18.4" cy="9.4" r="2.9"/><circle cx="18.4" cy="14.6" r="2.9"/></g>`;
  return `<svg class="bone ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${shape('#8A5A2B', '#8A5A2B', 2.6)}${shape('#FFF4DC', 'none', 0)}<path d="M8.4 9.6 L14.8 5.4" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9"/></svg>`;
}

export function star(filled, cls = '') {
  return `<svg class="star ${filled ? 'on' : 'off'} ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>`;
}
