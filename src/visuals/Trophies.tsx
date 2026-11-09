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
  // Bowl, collar, then the stacked barrel of bands that widens to the base.
  return (
    <g stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round">
      <path d="M16 7 C16 16 22 21 30 21 C38 21 44 16 44 7 Z" fill={G.silver} />
      <ellipse cx="30" cy="7" rx="14" ry="2.6" fill={G.silverDark} />
      <ellipse cx="30" cy="7" rx="11.5" ry="1.7" fill="#5f666d" opacity={0.6} />
      <rect x="26.5" y="21" width="7" height="4" fill={G.silverDark} />
      <path d="M22 25 H38 L39 29 H21 Z" fill={G.silver} />
      <path d="M21 29 H39 V39 H21 Z" fill={G.silver} />
      <Bands x0={21} x1={39} y0={29} y1={39} n={3} />
      <path d="M19.5 39 H40.5 V51 H19.5 Z" fill={G.silver} />
      <Bands x0={19.5} x1={40.5} y0={39} y1={51} n={4} />
      <path d="M18 51 H42 V64 H18 Z" fill={G.silver} />
      <Bands x0={18} x1={42} y0={51} y1={64} n={4} />
      <path d="M16.5 64 H43.5 V78 H16.5 Z" fill={G.silver} />
      <Bands x0={16.5} x1={43.5} y0={64} y1={78} n={5} />
      <path d="M15 78 H45 L46.5 92 H13.5 Z" fill={G.silver} />
      <Bands x0={14.5} x1={45.5} y0={78} y1={92} n={5} />
      <rect x="12.5" y="92" width="35" height="3.5" rx="1" fill={G.silverDark} />
    </g>
  );
}

function LarryOBrien() {
  // Gold ball dropping into a net, on a tapered gold base.
  return (
    <g stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round">
      <path d="M19 33 L23.5 58 H36.5 L41 33 Z" fill={G.gold} />
      <g stroke="rgb(90 60 10 / 0.45)" strokeWidth={0.5} fill="none">
        <path d="M21 36 L33 57 M25 35 L36 52 M29 34 L38.5 46 M33 34 L40 40 M39 36 L27 57 M35 35 L24 52 M31 34 L21.5 46 M27 34 L20 40" />
      </g>
      <ellipse cx="30" cy="33" rx="12" ry="2.4" fill={G.goldDark} />
      <circle cx="30" cy="20" r="11" fill={G.gold} />
      <g stroke="rgb(90 60 10 / 0.55)" strokeWidth={0.7} fill="none">
        <path d="M19 20 H41" />
        <path d="M30 9 V31" />
        <path d="M22.5 12 C27 16 27 24 22.5 28" />
        <path d="M37.5 12 C33 16 33 24 37.5 28" />
      </g>
      <path d="M25 58 H35 L36 72 H24 Z" fill={G.gold} />
      <path d="M22 72 H38 L41 84 H19 Z" fill={G.gold} />
      <rect x="17" y="84" width="26" height="9" rx="1.2" fill={G.goldDark} />
      <rect x="15.5" y="93" width="29" height="2.8" rx="1" fill={G.gold} />
    </g>
  );
}

function CommissionersTrophy() {
  // A ring of gold flags around a silver baseball with gold latitude lines.
  const flags = Array.from({length: 14}, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return {x: 30 + Math.sin(a) * 15.5, depth: Math.cos(a), side: Math.sin(a) >= 0 ? 1 : -1};
  });
  const flag = (f: (typeof flags)[number], i: number) => {
    const baseY = 80 + f.depth * 2.6;
    const topY = 10 + f.depth * 2.6;
    const fx = f.x + (f.side > 0 ? 0 : -6.5);
    return (
      <g key={i} opacity={f.depth < 0 ? 0.75 : 1}>
        {/* A gradient on a zero-width line has no bounding box, so poles are thin rects. */}
        <rect x={f.x - 0.55} y={topY} width={1.1} height={baseY - topY} fill={f.depth < 0 ? '#9c7420' : '#c99a32'} />
        <path d={`M${fx} ${topY} h6.5 l-1.4 2.6 l1.4 2.6 h-6.5 Z`} fill={G.gold} stroke={EDGE} strokeWidth={0.4} />
      </g>
    );
  };
  return (
    <g strokeLinejoin="round">
      {flags.map((f, i) => (f.depth < 0 ? flag(f, i) : null))}
      <circle cx="30" cy="46" r="10" fill={G.silver} stroke={EDGE} strokeWidth={0.6} />
      <g stroke="#c9952a" strokeWidth={0.8} fill="none">
        <ellipse cx="30" cy="46" rx="10" ry="3.4" />
        <ellipse cx="30" cy="46" rx="3.6" ry="10" />
        <path d="M21 41 H39 M21 51 H39" />
      </g>
      <rect x="28.5" y="56" width="3" height="20" fill={G.goldDark} />
      {flags.map((f, i) => (f.depth >= 0 ? flag(f, i) : null))}
      <path d="M12.5 80 H47.5 L45 90 H15 Z" fill={G.gold} stroke={EDGE} strokeWidth={0.6} />
      <rect x="13" y="90" width="34" height="5.5" rx="1.2" fill={G.goldDark} stroke={EDGE} strokeWidth={0.6} />
    </g>
  );
}

