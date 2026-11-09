import * as THREE from 'three';
import {hash2, rgb, shade, type ColorIn, type Layer, type MaterialKey, type RGB, type TriBuffer, type V2, type V3} from './core';
import {lengths, normalsAway, offset, resample, type Path} from './paths';

/**
 * Reusable low-poly building parts. Every function takes a Layer and pushes
 * triangles into it, so a model is plain code: "a stand here, a canopy there".
 * Sizes are in metres.
 */

// ── Seating ─────────────────────────────────────────────────────────────────

export interface SeatCtx {
  /** Position along the stand, 0..1. */
  t: number;
  /** First seat row of the modelled step (0 = front row). */
  row: number;
  rows: number;
  /** Section index along the stand (sections are split by aisles). */
  section: number;
  /** Segment index (unique per quad column, for random mixes). */
  seg: number;
}

export type SeatPaint = (c: SeatCtx) => ColorIn;

export const solidSeats = (color: ColorIn): SeatPaint => () => color;

/** Random mix of colours, like TD Place's pixel pattern or Commonwealth's green and gold. */
export const mixedSeats =
  (colors: ColorIn[], weights: number[] = colors.map(() => 1), seed = 1): SeatPaint =>
  ({seg, row}) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = hash2(seg * 7 + seed, row * 13 + seed * 31) * total;
    for (let i = 0; i < colors.length; i++) {
      r -= weights[i];
      if (r <= 0) return colors[i];
    }
    return colors[colors.length - 1];
  };

/** Colour bands by row fraction, front to back: [[untilFraction, colour], …]. */
export const rowBands =
  (bands: [number, ColorIn][]): SeatPaint =>
  ({row, rows}) => {
    const f = row / Math.max(1, rows);
    for (const [until, c] of bands) if (f < until) return c;
    return bands[bands.length - 1][1];
  };

/** Colour by position along the stand: [[untilT, colour], …]. */
export const alongBands =
  (bands: [number, ColorIn][]): SeatPaint =>
  ({t}) => {
    for (const [until, c] of bands) if (t < until) return c;
    return bands[bands.length - 1][1];
  };

export interface StandOpts {
  /** Front edge of the stand (field side). */
  front: Path;
  /** The stand faces this point; rows climb away from it. */
  focus?: V2;
  /** Seat rows, constant or varying along the stand (t = 0..1). */
  rows: number | ((t: number) => number);
  rowDepth?: number;
  /** Height gained per row (rake). */
  riser?: number;
  /** Height of the front row above the ground. */
  y0?: number;
  /** Rows merged into one modelled step (keeps the poly count low). */
  rowsPerStep?: number;
  seat: ColorIn | SeatPaint;
  /** Section width between aisles, metres; 0 disables aisles. */
  section?: number;
  aisle?: number;
  aisleColor?: ColorIn;
  /** Back wall, end walls. */
  concrete?: ColorIn;
  /** Front wall (below the first row). */
  fascia?: ColorIn;
  /** Back wall down to this height (default ground); false = none. */
  backTo?: number | false;
  ends?: boolean;
  maxSeg?: number;
}

export interface StandInfo {
  /** Back edge of the top row. */
  back: Path;
  /** Front edge as sampled. */
  front: Path;
  /** Top height at each sample. */
  topY: number[];
  normals: V2[];
}

interface Sample {
  p: V2;
  aisle: boolean; // the segment starting here is an aisle
  section: number;
}

