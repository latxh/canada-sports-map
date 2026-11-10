import {useId} from 'react';
import type {IdentityEra, Sport} from '../data';
import {mix, readableOn} from '../lib/color';

interface Props {
  era: IdentityEra;
  sport: Sport;
  /** Width in px; height follows the surface's aspect ratio. */
  width?: number;
}

/**
 * Top-down illustration of the playing surface in an era's colours.
 * Proportions follow regulation dimensions (NHL rink, NBA court, CFL field,
 * FIFA pitch, MLB diamond); decoration is illustrative.
 */
export function PlayingSurface({era, sport, width = 280}: Props) {
  switch (sport) {
    case 'hockey':
      return <Rink era={era} width={width} />;
    case 'basketball':
      return <Court era={era} width={width} />;
    case 'football':
      return <CflField era={era} width={width} />;
    case 'soccer':
      return <Pitch era={era} width={width} />;
    case 'baseball':
      return <Diamond era={era} width={width} />;
    case 'lacrosse':
      return <BoxFloor era={era} width={width} />;
  }
}

function CentreMark({cx, cy, r, era}: {cx: number; cy: number; r: number; era: IdentityEra}) {
  const [primary, secondary = '#ffffff'] = era.colors;
  const ink = readableOn(primary, era.colors);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={primary} stroke={secondary} strokeWidth={r * 0.12} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-sans-serif, system-ui"
        fontWeight={900}
        fontSize={r * (era.mark.length > 2 ? 0.7 : 0.95)}
        fill={ink}>
        {era.mark}
      </text>
    </g>
  );
}

function Rink({era, width}: {era: IdentityEra; width: number}) {
  const [primary] = era.colors;
  const red = '#c8102e';
  const blue = '#0b4ea2';
  const circles = [
    [31, 20.5],
    [31, 64.5],
    [169, 20.5],
    [169, 64.5],
  ];
  return (
    <svg width={width} height={(width * 85) / 200} viewBox="-2 -2 204 89" role="img" aria-label="Rink illustration">
      <rect x="0" y="0" width="200" height="85" rx="28" fill="#f4f8fb" stroke={primary} strokeWidth="2.5" />
      <rect x="11" y="3" width="0.6" height="79" fill={red} />
      <rect x="188.4" y="3" width="0.6" height="79" fill={red} />
      <rect x="74" y="0" width="2" height="85" fill={blue} />
      <rect x="124" y="0" width="2" height="85" fill={blue} />
      <rect x="99" y="0" width="2" height="85" fill={red} />
      <circle cx="100" cy="42.5" r="15" fill="none" stroke={blue} strokeWidth="0.6" />
      <CentreMark cx={100} cy={42.5} r={9} era={era} />
      {circles.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="15" fill="none" stroke={red} strokeWidth="0.6" />
          <circle cx={x} cy={y} r="1" fill={red} />
        </g>
      ))}
      {[
        [11.6, 1],
        [188.4, -1],
      ].map(([x, dir]) => (
        <path key={x} d={`M ${x} 38.5 a 6 4 0 0 ${dir > 0 ? 0 : 1} 0 8`} fill="#8ecae6" stroke={red} strokeWidth="0.5" />
      ))}
    </svg>
  );
}

