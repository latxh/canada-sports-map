import {useEffect, useMemo, useRef} from 'react';
import type {ZoomTransform} from 'd3-zoom';

/** Screen pixels per dither cell: fine enough to read as texture, coarse enough to stay crisp. */
const CELL = 3;
/** 4×4 Bayer matrix, as thresholds in (0, 1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const NONE = 65535;

export interface Site {
  /** Position in unzoomed (k = 1) map pixels. */
  x: number;
  y: number;
  rgb: [number, number, number];
}

export interface Blob {
  /** Centre in unzoomed (k = 1) map pixels. */
  x: number;
  y: number;
  /** Visual radius in screen pixels at the current zoom. */
  r: number;
}

export type DitherMode =
  | {kind: 'closest'; sites: Site[]}
  | {kind: 'blobs'; blobs: Blob[]; rgb: [number, number, number]; sparkle?: boolean};

interface Field {
  gw: number;
  gh: number;
  /** Palette index per cell, or NONE where nothing is drawn. */
  color: Uint16Array;
  /** Resting density per cell, 0–1. */
  base: Float32Array;
  /** Distance (screen px) to the cell's source, for the outward ripples. */
  phase: Float32Array;
  palette: [number, number, number][];
  sparkle: boolean;
}

/**
 * An animated ordered-dither layer clipped to Canada's land. Two modes:
 * - closest: each cell takes the colour of its nearest site (a Voronoi map), dense near
 *   the city and falling off quickly with distance;
 * - blobs: soft discs of one colour (population, championships) whose cores are solid.
 * Ripples travel outward from every source and the dots twinkle; with reduced motion the
 * layer is drawn once, still.
 */
export function DitherLayer({
  width,
  height,
  transform,
  mode,
  provinces,
  lakes,
}: {
  width: number;
  height: number;
  transform: ZoomTransform;
  mode: DitherMode;
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

  // Rebuild the field when the view or the data change.
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
    const n = gw * gh;
    const color = new Uint16Array(n).fill(NONE);
    const base = new Float32Array(n);
    const phase = new Float32Array(n);

    if (mode.kind === 'closest') {
      const {sites} = mode;
      const sx = sites.map((s) => transform.applyX(s.x));
      const sy = sites.map((s) => transform.applyY(s.y));
      // Falloff in unzoomed pixels, so the look holds as you zoom.
      const reach = 34 * transform.k;
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
          const d1 = Math.sqrt(best);
          const edge = sites.length > 1 ? Math.sqrt(second) - d1 : 1e6;
          color[c] = bi;
          base[c] = (0.025 + 0.9 * Math.exp(-d1 / reach)) * Math.min(1, edge / 7);
          phase[c] = d1;
        }
      }
      fieldRef.current = {gw, gh, color, base, phase, palette: sites.map((s) => s.rgb), sparkle: false};
    } else {
      const strength = new Float32Array(n);
      for (const b of mode.blobs) {
        const bx = transform.applyX(b.x);
        const by = transform.applyY(b.y);
        const sigma = Math.max(2.2, b.r * 0.55);
        const reach = sigma * 3;
        const i0 = Math.max(0, Math.floor((bx - reach) / CELL));
        const i1 = Math.min(gw - 1, Math.ceil((bx + reach) / CELL));
        const j0 = Math.max(0, Math.floor((by - reach) / CELL));
        const j1 = Math.min(gh - 1, Math.ceil((by + reach) / CELL));
        const inv = 1 / (2 * sigma * sigma);
        for (let j = j0; j <= j1; j++) {
          const dy = (j + 0.5) * CELL - by;
          for (let i = i0; i <= i1; i++) {
            const c = j * gw + i;
            if (alpha[c * 4 + 3] < 128) continue;
            const dx = (i + 0.5) * CELL - bx;
            const d2 = dx * dx + dy * dy;
            const v = Math.exp(-d2 * inv) * 1.15;
            base[c] += v;
            if (v > strength[c]) {
              strength[c] = v;
              phase[c] = Math.sqrt(d2);
            }
          }
        }
      }
      for (let c = 0; c < n; c++) {
        if (base[c] > 0.035) {
          base[c] = Math.min(1, base[c]);
          color[c] = 0;
        }
      }
      fieldRef.current = {gw, gh, color, base, phase, palette: [mode.rgb], sparkle: !!mode.sparkle};
    }
    if (reducedMotion) drawRef.current(0);
  }, [transform, mode, provincePaths, lakePaths, gw, gh, reducedMotion]);

  // Draw one frame at time t (seconds).
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
      const tick = Math.floor(t * 6);
      for (let j = 0; j < f.gh; j++) {
        for (let i = 0; i < f.gw; i++) {
          const c = j * f.gw + i;
          const o = c * 4;
          const k = f.color[c];
          if (k === NONE) {
            px[o + 3] = 0;
            continue;
          }
          const b = f.base[c];
          const wave = 0.5 + 0.5 * Math.sin(f.phase[c] * 0.11 - t * 2.6);
          const h = ((i * 73856093) ^ (j * 19349663) ^ (tick * 83492791)) >>> 0;
          const twinkle = ((h % 1000) / 1000 - 0.5) * 0.1;
          const intensity = b * (0.7 + 0.3 * wave) + twinkle * Math.min(1, b * 3);
          if (f.sparkle && b > 0.2 && h % 1000 < 7) {
            // A glint: a bright dot that lives for one tick.
            px[o] = 255;
            px[o + 1] = 246;
            px[o + 2] = 210;
            px[o + 3] = 255;
          } else if (intensity > BAYER[(j & 3) * 4 + (i & 3)]) {
            const rgb = f.palette[k];
            px[o] = rgb[0];
            px[o + 1] = rgb[1];
            px[o + 2] = rgb[2];
            px[o + 3] = 225;
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
  }, [reducedMotion]);

  return (
    <foreignObject x={0} y={0} width={width} height={height} aria-hidden="true" pointerEvents="none">
      <canvas ref={canvasRef} className="dither-layer" style={{width: gw * CELL, height: gh * CELL}} />
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
