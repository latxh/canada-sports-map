import {rgb, type ColorIn, type Layer, type V2} from '../kit/core';
import {box, column, lightPole, patch, screen, stand, strip, wall, type SeatPaint, type StandInfo} from '../kit/parts';
import {offset, resample, roundedRect, type Path} from '../kit/paths';
import type {ModelContext} from './types';

/** Shared palette, tuned for the flat-shaded look. */
export const C = {
  concrete: '#c7c3ba',
  concreteDark: '#9f9b93',
  precast: '#d6d2c8',
  steel: '#dfe3e6',
  steelDark: '#8c939a',
  roofWhite: '#eff1f1',
  roofGrey: '#c9cdd1',
  glass: '#6d97a6',
  glassDark: '#3e5562',
  glassBlue: '#7aa3c4',
  asphalt: '#767b81',
  road: '#62676d',
  plaza: '#bfb9ad',
  grass: '#6f9c58',
  grassDark: '#5e8b4b',
  fascia: '#3a3e44',
  aisle: '#b4b1aa',
  aluminium: '#d4d7da',
  brick: '#9b4632',
  wood: '#8a6243',
  white: '#f1f2f0',
} as const;

/** Floodlight masts at the given points, all aimed at the centre. */
export function floodlights(L: Layer, points: V2[], h: number, o: {color?: ColorIn; head?: [number, number]; base?: number} = {}) {
  for (const [x, z] of points) lightPole(L, x, z, h, [0, 0], o);
}

/** Aluminium bleachers on scaffolding (open back with legs) — modular stands. */
export function bleachers(L: Layer, o: {front: Path; rows: number; seat: ColorIn | SeatPaint; y0?: number; focus?: V2; riser?: number; section?: number; legColor?: ColorIn}): StandInfo {
  const info = stand(L, {
    front: o.front,
    focus: o.focus,
    rows: o.rows,
    y0: o.y0 ?? 0.9,
    riser: o.riser ?? 0.38,
    seat: o.seat,
    section: o.section ?? 14,
    concrete: '#a7abaf',
    fascia: '#6c7177',
    backTo: false,
    aisleColor: '#bfc3c6',
  });
  const legs = resample(info.back, 6);
  legs.pts.forEach(([x, z], i) => {
    const top = info.topY[Math.min(info.topY.length - 1, Math.round((i / Math.max(1, legs.pts.length - 1)) * (info.topY.length - 1)))];
    column(L, [x, 0, z], top, 0.22, o.legColor ?? '#8d9399', {sides: 4, cap: false});
  });
  return info;
}

export interface ArenaBowlOpts {
  /** Inner edge (around the rink + apron). Default 66 × 32 m with 11 m corners. */
  inner?: Path;
  lowerRows?: number;
  upperRows?: number;
  lowerSeats: ColorIn | SeatPaint;
  upperSeats?: ColorIn | SeatPaint;
  /** Rows of a middle club tier between suites rings (Bell Centre). */
  clubRows?: number;
  clubSeats?: ColorIn | SeatPaint;
  /** Height of the suites ring between tiers. */
  suites?: number;
  scoreboard?: boolean;
}