function Court({era, width}: {era: IdentityEra; width: number}) {
  const pid = useId();
  const [primary, secondary = '#ffffff'] = era.colors;
  const wood = '#d8a46a';
  const line = '#ffffff';
  return (
    <svg width={width} height={(width * 50) / 94} viewBox="-3 -3 100 56" role="img" aria-label="Court illustration">
      <defs>
        <pattern id={pid} width="94" height="2.4" patternUnits="userSpaceOnUse">
          <rect width="94" height="2.4" fill={wood} />
          <rect y="2.2" width="94" height="0.2" fill={mix(wood, '#000000', 0.12)} />
        </pattern>
      </defs>
      <rect x="-3" y="-3" width="100" height="56" fill={primary} />
      <rect x="0" y="0" width="94" height="50" fill={`url(#${pid})`} stroke={line} strokeWidth="0.4" />
      {/* keys */}
      <rect x="0" y="17" width="19" height="16" fill={mix(primary, wood, 0.15)} stroke={line} strokeWidth="0.3" />
      <rect x="75" y="17" width="19" height="16" fill={mix(primary, wood, 0.15)} stroke={line} strokeWidth="0.3" />
      <circle cx="19" cy="25" r="6" fill="none" stroke={line} strokeWidth="0.3" />
      <circle cx="75" cy="25" r="6" fill="none" stroke={line} strokeWidth="0.3" />
      {/* three-point lines */}
      <path d="M0 3 H14 A23.75 23.75 0 0 1 14 47 H0" fill="none" stroke={line} strokeWidth="0.35" />
      <path d="M94 3 H80 A23.75 23.75 0 0 0 80 47 H94" fill="none" stroke={line} strokeWidth="0.35" />
      <line x1="47" y1="0" x2="47" y2="50" stroke={line} strokeWidth="0.35" />
      <circle cx="47" cy="25" r="6" fill="none" stroke={secondary} strokeWidth="0.35" />
      <CentreMark cx={47} cy={25} r={4.6} era={era} />
      <circle cx="5.25" cy="25" r="0.75" fill="none" stroke="#ff7a00" strokeWidth="0.3" />
      <circle cx="88.75" cy="25" r="0.75" fill="none" stroke="#ff7a00" strokeWidth="0.3" />
    </svg>
  );
}

function CflField({era, width}: {era: IdentityEra; width: number}) {
  const [primary, secondary = '#ffffff'] = era.colors;
  const ink = readableOn(primary, era.colors);
  const turf = '#3f8f3a';
  // 110 yd field + two 20 yd end zones = 150 yd long, 65 yd wide.
  return (
    <svg width={width} height={(width * 65) / 150} viewBox="-2 -2 154 69" role="img" aria-label="CFL field illustration">
      <rect x="-2" y="-2" width="154" height="69" fill={mix(turf, '#000000', 0.25)} />
      {Array.from({length: 11}, (_, i) => (
        <rect key={i} x={20 + i * 10} y="0" width="10" height="65" fill={i % 2 ? turf : mix(turf, '#ffffff', 0.06)} />
      ))}
      <rect x="0" y="0" width="20" height="65" fill={primary} />
      <rect x="130" y="0" width="20" height="65" fill={primary} />
      {[0, 1].map((side) => (
        <text
          key={side}
          x={side ? 140 : 10}
          y="32.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="ui-sans-serif, system-ui"
          fontWeight={900}
          fontSize="9"
          fill={ink}
          transform={`rotate(${side ? 90 : -90} ${side ? 140 : 10} 32.5)`}>
          {era.mark}
        </text>
      ))}
      {Array.from({length: 12}, (_, i) => (
        <line key={i} x1={20 + i * 10} y1="0" x2={20 + i * 10} y2="65" stroke="#ffffff" strokeWidth={i === 0 || i === 11 ? 0.7 : 0.35} />
      ))}
      {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => (
        <text key={i} x={30 + i * 10} y="9" textAnchor="middle" fontSize="4" fontWeight={700} fill="#ffffff" opacity={0.85}>
          {n === 50 ? 'C' : n}
        </text>
      ))}
      <rect x="0" y="0" width="150" height="65" fill="none" stroke="#ffffff" strokeWidth="0.7" />
      <CentreMark cx={75} cy={32.5} r={7} era={era} />
      {/* goalposts on the goal lines */}
      <rect x="19.5" y="30" width="1" height="5" fill={secondary === '#ffffff' ? '#f2c500' : secondary} />
      <rect x="129.5" y="30" width="1" height="5" fill={secondary === '#ffffff' ? '#f2c500' : secondary} />
    </svg>
  );
}