function sectionSamples(front: Path, section: number, aisle: number, maxSeg: number): Sample[] {
  const r = resample(front, Math.min(maxSeg, 2));
  const {cum, total} = lengths(r);
  const n = r.pts.length;
  const pointAt = (d: number): V2 => {
    if (front.closed) d = ((d % total) + total) % total;
    let k = 0;
    while (k < n - 1 && cum[k + 1] < d) k++;
    const a = r.pts[k];
    const b = r.pts[front.closed ? (k + 1) % n : Math.min(k + 1, n - 1)];
    const segEnd = k + 1 < n ? cum[k + 1] : total;
    const t = segEnd > cum[k] ? Math.min(1, Math.max(0, (d - cum[k]) / (segEnd - cum[k]))) : 0;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  const out: Sample[] = [];
  const push = (d: number, isAisle: boolean, sec: number) => out.push({p: pointAt(d), aisle: isAisle, section: sec});
  if (section <= 0 || total < section) {
    const k = Math.max(1, Math.ceil(total / maxSeg));
    for (let i = 0; i < k; i++) push((total * i) / k, false, 0);
    if (!front.closed) push(total, false, 0);
    return out;
  }
  // Fit a whole number of section+aisle units; open stands start and end with a section.
  const unit = section + aisle;
  const count = front.closed ? Math.max(1, Math.round(total / unit)) : Math.max(1, Math.round((total + aisle) / unit));
  const sec = front.closed ? total / count - aisle : (total - aisle * (count - 1)) / count;
  let d = 0;
  for (let s = 0; s < count; s++) {
    const k = Math.max(1, Math.ceil(sec / maxSeg));
    for (let i = 0; i < k; i++) push(d + (sec * i) / k, false, s);
    d += sec;
    if (front.closed || s < count - 1) {
      push(d, true, s);
      d += aisle;
    }
  }
  if (!front.closed) push(total, false, count - 1);
  return out;
}

/** Stepped seating along a path: treads and risers, with aisles, a front wall, a back wall and end walls. */
export function stand(L: Layer, o: StandOpts): StandInfo {
  const buf = L.m('matte');
  const rowDepth = o.rowDepth ?? 0.85;
  const riser = o.riser ?? 0.42;
  const y0 = o.y0 ?? 1;
  const rowsPerStep = o.rowsPerStep ?? 2;
  const focus = o.focus ?? [0, 0];
  const concrete = rgb(o.concrete ?? '#b8b6b0');
  const aisleRGB = rgb(o.aisleColor ?? '#b4b1aa');
  const fascia = rgb(o.fascia ?? '#4a4e54');
  const paint: SeatPaint = typeof o.seat === 'function' ? o.seat : solidSeats(o.seat);
  const rowsAt = typeof o.rows === 'number' ? () => o.rows as number : o.rows;
  const samples = sectionSamples(o.front, o.section ?? 16, o.aisle ?? 1.4, o.maxSeg ?? 5);
  const fp = {pts: samples.map((s) => s.p), closed: o.front.closed};
  const normals = normalsAway(fp, focus);
  const {cum, total} = lengths(fp);
  const n = samples.length;
  const tAt = (i: number) => (total ? cum[i] / total : 0);
  const maxRows = Math.max(...samples.map((_, i) => rowsAt(tAt(i))));
  const steps = Math.max(1, Math.ceil(maxRows / rowsPerStep));

  // Profile point (outward distance, height) for sample i.
  const prof = samples.map((_, i) => {
    const rows = rowsAt(tAt(i));
    return {rows, d: (rows * rowDepth) / steps, h: (rows * riser) / steps};
  });
  const P = (i: number, dist: number, y: number): V3 => {
    const s = samples[i].p;
    const nn = normals[i];
    return [s[0] + nn[0] * dist, y, s[1] + nn[1] * dist];
  };

  const edges = o.front.closed ? n : n - 1;
  for (let i = 0; i < edges; i++) {
    const k = (i + 1) % n;
    const a = prof[i];
    const b = prof[k];
    const isAisle = samples[i].aisle;
    const tMid = o.front.closed && k === 0 ? (tAt(i) + 1) / 2 : (tAt(i) + tAt(k)) / 2;
    for (let j = 0; j < steps; j++) {
      const A0 = P(i, j * a.d, y0 + j * a.h);
      const A1 = P(k, j * b.d, y0 + j * b.h);
      const B0 = P(i, j * a.d, y0 + (j + 1) * a.h);
      const B1 = P(k, j * b.d, y0 + (j + 1) * b.h);
      const C0 = P(i, (j + 1) * a.d, y0 + (j + 1) * a.h);
      const C1 = P(k, (j + 1) * b.d, y0 + (j + 1) * b.h);
      const rows = (a.rows + b.rows) / 2;
      const seatC = isAisle ? aisleRGB : rgb(paint({t: tMid, row: j * rowsPerStep, rows, section: samples[i].section, seg: i}));
      buf.quad(A0, A1, B1, B0, shade(seatC, isAisle ? 0.82 : 0.58));
      buf.quad(B0, B1, C1, C0, seatC);
    }
    // Front wall.
    if (y0 > 0.15) buf.quad(P(i, 0, 0), P(k, 0, 0), P(k, 0, y0), P(i, 0, y0), fascia);
    // Back wall.
    if (o.backTo !== false) {
      const yb = o.backTo ?? 0;
      buf.quad(P(i, steps * a.d, y0 + steps * a.h), P(k, steps * b.d, y0 + steps * b.h), P(k, steps * b.d, yb), P(i, steps * a.d, yb), concrete);
    }
  }

  // End walls for open stands.
  if (!o.front.closed && o.ends !== false) {
    for (const i of [0, n - 1]) {
      const pr = prof[i];
      const outline: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(0, y0)];
      for (let j = 0; j < steps; j++) {
        outline.push(new THREE.Vector2(j * pr.d, y0 + (j + 1) * pr.h));
        outline.push(new THREE.Vector2((j + 1) * pr.d, y0 + (j + 1) * pr.h));
      }
      // Open stands close diagonally back to the front foot; others drop to the back wall's foot.
      if (o.backTo !== false) {
        const yb = Math.min(o.backTo ?? 0, y0);
        outline.push(new THREE.Vector2(steps * pr.d, yb));
        if (yb > 0) {
          outline.shift();
          outline.unshift(new THREE.Vector2(0, yb));
        }
      }
      const faces = THREE.ShapeUtils.triangulateShape(outline, []);
      for (const [x, y, z] of faces) {
        buf.tri(P(i, outline[x].x, outline[x].y), P(i, outline[y].x, outline[y].y), P(i, outline[z].x, outline[z].y), concrete);
      }
    }
  }

  return {
    front: fp,
    back: {closed: fp.closed, pts: samples.map((_, i) => P(i, steps * prof[i].d, 0)).map(([x, , z]) => [x, z] as V2)},
    topY: prof.map((pr) => y0 + steps * pr.h),
    normals,
  };
}

