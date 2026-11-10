import type {ReactNode} from 'react';
import {LEAGUES, LEAGUE_ORDER, type LeagueId, type Team} from '../data';

/**
 * Original trophy illustrations, one per league championship trophy. They are
 * drawn from reference photos as simplified cut-outs, not reproductions.
 *
 * Gradients are defined once by <TrophyDefs /> (rendered at the app root) and
 * referenced by id, so a cabinet of 24 Stanley Cups stays cheap.
 */

const G = {
  silver: 'url(#tr-silver)',
  silverDark: 'url(#tr-silver-dark)',
  gold: 'url(#tr-gold)',
  goldDark: 'url(#tr-gold-dark)',
  wood: 'url(#tr-wood)',
  crystal: 'url(#tr-crystal)',
};

export function TrophyDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="tr-silver" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8f979f" />
          <stop offset="0.22" stopColor="#f6f8fa" />
          <stop offset="0.45" stopColor="#c3c9cf" />
          <stop offset="0.7" stopColor="#eef1f4" />
          <stop offset="1" stopColor="#7c848c" />
        </linearGradient>
        <linearGradient id="tr-silver-dark" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5f666d" />
          <stop offset="0.3" stopColor="#c9ced3" />
          <stop offset="0.6" stopColor="#8c939a" />
          <stop offset="1" stopColor="#4f555b" />
        </linearGradient>
        <linearGradient id="tr-gold" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9a6a12" />
          <stop offset="0.25" stopColor="#fff0b8" />
          <stop offset="0.5" stopColor="#e0ac34" />
          <stop offset="0.75" stopColor="#fbe08a" />
          <stop offset="1" stopColor="#8a5c0e" />
        </linearGradient>
        <linearGradient id="tr-gold-dark" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6e4a0a" />
          <stop offset="0.35" stopColor="#d9a63a" />
          <stop offset="0.65" stopColor="#a87818" />
          <stop offset="1" stopColor="#5e3f08" />
        </linearGradient>
        <linearGradient id="tr-wood" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#2a1a10" />
          <stop offset="0.35" stopColor="#5a3820" />
          <stop offset="0.7" stopColor="#3e2616" />
          <stop offset="1" stopColor="#21140c" />
        </linearGradient>
        <linearGradient id="tr-crystal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#cfe6f5" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="#9cc7e3" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e8f4fb" stopOpacity="0.95" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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
  // A gold basketball dropping through a gold hoop and net, on a square base.
  return (
    <g stroke="rgb(90 60 10 / 0.45)" strokeWidth={0.5} strokeLinejoin="round">
      <path d="M14 81 L17.5 77.5 H42.5 L46 81 Z" fill={G.gold} />
      <rect x="14" y="81" width="32" height="12" rx="0.8" fill={G.goldDark} />
      <path d="M17.5 30 C18.5 46 22 62 25 77.5 H35 C38 62 41.5 46 42.5 30 Z" fill={G.gold} />
      <path
        d="M19 33 L33 77 M24 31 L37 70 M30 30.5 L39.5 58 M36 31 L41 44 M41 33 L27 77 M36 31 L23 70 M30 30.5 L20.5 58 M24 31 L19 44"
        stroke="rgb(120 80 10 / 0.42)"
        strokeWidth={0.6}
        fill="none"
      />
      <path d="M21 34 C21.5 48 24 62 26.5 75" stroke="rgb(255 245 200 / 0.75)" strokeWidth={1.2} fill="none" />
      <path d="M17.5 30 A12.5 2.4 0 0 0 42.5 30" fill="none" stroke={G.goldDark} strokeWidth={1.4} />
      <circle cx="30" cy="17.5" r="11.6" fill={G.gold} />
      <g stroke="rgb(110 70 10 / 0.55)" strokeWidth={0.7} fill="none">
        <path d="M18.4 17.5 H41.6" />
        <path d="M30 5.9 V29.1" />
        <path d="M22 9 C26.6 13 26.6 22 22 26" />
        <path d="M38 9 C33.4 13 33.4 22 38 26" />
      </g>
      <ellipse cx="25" cy="11.5" rx="3.6" ry="2.2" fill="rgb(255 250 220 / 0.6)" stroke="none" />
      <path d="M17.5 30 A12.5 2.4 0 0 1 42.5 30" fill="none" stroke={G.gold} strokeWidth={1.2} />
    </g>
  );
}

