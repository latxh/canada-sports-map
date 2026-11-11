import type {V2} from './core';

/**
 * Plan-view paths (x, z) used as outlines for stands, walls and roofs.
 * Closed paths do not repeat their first point.
 */

export interface Path {
  pts: V2[];
  closed: boolean;
}

export const path = (pts: V2[], closed = false): Path => ({pts, closed});

/** Superellipse |x/a|^p + |z/b|^p = 1 (p = 2 ellipse, larger p = squarer). */
export function superellipse(a: number, b: number, p: number, n = 96, phase = 0): Path {
  const pts: V2[] = [];
  const e = 2 / p;
  for (let i = 0; i < n; i++) {
    const t = phase + (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    pts.push([a * Math.sign(c) * Math.abs(c) ** e, b * Math.sign(s) * Math.abs(s) ** e]);
  }
  return {pts, closed: true};
}

export const ellipse = (a: number, b: number, n = 64) => superellipse(a, b, 2, n);
export const circle = (r: number, n = 64) => superellipse(r, r, 2, n);

/** Rounded rectangle centred on the origin; width along x, depth along z. */
export function roundedRect(w: number, d: number, r: number, perCorner = 6): Path {
  const hx = w / 2;
  const hz = d / 2;
  r = Math.min(r, hx, hz);
  const pts: V2[] = [];
  const corners: [number, number, number][] = [
    [hx - r, hz - r, 0],
    [-hx + r, hz - r, Math.PI / 2],
    [-hx + r, -hz + r, Math.PI],
    [hx - r, -hz + r, (3 * Math.PI) / 2],
  ];
  for (const [cx, cz, a0] of corners) {
    if (r <= 0) {
      pts.push([cx, cz]);
      continue;
    }
    for (let i = 0; i <= perCorner; i++) {
      const a = a0 + (i / perCorner) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
    }
  }
  return {pts, closed: true};
}

/** Circular arc from angle a0 to a1 (radians, 0 = +x, π/2 = +z). */
export function arc(cx: number, cz: number, r: number, a0: number, a1: number, n = 16): Path {
  const pts: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return {pts, closed: false};
}

/** Straight segment, subdivided into n pieces. */
export function line(a: V2, b: V2, n = 1): Path {
  const pts: V2[] = [];
  for (let i = 0; i <= n; i++) pts.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  return {pts, closed: false};
}

/** Join open paths end to end (drops duplicated joints). */
export function join(...parts: Path[]): Path {
  const pts: V2[] = [];
  for (const p of parts) {
    for (const q of p.pts) {
      const last = pts[pts.length - 1];
      if (last && Math.hypot(last[0] - q[0], last[1] - q[1]) < 1e-6) continue;
      pts.push(q);
    }
  }
  return {pts, closed: false};
}

/** Part of a closed path between fractions f0 and f1 of its length (wraps). */
export function slice(p: Path, f0: number, f1: number, maxSeg = 4): Path {
  const r = resample(p, maxSeg);
  const {cum, total} = lengths(r);
  const n = r.pts.length;
  const pts: V2[] = [];
  const span = ((f1 - f0) % 1 + 1) % 1 || 1;
  const steps = Math.max(2, Math.ceil((span * total) / maxSeg));
  for (let i = 0; i <= steps; i++) {
    const d = (((f0 + (span * i) / steps) % 1) + 1) % 1 * total;
    let k = 0;
    while (k < n - 1 && cum[k + 1] < d) k++;
    const a = r.pts[k];
    const b = r.pts[(k + 1) % n];
    const segLen = (k + 1 < cum.length ? cum[k + 1] : total) - cum[k];
    const t = segLen > 0 ? (d - cum[k]) / segLen : 0;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return {pts, closed: false};
}

/** Cumulative lengths at each point; `total` includes the closing edge for closed paths. */
export function lengths(p: Path): {cum: number[]; total: number} {
  const cum = [0];
  for (let i = 1; i < p.pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]));
  }
  let total = cum[cum.length - 1];
  if (p.closed && p.pts.length > 1) {
    const a = p.pts[p.pts.length - 1];
    const b = p.pts[0];
    total += Math.hypot(a[0] - b[0], a[1] - b[1]);
  }
  return {cum, total};
}

/** Subdivide edges longer than maxSeg. */
export function resample(p: Path, maxSeg: number): Path {
  const out: V2[] = [];
  const n = p.pts.length;
  const edges = p.closed ? n : n - 1;
  for (let i = 0; i < edges; i++) {
    const a = p.pts[i];
    const b = p.pts[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.ceil(len / maxSeg));
    for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  if (!p.closed) out.push(p.pts[n - 1]);
  return {pts: out, closed: p.closed};
}

/** Unit normals pointing away from `focus` (default origin). */
export function normalsAway(p: Path, focus: V2 = [0, 0]): V2[] {
  const n = p.pts.length;
  return p.pts.map((q, i) => {
    const prev = p.pts[p.closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const next = p.pts[p.closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let tx = next[0] - prev[0];
    let tz = next[1] - prev[1];
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    let nx = tz;
    let nz = -tx;
    if (nx * (q[0] - focus[0]) + nz * (q[1] - focus[1]) < 0) {
      nx = -nx;
      nz = -nz;
    }
    return [nx, nz];
  });
}

/** Offset every point along its away-from-focus normal by d (or d(i, t), t = 0..1 along the path). */
export function offset(p: Path, d: number | ((t: number, i: number) => number), focus: V2 = [0, 0]): Path {
  const normals = normalsAway(p, focus);
  const {cum, total} = lengths(p);
  return {
    closed: p.closed,
    pts: p.pts.map((q, i) => {
      const dist = typeof d === 'number' ? d : d(total ? cum[i] / total : 0, i);
      return [q[0] + normals[i][0] * dist, q[1] + normals[i][1] * dist];
    }),
  };
}

/** Rotate (radians, counter-clockwise seen from above) then translate. */
export function transform(p: Path, {x = 0, z = 0, rot = 0}: {x?: number; z?: number; rot?: number}): Path {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return {closed: p.closed, pts: p.pts.map(([px, pz]) => [px * c - pz * s + x, px * s + pz * c + z])};
}

export function reverse(p: Path): Path {
  return {closed: p.closed, pts: [...p.pts].reverse()};
}

export function centroid(p: Path): V2 {
  let x = 0;
  let z = 0;
  for (const q of p.pts) {
    x += q[0];
    z += q[1];
  }
  return [x / p.pts.length, z / p.pts.length];
}

/** Obround: straight sides z = ±b between x = ±half, elliptical caps of depth a beyond. */
export function obround(half: number, a: number, b: number, perCap = 18): Path {
  const pts: V2[] = [];
  for (let i = 0; i <= perCap; i++) {
    const t = -Math.PI / 2 + (i / perCap) * Math.PI;
    pts.push([half + a * Math.cos(t), b * Math.sin(t)]);
  }
  for (let i = 0; i <= perCap; i++) {
    const t = Math.PI / 2 + (i / perCap) * Math.PI;
    pts.push([-half + a * Math.cos(t), b * Math.sin(t)]);
  }
  return {pts, closed: true};
}