// ── Walls, slabs and solids ────────────────────────────────────────────────

type Height = number | ((x: number, z: number, i: number) => number);
const hAt = (h: Height, x: number, z: number, i: number) => (typeof h === 'number' ? h : h(x, z, i));

export interface WallOpts {
  mat?: MaterialKey;
  /** Metres per texture tile horizontally / vertically. */
  tile?: [number, number];
  /** Per-edge colour override. */
  colorAt?: (t: number, i: number) => ColorIn;
}

/** Vertical wall strip along a path between two heights (each may vary along it). */
export function wall(L: Layer, p: Path, y0: Height, y1: Height, color: ColorIn, o: WallOpts = {}) {
  const buf = L.m(o.mat ?? 'matte');
  const [tu, tv] = o.tile ?? [4, 4];
  const {cum, total} = lengths(p);
  const n = p.pts.length;
  const edges = p.closed ? n : n - 1;
  const base = rgb(color);
  for (let i = 0; i < edges; i++) {
    const k = (i + 1) % n;
    const a = p.pts[i];
    const b = p.pts[k];
    const ua = cum[i] / tu;
    const ub = (k === 0 ? total : cum[k]) / tu;
    const a0 = hAt(y0, a[0], a[1], i);
    const a1 = hAt(y1, a[0], a[1], i);
    const b0 = hAt(y0, b[0], b[1], k);
    const b1 = hAt(y1, b[0], b[1], k);
    const c = o.colorAt ? rgb(o.colorAt(total ? cum[i] / total : 0, i)) : base;
    buf.quad([a[0], a0, a[1]], [b[0], b0, b[1]], [b[0], b1, b[1]], [a[0], a1, a[1]], c, [
      [ua, a0 / tv],
      [ub, b0 / tv],
      [ub, b1 / tv],
      [ua, a1 / tv],
    ]);
  }
}

/** Closed outline extruded between two heights, with a flat top. */
export function prism(L: Layer, outline: Path, y0: number, y1: number, color: ColorIn, o: WallOpts & {top?: ColorIn | false; topMat?: MaterialKey} = {}) {
  wall(L, {pts: outline.pts, closed: true}, y0, y1, color, o);
  if (o.top !== false) L.m(o.topMat ?? 'matte').flatPolygon(outline.pts, y1, rgb(o.top ?? shade(color, 0.92)));
}

