import type {SVGProps} from 'react';

/** Small stroke icons for glyphs the Astryx semantic set doesn't include. Pass to <Icon icon={…} />. */
function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const FitIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </svg>
);

export const CubeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2 3 7v10l9 5 9-5V7z" />
    <path d="m3 7 9 5 9-5M12 12v10" />
  </svg>
);

export const ExpandIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

export const TrophyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
  </svg>
);

export const PinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const StadiumIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="9" rx="9" ry="4" />
    <path d="M3 9v6c0 2.2 4 4 9 4s9-1.8 9-4V9" />
    <ellipse cx="12" cy="9" rx="4.5" ry="1.8" />
  </svg>
);

export const RotateIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const MapleLeafIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path fill="currentColor" d={MAPLE_LEAF_PATH_24} />
  </svg>
);

/** A simplified 11-point maple leaf on a 24×24 grid (original drawing). */
export const MAPLE_LEAF_PATH_24 =
  'M12 1.5l1.7 3.4 1.9-1-.6 4.9 2.6-2.8.6 1.6 2.9-.6-.9 3.2 1.3.6-4.4 3.8.5 1.7-4.3-.7.1 4.9h-1.4l.1-4.9-4.3.7.5-1.7L3.8 11l1.3-.6-.9-3.2 2.9.6.6-1.6L10.3 9l-.6-4.9 1.9 1z';

export const MonitorIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

export const ShareIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);

export const InfoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const ListIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

export const ExternalIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

/** The Canadian flag (2:1), drawn with the same simplified maple leaf. */
export function CanadaFlag({width = 26, title}: {width?: number; title?: string}) {
  return (
    <svg
      viewBox="0 0 48 24"
      width={width}
      height={width / 2}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="shrink-0">
      <rect x="0.5" y="0.5" width="47" height="23" rx="2.5" fill="#ffffff" stroke="rgb(0 0 0 / 0.12)" />
      <path d="M3 0.5 H12 V23.5 H3 A2.5 2.5 0 0 1 0.5 21 V3 A2.5 2.5 0 0 1 3 0.5 Z" fill="#d52b1e" />
      <path d="M36 0.5 H45 A2.5 2.5 0 0 1 47.5 3 V21 A2.5 2.5 0 0 1 45 23.5 H36 Z" fill="#d52b1e" />
      <path d={MAPLE_LEAF_PATH_24} fill="#d52b1e" transform="translate(15.6 2.4) scale(0.7)" />
    </svg>
  );
}
