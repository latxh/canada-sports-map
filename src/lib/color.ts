/** Relative luminance (WCAG) of a #rrggbb colour. */
export function luminance(hex: string): number {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Pick the palette colour (or black/white) that reads best on `background`. */
export function readableOn(background: string, palette: string[] = []): string {
  const candidates = [...palette.filter((c) => c.toLowerCase() !== background.toLowerCase()), '#ffffff', '#111111'];
  let best = candidates[0];
  let bestRatio = 0;
  for (const c of candidates) {
    const ratio = contrastRatio(background, c);
    // Prefer palette colours when they are comfortably legible.
    const score = palette.includes(c) && ratio >= 3 ? ratio + 3 : ratio;
    if (score > bestRatio) {
      best = c;
      bestRatio = score;
    }
  }
  return best;
}

export function mix(a: string, b: string, t: number): string {
  const pa = a.replace('#', '');
  const pb = b.replace('#', '');
  const out = [0, 2, 4].map((i) => {
    const ca = parseInt(pa.slice(i, i + 2), 16);
    const cb = parseInt(pb.slice(i, i + 2), 16);
    return Math.round(ca + (cb - ca) * t)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${out.join('')}`;
}