/** Axis-aligned (then rotated) box sitting on y = base. */
export function box(L: Layer, [cx, y, cz]: V3, [w, h, d]: V3, color: ColorIn, o: WallOpts & {rot?: number; top?: ColorIn | false; topMat?: MaterialKey} = {}) {
  const c = Math.cos(o.rot ?? 0);
  const s = Math.sin(o.rot ?? 0);
  const pts: V2[] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c]);
  prism(L, {pts, closed: true}, y, y + h, color, o);
}

/** Horizontal (or sloping) strip between two matching paths, optionally with thickness. */
export function strip(
  L: Layer,
  inner: Path,
  outer: Path,
  yIn: number | ((t: number, i: number) => number),
  yOut: number | ((t: number, i: number) => number),
  color: ColorIn,
  o: {mat?: MaterialKey; thickness?: number; edge?: ColorIn; under?: ColorIn} = {},
) {
  const buf = L.m(o.mat ?? 'matte');
  const n = inner.pts.length;
  const {cum, total} = lengths(inner);
  const t = (i: number) => (total ? cum[i] / total : 0);
  const yi = (i: number) => (typeof yIn === 'number' ? yIn : yIn(t(i), i));
  const yo = (i: number) => (typeof yOut === 'number' ? yOut : yOut(t(i), i));
  const top = rgb(color);
  const under = rgb(o.under ?? shade(color, 0.7));
  const edge = rgb(o.edge ?? shade(color, 0.85));
  const th = o.thickness ?? 0;
  const edges = inner.closed ? n : n - 1;
  for (let i = 0; i < edges; i++) {
    const k = (i + 1) % n;
    const ia: V3 = [inner.pts[i][0], yi(i), inner.pts[i][1]];
    const ib: V3 = [inner.pts[k][0], yi(k), inner.pts[k][1]];
    const oa: V3 = [outer.pts[i][0], yo(i), outer.pts[i][1]];
    const ob: V3 = [outer.pts[k][0], yo(k), outer.pts[k][1]];
    buf.quad(ia, ib, ob, oa, top);
    if (th > 0) {
      const d = (p: V3): V3 => [p[0], p[1] - th, p[2]];
      buf.quad(d(ia), d(ib), d(ob), d(oa), under);
      buf.quad(ia, ib, d(ib), d(ia), edge);
      buf.quad(oa, ob, d(ob), d(oa), edge);
    }
  }
  if (th > 0 && !inner.closed) {
    for (const i of [0, n - 1]) {
      const ia: V3 = [inner.pts[i][0], yi(i), inner.pts[i][1]];
      const oa: V3 = [outer.pts[i][0], yo(i), outer.pts[i][1]];
      buf.quad(ia, oa, [oa[0], oa[1] - th, oa[2]], [ia[0], ia[1] - th, ia[2]], edge);
    }
  }
}

/** Cantilevered roof over a stand: from the back edge out toward the field, tilting up by `rise`. */
export function canopy(
  L: Layer,
  back: Path,
  o: {
    focus?: V2;
    depth: number | ((t: number) => number);
    y: number | ((t: number) => number);
    rise?: number;
    color: ColorIn;
    mat?: MaterialKey;
    thickness?: number;
    overhang?: number;
    under?: ColorIn;
    edge?: ColorIn;
  },
) {
  const focus = o.focus ?? [0, 0];
  const depth = typeof o.depth === 'number' ? () => o.depth as number : o.depth;
  const y = typeof o.y === 'number' ? () => o.y as number : o.y;
  const outer = offset(back, o.overhang ?? 0.5, focus);
  const inner = offset(back, (t) => -depth(t), focus);
  strip(L, inner, outer, (t) => y(t) + (o.rise ?? 1.5), (t) => y(t), o.color, {
    mat: o.mat ?? 'metal',
    thickness: o.thickness ?? 0.9,
    under: o.under,
    edge: o.edge,
  });
  return {inner, outer};
}