function MlsCup() {
  // Philip F. Anschutz Trophy: a slim silver body holding a gold ball.
  return (
    <g stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round">
      <path d="M22 24 C23 30 26 33 30 33 C34 33 37 30 38 24 Z" fill={G.silver} />
      <circle cx="30" cy="16" r="9.5" fill={G.gold} />
      <g fill="#8a5c0e" opacity={0.55} stroke="none">
        <path d="M30 12 l3.2 2.3 -1.2 3.7 h-4 l-1.2 -3.7 Z" />
        <path d="M21.6 15 l2.6 -1.4 1 3 -1.8 2.6 -1.9 -0.5 Z" />
        <path d="M38.4 15 l-2.6 -1.4 -1 3 1.8 2.6 1.9 -0.5 Z" />
      </g>
      <path d="M27 33 H33 C33 45 37 56 39 72 H21 C23 56 27 45 27 33 Z" fill={G.silver} />
      <path d="M29 36 C28.5 48 26 58 24.5 70" stroke="rgb(255 255 255 / 0.7)" strokeWidth={1.2} fill="none" />
      <rect x="18" y="72" width="24" height="6" rx="1" fill={G.gold} />
      <path d="M16 78 H44 L45.5 92 H14.5 Z" fill={G.silverDark} />
      <rect x="13" y="92" width="34" height="3.5" rx="1" fill={G.silver} />
    </g>
  );
}

function GreyCup() {
  // Silver cup on a short stem, standing on a tall wooden plinth with name plates.
  const plates = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) plates.push(<rect key={`${r}-${c}`} x={18.5 + c * 8} y={62 + r * 7} width={6} height={4.2} rx={0.6} fill={G.gold} opacity={0.9} />);
  return (
    <g stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round">
      <path d="M17 9 C17 26 23 35 30 35 C37 35 43 26 43 9 Z" fill={G.silver} />
      <ellipse cx="30" cy="9" rx="13" ry="2.6" fill={G.silverDark} />
      <path d="M21 16 C22 25 25 31 29 33" stroke="rgb(255 255 255 / 0.65)" strokeWidth={1.2} fill="none" />
      <path d="M27.5 35 H32.5 L33.5 44 H26.5 Z" fill={G.silverDark} />
      <path d="M21 44 H39 L41 50 H19 Z" fill={G.silver} />
      <path d="M16 50 H44 V56 H16 Z" fill={G.silverDark} />
      <path d="M15 56 H45 L46.5 92 H13.5 Z" fill={G.wood} />
      {plates}
      <rect x="12.5" y="92" width="35" height="3.5" rx="1" fill={G.wood} />
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

const ART: Record<LeagueId, () => ReactNode> = {
  NHL: StanleyCup,
  NBA: LarryOBrien,
  MLB: CommissionersTrophy,
  MLS: MlsCup,
  CFL: GreyCup,
  CPL: NorthStarCup,
};

/** The trophy each league's champion lifts, by its proper name. */
export const TROPHY_NAME: Record<LeagueId, string> = {
  NHL: 'Stanley Cup',
  NBA: 'Larry O’Brien Trophy',
  MLB: 'Commissioner’s Trophy',
  MLS: 'Philip F. Anschutz Trophy',
  CFL: 'Grey Cup',
  CPL: 'North Star Cup',
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
