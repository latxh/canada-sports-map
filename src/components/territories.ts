/**
 * Geometry for the closest-team view: each city's territory (its Voronoi cell) cut to the land
 * that is drawn, so the map can fill and outline territories without SVG clip paths (which
 * browsers re-rasterise on every frame of a pan or zoom).
 *
 * Everything is in unzoomed (k = 1) map pixels.
 */

export type Pt = [number, number];
export type Ring = Pt[];

/** A piece of a territory's border: part of a Voronoi edge that lies over land. */
export interface BorderPiece {
  a: Pt;
  b: Pt;
  /** Unit normal pointing into the territory. */
  n: Pt;
}

/** The rings of an SVG path made of absolute M / L / Z commands (what d3-geo's geoPath writes). */
export function parseRings(d: string): Ring[] {
  const rings: Ring[] = [];
  let ring: Ring | null = null;
  const re = /([MLZmlz])([^MLZmlz]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const cmd = m[1].toUpperCase();
    if (cmd === 'Z') {
      if (ring && ring.length >= 3) rings.push(ring);
      ring = null;
      continue;
    }
    const nums = m[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'M') {
      if (ring && ring.length >= 3) rings.push(ring);
      ring = [];
    }
    for (let i = 0; i + 1 < nums.length; i += 2) ring?.push([nums[i], nums[i + 1]]);
  }
  if (ring && ring.length >= 3) rings.push(ring);
  return rings;
}

/**
 * Voronoi cells for a few points (half-plane clipping: fine for tens of sites), clipped to
 * `bounds` grown well past the map. Index-aligned with `points`; null where a cell is empty
 * (two cities on the same spot).
 */
export function voronoiPolygons(points: Pt[], bounds: [Pt, Pt]): {cells: (Ring | null)[]; box: [Pt, Pt]} {
  const [[x0, y0], [x1, y1]] = bounds;
  const pad = Math.max(x1 - x0, y1 - y0);
  const box: [Pt, Pt] = [
    [x0 - pad, y0 - pad],
    [x1 + pad, y1 + pad],
  ];
  const start: Ring = [box[0], [box[1][0], box[0][1]], box[1], [box[0][0], box[1][1]]];
  const cells = points.map(([px, py], i) => {
    let poly = start;
    for (let j = 0; j < points.length && poly.length; j++) {
      if (j === i) continue;
      const [qx, qy] = points[j];
      // Keep the side of the perpendicular bisector nearer to p: (q - p)·x <= (|q|² - |p|²) / 2.
      poly = clipHalfPlane(poly, qx - px, qy - py, (qx * qx + qy * qy - px * px - py * py) / 2);
    }
    return poly.length >= 3 ? poly : null;
  });
  return {cells, box};
}

