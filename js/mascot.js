// Archie (Arcsi / Арчі): a cartoon brown-and-white Jack Russell terrier, original inline SVG.
// Collar color follows the theme (--owl). moods: happy, think, cheer, sleep, oops
// The exported name `owl` is kept for backwards compatibility with app.js.
const BROWN = '#B8692E', BROWN_D = '#8A4A1C', INK = '#2A1E17', WHITE = '#FFFDF8', LINE = '#5B3A22';

// Outfit from the wardrobe: {harness: color, hat: 'cap'|'crown', neck: 'bowtie'|'scarf', eyes: 'glasses'}.
// app.js calls setOutfit() when the grade changes, so every Archie on screen wears the same things.
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

let _aid = 0;
export function archie(mood = 'happy', cls = '', outfit = OUTFIT) {
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
  const paw = (d) => `<path d="${d}" fill="${WHITE}" ${S}/>`;
  const pawUp = mood === 'think' ? paw('M70 100 C70 90 74 80 79 80 C85 82 83 94 80 104 Z')
    : (mood === 'wave' || mood === 'point')
      ? paw('M74 98 C76 88 82 78 88 80 C93 83 88 96 83 104 Z') + `<path d="M96 76 l4 -4 M99 86 l6 -1" stroke="#FFC83D" stroke-width="2.6" stroke-linecap="round"/>`
      : '';
  const rightLeg = pawUp
    ? ''
    : `<path d="M66 100 L66 114 C66 119 76 119 76 114 L76 100 Z" fill="${WHITE}" ${S}/><path d="M69 116 v3 M73 116 v3" stroke="${LINE}" stroke-width="1.2"/>`;
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
  return `<svg class="owl archie owl-${mood} ${cls}" viewBox="0 0 120 124" role="img" aria-label="Archie" focusable="false">
  <defs><clipPath id="${id}"><path d="${HEAD}"/></clipPath></defs>
  <g class="owl-body-g">
    ${tail}
    <!-- haunches -->
    <path d="M44 88 C32 90 28 104 32 116 L50 118 L52 94 Z" fill="${WHITE}" ${S}/>
    <path d="M76 88 C88 90 92 104 88 116 L70 118 L68 94 Z" fill="${WHITE}" ${S}/>
    <path d="M34 117 h13 M73 117 h13" stroke="${LINE}" stroke-width="1.2"/>
    <!-- compact chest + front legs -->
    <path d="M44 66 C36 78 38 96 42 104 L42 114 C42 119 53 119 53 114 L53 100 L67 100 L67 114 C67 119 78 119 78 114 L78 104 C82 96 84 78 76 66 Z" fill="${WHITE}" ${S}/>
    ${rightLeg}
    <path d="M45 116 v3 M50 116 v3" stroke="${LINE}" stroke-width="1.2"/>
    <!-- brown shoulder/saddle patches -->
    <path d="M45 68 C38 74 36 84 37 92 C42 90 47 82 50 72 Z" fill="${BROWN}"/>
    <path d="M75 68 C82 74 84 84 83 92 C78 90 73 82 70 72 Z" fill="${BROWN}"/>
    <!-- harness -->
    <path d="M42 80 Q60 92 78 80 L78 86 Q60 98 42 86 Z" fill="${NAVY}" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M60 92 L60 106" stroke="${NAVY}" stroke-width="3.5" stroke-linecap="round"/>
    ${o.neck === 'bowtie' ? '' : `<circle cx="60" cy="91" r="5" fill="#FFC83D" stroke="${LINE}" stroke-width="1.3"/><circle cx="60" cy="91" r="2" fill="${NAVY}"/>`}
    ${o.neck === 'scarf' ? ACC.scarf : ''}
    ${pawUp}
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
  </g></svg>`;
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