function CommissionersTrophy() {
  // Thirty gold flags ring a silver baseball, rising from a black base with a silver band.
  const poles = Array.from({length: 16}, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return {x: 30 + 16 * Math.cos(a), depth: Math.sin(a), a};
  });
  const pole = (p: {x: number; depth: number}, key: number) => {
    const top = 13 + 4 * p.depth;
    const bottom = 76 + 2.2 * p.depth;
    const dir = p.x < 30 ? -1 : 1;
    return (
      <g key={key} opacity={p.depth < 0 ? 0.6 : 1}>
        <rect x={p.x - 0.55} y={top} width={1.1} height={bottom - top} fill={G.gold} stroke="none" />
        <path
          d={`M${p.x} ${top} q ${2.8 * dir} -1.6 ${5.6 * dir} 0.6 l 0 8 q ${-2.8 * dir} -1.8 ${-5.6 * dir} -0.6 Z`}
          fill={G.gold}
          stroke="rgb(110 70 10 / 0.5)"
          strokeWidth={0.4}
        />
      </g>
    );
  };
  return (
    <g strokeLinejoin="round">
      <path d="M11 78 H49 L50 93 H10 Z" fill="#17191d" stroke={EDGE} strokeWidth={0.5} />
      <path d="M11 78 H49 V82.5 H11 Z" fill={G.silver} />
      <path d="M13 87.5 H47" stroke="rgb(212 175 55 / 0.7)" strokeWidth={0.8} />
      <ellipse cx="30" cy="78" rx="19" ry="2.4" fill={G.silverDark} />
      {poles.filter((p) => p.depth < 0).map((p, i) => pole(p, i))}
      <circle cx="30" cy="44" r="11" fill={G.silver} stroke={EDGE} strokeWidth={0.5} />
      <g stroke="rgb(70 76 82 / 0.45)" strokeWidth={0.5} fill="none">
        <ellipse cx="30" cy="44" rx="4.8" ry="11" />
        <path d="M19 44 H41 M20.5 38 H39.5 M20.5 50 H39.5" />
      </g>
      <path d="M30 55 V76" stroke={G.silverDark} strokeWidth={2.4} />
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
  // A silver cup with looped handles on a tall black cone ringed with silver bands.
  const at = (y: number) => [21 - ((y - 38) * 12) / 54, 39 + ((y - 38) * 12) / 54];
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d="M21 38 H39 L51 92 H9 Z" fill="#1b1d22" />
      {[46, 56, 66, 76, 86].map((y) => {
        const [a, b] = at(y);
        const [c, d] = at(y + 2.6);
        return <path key={y} d={`M${a} ${y} H${b} L${d} ${y + 2.6} H${c} Z`} fill={G.silver} />;
      })}
      <path d="M30 40 V91 M24 40 L18 91 M36 40 L42 91" stroke="rgb(255 255 255 / 0.1)" strokeWidth={0.6} />
      <rect x="8.5" y="91.5" width="43" height="3" rx="0.8" fill={G.silverDark} />
      <ellipse cx="30" cy="38" rx="10" ry="2" fill={G.silver} />
      <path d="M27.4 31 H32.6 L33.6 38 H26.4 Z" fill={G.silverDark} />
      <path d="M18 9.5 C8.5 9.5 8.5 25 20 27" fill="none" stroke={G.silverDark} strokeWidth={2.4} />
      <path d="M42 9.5 C51.5 9.5 51.5 25 40 27" fill="none" stroke={G.silverDark} strokeWidth={2.4} />
      <path d="M17 6 C17 20 22 31 30 31 C38 31 43 20 43 6 Z" fill={G.silver} />
      <ellipse cx="30" cy="6" rx="13" ry="2.3" fill={G.silverDark} />
      <path d="M21 9 C22 19 25 26 28.5 29" stroke="rgb(255 255 255 / 0.8)" strokeWidth={1.1} fill="none" />
    </g>
  );
}

function NorthStarCup() {
  // A crystal trophy crowned with a north star.
  return (
    <g strokeLinejoin="round">
      <path
        d="M30 4 L33.2 13.8 L43.5 13.8 L35.2 19.9 L38.4 29.7 L30 23.6 L21.6 29.7 L24.8 19.9 L16.5 13.8 L26.8 13.8 Z"
        fill={G.crystal}
        stroke="#7fa9c4"
        strokeWidth={0.7}
      />
      <path d="M30 4 L30 23.6 M16.5 13.8 L35.2 19.9 M43.5 13.8 L24.8 19.9" stroke="rgb(255 255 255 / 0.8)" strokeWidth={0.5} />
      <path d="M26 30 H34 L37 66 H23 Z" fill={G.crystal} stroke="#7fa9c4" strokeWidth={0.7} />
      <path d="M28 33 L25.8 63" stroke="rgb(255 255 255 / 0.9)" strokeWidth={1.1} />
      <path d="M32.5 34 L34.3 62" stroke="rgb(70 120 150 / 0.35)" strokeWidth={0.8} />
      <path d="M20 66 H40 L42 78 H18 Z" fill={G.silver} stroke={EDGE} strokeWidth={0.6} />
      <path d="M15 78 H45 L46.5 92 H13.5 Z" fill="#1d2430" stroke={EDGE} strokeWidth={0.6} />
      <rect x="12.5" y="92" width="35" height="3.5" rx="1" fill={G.silverDark} />
    </g>
  );
}

