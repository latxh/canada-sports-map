import {useEffect, useMemo, useRef} from 'react';
import type {ZoomTransform} from 'd3-zoom';

/** Screen pixels per dither cell: big enough to read as a pattern, small enough for clean borders. */
const CELL = 5;
/** 4×4 Bayer matrix, as thresholds in (0, 1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export interface Site {
  /** Position in unzoomed (k = 1) map pixels. */
  x: number;
  y: number;
  rgb: [number, number, number];
}

interface Field {
  gw: number;
  gh: number;
  /** Nearest site per cell, or 65535 outside Canada. */
  nearest: Uint16Array;
  /** Distance to the nearest site, in screen pixels. */
  d1: Float32Array;
  /** Gap to the second-nearest site, in screen pixels (small near a border). */
  edge: Float32Array;
  k: number;
}

/**
 * Canada coloured by its closest team: a nearest-site field (Voronoi in map space) drawn as
 * an ordered-dither pattern. Ripples travel outward from every team's city and the dots
 * twinkle, so the map breathes; with reduced motion it is drawn once, still.
 */
export function ClosestLayer({
  width,
  height,
  transform,
  sites,
  provinces,
  lakes,
}: {
  width: number;
  height: number;
  transform: ZoomTransform;
  sites: Site[];
  /** SVG path data, in k = 1 map pixels. */
  provinces: string[];
  lakes: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<Field | null>(null);
  const drawRef = useRef<(t: number) => void>(() => {});
  const reducedMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const provincePaths = useMemo(() => provinces.map((d) => new Path2D(d)), [provinces]);
  const lakePaths = useMemo(() => lakes.map((d) => new Path2D(d)), [lakes]);
  const gw = Math.ceil(width / CELL);
  const gh = Math.ceil(height / CELL);

  // Rebuild the field when the view or the teams change.
  useEffect(() => {
    if (gw <= 0 || gh <= 0) return;
    const mask = document.createElement('canvas');
    mask.width = gw;
    mask.height = gh;
    const mctx = mask.getContext('2d', {willReadFrequently: true});
    if (!mctx) return;
    mctx.setTransform(transform.k / CELL, 0, 0, transform.k / CELL, transform.x / CELL, transform.y / CELL);
    mctx.fillStyle = '#000';
    for (const p of provincePaths) mctx.fill(p);
    mctx.globalCompositeOperation = 'destination-out';
    for (const p of lakePaths) mctx.fill(p);
    const alpha = mctx.getImageData(0, 0, gw, gh).data;

    const sx = sites.map((s) => transform.applyX(s.x));
    const sy = sites.map((s) => transform.applyY(s.y));
    const n = gw * gh;
    const nearest = new Uint16Array(n).fill(65535);
    const d1 = new Float32Array(n);
    const edge = new Float32Array(n);
    for (let j = 0; j < gh; j++) {
      const cy = (j + 0.5) * CELL;
      for (let i = 0; i < gw; i++) {
        const c = j * gw + i;
        if (alpha[c * 4 + 3] < 128 || sites.length === 0) continue;
        const cx = (i + 0.5) * CELL;
        let best = Infinity;
        let second = Infinity;
        let bi = 0;
        for (let s = 0; s < sites.length; s++) {
          const dx = sx[s] - cx;
          const dy = sy[s] - cy;
          const d = dx * dx + dy * dy;
          if (d < best) {
            second = best;
            best = d;
            bi = s;
          } else if (d < second) second = d;
        }
        nearest[c] = bi;
        d1[c] = Math.sqrt(best);
        edge[c] = sites.length > 1 ? Math.sqrt(second) - d1[c] : 1e6;
      }
    }
    fieldRef.current = {gw, gh, nearest, d1, edge, k: transform.k};
    if (reducedMotion) drawRef.current(0);
  }, [transform, sites, provincePaths, lakePaths, gw, gh, reducedMotion]);

  // Draw one frame of the dither at time t (seconds).
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let image: ImageData | null = null;
    drawRef.current = (t: number) => {
      const f = fieldRef.current;
      if (!f) return;
      if (canvas.width !== f.gw || canvas.height !== f.gh) {
        canvas.width = f.gw;
        canvas.height = f.gh;
        image = null;
      }
      image ??= ctx.createImageData(f.gw, f.gh);
      const px = image.data;
      const tick = Math.floor(t * 5);
      for (let j = 0; j < f.gh; j++) {
        for (let i = 0; i < f.gw; i++) {
          const c = j * f.gw + i;
          const o = c * 4;
          const s = f.nearest[c];
          if (s === 65535) {
            px[o + 3] = 0;
            continue;
          }
          const d = f.d1[c];
          // Denser near the city, fading with distance (in unzoomed pixels so zoom keeps the look).
          const near = Math.exp(-d / f.k / 110);
          // Ripples moving outward from each city.
          const wave = 0.5 + 0.5 * Math.sin(d * 0.075 - t * 2.4);
          // A soft gap along each border.
          const border = Math.min(1, f.edge[c] / 9);
          // A little twinkle, re-rolled a few times a second.
          const h = ((i * 73856093) ^ (j * 19349663) ^ (tick * 83492791)) >>> 0;
          const twinkle = ((h % 1000) / 1000 - 0.5) * 0.12;
          const intensity = (0.16 + 0.5 * near + 0.24 * wave + twinkle) * border;
          if (intensity > BAYER[(j & 3) * 4 + (i & 3)]) {
            const rgb = sites[s].rgb;
            px[o] = rgb[0];
            px[o + 1] = rgb[1];
            px[o + 2] = rgb[2];
            px[o + 3] = 215;
          } else {
            px[o + 3] = 0;
          }
        }
      }
      ctx.putImageData(image, 0, 0);
    };
    drawRef.current(0);
    if (reducedMotion) return;
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 45) return; // ~22 fps is plenty for a dither and easy on batteries
      last = now;
      drawRef.current((now - start) / 1000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sites, reducedMotion]);

  return (
    <foreignObject x={0} y={0} width={width} height={height} aria-hidden="true" pointerEvents="none">
      <canvas ref={canvasRef} className="closest-layer" style={{width: gw * CELL, height: gh * CELL}} />
    </foreignObject>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rr ? (gg - bb) / d + (gg < bb ? 6 : 0) : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
  return [h * 60, sat, l];
}

function hslToRgb(h: number, sat: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * The team's most colourful colour (so navy-and-orange teams read as orange, not grey),
 * with dark shades lifted in lightness, keeping their hue, so they show on the map.
 */
export function siteColor(colors: string[]): [number, number, number] {
  const chroma = (hex: string) => {
    const [r, g, b] = hexToRgb(hex);
    return Math.max(r, g, b) - Math.min(r, g, b);
  };
  const best = colors.reduce((a, b) => (chroma(b) > chroma(a) + 24 ? b : a), colors[0]);
  const [h, sat, l] = rgbToHsl(hexToRgb(best));
  if (sat < 0.12) return hslToRgb(h, sat, Math.min(0.62, Math.max(0.38, l)));
  return hslToRgb(h, Math.max(sat, 0.55), Math.min(0.6, Math.max(0.42, l)));
}