/** Roof cap over a closed outline: rings shrink toward the centre and take their height from h(x, z, s), s = 0 edge → 1 centre. */
export function shell(
  L: Layer,
  outline: Path,
  h: (x: number, z: number, s: number) => number,
  color: ColorIn | ((x: number, z: number, s: number) => ColorIn),
  o: {mat?: MaterialKey; rings?: number; center?: V2; ringAt?: (i: number, rings: number) => number} = {},
) {
  const buf = L.m(o.mat ?? 'matte');
  const rings = o.rings ?? 8;
  const n = outline.pts.length;
  let [cx, cz] = o.center ?? [0, 0];
  if (!o.center) {
    for (const [x, z] of outline.pts) {
      cx += x / n;
      cz += z / n;
    }
  }
  const ringS = (i: number) => (o.ringAt ? o.ringAt(i, rings) : i / rings);
  const ring = (i: number): V3[] => {
    const s = ringS(i);
    return outline.pts.map(([x, z]) => {
      const px = cx + (x - cx) * (1 - s);
      const pz = cz + (z - cz) * (1 - s);
      return [px, h(px, pz, s), pz];
    });
  };
  const colorOf = (a: V3, s: number) => (typeof color === 'function' ? rgb(color(a[0], a[2], s)) : rgb(color));
  let prev = ring(0);
  for (let r = 1; r <= rings; r++) {
    const cur = ring(r);
    const s = (ringS(r - 1) + ringS(r)) / 2;
    for (let i = 0; i < n; i++) {
      const k = (i + 1) % n;
      const c = colorOf(prev[i], s);
      if (r === rings && ringS(r) >= 1) buf.tri(prev[i], prev[k], cur[i], c);
      else buf.quad(prev[i], prev[k], cur[k], cur[i], c);
    }
    prev = cur;
  }
}

// ── Steel ──────────────────────────────────────────────────────────────────

/** Square-section member between two points. */
export function beam(L: Layer, a: V3, b: V3, w: number, color: ColorIn, mat: MaterialKey = 'metal', hgt = w) {
  const buf = L.m(mat);
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  if (d.lengthSq() < 1e-8) return;
  d.normalize();
  const ref = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(d, ref).normalize().multiplyScalar(w / 2);
  const v = new THREE.Vector3().crossVectors(u, d).normalize().multiplyScalar(hgt / 2);
  const c = rgb(color);
  const corner = (p: V3, su: number, sv: number): V3 => [p[0] + u.x * su + v.x * sv, p[1] + u.y * su + v.y * sv, p[2] + u.z * su + v.z * sv];
  const signs: [number, number][] = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ];
  for (let i = 0; i < 4; i++) {
    const [s1, t1] = signs[i];
    const [s2, t2] = signs[(i + 1) % 4];
    buf.quad(corner(a, s1, t1), corner(a, s2, t2), corner(b, s2, t2), corner(b, s1, t1), shade(c, i % 2 ? 0.85 : 1));
  }
}

/** Vertical prism column (sides = 4..12), optionally tapering. */
export function column(L: Layer, [x, y, z]: V3, height: number, r: number, color: ColorIn, o: {mat?: MaterialKey; sides?: number; rTop?: number; cap?: boolean} = {}) {
  const buf = L.m(o.mat ?? 'metal');
  const sides = o.sides ?? 8;
  const rt = o.rTop ?? r;
  const c = rgb(color);
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    buf.quad(
      [x + Math.cos(a0) * r, y, z + Math.sin(a0) * r],
      [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r],
      [x + Math.cos(a1) * rt, y + height, z + Math.sin(a1) * rt],
      [x + Math.cos(a0) * rt, y + height, z + Math.sin(a0) * rt],
      shade(c, 0.85 + 0.15 * Math.cos(a0 - 0.8)),
    );
  }
  if (o.cap !== false) {
    const top: V3[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      top.push([x + Math.cos(a) * rt, y + height, z + Math.sin(a) * rt]);
    }
    buf.fan(top, c);
  }
}

/** Planar lattice truss: top chord along pts, bottom chord `depth` below, zig-zag web. */
export function truss(L: Layer, pts: V3[], depth: number, color: ColorIn, o: {chord?: number; web?: number; mat?: MaterialKey; down?: V3} = {}) {
  const chord = o.chord ?? 0.7;
  const web = o.web ?? 0.35;
  const dn = o.down ?? [0, -1, 0];
  const low = pts.map((p): V3 => [p[0] + dn[0] * depth, p[1] + dn[1] * depth, p[2] + dn[2] * depth]);
  for (let i = 0; i < pts.length - 1; i++) {
    beam(L, pts[i], pts[i + 1], chord, color, o.mat);
    beam(L, low[i], low[i + 1], chord, color, o.mat);
    beam(L, i % 2 ? pts[i] : low[i], i % 2 ? low[i + 1] : pts[i + 1], web, color, o.mat);
    beam(L, pts[i], low[i], web, color, o.mat);
  }
  beam(L, pts[pts.length - 1], low[low.length - 1], web, color, o.mat);
}