function NllCup() {
  // The NLL Cup since 2024: a tall, twisting silver vessel with a jagged crown, on a black hexagonal base.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d="M12 80 L15 76 H45 L48 80 V92.5 H12 Z" fill="#1b1d22" />
      <path d="M12 80 L15 76 H45 L48 80 Z" fill="#3a3e45" />
      <path d="M21 80 V92.5 M39 80 V92.5" stroke="rgb(255 255 255 / 0.14)" strokeWidth={0.6} />
      <path d="M26.5 82.5 H33.5 V87 L30 90 L26.5 87 Z" fill={G.silver} />
      <path d="M25 76.5 C24 62 22 46 19 30 L13 6 L22 11 L30 3.5 L38 11 L47 6 L41 30 C38 46 36 62 35 76.5 Z" fill={G.silver} />
      <path d="M25 74 C27 55 21 38 22 11 M30 75 C31 50 34 30 30 3.5 M35 74 C33 55 39 38 38 11" stroke="rgb(0 0 0 / 0.2)" strokeWidth={0.7} fill="none" />
      <path d="M27 70 C28 52 24 36 24.5 15" stroke="rgb(255 255 255 / 0.8)" strokeWidth={1.2} fill="none" />
    </g>
  );
}

function CeblTrophy() {
  // A gold cup of interlocking facets, like a net, on a black base.
  return (
    <g stroke="rgb(90 60 10 / 0.45)" strokeWidth={0.5} strokeLinejoin="round">
      <path d="M19 64 H41 L43 92 H17 Z" fill="#1b1d22" />
      <rect x="18.6" y="64" width="22.8" height="3" fill={G.gold} />
      <rect x="16.5" y="91" width="27" height="3" rx="0.8" fill={G.goldDark} />
      <path d="M26 54 H34 L35 64 H25 Z" fill={G.goldDark} />
      <path d="M10.5 11 H49.5 L44.5 36 L36 54 H24 L15.5 36 Z" fill={G.gold} />
      <path
        d="M10.5 11 L36 54 M20.3 11 L41.4 44 M30 11 L44.5 36 M39.8 11 L47.7 20 M49.5 11 L24 54 M39.8 11 L18.6 44 M30 11 L15.5 36 M20.3 11 L12.3 20"
        stroke="rgb(110 70 10 / 0.5)"
        strokeWidth={0.6}
        fill="none"
      />
      <path d="M14 16 L20 34" stroke="rgb(255 245 200 / 0.8)" strokeWidth={1.1} />
      <ellipse cx="30" cy="11" rx="19.5" ry="3.2" fill={G.goldDark} />
      <ellipse cx="30" cy="11.2" rx="16.5" ry="2" fill="#6e4a0a" opacity={0.6} />
    </g>
  );
}

function WalterCup() {
  // Sterling silver: a broad bowl ringed with Ws, held up by angled blades on a round base banded in black.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d="M9 80 V87.5 C9 92 51 92 51 87.5 V80 Z" fill="#1d2027" />
      <ellipse cx="30" cy="80" rx="21" ry="4.6" fill={G.silver} />
      <path d="M11.5 87 C20 90.5 40 90.5 48.5 87" stroke={G.silver} strokeWidth={0.9} fill="none" />
      <path d="M26.5 80 L11 24 L14.6 22.8 L31 79.5 Z" fill={G.silver} />
      <path d="M33 80 L44 5 L47.6 5.8 L37.2 80 Z" fill={G.silver} />
      <path d="M29.4 80 L33.6 44 L35.6 44.4 L33 80 Z" fill={G.silverDark} />
      <g transform="rotate(-9 30 27)">
        <path d="M10.5 21 C10.5 31.5 18.5 36.5 30 36.5 C41.5 36.5 49.5 31.5 49.5 21 Z" fill={G.silver} />
        <path d="M13.5 25.5 l2.6 4.2 2.6 -4.2 2.6 4.2 2.6 -4.2 2.6 4.2 2.6 -4.2 2.6 4.2 2.6 -4.2 2.6 4.2 2.6 -4.2 2.6 4.2 2.6 -4.2" stroke="rgb(60 66 72 / 0.45)" strokeWidth={0.6} fill="none" />
        <ellipse cx="30" cy="21" rx="19.5" ry="3.7" fill={G.silverDark} />
        <ellipse cx="30" cy="21.2" rx="16.5" ry="2.4" fill="#5f666d" opacity={0.55} />
      </g>
    </g>
  );
}