/** Seating bowl, suites ring and centre-hung scoreboard shared by the seven NHL arenas. */
export function arenaBowl(ctx: ModelContext, o: ArenaBowlOpts) {
  const L = ctx.base;
  const inner = o.inner ?? roundedRect(66, 32, 11, 5);
  const kind = ctx.kindFor({basketball: 'court'}, 'rink');
  ctx.field({kind, surface: kind === 'rink' ? 'ice' : 'hardwood'});
  // Arena floor around the playing surface.
  L.m('matte').flatPolygon(offset(inner, 1, [0, 0]).pts, 0.01, rgb('#3b3e43'));
  const lower = stand(L, {front: inner, rows: o.lowerRows ?? 22, y0: 1.1, riser: 0.5, rowDepth: 0.78, seat: o.lowerSeats, section: 9, aisle: 1.1, fascia: '#2f3237', backTo: false});
  const suites = o.suites ?? 4.2;
  const lowTop = Math.max(...lower.topY);
  // Suites / concourse ring.
  const ring = offset(lower.back, 0.2, [0, 0]);
  wall(L, ring, lowTop, lowTop + suites, '#5d6f7c', {mat: 'glass'});
  strip(L, offset(lower.back, -1.2, [0, 0]), offset(lower.back, 1.5, [0, 0]), lowTop + suites, lowTop + suites, '#43474d', {thickness: 0.6});
  let front = offset(lower.back, -1.5, [0, 0]);
  let y0 = lowTop + suites + 0.6;
  if (o.clubRows) {
    const club = stand(L, {front, rows: o.clubRows, y0, riser: 0.55, rowDepth: 0.8, seat: o.clubSeats ?? o.lowerSeats, section: 9, aisle: 1.1, fascia: '#2f3237', backTo: false});
    const top = Math.max(...club.topY);
    wall(L, offset(club.back, 0.2, [0, 0]), top, top + suites, '#5d6f7c', {mat: 'glass'});
    strip(L, offset(club.back, -1.2, [0, 0]), offset(club.back, 1.5, [0, 0]), top + suites, top + suites, '#43474d', {thickness: 0.6});
    front = offset(club.back, -1.5, [0, 0]);
    y0 = top + suites + 0.6;
  }
  const upper = stand(L, {front, rows: o.upperRows ?? 18, y0, riser: 0.62, rowDepth: 0.8, seat: o.upperSeats ?? o.lowerSeats, section: 9, aisle: 1.1, fascia: '#2f3237', backTo: false});
  const top = Math.max(...upper.topY);
  if (o.scoreboard !== false) {
    const y = Math.min(top - 2, 18);
    box(L, [0, y, 0], [9, 6, 6], '#26292e');
    for (const [rot, w] of [
      [0, 6],
      [Math.PI / 2, 9],
      [Math.PI, 6],
      [-Math.PI / 2, 9],
    ] as [number, number][]) {
      const d = rot === 0 || rot === Math.PI ? 4.55 : 3.05;
      screen(L, [Math.cos(rot) * d, y + 0.3, Math.sin(rot) * d], w - 0.6, 5.4, rot, {depth: 0.2, face: '#3a64a8'});
    }
    column(L, [0, y + 6, 0], 10, 0.15, '#555b62', {sides: 4});
  }
  return {lower, upper, top, back: upper.back};
}

/** Convenience: a field-facing straight stand from a to b. */
export function straight(a: V2, b: V2, n = 1): Path {
  const pts: V2[] = [];
  for (let i = 0; i <= n; i++) pts.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  return {pts, closed: false};
}

/** Picnic tables / patio furniture scattered along a line. */
export function patio(L: Layer, a: V2, b: V2, count: number, color: ColorIn = '#7b5a3e') {
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    box(L, [a[0] + (b[0] - a[0]) * t, 0, a[1] + (b[1] - a[1]) * t], [2.2, 0.8, 1.6], color);
  }
}

/** Parking lot: asphalt patch with a few lighter stall rows. */
export function parking(L: Layer, [cx, cz]: V2, w: number, d: number, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (x: number, z: number): V2 => [cx + x * c - z * s, cz + x * s + z * c];
  patch(L, {closed: true, pts: [P(-w / 2, -d / 2), P(w / 2, -d / 2), P(w / 2, d / 2), P(-w / 2, d / 2)]}, '#6f7479', 0.015);
  for (let z = -d / 2 + 8; z < d / 2 - 4; z += 16) {
    patch(L, {closed: true, pts: [P(-w / 2 + 4, z - 0.3), P(w / 2 - 4, z - 0.3), P(w / 2 - 4, z + 0.3), P(-w / 2 + 4, z + 0.3)]}, '#8e9399', 0.025);
  }
}

