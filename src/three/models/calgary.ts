import {hash2, rgb, shade, type V3} from '../kit/core';
import {beam, box, canopy, column, hipRoof, mixedSeats, patch, shell, stand, tent, treeLine, truss, wall, type SeatCtx} from '../kit/parts';
import {arc, circle, join, line, offset, roundedRect, type Path} from '../kit/paths';
import {arenaBowl, bleachers, floodlights, parking} from './common';
import type {StadiumModelFn} from './types';

/**
 * Scotiabank Saddledome. A 140 m circle (OSM 143 × 140 m) under a concrete
 * hyperbolic-paraboloid roof: high over the ends of the rink, low over the sides,
 * edged in orange. Grey fluted walls between concrete ribs lean out to meet it,
 * above a ring slab on pilotis; two orange stair towers flank the low side and a
 * yellow +15 walkway runs off toward the LRT.
 */
export const saddledome: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(225, '#777c81');
  parking(base, [-150, 40], 80, 150);
  parking(base, [130, -40], 90, 160);
  arenaBowl(ctx, {lowerSeats: '#b8202d', upperSeats: '#b8202d'});
  const R = 70;
  const H = (x: number, z: number) => 41 + 12 * ((x / R) ** 2 - (z / R) ** 2);
  // Ground floor, ring slab, pilotis.
  wall(base, circle(57, 40), 0, 12, '#3f454b', {mat: 'glass'});
  const slabIn = circle(56, 40);
  const slabOut = circle(73, 40);
  for (let i = 0; i < 40; i++) {
    const k = (i + 1) % 40;
    const q = (p: [number, number], y: number): V3 => [p[0], y, p[1]];
    base.m('matte').quad(q(slabIn.pts[i], 12), q(slabIn.pts[k], 12), q(slabOut.pts[k], 12), q(slabOut.pts[i], 12), rgb('#cbc8c1'));
    base.m('matte').quad(q(slabOut.pts[i], 12), q(slabOut.pts[k], 12), q(slabOut.pts[k], 10.8), q(slabOut.pts[i], 10.8), rgb('#b9b6af'));
  }
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    column(base, [Math.cos(a) * 69, 0, Math.sin(a) * 69], 10.8, 0.7, '#c4c1ba', {mat: 'matte', sides: 6});
  }
  // Leaning fluted walls, window band, ribs.
  const n = 72;
  const buf = base.m('panel');
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const bot = (a: number): V3 => [Math.cos(a) * 64, 12, Math.sin(a) * 64];
    const top = (a: number): V3 => [Math.cos(a) * 70, H(Math.cos(a) * 70, Math.sin(a) * 70) - 1.8, Math.sin(a) * 70];
    buf.quad(bot(a0), bot(a1), top(a1), top(a0), shade('#8e959b', i % 2 ? 0.9 : 1.04));
  }
  wall(base, circle(64.9, 72), 14.2, 16.8, '#3d4d58', {mat: 'glass'});
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    beam(base, [c * 64.6, 12, s * 64.6], [c * 71, H(c * 70, s * 70) - 1.6, s * 71], 1.3, '#cac7c0', 'matte');
  }
  // Saddle roof and its orange edge.
  shell(roof, circle(R + 0.5, 64), (x, z) => H(x, z), (_x, _z, s) => shade('#f1f2f0', 0.93 + 0.07 * s), {rings: 7});
  wall(roof, circle(R + 0.8, 64), (x, z) => H(x, z) - 1.9, (x, z) => H(x, z) + 0.2, '#cf5f2b');
  // Stair towers, +15 walkway.
  for (const a of [0.85, Math.PI - 0.85]) box(base, [Math.cos(a) * 75, 0, Math.sin(a) * 75], [10, 26, 12], '#c4592f', {rot: a, top: '#f1f1ef'});
  box(base, [-112, 7.5, 30], [74, 4.2, 4.4], '#f2c230', {rot: -0.28, top: '#f5cf4f'});
  for (const t of [-0.8, -0.3, 0.2, 0.7]) column(base, [-112 + t * 70 * Math.cos(-0.28), 0, 30 + t * 70 * Math.sin(-0.28)], 7.5, 0.6, '#9aa0a6', {sides: 6});
  return {radius: 92, target: 16, view: {azimuth: 90, elevation: 16, distance: 2.4}};
};

/**
 * McMahon Stadium. Two deep sideline grandstands (built 1960, enlarged 1988),
 * straight in the middle with angled wings at both ends; red centre seats, blue
 * flanks, grey wings. White corrugated backs with a red base band, a press box
 * on top of each, and eight red lattice light towers. Open end zones.
 */
