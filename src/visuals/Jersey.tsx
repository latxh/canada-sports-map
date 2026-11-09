import {useId} from 'react';
import type {IdentityEra, JerseyPattern, Sport} from '../data';
import {luminance, readableOn} from '../lib/color';

/** Silhouettes on a 120×130 canvas. Original drawings. */
const BODY: Record<Sport, string> = {
  hockey:
    'M38 8 C46 14 74 14 82 8 L106 22 C112 26 116 34 117 44 L119 74 L100 78 L97 52 L96 122 C80 126 40 126 24 122 L23 52 L20 78 L1 74 L3 44 C4 34 8 26 14 22 Z',
  basketball:
    'M40 6 C44 22 76 22 80 6 L92 8 C92 22 98 32 104 36 L104 122 C84 126 36 126 16 122 L16 36 C22 32 28 22 28 8 Z',
  baseball:
    'M42 8 C48 16 72 16 78 8 L104 18 L118 46 L100 56 L94 46 L94 122 C78 126 42 126 26 122 L26 46 L20 56 L2 46 L16 18 Z',
  football:
    'M42 8 C48 18 72 18 78 8 L108 16 C114 18 118 28 118 36 L118 56 L98 58 L96 50 L96 122 C80 126 40 126 24 122 L24 50 L22 58 L2 56 L2 36 C2 28 6 18 12 16 Z',
  soccer:
    'M44 8 C50 14 70 14 76 8 L102 16 L116 44 L100 54 L94 44 L94 122 C78 126 42 126 26 122 L26 44 L20 54 L4 44 L18 16 Z',
};

const COLLAR: Record<Sport, string> = {
  hockey: 'M38 8 C46 14 74 14 82 8 L76 20 C66 26 54 26 44 20 Z',
  basketball: 'M40 6 C44 22 76 22 80 6 L76 6 C72 18 48 18 44 6 Z',
  baseball: 'M42 8 C48 16 72 16 78 8 L60 32 Z',
  football: 'M42 8 C48 18 72 18 78 8 L72 8 C68 14 52 14 48 8 Z',
  soccer: 'M44 8 C50 14 70 14 76 8 L68 18 L60 22 L52 18 Z',
};

interface Props {
  era: IdentityEra;
  sport: Sport;
  variant: 'home' | 'away';
  size?: number;
}

export function Jersey({era, sport, variant, size = 96}: Props) {
  const clipId = useId();
  const [primary, secondary = '#ffffff', tertiary] = era.colors;
  const isLightPrimary = luminance(primary) > 0.7;
  const body = variant === 'home' ? primary : isLightPrimary ? secondary : '#f7f7f5';
  const trim = variant === 'home' ? (secondary.toLowerCase() === primary.toLowerCase() ? '#ffffff' : secondary) : isLightPrimary ? primary : primary;
  const accent = tertiary ?? (variant === 'home' ? '#ffffff' : secondary);
  const ink = readableOn(body, era.colors);
  const label = `${variant === 'home' ? 'Home' : 'Away'} uniform illustration, ${era.jersey.pattern.replace('-', ' ')} pattern`;

  return (
    <svg width={size} height={(size * 130) / 120} viewBox="0 0 120 130" role="img" aria-label={label}>
      <defs>
        <clipPath id={clipId}>
          <path d={BODY[sport]} />
        </clipPath>
      </defs>
      <path d={BODY[sport]} fill={body} />
      <g clipPath={`url(#${clipId})`}>
        <Pattern pattern={era.jersey.pattern} sport={sport} trim={trim} accent={accent} />
        <path d={COLLAR[sport]} fill={trim} />
      </g>
      <text
        x="60"
        y={sport === 'basketball' ? 62 : 58}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={900}
        fontSize={era.mark.length > 3 ? 16 : 20}
        fill={ink}
        stroke={trim === ink ? 'none' : trim}
        strokeWidth={0.8}
        paintOrder="stroke">
        {era.mark}
      </text>
      <text x="60" y="92" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight={800} fontSize={18} fill={ink} opacity={0.9}>
        {variant === 'home' ? '19' : '91'}
      </text>
      <path d={BODY[sport]} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1.2} />
    </svg>
  );
}

function Pattern({pattern, sport, trim, accent}: {pattern: JerseyPattern; sport: Sport; trim: string; accent: string}) {
  const sleeved = sport !== 'basketball';
  switch (pattern) {
    case 'plain':
      return null;
    case 'hem-stripes':
      return (
        <g>
          <rect x="0" y="100" width="120" height="7" fill={trim} />
          <rect x="0" y="110" width="120" height="4" fill={accent} />
          {sleeved && (
            <>
              <rect x="0" y="58" width="26" height="6" fill={trim} />
              <rect x="94" y="58" width="26" height="6" fill={trim} />
              <rect x="0" y="66" width="26" height="3" fill={accent} />
              <rect x="94" y="66" width="26" height="3" fill={accent} />
            </>
          )}
        </g>
      );
    case 'chest-stripe':
      return (
        <g>
          <rect x="0" y="40" width="120" height="4" fill={accent} />
          <rect x="0" y="44" width="120" height="26" fill={trim} />
          <rect x="0" y="70" width="120" height="4" fill={accent} />
        </g>
      );
    case 'sash':
      return <path d="M10 0 L34 0 L120 110 L120 134 Z" fill={trim} />;
    case 'hoops':
      return (
        <g>
          {[20, 44, 68, 92, 116].map((y) => (
            <rect key={y} x="0" y={y} width="120" height="12" fill={trim} />
          ))}
        </g>
      );
    case 'pinstripes':
      return (
        <g opacity={0.8}>
          {Array.from({length: 15}, (_, i) => (
            <rect key={i} x={4 + i * 8} y="0" width="1.4" height="130" fill={trim} />
          ))}
        </g>
      );
    case 'yoke':
      return <path d="M0 0 H120 V30 C90 40 30 40 0 30 Z" fill={trim} />;
    case 'shoulder-stripes':
      return (
        <g>
          <path d="M0 26 L30 14 L32 22 L2 34 Z" fill={trim} />
          <path d="M120 26 L90 14 L88 22 L118 34 Z" fill={trim} />
          <path d="M0 36 L33 24 L34 28 L1 40 Z" fill={accent} />
          <path d="M120 36 L87 24 L86 28 L119 40 Z" fill={accent} />
          <rect x="0" y="112" width="120" height="5" fill={trim} />
        </g>
      );
    case 'side-panels':
      return (
        <g>
          <path d="M0 40 L30 40 L36 130 L0 130 Z" fill={trim} />
          <path d="M120 40 L90 40 L84 130 L120 130 Z" fill={trim} />
          <path d="M30 40 L33 40 L39 130 L36 130 Z" fill={accent} />
          <path d="M90 40 L87 40 L81 130 L84 130 Z" fill={accent} />
        </g>
      );
    case 'vertical-stripes':
      return (
        <g>
          {[14, 40, 66, 92].map((x) => (
            <rect key={x} x={x} y="0" width="13" height="130" fill={trim} />
          ))}
        </g>
      );
    case 'chevron':
      return (
        <g>
          <path d="M0 26 L60 70 L120 26 L120 44 L60 88 L0 44 Z" fill={trim} />
          <path d="M0 48 L60 92 L120 48 L120 52 L60 96 L0 52 Z" fill={accent} />
        </g>
      );
  }
}
