// Archie (Arcsi / Арчі): a cartoon brown-and-white Jack Russell terrier, original inline SVG.
// Collar color follows the theme (--owl). moods: happy, think, cheer, sleep, oops
// The exported name `owl` is kept for backwards compatibility with app.js.
const BROWN = '#B8692E', BROWN_D = '#8A4A1C', INK = '#2A1E17', WHITE = '#FFFDF8', LINE = '#5B3A22';

export function archie(mood = 'happy', cls = '') {
  const eyes = {
    happy: `<circle cx="47" cy="47" r="5.6" fill="${INK}"/><circle cx="73" cy="47" r="5.6" fill="${INK}"/>
            <circle cx="48.8" cy="45" r="1.9" fill="#fff"/><circle cx="74.8" cy="45" r="1.9" fill="#fff"/>`,
    think: `<circle cx="49" cy="43.5" r="5.4" fill="${INK}"/><circle cx="75" cy="43.5" r="5.4" fill="${INK}"/>
            <circle cx="50.6" cy="41.6" r="1.8" fill="#fff"/><circle cx="76.6" cy="41.6" r="1.8" fill="#fff"/>
            <path d="M40 35 q6 -4 12 -1 M68 34 q6 -3 12 1" stroke="${LINE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    cheer: `<path d="M41 48 q6 -8 12 0 M67 48 q6 -8 12 0" stroke="${INK}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    sleep: `<path d="M41 47 q6 5 12 0 M67 47 q6 5 12 0" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    oops: `<circle cx="47" cy="48" r="5.2" fill="${INK}"/><circle cx="73" cy="48" r="5.2" fill="${INK}"/>
           <circle cx="48.6" cy="46.2" r="1.7" fill="#fff"/><circle cx="74.6" cy="46.2" r="1.7" fill="#fff"/>
           <path d="M40 38 l11 -3 M80 38 l-11 -3" stroke="${LINE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  }[mood] || '';
  const mouth = {
    happy: `<path d="M53 66 q3.5 4 7 0 q3.5 4 7 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
            <path d="M57.5 68.5 q2.5 7 5 0 Z" fill="#F07A8A"/>`,
    think: `<path d="M55 67 q5 2 10 -1" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    cheer: `<path d="M51 65 q9 13 18 0 Z" fill="${INK}"/><path d="M55 70 q5 6 10 0 q-5 -2 -10 0 Z" fill="#F07A8A"/>`,
    sleep: `<path d="M56 67 q4 2 8 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    oops: `<ellipse cx="60" cy="68" rx="3.4" ry="2.6" fill="${INK}"/>`
  }[mood] || '';
  // ears: perky for cheer, folded (button ears, typical JRT) otherwise
  const ears = mood === 'cheer'
    ? `<path d="M32 36 C24 22 26 10 36 8 C42 16 46 24 46 30 Z" fill="${BROWN}" stroke="${LINE}" stroke-width="1.6"/>
       <path d="M88 36 C96 22 94 10 84 8 C78 16 74 24 74 30 Z" fill="${BROWN}" stroke="${LINE}" stroke-width="1.6"/>`
    : `<path d="M34 30 C24 26 18 34 22 44 C26 40 32 40 38 40 Z" fill="${BROWN}" stroke="${LINE}" stroke-width="1.6"/>
       <path d="M86 30 C96 26 102 34 98 44 C94 40 88 40 82 40 Z" fill="${BROWN}" stroke="${LINE}" stroke-width="1.6"/>
       <path d="M33 26 C38 20 46 20 48 26" fill="${BROWN_D}" opacity=".0"/>`;
  const pawUp = mood === 'think'
    ? `<ellipse cx="78" cy="78" rx="8" ry="6.5" fill="${WHITE}" stroke="${LINE}" stroke-width="1.6" transform="rotate(-25 78 78)"/>`
    : '';
  const tail = mood === 'sleep'
    ? `<path d="M84 104 C96 108 102 104 104 98" stroke="${LINE}" stroke-width="6.5" fill="none" stroke-linecap="round"/>
       <path d="M84 104 C96 108 102 104 104 98" stroke="${WHITE}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<g class="ar-tail"><path d="M82 92 C92 86 96 76 94 66" stroke="${LINE}" stroke-width="7" fill="none" stroke-linecap="round"/>
       <path d="M82 92 C92 86 96 76 94 66" stroke="${WHITE}" stroke-width="4.4" fill="none" stroke-linecap="round"/>
       <path d="M95.2 72 C95.6 69 94.8 67 94 66" stroke="${BROWN}" stroke-width="4.4" fill="none" stroke-linecap="round"/></g>`;
  const extra = mood === 'sleep'
    ? `<text x="92" y="24" fill="var(--owl-dark,#6D28D9)" font-family="sans-serif" font-weight="900" font-size="15">z</text><text x="102" y="13" fill="var(--owl-dark,#6D28D9)" font-family="sans-serif" font-weight="900" font-size="11">z</text>`
    : mood === 'cheer'
      ? `<path d="M14 30 l4 -4 M10 44 l6 0 M106 30 l-4 -4 M110 44 l-6 0" stroke="#FFC83D" stroke-width="3" stroke-linecap="round"/>`
      : '';
  return `<svg class="owl archie owl-${mood} ${cls}" viewBox="0 0 120 124" role="img" aria-label="Archie" focusable="false">
  <g class="owl-body-g">
    ${tail}
    <!-- body -->
    <path d="M36 118 C30 98 34 82 46 78 L74 78 C86 82 90 98 84 118 Z" fill="${WHITE}" stroke="${LINE}" stroke-width="1.8"/>
    <path d="M72 84 C80 86 85 94 84 104 C78 102 72 96 70 90 Z" fill="${BROWN}" opacity=".95"/>
    <!-- front paws -->
    <ellipse cx="50" cy="117" rx="8" ry="5" fill="${WHITE}" stroke="${LINE}" stroke-width="1.6"/>
    <ellipse cx="70" cy="117" rx="8" ry="5" fill="${WHITE}" stroke="${LINE}" stroke-width="1.6"/>
    <!-- collar with tag -->
    <path d="M42 80 Q60 88 78 80 L78 86 Q60 94 42 86 Z" fill="var(--owl,#8B5CF6)" stroke="${LINE}" stroke-width="1.2"/>
    <circle cx="60" cy="93" r="4.6" fill="#FFC83D" stroke="${LINE}" stroke-width="1.2"/>
    <!-- head -->
    <path d="M60 18 C38 18 28 32 28 50 C28 68 42 80 60 80 C78 80 92 68 92 50 C92 32 82 18 60 18 Z" fill="${WHITE}" stroke="${LINE}" stroke-width="1.8"/>
    <!-- brown head patches (classic JRT): both sides of the head, white blaze in the middle -->
    <path d="M60 19 C44 19 31 28 29 44 C34 40 40 38 46 40 C50 34 54 28 56 20 Z" fill="${BROWN}"/>
    <path d="M60 19 C76 19 89 28 91 44 C86 40 80 38 74 40 C70 34 66 28 64 20 Z" fill="${BROWN}"/>
    <ellipse cx="46.5" cy="46.5" rx="10.5" ry="9.5" fill="${BROWN}"/>
    ${ears}
    <!-- muzzle -->
    <ellipse cx="60" cy="64" rx="15" ry="11" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.2" opacity=".95"/>
    <path d="M54.5 57 C54.5 53.5 65.5 53.5 65.5 57 C65.5 60.5 62 62 60 62 C58 62 54.5 60.5 54.5 57 Z" fill="${INK}"/>
    <ellipse cx="58" cy="55.6" rx="2" ry="1.1" fill="#fff" opacity=".7"/>
    ${eyes}
    ${mouth}
    <circle cx="40" cy="62" r="4" fill="#FF9AA8" opacity=".35"/><circle cx="80" cy="62" r="4" fill="#FF9AA8" opacity=".35"/>
    ${pawUp}
    ${extra}
  </g></svg>`;
}

export const owl = archie;

export function star(filled, cls = '') {
  return `<svg class="star ${filled ? 'on' : 'off'} ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>`;
}