/** Sutherland–Hodgman against one half-plane nx·x + ny·y <= c. */
function clipHalfPlane(poly: Ring, nx: number, ny: number, c: number): Ring {
  const out: Ring = [];
  for (let k = 0; k < poly.length; k++) {
    const a = poly[k];
    const b = poly[(k + 1) % poly.length];
    const da = nx * a[0] + ny * a[1] - c;
    const db = nx * b[0] + ny * b[1] - c;
    if (da <= 0) out.push(a);
    if (da <= 0 !== db <= 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/** A convex polygon as half-planes (inside: nx·x + ny·y <= c), whatever its winding. */
function halfPlanes(cell: Ring): [number, number, number][] {
  let area = 0;
  for (let k = 0; k < cell.length; k++) {
    const a = cell[k];
    const b = cell[(k + 1) % cell.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const s = area > 0 ? 1 : -1;
  return cell.map((a, k) => {
    const b = cell[(k + 1) % cell.length];
    // Outward normal of edge a→b for a polygon of winding s.
    const nx = s * (b[1] - a[1]);
    const ny = -s * (b[0] - a[0]);
    return [nx, ny, nx * a[0] + ny * a[1]];
  });
}

interface Bbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const bboxOf = (ring: Ring): Bbox => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return {x0, y0, x1, y1};
};

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();
const ringPath = (r: Ring) => `M${r.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join('L')}Z`;

/**
 * Each territory cut to the land (`provinces`: SVG paths, one per province), as an SVG path
 * per site, plus (per site) the pieces of its borders with other territories that lie over land.
 */
export function territoryShapes(cells: (Ring | null)[], box: [Pt, Pt], provinces: string[]): {fills: (string | null)[]; borders: BorderPiece[][]} {
  const land = provinces.map((d) => parseRings(d).map((ring) => ({ring, bb: bboxOf(ring)})));
  const allRings = land.flat();

  const fills = cells.map((cell) => {
    if (!cell) return null;
    const planes = halfPlanes(cell);
    const cb = bboxOf(cell);
    const parts: string[] = [];
    for (const {ring, bb} of allRings) {
      if (bb.x1 < cb.x0 || bb.x0 > cb.x1 || bb.y1 < cb.y0 || bb.y0 > cb.y1) continue;
      // Wholly inside: keep as is. Otherwise clip against each edge of the (convex) cell.
      const inside = planes.every(([nx, ny, c]) => nx * bb.x0 + ny * bb.y0 <= c && nx * bb.x1 + ny * bb.y0 <= c && nx * bb.x0 + ny * bb.y1 <= c && nx * bb.x1 + ny * bb.y1 <= c);
      let r: Ring = ring;
      if (!inside) for (const [nx, ny, c] of planes) if ((r = clipHalfPlane(r, nx, ny, c)).length < 3) break;
      if (r.length >= 3) parts.push(ringPath(r));
    }
    return parts.length ? parts.join('') : null;
  });

  // Borders: every cell edge that isn't on the outer box, cut to the land, drawn by each cell
  // on its own side.
  const onBox = (p: Pt) => Math.abs(p[0] - box[0][0]) < 1e-6 || Math.abs(p[0] - box[1][0]) < 1e-6 || Math.abs(p[1] - box[0][1]) < 1e-6 || Math.abs(p[1] - box[1][1]) < 1e-6;
  const borders: BorderPiece[][] = cells.map(() => []);
  cells.forEach((cell, site) => {
    if (!cell) return;
    let cx = 0;
    let cy = 0;
    for (const [x, y] of cell) {
      cx += x / cell.length;
      cy += y / cell.length;
    }
    for (let k = 0; k < cell.length; k++) {
      const a = cell[k];
      const b = cell[(k + 1) % cell.length];
      if (onBox(a) && onBox(b) && (a[0] === b[0] || a[1] === b[1])) continue;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 1e-9) continue;
      let n: Pt = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
      if (n[0] * (cx - a[0]) + n[1] * (cy - a[1]) < 0) n = [-n[0], -n[1]];
      for (const [t0, t1] of landIntervals(a, b, land)) {
        borders[site].push({a: [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], b: [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1], n});
      }
    }
  });
  return {fills, borders};
}

/** The parts (as [t0, t1] along a→b) of segment a→b over land: the union over provinces. */
function landIntervals(a: Pt, b: Pt, land: {ring: Ring; bb: Bbox}[][]): [number, number][] {
  const sb: Bbox = {x0: Math.min(a[0], b[0]), y0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), y1: Math.max(a[1], b[1])};
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const spans: [number, number][] = [];
  for (const province of land) {
    const ts: number[] = [];
    let inside = false;
    let touched = false;
    for (const {ring, bb} of province) {
      // Point-in-polygon for a (even-odd across the province's rings) needs every ring whose
      // band holds a's y; crossings need rings near the segment.
      const near = !(bb.x1 < sb.x0 || bb.x0 > sb.x1 || bb.y1 < sb.y0 || bb.y0 > sb.y1);
      const holdsY = bb.y0 <= a[1] && a[1] <= bb.y1 && bb.x1 >= a[0];
      if (!near && !holdsY) continue;
      touched = true;
      for (let k = 0, j = ring.length - 1; k < ring.length; j = k++) {
        const p = ring[j];
        const q = ring[k];
        if (holdsY && p[1] > a[1] !== q[1] > a[1] && a[0] < ((q[0] - p[0]) * (a[1] - p[1])) / (q[1] - p[1]) + p[0]) inside = !inside;
        if (!near) continue;
        const ex = q[0] - p[0];
        const ey = q[1] - p[1];
        const den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / den;
        const u = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / den;
        if (t > 0 && t < 1 && u >= 0 && u < 1) ts.push(t);
      }
    }
    if (!touched) continue;
    ts.sort((x, y) => x - y);
    let from = inside ? 0 : -1;
    for (const t of ts) {
      if (from >= 0) {
        spans.push([from, t]);
        from = -1;
      } else from = t;
    }
    if (from >= 0) spans.push([from, 1]);
  }
  // Union: neighbouring provinces meet along shared borders, so join touching spans.
  spans.sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    if (last && s[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], s[1]);
    else if (s[1] - s[0] > 1e-6) out.push([...s]);
  }
  return out;
}
