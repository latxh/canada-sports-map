import type {ReactNode} from 'react';
import {LEAGUES, LEAGUE_ORDER, type LeagueId, type Team} from '../data';
import {G} from './TrophyDefs';

/**
 * Original trophy illustrations, one per league championship trophy. They are
 * drawn from reference photos as simplified cut-outs, not reproductions.
 *
 * Gradients are defined once by <TrophyDefs /> (rendered at the app root) and
 * referenced by id, so a cabinet of 24 Stanley Cups stays cheap.
 */

const EDGE = 'rgb(0 0 0 / 0.28)';

/** Horizontal engraving lines across a band. */
function Bands({x0, x1, y0, y1, n, color = 'rgb(0 0 0 / 0.18)'}: {x0: number; x1: number; y0: number; y1: number; n: number; color?: string}) {
  const lines = [];
  for (let i = 1; i < n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    lines.push(<line key={i} x1={x0 + 1} x2={x1 - 1} y1={y} y2={y} stroke={color} strokeWidth={0.5} />);
  }
  return <>{lines}</>;
}

/** Points of an n-pointed star centred on (cx, cy), squashed vertically by `sy`. */
function starPoints(cx: number, cy: number, outer: number, inner: number, n = 5, sy = 1, turn = -Math.PI / 2) {
  return Array.from({length: n * 2}, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = turn + (i * Math.PI) / n;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a) * sy).toFixed(2)}`;
  }).join(' ');
}

/** A small maple leaf centred on (x, y). */
function mapleLeaf(x: number, y: number, s: number, rot = 0) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
      d="M0 -5 L0.9 -3.3 L1.6 -3.6 L1.3 -1.5 L2.5 -2.6 L2.8 -1.9 L4.2 -2.2 L3.8 -0.8 L4.6 -0.4 L2.4 1.4 L2.7 2.2 L0.5 1.9 L0.6 4.4 L0 4.4 L-0.6 4.4 L-0.5 1.9 L-2.7 2.2 L-2.4 1.4 L-4.6 -0.4 L-3.8 -0.8 L-4.2 -2.2 L-2.8 -1.9 L-2.5 -2.6 L-1.3 -1.5 L-1.6 -3.6 L-0.9 -3.3 Z"
    />
  );
}

function StanleyCup() {
  // Bowl, stepped collar and the five-band barrel, as the Cup has looked since 1958.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d="M11 44 H49 L51 91 H9 Z" fill={G.silver} />
      <Bands x0={9.5} x1={50.5} y0={44} y1={91} n={5} color="rgb(0 0 0 / 0.34)" />
      <path d="M14 46 L12.4 89" stroke="rgb(255 255 255 / 0.8)" strokeWidth={1.5} />
      <path d="M45.5 46 L47 89" stroke="rgb(0 0 0 / 0.12)" strokeWidth={1.5} />
      <rect x="8.5" y="90.5" width="43" height="3.5" rx="1" fill={G.silverDark} />
      <path d="M16.5 36 H43.5 L45.5 44 H14.5 Z" fill={G.silver} />
      <path d="M19.5 29.5 H40.5 L42 36 H18 Z" fill={G.silver} />
      <path d="M22 24 H38 L39.2 29.5 H20.8 Z" fill={G.silver} />
      <line x1="15.5" x2="44.5" y1="40" y2="40" stroke="rgb(0 0 0 / 0.25)" strokeWidth={0.5} />
      <path d="M26.5 18.5 H33.5 L34.6 24 H25.4 Z" fill={G.silverDark} />
      <path d="M16.5 5.5 C16.5 13 21.5 18.5 30 18.5 C38.5 18.5 43.5 13 43.5 5.5 Z" fill={G.silver} />
      <ellipse cx="30" cy="5.5" rx="13.5" ry="2.4" fill={G.silverDark} />
      <ellipse cx="30" cy="5.6" rx="11" ry="1.5" fill="#6b7279" opacity={0.6} />
      <path d="M20 8 C21 13 24 16 28 17.3" stroke="rgb(255 255 255 / 0.8)" strokeWidth={1} fill="none" />
    </g>
  );
}

function LarryOBrien() {
  // A gold basketball dropping into a gold hoop: the ball sits tilted and off-centre, its lower
  // half already through the rim, above a tapered net and a square base.
  const rim = {cx: 31, cy: 38, rx: 13, ry: 3.4};
  return (
    <g stroke="rgb(90 60 10 / 0.45)" strokeWidth={0.5} strokeLinejoin="round">
      <path d="M13 83 L16.5 79.5 H45.5 L49 83 Z" fill={G.gold} />
      <rect x="13" y="83" width="36" height="10" rx="0.8" fill={G.goldDark} />
      <path d="M17 86.5 H45" stroke="rgb(255 240 190 / 0.35)" strokeWidth={0.6} />
      <path d={`M${rim.cx - rim.rx} ${rim.cy} C${rim.cx - rim.rx + 1} 54 ${rim.cx - 6} 68 ${rim.cx - 4.6} 79.5 H${rim.cx + 4.6} C${rim.cx + 6} 68 ${rim.cx + rim.rx - 1} 54 ${rim.cx + rim.rx} ${rim.cy} Z`} fill={G.gold} />
      <path
        d="M19.5 41 L33.5 79 M24.5 41.5 L36 72 M30 41.8 L37.6 62 M35.5 41.6 L39.6 52 M42.5 41 L28.5 79 M37.5 41.5 L26 72 M32 41.8 L24.4 62 M26.5 41.6 L22.4 52"
        stroke="rgb(120 80 10 / 0.42)"
        strokeWidth={0.6}
        fill="none"
      />
      <path d="M21 43 C21.6 56 24.4 68 27 77" stroke="rgb(255 245 200 / 0.7)" strokeWidth={1.2} fill="none" />
      {/* The back of the rim, behind the ball. */}
      <path d={`M${rim.cx - rim.rx} ${rim.cy} A${rim.rx} ${rim.ry} 0 0 1 ${rim.cx + rim.rx} ${rim.cy}`} fill="none" stroke={G.goldDark} strokeWidth={1.6} />
      <g transform="translate(0 4.5) rotate(-24 27.5 27)">
        <circle cx="27.5" cy="27" r="12.4" fill={G.gold} />
        <g stroke="rgb(110 70 10 / 0.6)" strokeWidth={0.75} fill="none">
          <path d="M15.1 27 H39.9" />
          <path d="M27.5 14.6 V39.4" />
          <path d="M19 17.8 C24 22 24 32 19 36.2" />
          <path d="M36 17.8 C31 22 31 32 36 36.2" />
        </g>
        <ellipse cx="22.5" cy="20.5" rx="4" ry="2.4" fill="rgb(255 250 220 / 0.55)" stroke="none" />
      </g>
      {/* The front of the rim, over the ball's lower half. */}
      <path d={`M${rim.cx - rim.rx} ${rim.cy} A${rim.rx} ${rim.ry} 0 0 0 ${rim.cx + rim.rx} ${rim.cy}`} fill="none" stroke={G.gold} strokeWidth={1.8} />
      <path d={`M${rim.cx - rim.rx + 2} ${rim.cy + 1.6} A${rim.rx} ${rim.ry} 0 0 0 ${rim.cx + 4} ${rim.cy + 3}`} fill="none" stroke="rgb(255 245 200 / 0.7)" strokeWidth={0.6} />
    </g>
  );
}

function CommissionersTrophy() {
  // Thirty slim silver flagpoles stand in a ring on a round base, each topped with a gold
  // pennant; the pennants trace a ring that tilts up toward the back.
  const N = 30;
  const poles = Array.from({length: N}, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const x = 30 + 14.5 * Math.cos(a);
    const depth = Math.sin(a); // 1 = nearest the viewer
    // The top ring tilts: high at the back left, low at the front right.
    const top = 24 + 8 * (0.8 * depth + 0.6 * Math.cos(a));
    return {x, depth, top, base: 76 + 2.6 * depth, dir: Math.cos(a) >= 0 ? 1 : -1};
  });
  const pole = (p: (typeof poles)[number], key: number) => (
    <g key={key} opacity={p.depth < 0 ? 0.7 : 1}>
      <rect x={p.x - 0.55} y={p.top} width={1.1} height={p.base - p.top} fill={G.silver} stroke="none" />
      <path
        d={`M${p.x + 0.3} ${p.top - 0.6} q 2.4 -1 4.8 0.4 l -1.2 2.4 l 1.2 2.4 q -2.4 -1.2 -4.8 -0.2 Z`}
        fill={G.gold}
        stroke="rgb(110 70 10 / 0.6)"
        strokeWidth={0.3}
      />
    </g>
  );
  return (
    <g strokeLinejoin="round">
      <path d="M10.5 81 C10.5 78.5 49.5 78.5 49.5 81 L50.5 92 C50.5 95 9.5 95 9.5 92 Z" fill="#17191d" stroke={EDGE} strokeWidth={0.5} />
      <path d="M11.5 86.5 C18 89 42 89 48.5 86.5" stroke="rgb(212 175 55 / 0.75)" strokeWidth={1} fill="none" />
      <ellipse cx="30" cy="79" rx="19.5" ry="3.4" fill={G.silver} stroke={EDGE} strokeWidth={0.5} />
      <ellipse cx="30" cy="77.6" rx="16.5" ry="2.8" fill={G.silverDark} stroke={EDGE} strokeWidth={0.4} />
      {poles.filter((p) => p.depth < 0).map((p, i) => pole(p, i))}
      <circle cx="30" cy="73" r="3.6" fill={G.gold} stroke="rgb(110 70 10 / 0.5)" strokeWidth={0.4} />
      {poles.filter((p) => p.depth >= 0).map((p, i) => pole(p, 100 + i))}
    </g>
  );
}

function MlsCup() {
  // The Philip F. Anschutz Trophy: a silver cup with a gold rim and star, wrapped by two sweeping ribbon handles.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d="M24 82 C5 70 2 30 10.5 9 C12.5 4.5 19 5.5 19 11" fill="none" stroke={G.silverDark} strokeWidth={4} strokeLinecap="round" />
      <path d="M36 82 C55 70 58 30 49.5 9 C47.5 4.5 41 5.5 41 11" fill="none" stroke={G.silverDark} strokeWidth={4} strokeLinecap="round" />
      <path d="M23.5 80 C6.5 69 4 31 11.5 10.5" fill="none" stroke="rgb(255 255 255 / 0.7)" strokeWidth={1} />
      <path d="M36.5 80 C53.5 69 56 31 48.5 10.5" fill="none" stroke="rgb(255 255 255 / 0.45)" strokeWidth={1} />
      <path d="M13 85 H47 L48.5 92.5 H11.5 Z" fill={G.silver} />
      <ellipse cx="30" cy="85" rx="17" ry="3" fill={G.silver} />
      <path d="M12 90 H48" stroke={G.gold} strokeWidth={1.4} />
      <path d="M26.5 61 C27.5 70 27.5 76 24.5 85 H35.5 C32.5 76 32.5 70 33.5 61 Z" fill={G.silver} />
      <ellipse cx="30" cy="64" rx="4.6" ry="2.8" fill={G.gold} />
      <path d="M17 12 C17 38 23 56 30 60.5 C37 56 43 38 43 12 Z" fill={G.silver} />
      <path d="M21 17 C21.5 34 25 49 29 57" stroke="rgb(255 255 255 / 0.8)" strokeWidth={1.2} fill="none" />
      <ellipse cx="30" cy="12" rx="13" ry="2.6" fill={G.gold} />
      <ellipse cx="30" cy="12.2" rx="10.6" ry="1.6" fill="#8a5c0e" opacity={0.6} />
      <path d="M18.2 24 C24 26.6 36 26.6 41.8 24" stroke={G.gold} strokeWidth={1.6} fill="none" />
      <path d="M30 28.5 l1.6 3.3 3.6 0.5 -2.6 2.5 0.6 3.6 -3.2 -1.7 -3.2 1.7 0.6 -3.6 -2.6 -2.5 3.6 -0.5 Z" fill={G.gold} />
    </g>
  );
}

function GreyCup() {
  // A silver loving cup with two tall ear handles on a short stem, set on a tall bell-shaped
  // silver base: tiers of engraved plates between narrow black bands, on a black plinth.
  const top = 37;
  const bottom = 90;
  const half = (y: number) => 9.5 + 11.5 * Math.pow((y - top) / (bottom - top), 1.25);
  const bands = [top, 44, 52, 61, 71, 81, bottom];
  const tiers = [];
  for (let i = 0; i < bands.length - 1; i++) {
    const y0 = bands[i] + 1.4;
    const y1 = bands[i + 1];
    const [a0, a1] = [half(y0), half(y1)];
    tiers.push(<path key={`t${i}`} d={`M${30 - a0} ${y0} H${30 + a0} L${30 + a1} ${y1} H${30 - a1} Z`} fill={G.silver} />);
    // Vertical seams between the engraved plates.
    for (const f of [-0.62, -0.22, 0.22, 0.62]) {
      tiers.push(<path key={`s${i}${f}`} d={`M${30 + f * a0} ${y0} L${30 + f * a1} ${y1}`} stroke="rgb(0 0 0 / 0.22)" strokeWidth={0.45} />);
    }
    const yb = bands[i + 1];
    tiers.push(<path key={`b${i}`} d={`M${30 - half(yb) - 0.3} ${yb} H${30 + half(yb) + 0.3} V${yb + 1.4} H${30 - half(yb) - 0.3} Z`} fill="#1b1d22" />);
  }
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d={`M${30 - half(top) - 0.6} ${top - 1.6} H${30 + half(top) + 0.6} V${top + 1.4} H${30 - half(top) - 0.6} Z`} fill="#1b1d22" />
      {tiers}
      <path d={`M${30 - half(top) + 2} ${top + 3} L${30 - half(bottom) + 3} ${bottom - 1}`} stroke="rgb(255 255 255 / 0.65)" strokeWidth={1.4} />
      <path d="M7.5 91.4 H52.5 V94 H7.5 Z" fill="#1b1d22" />
      {/* Cup: stem and foot, bowl, ear handles. */}
      <ellipse cx="30" cy="34.6" rx="7.5" ry="1.6" fill={G.silverDark} />
      <path d="M28.4 25 H31.6 L32.2 34 H27.8 Z" fill={G.silver} />
      <ellipse cx="30" cy="28.4" rx="2.6" ry="1.1" fill={G.silverDark} />
      <path d="M19 9 C11 8 9.5 19 21.5 21.5" fill="none" stroke={G.silverDark} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M41 9 C49 8 50.5 19 38.5 21.5" fill="none" stroke={G.silverDark} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M17.5 5.5 C17.5 17 22 24.5 30 25.2 C38 24.5 42.5 17 42.5 5.5 Z" fill={G.silver} />
      <path d="M16.6 4.8 H43.4 L42.6 6.6 H17.4 Z" fill={G.silverDark} />
      <ellipse cx="30" cy="5" rx="13.2" ry="1.8" fill={G.silverDark} />
      <ellipse cx="30" cy="5.1" rx="11" ry="1.1" fill="#6b7279" opacity={0.6} />
      <path d="M21 9 C21.8 16 24.5 21.5 28 23.6" stroke="rgb(255 255 255 / 0.8)" strokeWidth={1.1} fill="none" />
    </g>
  );
}

function NorthStarCup() {
  // The North Star Cup: a tall, faceted silver cup flaring up to a gold rim, with a gold crest,
  // a rounded collar bearing a gold compass star, a flared foot, and two tall blade handles
  // whose arms reach in to the bowl.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      {/* Handles: blades rising from the foot, with angled arms into the bowl. */}
      <path d="M17.5 85 C12 70 9.5 46 9.8 21 L13 18.5 C12.8 44 14.6 66 20 84 Z" fill={G.silverDark} />
      <path d="M42.5 85 C48 70 50.5 46 50.2 21 L47 18.5 C47.2 44 45.4 66 40 84 Z" fill={G.silverDark} />
      <path d="M11 31 L21.5 28.5 L21.8 34.5 L11.2 35.5 Z" fill={G.silver} />
      <path d="M49 31 L38.5 28.5 L38.2 34.5 L48.8 35.5 Z" fill={G.silver} />
      {/* Foot. */}
      <path d="M25.5 68 H34.5 L46.5 88 H13.5 Z" fill={G.silver} />
      <path d="M30 68 V88 M27.6 68 L22 88 M32.4 68 L38 88" stroke="rgb(0 0 0 / 0.14)" strokeWidth={0.5} />
      <path d="M12.5 88 H47.5 V91.5 C47.5 93 12.5 93 12.5 91.5 Z" fill={G.silverDark} />
      {/* Bowl: a faceted cone. */}
      <path d="M14.5 7 H45.5 L35 61 H25 Z" fill={G.silver} />
      <path d="M19.8 7 L27.1 61 M25.2 7 L28.6 61 M30 7 V61 M34.8 7 L31.4 61 M40.2 7 L32.9 61" stroke="rgb(0 0 0 / 0.13)" strokeWidth={0.5} />
      <path d="M17.5 9 L26.2 58" stroke="rgb(255 255 255 / 0.75)" strokeWidth={1.3} />
      <ellipse cx="30" cy="7" rx="15.5" ry="2" fill={G.gold} stroke="rgb(90 60 10 / 0.5)" />
      <ellipse cx="30" cy="7.1" rx="13.6" ry="1.2" fill="#9aa1a8" stroke="none" />
      <circle cx="30" cy="16.5" r="4.2" fill={G.gold} stroke="rgb(90 60 10 / 0.5)" />
      <circle cx="30" cy="16.5" r="2.9" fill="none" stroke="rgb(110 70 10 / 0.45)" strokeWidth={0.4} />
      {/* Collar with the compass star. */}
      <rect x="23" y="59.5" width="14" height="9.5" rx="4.2" fill={G.silver} />
      <polygon points={starPoints(30, 64.2, 4, 1.1, 4, 1, -Math.PI / 2)} fill={G.gold} stroke="rgb(90 60 10 / 0.5)" strokeWidth={0.3} />
      <polygon points={starPoints(30, 64.2, 2.4, 0.8, 4, 1, -Math.PI / 4)} fill={G.goldDark} stroke="none" />
    </g>
  );
}

function NllCup() {
  // The NLL Cup: a polished silver column that twists to a narrow waist and opens into a
  // five-pointed star at the top, on a faceted block bearing the black NLL shield, over a wide
  // black hexagonal base lined with silver plates.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      {/* Base. */}
      <path d="M13 80 H47 L51 83.5 V90.5 L47 94 H13 L9 90.5 V83.5 Z" fill="#1b1d22" />
      <path d="M13 80 H47 L51 83.5 H9 Z" fill="#33373d" />
      <path d="M11 84.6 H21 V91.6 H11 Z M23 84.6 H37 V91.6 H23 Z M39 84.6 H49 V91.6 H39 Z" fill={G.silver} stroke="rgb(0 0 0 / 0.35)" strokeWidth={0.4} />
      {/* Block with the shield. */}
      <path d="M20 65 H40 L43 67.5 V78 L40 80 H20 L17 78 V67.5 Z" fill={G.silver} />
      <path d="M20 65 V80 M40 65 V80" stroke="rgb(0 0 0 / 0.18)" strokeWidth={0.5} />
      <path d="M26.2 67.8 H33.8 V74 L30 77.6 L26.2 74 Z" fill="#15171b" stroke={G.silverDark} strokeWidth={0.6} />
      <polygon points={starPoints(30, 73.3, 2.2, 0.6, 4)} fill={G.silver} stroke="none" />
      {/* The twisting column: two faces crossing at the waist. */}
      <path d="M16.5 12.5 L43.5 12.5 L33.4 44 L41 65 H19 L26.6 44 Z" fill={G.silver} />
      <path d="M30 12.5 H43.5 L33.4 44 L29.4 40 Z" fill={G.silverDark} />
      <path d="M26.6 44 L30.6 48 L41 65 H33 Z" fill={G.silverDark} />
      <path d="M18.5 14 L27.2 42.5" stroke="rgb(255 255 255 / 0.85)" strokeWidth={1.3} />
      <path d="M29 50 L23 63" stroke="rgb(255 255 255 / 0.7)" strokeWidth={1.1} />
      {/* The star opening at the top. */}
      <polygon points={starPoints(30, 10.5, 13, 5.4, 5, 0.62)} fill={G.silver} />
      <polygon points={starPoints(30, 10.6, 9.6, 3.8, 5, 0.6)} fill="#15171b" stroke="none" />
    </g>
  );
}

function CeblTrophy() {
  // The CEBL Championship Trophy: a sand-coloured ball resting in a hoop, over a tapering net of
  // silver rods hung with maple leaves, on a light wooden drum with a brass plaque.
  const rods = [-19, -13, -7, 0, 7, 13, 19];
  const leaves: [number, number, number, number][] = [
    [15.5, 35, 1.3, -22], [25, 35, 1.4, -4], [35, 35, 1.4, 4], [44.5, 35, 1.3, 22],
    [20, 46, 1.25, -12], [30, 45, 1.35, 0], [40, 46, 1.25, 12],
    [24.5, 56, 1.15, -6], [35.5, 56, 1.15, 6],
    [30, 64, 1.05, 0],
  ];

  return (
    <g strokeLinejoin="round">
      {/* Base. */}
      <path d="M19.5 72 C19.5 70.6 40.5 70.6 40.5 72 V92 C40.5 93.6 19.5 93.6 19.5 92 Z" fill="#d8b98c" stroke={EDGE} strokeWidth={0.5} />
      <path d="M19.5 76 C26 77 34 77 40.5 76 M19.5 80 C26 81 34 81 40.5 80 M19.5 84 C26 85 34 85 40.5 84 M19.5 88 C26 89 34 89 40.5 88" stroke="rgb(120 80 40 / 0.35)" strokeWidth={0.45} fill="none" />
      <rect x="24.5" y="76.5" width="11" height="11" rx="0.6" fill={G.goldDark} stroke="rgb(90 60 10 / 0.5)" strokeWidth={0.4} />
      <circle cx="30" cy="80" r="1.6" fill="none" stroke="rgb(50 35 10 / 0.6)" strokeWidth={0.4} />
      {/* Rods, from the hoop down into the base. */}
      {rods.map((dx) => (
        <path key={dx} d={`M${30 + dx} 31 L${30 + dx * 0.32} 72`} stroke={G.silver} strokeWidth={1} />
      ))}
      {/* The back of the hoop, the ball, then the front of the hoop. */}
      <path d="M8.5 25.5 A21.5 5.6 0 0 1 51.5 25.5" fill="none" stroke={G.sand} strokeWidth={2.4} />
      <circle cx="30" cy="20" r="12.5" fill={G.sand} stroke={EDGE} strokeWidth={0.5} />
      <g stroke="rgb(90 70 40 / 0.45)" strokeWidth={0.6} fill="none">
        <path d="M17.5 21 C24 23 36 23 42.5 21" />
        <path d="M24 9.5 C21 15 21 25 24 31" />
        <path d="M36 9.5 C39 15 39 25 36 31" />
      </g>
      <ellipse cx="25" cy="13" rx="4" ry="2.3" fill="rgb(255 250 230 / 0.45)" />
      <path d="M8.5 25.5 A21.5 5.6 0 0 0 51.5 25.5" fill="none" stroke={G.sand} strokeWidth={2.6} />
      <path d="M8.5 25.5 A21.5 5.6 0 0 0 51.5 25.5" fill="none" stroke="rgb(70 50 25 / 0.35)" strokeWidth={0.4} />
      {/* Maple leaves on the net. */}
      <g fill={G.maple} stroke="rgb(110 85 50 / 0.55)" strokeWidth={0.35}>
        {leaves.map(([x, y, sc, r]) => (
          <g key={`${x}-${y}`}>{mapleLeaf(x, y, sc, r)}</g>
        ))}
      </g>
    </g>
  );
}

function WalterCup() {
  // The Walter Cup: two silver hockey sticks form a V, their blades meeting on a faceted wedge,
  // their shafts rising past a shallow bowl ringed with a zigzag band; on a round black base
  // with a polished silver band.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      {/* Base. */}
      <path d="M9 82 V89.5 C9 94.5 51 94.5 51 89.5 V82 Z" fill="#1b1d22" />
      <path d="M9.6 84.2 C14 87.6 46 87.6 50.4 84.2 V89 C46 92.4 14 92.4 9.6 89 Z" fill={G.silver} stroke="rgb(0 0 0 / 0.3)" strokeWidth={0.4} />
      <ellipse cx="30" cy="82" rx="21" ry="3.8" fill="#2b2e33" />
      {/* Wedge where the blades meet. */}
      <path d="M17 82 L30 66 L43 82 Z" fill={G.silver} />
      <path d="M30 66 V82" stroke="rgb(0 0 0 / 0.18)" strokeWidth={0.5} />
      {/* The two sticks. */}
      <path d="M8.5 3.5 L12.6 3 L32 79 L26.5 80.5 Z" fill={G.silver} />
      <path d="M12.6 3 L14.4 3.6 L32.6 78 L32 79 Z" fill={G.silverDark} />
      <path d="M51.5 3.5 L47.4 3 L28 79 L33.5 80.5 Z" fill={G.silver} />
      <path d="M47.4 3 L45.6 3.6 L27.4 78 L28 79 Z" fill={G.silverDark} />
      <path d="M10.3 6 L27.6 74" stroke="rgb(255 255 255 / 0.75)" strokeWidth={0.9} />
      <path d="M49.6 6 L32.4 74" stroke="rgb(0 0 0 / 0.25)" strokeWidth={0.7} />
      {/* The bowl, held between the shafts. */}
      <path d="M12.5 19 H47.5 V21.6 H12.5 Z" fill={G.silverDark} />
      <path d="M13.5 16.5 C14.5 27 21 30.5 30 30.5 C39 30.5 45.5 27 46.5 16.5 Z" fill={G.silver} />
      <path d="M14.2 19.5 H45.8 L45 24.2 H15 Z" fill={G.silver} stroke="rgb(0 0 0 / 0.3)" strokeWidth={0.4} />
      <path d="M15.4 24 L17.6 19.8 L19.8 24 L22 19.8 L24.2 24 L26.4 19.8 M33.6 19.8 L35.8 24 L38 19.8 L40.2 24 L42.4 19.8 L44.6 24" stroke="rgb(60 66 72 / 0.55)" strokeWidth={0.5} fill="none" />
      <path d="M27.4 20.2 L28.9 23.6 L30 21.4 L31.1 23.6 L32.6 20.2" stroke="#3c4146" strokeWidth={0.8} fill="none" />
      <ellipse cx="30" cy="16.5" rx="16.5" ry="2.6" fill={G.silverDark} />
      <ellipse cx="30" cy="16.6" rx="14" ry="1.6" fill="#7c848c" opacity={0.55} />
    </g>
  );
}

function WnbaTrophy() {
  // The WNBA championship trophy: a chrome ball held up and off to one side by three slanted
  // silver rods, on a black, triangular base with a polished top.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      {/* Base: a triangular plinth seen from the front. */}
      <path d="M9.5 80 L22 74 H41 L51.5 80 Z" fill="#2b2e33" />
      <path d="M13 79 H48" stroke={G.silver} strokeWidth={0.9} />
      <path d="M9.5 80 H51.5 L50 93 H11 Z" fill="#15171b" />
      <path d="M15 85.5 H46" stroke="rgb(220 224 228 / 0.55)" strokeWidth={0.8} />
      {/* Rods: from the base up to the ball, leaning right. */}
      <path d="M17.6 78 L30.4 32.8" stroke={G.silver} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M26.4 76.4 L34 33.6" stroke={G.silverDark} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M34.4 78 L40.6 31.6" stroke={G.silver} strokeWidth={2.4} strokeLinecap="round" />
      <ellipse cx="17.6" cy="78" rx="2.4" ry="1" fill={G.silver} />
      <ellipse cx="26.4" cy="76.4" rx="2.2" ry="0.9" fill={G.silverDark} />
      <ellipse cx="34.4" cy="78" rx="2.4" ry="1" fill={G.silver} />
      {/* The ball. */}
      <circle cx="37" cy="20" r="13" fill={G.chrome} />
      <g stroke="rgb(25 28 32 / 0.75)" strokeWidth={0.8} fill="none">
        <path d="M24.4 23 C31 26 43 26 49.6 22" />
        <path d="M33 7.6 C29 13 28.5 25 31.6 32" />
        <path d="M44 9 C46.5 14 47 23 44.6 30" />
      </g>
      <ellipse cx="32.5" cy="13.5" rx="3.6" ry="2.4" fill="rgb(255 255 255 / 0.8)" stroke="none" />
    </g>
  );
}

function MathesonCup() {
  // The Diana B. Matheson Cup: a gold body of twisting "aurora" ribbons rising to a gold north
  // star, on a white (silver) drum over a bronze ring and a dark wooden base.
  return (
    <g strokeLinejoin="round">
      {/* Base: silver drum, bronze ring, wood. */}
      <path d="M15.5 87.5 H44.5 L45.5 92 C45.5 94.2 14.5 94.2 14.5 92 Z" fill="#4a3020" stroke={EDGE} strokeWidth={0.5} />
      <path d="M15 86.4 C15 88.4 45 88.4 45 86.4 V88 C45 90 15 90 15 88 Z" fill="#b8733a" stroke={EDGE} strokeWidth={0.4} />
      <path d="M17.5 72 C17.5 70.4 42.5 70.4 42.5 72 L44.6 86.4 C44.6 88.2 15.4 88.2 15.4 86.4 Z" fill="#eceef0" stroke={EDGE} strokeWidth={0.5} />
      <path d="M17.5 72 C17.5 73.6 42.5 73.6 42.5 72" fill="none" stroke={G.gold} strokeWidth={1.1} />
      <path d="M22.5 79.6 H37.5" stroke="rgb(90 96 102 / 0.55)" strokeWidth={1.1} />
      <path d="M24.5 82.4 H35.5" stroke="rgb(90 96 102 / 0.4)" strokeWidth={0.6} />
      {/* The twisting ribbons and the spine between them. */}
      <g stroke="rgb(90 60 10 / 0.5)" strokeWidth={0.4}>
        <path d="M27.6 18 H32.4 L31.6 72 H28.4 Z" fill={G.goldDark} />
        <path d="M19 19 C8.5 34 44.5 41 30.6 58 C27.6 62.5 27.8 67 28.4 72 L31.4 72 C31 67 31.2 63 34.4 59 C50 40 15.5 33 25 18.5 Z" fill={G.gold} />
        <path d="M41 19 C51.5 34 15.5 41 29.4 58 C32.4 62.5 32.2 67 31.6 72 L28.6 72 C29 67 28.8 63 25.6 59 C10 40 44.5 33 35 18.5 Z" fill={G.goldDark} opacity={0.92} />
        <path d="M19.6 23 C14.5 33 38.5 40 32.2 53" fill="none" stroke="rgb(255 245 200 / 0.75)" strokeWidth={1} />
      </g>
      {/* The north star, in a little perspective. */}
      <polygon points={starPoints(30, 12.8, 12.6, 5.4, 5, 0.86)} fill={G.gold} stroke="rgb(90 60 10 / 0.55)" strokeWidth={0.5} />
      <path d={`M30 12.8 L30 ${(12.8 - 12.6 * 0.86).toFixed(2)} M30 12.8 L${(30 + 12.6 * Math.cos(-Math.PI / 2 + (2 * Math.PI) / 5)).toFixed(2)} ${(12.8 + 12.6 * 0.86 * Math.sin(-Math.PI / 2 + (2 * Math.PI) / 5)).toFixed(2)}`} stroke="rgb(110 70 10 / 0.35)" strokeWidth={0.5} />
      <polygon points={`30,13.2 ${starPoints(30, 12.8, 12.6, 5.4, 5, 0.86).split(' ').slice(2, 6).join(' ')}`} fill={G.goldDark} opacity={0.55} stroke="none" />
    </g>
  );
}

function CdlTrophy() {
  // A tall, angular silver trophy on a black base.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d="M15 76 H45 L47 92.5 H13 Z" fill="#17191d" />
      <rect x="12.5" y="91.5" width="35" height="3" rx="0.8" fill={G.silverDark} />
      <path d="M16.5 76 H43.5 L41 72 H19 Z" fill={G.silverDark} />
      <path d="M30 4 L41 18 L35 72 H25 L19 18 Z" fill={G.silver} />
      <path d="M30 4 L30 72 M19 18 L41 18" stroke="rgb(0 0 0 / 0.22)" strokeWidth={0.6} />
      <path d="M27 12 L23 20 L27.5 68" stroke="rgb(255 255 255 / 0.75)" strokeWidth={1.1} fill="none" />
    </g>
  );
}

const ART: Record<LeagueId, () => ReactNode> = {
  NHL: StanleyCup,
  NBA: LarryOBrien,
  MLB: CommissionersTrophy,
  MLS: MlsCup,
  CFL: GreyCup,
  CPL: NorthStarCup,
  NLL: NllCup,
  CEBL: CeblTrophy,
  PWHL: WalterCup,
  WNBA: WnbaTrophy,
  NSL: MathesonCup,
  CDL: CdlTrophy,
};

/** The trophy each league's champion lifts, by its proper name. */
export const TROPHY_NAME: Record<LeagueId, string> = {
  NHL: 'Stanley Cup',
  NBA: 'Larry O’Brien Trophy',
  MLB: 'Commissioner’s Trophy',
  MLS: 'Philip F. Anschutz Trophy',
  CFL: 'Grey Cup',
  CPL: 'North Star Cup',
  NLL: 'NLL Cup',
  CEBL: 'CEBL Championship',
  PWHL: 'Walter Cup',
  WNBA: 'WNBA Championship',
  NSL: 'Diana B. Matheson Cup',
  CDL: 'CDL Championship',
};

/**
 * Trophies whose drawings are shorter than the rest, scaled up from the middle of their base so
 * every trophy stands about the same height (most reach from y≈4 to the base at y≈93).
 */
const FIT: Partial<Record<LeagueId, {scale: number; baseY: number}>> = {
  NBA: {scale: 1.16, baseY: 93},
  MLB: {scale: 1.13, baseY: 95},
};

export function TrophyArt({league, height = 64, isMuted = false, title}: {league: LeagueId; height?: number; isMuted?: boolean; title?: string}) {
  const Art = ART[league];
  const fit = FIT[league];
  return (
    <svg
      viewBox="0 0 60 98"
      height={height}
      width={(height * 60) / 98}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={isMuted ? {filter: 'grayscale(1)', opacity: 0.28} : undefined}>
      <ellipse cx="30" cy="96" rx="20" ry="1.8" fill="rgb(0 0 0 / 0.14)" />
      {fit ? (
        <g transform={`translate(30 ${fit.baseY}) scale(${fit.scale}) translate(-30 ${-fit.baseY})`}>
          <Art />
        </g>
      ) : (
        <Art />
      )}
    </svg>
  );
}

/**
 * Every championship a team has won, one trophy per title with its year,
 * plus an empty silhouette when a team has never won.
 */
export function TrophyCabinet({team}: {team: Team}) {
  const league = team.league;
  const titles = team.championships;
  const name = TROPHY_NAME[league];
  if (titles.length === 0) {
    return (
      <div className="card-radius flex items-center gap-3 bg-[var(--color-background-muted)] p-3">
        <TrophyArt league={league} height={56} isMuted />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-primary">No {name} yet</span>
          <span className="text-xs text-secondary">{LEAGUES[league].id} champions lift the {name}.</span>
        </div>
      </div>
    );
  }
  const size = titles.length > 12 ? 52 : titles.length > 4 ? 60 : 76;
  return (
    <div className="card-radius bg-[var(--color-background-muted)] p-3">
      <ul
        className="grid justify-items-center gap-x-1 gap-y-2"
        style={{gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(size * 0.78)}px, 1fr))`}}
        aria-label={`${titles.length} ${name}${titles.length === 1 ? '' : 's'}`}>
        {titles.map((year) => (
          <li key={year} className="flex flex-col items-center gap-0.5">
            <TrophyArt league={league} height={size} />
            <span className="text-xs font-semibold tabular-nums text-secondary">{year}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Every title won by a set of teams (a city's), one trophy each, grouped by league and
 * in date order. The year sits under each trophy; the team is in its label.
 */
export function TitleCabinet({teams}: {teams: Team[]}) {
  const items = teams
    .flatMap((t) => t.championships.map((year) => ({team: t, year})))
    .sort((a, b) => LEAGUE_ORDER.indexOf(a.team.league) - LEAGUE_ORDER.indexOf(b.team.league) || a.year - b.year);
  if (items.length === 0) return null;
  const size = items.length > 24 ? 40 : items.length > 10 ? 48 : 60;
  return (
    <div className="card-radius bg-[var(--color-background-muted)] p-3">
      <ul
        className="grid justify-items-center gap-x-1 gap-y-2"
        style={{gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(size * 0.8)}px, 1fr))`}}
        aria-label={`${items.length} championship${items.length === 1 ? '' : 's'}`}>
        {items.map(({team, year}) => (
          <li key={`${team.id}-${year}`} className="flex flex-col items-center gap-0.5" title={`${TROPHY_NAME[team.league]} ${year} · ${team.name}`}>
            <TrophyArt league={team.league} height={size} title={`${TROPHY_NAME[team.league]} ${year}, ${team.name}`} />
            <span className="text-[10px] font-semibold tabular-nums text-secondary" aria-hidden>
              {year}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
