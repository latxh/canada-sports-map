/**
 * Gradients shared by every trophy illustration, defined once at the app root (and on preview
 * cards) so each trophy can reference them. Kept apart from Trophies.tsx, which only the
 * panels need.
 */
export const G = {
  silver: 'url(#tr-silver)',
  silverDark: 'url(#tr-silver-dark)',
  gold: 'url(#tr-gold)',
  goldDark: 'url(#tr-gold-dark)',
  wood: 'url(#tr-wood)',
  crystal: 'url(#tr-crystal)',
  sand: 'url(#tr-sand)',
  chrome: 'url(#tr-chrome)',
  maple: 'url(#tr-maple)',
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
        <linearGradient id="tr-sand" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8a7350" />
          <stop offset="0.3" stopColor="#d8c39c" />
          <stop offset="0.6" stopColor="#b59b72" />
          <stop offset="1" stopColor="#7c6646" />
        </linearGradient>
        <radialGradient id="tr-chrome" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.18" stopColor="#c9ced3" />
          <stop offset="0.55" stopColor="#6c737a" />
          <stop offset="0.85" stopColor="#3c4146" />
          <stop offset="1" stopColor="#8c939a" />
        </radialGradient>
        <linearGradient id="tr-maple" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e9d8b6" />
          <stop offset="0.5" stopColor="#d9c29a" />
          <stop offset="1" stopColor="#b99b6c" />
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