export const mcmahonStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(255, '#7a7f84');
  parking(base, [0, -175], 240, 60);
  parking(base, [0, 175], 240, 60);
  ctx.field({kind: 'cfl', surface: 'turf', area: [146, 70]});
  const paint = (c: SeatCtx) => {
    if (c.row / c.rows > 0.9) return c.section % 2 ? '#e6e6e6' : '#c8102e';
    if (c.t < 0.16 || c.t > 0.84) return '#d6d7d8';
    if (c.t < 0.3 || c.t > 0.7) return '#2a55a5';
    return '#c8102e';
  };
  for (const s of [-1, 1]) {
    const front = join(line([-84, s * 21], [-60, s * 36], 3), line([-60, s * 36], [60, s * 36], 8), line([60, s * 36], [84, s * 21], 3));
    const st = stand(base, {front, rows: 46, y0: 1.5, riser: 0.4, seat: paint, section: 9, concrete: '#dedcd6', fascia: '#8f2430'});
    const top = Math.max(...st.topY);
    const back = offset(st.back, 0.3);
    wall(base, back, 3, top + 1.5, '#e6e6e3', {mat: 'panel', tile: [2, 4]});
    wall(base, back, 0, 3, '#b3242c');
    const bz = s * (36 + 46 * 0.85);
    box(base, [0, top, bz - s * 3.5], [108, s < 0 ? 9 : 6, 7], '#cfd3d6', {top: '#9da2a7'});
    wall(base, line([-54, bz - s * 7.1], [54, bz - s * 7.1], 4), top + 1.5, top + 5, '#4f6575', {mat: 'glass'});
    for (const x of [-52, -18, 18, 52]) {
      const z = bz + s * 2;
      for (const dx of [-1.2, 1.2]) beam(base, [x + dx, 0, z], [x + dx * 0.6, top + 17, z], 0.6, '#c3262f');
      box(base, [x, top + 16, z], [7, 4.5, 1.6], '#b8242d', {top: '#9c1f27'});
      roof.m('glow').quad([x - 3, top + 16.6, z - s * 0.85], [x + 3, top + 16.6, z - s * 0.85], [x + 3, top + 20, z - s * 0.85], [x - 3, top + 20, z - s * 0.85], rgb('#fff6d6'));
    }
  }
  // South end curved concourse, north end patio building.
  const cIn = arc(0, 0, 94, 2.65, 3.63, 10);
  const cOut = arc(0, 0, 104, 2.65, 3.63, 10);
  wall(base, cOut, 0, 6, '#9aa0a6');
  wall(base, cIn, 0, 6, '#9aa0a6');
  for (let i = 0; i < cIn.pts.length - 1; i++) {
    const p = (q: [number, number]): V3 => [q[0], 6, q[1]];
    base.m('matte').quad(p(cIn.pts[i]), p(cIn.pts[i + 1]), p(cOut.pts[i + 1]), p(cOut.pts[i]), rgb('#4a4f56'));
  }
  box(base, [106, 0, -12], [30, 7, 46], '#b9bfc5', {top: '#9fb3c4'});
  return {radius: 112, target: 10, view: {azimuth: 122, elevation: 30, distance: 2.25}};
};

/**
 * ATCO Field, Spruce Meadows. A modular stadium (2019) on the "Meadows on the
 * Green" show-jumping ring: the covered east grandstand (4,500 seats) under an
 * exposed steel truss roof, small open stands at both ends, and Spruce Meadows'
 * white, red-roofed buildings and tents on the west side.
 */
export const atcoField: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(215, '#7fa564');
  const ring: Path = roundedRect(124, 124, 6, 3);
  patch(base, ring, '#6c9a52', 0.01);
  wall(base, ring, 0, 1.1, '#f4f4f2');
  ctx.field({kind: 'pitch', surface: 'grass', area: [112, 74]});
  const green = mixedSeats(['#2f7d4f', '#d23b3b', '#efefef'], [10, 1, 1], 9);
  const e = stand(base, {front: line([-50, 40], [50, 40], 8), rows: 20, y0: 1.5, seat: green, section: 12, concrete: '#b9b6ae'});
  const top = Math.max(...e.topY);
  const c = canopy(roof, offset(e.back, 1), {depth: 25, y: top + 6, rise: 1.2, color: '#c9cdd1', under: '#9aa1a8'});
  for (let i = 0; i < c.inner.pts.length; i++) {
    const [ix, iz] = c.inner.pts[i];
    const [ox, oz] = c.outer.pts[i];
    truss(roof, [[ox, top + 7.5, oz], [(ix + ox) / 2, top + 9.5, (iz + oz) / 2], [ix, top + 8.6, iz]], 2, '#aab0b6', {chord: 0.35, web: 0.2});
  }
  for (let x = -48; x <= 48; x += 12) column(roof, [x, 0, 40.5], top + 6.5, 0.3, '#9aa1a8', {sides: 6});
  for (const s of [-1, 1]) bleachers(base, {front: line([s * 59, -30], [s * 59, 30], 4), rows: 9, seat: '#2f7d4f'});
  // Spruce Meadows estate buildings and tents.
  box(base, [-12, 0, -84], [70, 9, 16], '#f1efe8', {top: false});
  hipRoof(base, [-12, 9, -84], 72, 18, 5, '#a8473b');
  box(base, [-12, 0, -95], [8, 20, 8], '#f1efe8', {top: false});
  hipRoof(base, [-12, 20, -95], 9, 9, 6, '#a8473b');
  box(base, [70, 0, -78], [30, 7, 14], '#f1efe8', {top: false});
  hipRoof(base, [70, 7, -78], 32, 16, 4, '#a8473b');
  tent(base, [38, -62], 20, 9, 3, 2.5, '#f6f6f4');
  tent(base, [-62, -64], 16, 9, 3, 2.5, '#f6f6f4');
  floodlights(base, [[-68, -66], [68, -66], [-68, 70], [68, 70]], 32);
  treeLine(base, line([-120, 100], [120, 100], 10), 14, 'deciduous', [10, 15], 8);
  treeLine(base, line([125, -90], [125, 90], 8), 14, 'deciduous', [10, 15], 9);
  for (let i = 0; i < 18; i++) {
    const x = -150 + hash2(i, 3) * 300;
    const z = -150 - hash2(i, 4) * 40;
    if (Math.hypot(x, z) < 210) treeLine(base, line([x, z], [x + 6, z]), 6, 'deciduous', [9, 13], i);
  }
  return {radius: 90, target: 5, view: {azimuth: 215, elevation: 28, distance: 2.3}};
};