// ── Site furniture ─────────────────────────────────────────────────────────

/** Floodlight mast with a lamp head aimed at `aim`. */
export function lightPole(L: Layer, x: number, z: number, h: number, aim: V2 = [0, 0], o: {color?: ColorIn; head?: [number, number]; base?: number} = {}) {
  const color = o.color ?? '#9aa1a8';
  const base = o.base ?? 0;
  column(L, [x, base, z], h, 0.45, color, {sides: 6, rTop: 0.3});
  const [hw, hh] = o.head ?? [6, 3.5];
  const ang = Math.atan2(aim[1] - z, aim[0] - x);
  const fx = Math.cos(ang);
  const fz = Math.sin(ang);
  const px = -fz;
  const pz = fx;
  const cx = x + fx * 0.6;
  const cz = z + fz * 0.6;
  const y = base + h;
  const quad = (off: number): [V3, V3, V3, V3] => [
    [cx + px * (hw / 2) + fx * off, y - hh / 2, cz + pz * (hw / 2) + fz * off],
    [cx - px * (hw / 2) + fx * off, y - hh / 2, cz - pz * (hw / 2) + fz * off],
    [cx - px * (hw / 2) + fx * off, y + hh / 2 + 0.6, cz - pz * (hw / 2) + fz * off],
    [cx + px * (hw / 2) + fx * off, y + hh / 2 + 0.6, cz + pz * (hw / 2) + fz * off],
  ];
  const back = quad(-0.4);
  L.m('metal').quad(back[0], back[1], back[2], back[3], rgb(color));
  const face = quad(0.05);
  L.m('glow').quad(face[0], face[1], face[2], face[3], rgb('#fff6d6'));
}

/** Video board: a frame with a glowing face, facing direction `rot` (radians, 0 = faces +x). */
export function screen(L: Layer, [x, y, z]: V3, w: number, h: number, rot: number, o: {frame?: ColorIn; face?: ColorIn; depth?: number; legs?: boolean} = {}) {
  const frame = o.frame ?? '#2b2f35';
  const depth = o.depth ?? 2;
  box(L, [x - Math.cos(rot) * (depth / 2), y, z - Math.sin(rot) * (depth / 2)], [depth, h, w], frame, {rot});
  const fx = Math.cos(rot);
  const fz = Math.sin(rot);
  const px = -fz;
  const pz = fx;
  const m = 0.4;
  const cx = x + fx * 0.05;
  const cz = z + fz * 0.05;
  L.m('glow').quad(
    [cx + px * (w / 2 - m), y + m, cz + pz * (w / 2 - m)],
    [cx - px * (w / 2 - m), y + m, cz - pz * (w / 2 - m)],
    [cx - px * (w / 2 - m), y + h - m, cz - pz * (w / 2 - m)],
    [cx + px * (w / 2 - m), y + h - m, cz + pz * (w / 2 - m)],
    rgb(o.face ?? '#3d6fb6'),
  );
  if (o.legs && y > 0.5) {
    column(L, [x + px * (w / 3), 0, z + pz * (w / 3)], y, 0.5, frame, {sides: 4});
    column(L, [x - px * (w / 3), 0, z - pz * (w / 3)], y, 0.5, frame, {sides: 4});
  }
}

