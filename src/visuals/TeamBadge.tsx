import type {BadgeShape, IdentityEra} from '../data';
import {readableOn} from '../lib/color';
import {MAPLE_LEAF_PATH_24} from '../components/icons';

/**
 * Original badge illustration in an era's team colours. This is NOT the team's
 * logo; it is a generic mark so the identity timeline reads visually without
 * copying trademarked artwork.
 */
export function TeamBadge({era, size = 48, title}: {era: IdentityEra; size?: number; title?: string}) {
  const [primary, secondary = '#ffffff', tertiary] = era.colors;
  const ink = readableOn(primary, era.colors);
  const trim = tertiary && tertiary.toLowerCase() !== ink.toLowerCase() ? tertiary : secondary;
  const mark = era.mark;
  const fontSize = mark.length <= 1 ? 46 : mark.length === 2 ? 36 : mark.length === 3 ? 27 : 21;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title ?? `Illustrated badge, ${era.from}${era.to ? `–${era.to}` : ''}`}>
      <BadgeShapePath shape={era.badge} fill={primary} stroke={trim === primary ? ink : trim} />
      {era.badge === 'leaf' ? null : (
        <text
          x="50"
          y={era.badge === 'shield' ? 50 : era.badge === 'pennant' ? 47 : 52}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontWeight={800}
          fontSize={fontSize}
          letterSpacing={mark.length > 2 ? -1 : 0}
          fill={ink}>
          {mark}
        </text>
      )}
    </svg>
  );
}

function BadgeShapePath({shape, fill, stroke}: {shape: BadgeShape; fill: string; stroke: string}) {
  const common = {fill, stroke, strokeWidth: 5, strokeLinejoin: 'round' as const};
  switch (shape) {
    case 'circle':
      return (
        <>
          <circle cx="50" cy="50" r="45" {...common} />
          <circle cx="50" cy="50" r="37" fill="none" stroke={stroke} strokeWidth={1.5} opacity={0.6} />
        </>
      );
    case 'oval':
      return <ellipse cx="50" cy="50" rx="46" ry="36" {...common} />;
    case 'shield':
      return <path d="M50 5 L90 16 V48 C90 72 72 88 50 96 C28 88 10 72 10 48 V16 Z" {...common} />;
    case 'diamond':
      return <path d="M50 4 L96 50 L50 96 L4 50 Z" {...common} />;
    case 'hexagon':
      return <path d="M50 4 L91 27 V73 L50 96 L9 73 V27 Z" {...common} />;
    case 'pennant':
      return <path d="M8 18 H92 L80 50 L92 82 H8 Z" {...common} />;
    case 'wordmark':
      return <rect x="6" y="20" width="88" height="60" rx="12" {...common} />;
    case 'leaf':
      return (
        <g transform="translate(2 2) scale(4)">
          <path d={MAPLE_LEAF_PATH_24} fill={fill} stroke={stroke} strokeWidth={1.1} strokeLinejoin="round" />
        </g>
      );
  }
}