function Pitch({era, width}: {era: IdentityEra; width: number}) {
  const grass = '#3e9a45';
  const [primary] = era.colors;
  return (
    <svg width={width} height={(width * 68) / 105} viewBox="-3 -3 111 74" role="img" aria-label="Pitch illustration">
      <rect x="-3" y="-3" width="111" height="74" fill={primary} />
      {Array.from({length: 14}, (_, i) => (
        <rect key={i} x={i * 7.5} y="0" width="7.5" height="68" fill={i % 2 ? grass : mix(grass, '#ffffff', 0.08)} />
      ))}
      <g fill="none" stroke="#ffffff" strokeWidth="0.45">
        <rect x="0" y="0" width="105" height="68" />
        <line x1="52.5" y1="0" x2="52.5" y2="68" />
        <circle cx="52.5" cy="34" r="9.15" />
        <rect x="0" y="13.84" width="16.5" height="40.32" />
        <rect x="88.5" y="13.84" width="16.5" height="40.32" />
        <rect x="0" y="24.84" width="5.5" height="18.32" />
        <rect x="99.5" y="24.84" width="5.5" height="18.32" />
        <path d="M16.5 26.7 A9.15 9.15 0 0 1 16.5 41.3" />
        <path d="M88.5 26.7 A9.15 9.15 0 0 0 88.5 41.3" />
      </g>
      <CentreMark cx={52.5} cy={34} r={5.5} era={era} />
    </svg>
  );
}

function Diamond({era, width}: {era: IdentityEra; width: number}) {
  const [primary] = era.colors;
  const grass = '#3f8f3a';
  const dirt = '#b9784a';
  return (
    <svg width={width} height={width * 0.8} viewBox="0 0 100 80" role="img" aria-label="Baseball diamond illustration">
      <rect width="100" height="80" fill={mix(grass, '#000000', 0.3)} />
      <path d="M50 76 L4 30 A65 65 0 0 1 96 30 Z" fill={grass} stroke={primary} strokeWidth="1.5" />
      <path d="M50 76 L26 52 A34 34 0 0 1 74 52 Z" fill={dirt} />
      <path d="M50 70 L36 56 L50 42 L64 56 Z" fill={grass} />
      <circle cx="50" cy="56" r="2.2" fill={dirt} />
      <g fill="#ffffff">
        <rect x="49" y="69" width="2" height="2" />
        <rect x="35" y="55" width="2" height="2" transform="rotate(45 36 56)" />
        <rect x="49" y="41" width="2" height="2" transform="rotate(45 50 42)" />
        <rect x="63" y="55" width="2" height="2" transform="rotate(45 64 56)" />
      </g>
      <line x1="50" y1="76" x2="4" y2="30" stroke="#ffffff" strokeWidth="0.4" />
      <line x1="50" y1="76" x2="96" y2="30" stroke="#ffffff" strokeWidth="0.4" />
      <CentreMark cx={50} cy={24} r={6} era={era} />
    </svg>
  );
}

/** Box lacrosse: turf laid over a hockey rink, with goal creases and a centre faceoff circle. */
function BoxFloor({era, width}: {era: IdentityEra; width: number}) {
  const [primary] = era.colors;
  const turf = '#2f7d3a';
  const line = '#ffffff';
  return (
    <svg width={width} height={(width * 85) / 200} viewBox="-2 -2 204 89" role="img" aria-label="Box lacrosse floor illustration">
      <rect x="0" y="0" width="200" height="85" rx="28" fill={turf} stroke={primary} strokeWidth="2.5" />
      <rect x="99" y="0" width="2" height="85" fill={line} opacity={0.85} />
      <rect x="62" y="0" width="1.2" height="85" fill={line} opacity={0.5} />
      <rect x="136.8" y="0" width="1.2" height="85" fill={line} opacity={0.5} />
      <circle cx="100" cy="42.5" r="15" fill="none" stroke={line} strokeWidth="0.8" />
      <CentreMark cx={100} cy={42.5} r={9} era={era} />
      {[22, 178].map((x) => (
        <g key={x}>
          <circle cx={x} cy={42.5} r="9" fill={mix(turf, '#ffffff', 0.12)} stroke={line} strokeWidth="0.8" />
          <rect x={x - 1.2} y={39.5} width="2.4" height="6" fill={line} />
        </g>
      ))}
    </svg>
  );
}