/** Low-poly tree. */
export function tree(L: Layer, x: number, z: number, h: number, kind: 'conifer' | 'deciduous' = 'deciduous', seed = 0, y = 0) {
  const buf = L.m('matte');
  const v = hash2(Math.round(x * 10), Math.round(z * 10) + seed);
  const trunkH = (kind === 'conifer' ? h * 0.18 : h * 0.35) + y;
  column(L, [x, y - 0.5, z], trunkH - y + 0.5, Math.max(0.25, h * 0.04), '#6b5240', {mat: 'matte', sides: 5, cap: false});
  if (kind === 'conifer') {
    const g = shade(v > 0.5 ? '#2f5a3a' : '#2a5136', 0.9 + v * 0.2);
    const tiers = 2;
    for (let t = 0; t < tiers; t++) {
      const y0 = trunkH + (t * (h + y - trunkH)) / (tiers + 0.6);
      const r = h * (0.32 - t * 0.09);
      const top = y0 + (h + y - trunkH) * (t === tiers - 1 ? 0.75 : 0.6);
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * Math.PI * 2 + v;
        const a1 = ((i + 1) / sides) * Math.PI * 2 + v;
        buf.tri([x + Math.cos(a0) * r, y0, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y0, z + Math.sin(a1) * r], [x, top, z], shade(g, 0.8 + 0.25 * Math.cos(a0)));
      }
    }
  } else {
    const g = shade(v > 0.6 ? '#5f8a46' : v > 0.3 ? '#527d3e' : '#6a9150', 0.95 + v * 0.1);
    const r = h * 0.38;
    const cy = trunkH + r * 0.9;
    // Squashed octahedron-ish blob.
    const ring: V3[] = [];
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + v * 2;
      ring.push([x + Math.cos(a) * r, cy, z + Math.sin(a) * r]);
    }
    const top: V3 = [x, cy + r * 0.95, z];
    const bot: V3 = [x, cy - r * 0.7, z];
    for (let i = 0; i < sides; i++) {
      const k = (i + 1) % sides;
      buf.tri(ring[i], ring[k], top, shade(g, 1.05));
      buf.tri(ring[k], ring[i], bot, shade(g, 0.75));
    }
  }
}

/** Trees spaced along a path with a little jitter. */
export function treeLine(L: Layer, p: Path, spacing: number, kind: 'conifer' | 'deciduous', h: [number, number] = [9, 14], seed = 3) {
  const r = resample(p, spacing);
  r.pts.forEach(([x, z], i) => {
    const j = hash2(i, seed);
    const jx = (hash2(i * 3, seed + 1) - 0.5) * spacing * 0.5;
    const jz = (hash2(i * 5, seed + 2) - 0.5) * spacing * 0.5;
    tree(L, x + jx, z + jz, h[0] + (h[1] - h[0]) * j, kind, seed + i);
  });
}

/** Grass, asphalt or plaza patch. */
export function patch(L: Layer, outline: Path, color: ColorIn, y = 0.02) {
  L.m('matte').flatPolygon(outline.pts, y, rgb(color));
}

/** Smooth low-poly hill (ellipse footprint). */
export function hill(L: Layer, cx: number, cz: number, rx: number, rz: number, h: number, color: ColorIn, o: {sides?: number; rings?: number; tilt?: number} = {}) {
  const sides = o.sides ?? 18;
  const pts: V2[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]);
  }
  shell(
    L,
    {pts, closed: true},
    (x, _z, s) => {
      const bump = (1 - Math.cos(s * Math.PI)) / 2;
      return h * bump + (o.tilt ?? 0) * ((x - cx) / rx) * h * 0.2 * bump;
    },
    (_x, _z, s) => shade(color, 0.9 + s * 0.15),
    {rings: o.rings ?? 6, center: [cx, cz]},
  );
}

/** Shipping container (12.2 m) — Wanderers Grounds' signature. */
export function container(L: Layer, [x, y, z]: V3, rot: number, color: ColorIn, long = 12.2) {
  box(L, [x, y, z], [long, 2.6, 2.45], color, {rot, top: shade(color, 1.08), tile: [1, 4], mat: 'panel'});
}

/** Marquee tent with a pitched roof. */
export function tent(L: Layer, [x, z]: V2, w: number, d: number, wallH: number, roofH: number, color: ColorIn, rot = 0) {
  box(L, [x, 0, z], [w, wallH, d], color, {rot, top: false});
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (px: number, py: number, pz: number): V3 => [x + px * c - pz * s, py, z + px * s + pz * c];
  const buf = L.m('matte');
  const col = rgb(color);
  const a = P(-w / 2, wallH, -d / 2);
  const b = P(w / 2, wallH, -d / 2);
  const cc = P(w / 2, wallH, d / 2);
  const dd = P(-w / 2, wallH, d / 2);
  const r0 = P(-w / 2 + Math.min(w, d) / 2, wallH + roofH, 0);
  const r1 = P(w / 2 - Math.min(w, d) / 2, wallH + roofH, 0);
  buf.quad(a, b, r1, r0, shade(col, 0.95));
  buf.quad(dd, cc, r1, r0, shade(col, 1.05));
  buf.tri(a, dd, r0, shade(col, 0.9));
  buf.tri(b, cc, r1, shade(col, 0.9));
}