function WnbaTrophy() {
  // A silver ball resting on a slim silver net, on a tall round base.
  return (
    <g stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round">
      <path d="M15 72 H45 L47 92 H13 Z" fill={G.silver} />
      <ellipse cx="30" cy="72" rx="15" ry="2.6" fill={G.silverDark} />
      <path d="M14 82 H46" stroke="rgb(234 88 12 / 0.75)" strokeWidth={1.4} />
      <rect x="12.5" y="91.5" width="35" height="3" rx="0.8" fill={G.silverDark} />
      <path d="M21 28 C21.5 42 25 56 27 70 H33 C35 56 38.5 42 39 28 Z" fill={G.silver} />
      <path d="M22 31 L31.5 69 M26 29.5 L34.3 60 M34 29.5 L25.7 60 M38 31 L28.5 69" stroke="rgb(60 66 72 / 0.35)" strokeWidth={0.55} fill="none" />
      <circle cx="30" cy="17" r="10.6" fill={G.silver} />
      <g stroke="rgb(60 66 72 / 0.5)" strokeWidth={0.6} fill="none">
        <path d="M19.4 17 H40.6" />
        <path d="M30 6.4 V27.6" />
        <path d="M22.6 9.2 C26.8 12.8 26.8 21.2 22.6 24.8" />
        <path d="M37.4 9.2 C33.2 12.8 33.2 21.2 37.4 24.8" />
      </g>
      <path d="M21 28 A9 1.8 0 0 0 39 28" fill="none" stroke={G.silverDark} strokeWidth={1.2} />
    </g>
  );
}

function MathesonCup() {
  // A slim silver cup on a long stem, standing on a light wooden base.
  return (
    <g stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round">
      <path d="M17 8 C17 24 22 32 30 32 C38 32 43 24 43 8 Z" fill={G.silver} />
      <ellipse cx="30" cy="8" rx="13" ry="2.5" fill={G.silverDark} />
      <path d="M21 13 C22 22 25 28 29 30" stroke="rgb(255 255 255 / 0.7)" strokeWidth={1.2} fill="none" />
      <circle cx="30" cy="19" r="4.2" fill="none" stroke="rgb(60 66 72 / 0.45)" strokeWidth={0.7} />
      <path d="M28.5 32 H31.5 L32.5 62 H27.5 Z" fill={G.silverDark} />
      <ellipse cx="30" cy="62" rx="7" ry="2" fill={G.silver} />
      <path d="M17 64 H43 L44.5 92 H15.5 Z" fill="#b98a5a" />
      <path d="M17 64 H43 L44.5 92 H15.5 Z" fill="url(#tr-wood)" opacity={0.35} />
      <rect x="21" y="72" width="18" height="7" rx="0.8" fill={G.silver} opacity={0.9} />
      <rect x="13.5" y="92" width="33" height="3.5" rx="1" fill={G.silverDark} />
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

export function TrophyArt({league, height = 64, isMuted = false, title}: {league: LeagueId; height?: number; isMuted?: boolean; title?: string}) {
  const Art = ART[league];
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
      <Art />
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
      <div className="flex items-center gap-3 rounded-xl bg-[var(--color-background-muted)] p-3">
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
    <div className="rounded-xl bg-[var(--color-background-muted)] p-3">
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
    <div className="rounded-xl bg-[var(--color-background-muted)] p-3">
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

/** A compact shelf summarising titles by league, e.g. for a city. */
export function TrophyShelf({teams}: {teams: Team[]}) {
  const totals = LEAGUE_ORDER.map((l) => ({league: l, count: teams.filter((t) => t.league === l).reduce((n, t) => n + t.championships.length, 0)})).filter(
    (t) => t.count > 0,
  );
  if (totals.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-end gap-x-4 gap-y-2 rounded-xl bg-[var(--color-background-muted)] px-3 pt-3 pb-2">
      {totals.map(({league, count}) => (
        <li key={league} className="flex items-end gap-1.5" aria-label={`${count} ${TROPHY_NAME[league]}${count === 1 ? '' : 's'}`}>
          <TrophyArt league={league} height={52} />
          <span className="pb-1 text-lg leading-none font-bold tabular-nums text-primary" aria-hidden>
            ×{count}
          </span>
        </li>
      ))}
    </ul>
  );
}