/** Simple pitched (gable) roof over a rectangle, ridge along x. */
export function gableRoof(L: Layer, [x, y, z]: V3, w: number, d: number, rise: number, color: ColorIn, rot = 0, overhang = 0.8) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (px: number, py: number, pz: number): V3 => [x + px * c - pz * s, py, z + px * s + pz * c];
  const hw = w / 2 + overhang;
  const hd = d / 2 + overhang;
  const buf = L.m('matte');
  const col = rgb(color);
  buf.quad(P(-hw, y, -hd), P(hw, y, -hd), P(hw, y + rise, 0), P(-hw, y + rise, 0), shade(col, 0.92));
  buf.quad(P(-hw, y, hd), P(hw, y, hd), P(hw, y + rise, 0), P(-hw, y + rise, 0), shade(col, 1.06));
  buf.tri(P(-w / 2, y, -d / 2), P(-w / 2, y, d / 2), P(-w / 2, y + rise, 0), shade(col, 0.85));
  buf.tri(P(w / 2, y, -d / 2), P(w / 2, y, d / 2), P(w / 2, y + rise, 0), shade(col, 0.85));
}

/** Hip roof over a rectangle (ridge along the longer side). */
export function hipRoof(L: Layer, [x, y, z]: V3, w: number, d: number, rise: number, color: ColorIn, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (px: number, py: number, pz: number): V3 => [x + px * c - pz * s, py, z + px * s + pz * c];
  const buf: TriBuffer = L.m('matte');
  const col: RGB = rgb(color);
  const hw = w / 2;
  const hd = d / 2;
  const ridge = Math.max(0, hw - hd);
  const a = P(-hw, y, -hd);
  const b = P(hw, y, -hd);
  const cc = P(hw, y, hd);
  const dd = P(-hw, y, hd);
  const r0 = P(-ridge, y + rise, 0);
  const r1 = P(ridge, y + rise, 0);
  buf.quad(a, b, r1, r0, shade(col, 0.92));
  buf.quad(dd, cc, r1, r0, shade(col, 1.06));
  buf.tri(b, cc, r1, shade(col, 0.98));
  buf.tri(dd, a, r0, shade(col, 0.88));
}

/** Barrel vault over a rectangle: length along x (before rotation), span across z, sitting on y. */
export function vault(L: Layer, [x, y, z]: V3, length: number, span: number, rise: number, color: ColorIn, o: {rot?: number; mat?: MaterialKey; seg?: number; ends?: ColorIn} = {}) {
  const buf = L.m(o.mat ?? 'metal');
  const seg = o.seg ?? 12;
  const c = Math.cos(o.rot ?? 0);
  const s = Math.sin(o.rot ?? 0);
  const P = (px: number, py: number, pz: number): V3 => [x + px * c - pz * s, py, z + px * s + pz * c];
  const col = rgb(color);
  const at = (px: number, i: number): V3 => {
    const phi = -Math.PI / 2 + (i / seg) * Math.PI;
    return P(px, y + rise * Math.cos(phi), (span / 2) * Math.sin(phi));
  };
  for (let i = 0; i < seg; i++) {
    buf.quad(at(-length / 2, i), at(length / 2, i), at(length / 2, i + 1), at(-length / 2, i + 1), shade(col, 0.9 + 0.12 * Math.cos(((i + 0.5) / seg) * Math.PI - 0.7)));
  }
  if (o.ends) {
    const e = rgb(o.ends);
    for (const px of [-length / 2, length / 2]) {
      const pts: V3[] = [];
      for (let i = 0; i <= seg; i++) pts.push(at(px, i));
      L.m('matte').fan([P(px, y, 0), ...pts], e);
    }
  }
}
