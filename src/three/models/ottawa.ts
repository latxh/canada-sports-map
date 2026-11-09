import type {V2, V3} from '../kit/core';
import {beam, box, canopy, column, mixedSeats, patch, shell, stand, strip, vault, wall} from '../kit/parts';
import {arc, circle, line, offset, type Path} from '../kit/paths';
import {arenaBowl, parking} from './common';
import type {StadiumModelFn} from './types';

/**
 * Canadian Tire Centre. A round drum (≈144 m across; OSM 169 × 149 m with the
 * entrance pavilions) banded in tan and grey precast, ringed by dark red
 * pilasters, crowned with an open steel railing, with a long glass entrance
 * pavilion at its foot — all in the middle of its parking lots in Kanata.
 */
export const canadianTireCentre: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(250, '#6f7479');
  patch(base, circle(98, 48), '#b9b4a8', 0.01);
  for (const [c, w, d, r] of [
    [[-160, -20], 100, 170, 0],
    [[150, 70], 90, 140, 0],
    [[20, 175], 220, 60, 0],
    [[30, -170], 200, 70, 0],
  ] as [V2, number, number, number][]) parking(base, c, w, d, r);
  arenaBowl(ctx, {lowerSeats: '#b5202e', upperSeats: '#b5202e'});

  const R = 72;
  const drum = circle(R, 48);
  wall(base, drum, 0, 13, '#454a50');
  const bands: [number, number, string][] = [
    [13, 17, '#cdb48d'],
    [17, 19, '#8e908e'],
    [19, 23.5, '#cdb48d'],
    [23.5, 25.5, '#8e908e'],
    [25.5, 30, '#cdb48d'],
    [30, 32, '#8e908e'],
    [32, 36, '#cdb48d'],
    [36, 38, '#7f8180'],
  ];
  for (const [y0, y1, c] of bands) wall(base, drum, y0, y1, c, {mat: 'panel', tile: [3, 4]});
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + Math.PI / 24;
    box(base, [Math.cos(a) * (R + 0.6), 17, Math.sin(a) * (R + 0.6)], [1.6, 8.5, 2.8], '#7c3a2c', {rot: a});
  }
  shell(roof, drum, (_x, _z, s) => 38 + 7 * Math.sin((s * Math.PI) / 2), '#c7cbce', {rings: 5, mat: 'metal'});
  // Railing crown.
  const posts: V3[] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const b: V3 = [Math.cos(a) * (R - 0.5), 38, Math.sin(a) * (R - 0.5)];
    const t: V3 = [Math.cos(a) * (R + 0.6), 42.5, Math.sin(a) * (R + 0.6)];
    beam(base, b, t, 0.35, '#a7aeb4');
    posts.push(t);
  }
  posts.forEach((p, i) => beam(base, p, posts[(i + 1) % posts.length], 0.3, '#a7aeb4'));
  // Glass entrance pavilion round the front.
  const front = arc(0, 0, 82, -1.75, 1.75, 20);
  const frontIn = arc(0, 0, R - 1, -1.75, 1.75, 20);
  wall(base, front, 0, 12, '#6f97a8', {mat: 'glass'});
  strip(base, offset(frontIn, 0, [0, 0]), offset(front, 2.5, [0, 0]), 12.4, 12.4, '#b9bdc0', {thickness: 0.7});
  for (const a of [-1.75, 1.75]) wall(base, line([Math.cos(a) * R, Math.sin(a) * R], [Math.cos(a) * 82, Math.sin(a) * 82]), 0, 12, '#c5c2bb');
  return {radius: 92, target: 14, view: {azimuth: 20, elevation: 26, distance: 2.4}};
};

/** Superellipse-like half outline from (−a, z0) round to (a, z0) bulging toward +z. */
function halfBox(a: number, z0: number, b: number, n = 26): Path {
  const pts: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = Math.PI - (i / n) * Math.PI;
    const c = Math.cos(t);
    const s = Math.sin(t);
    pts.push([a * Math.sign(c) * Math.abs(c) ** 0.45, z0 + b * Math.abs(s) ** 0.45]);
  }
  return {pts, closed: false};
}

/**
 * TD Place Stadium, Lansdowne Park. North stands (1967) with the arena beneath
 * them under a deep flat roof, red and grey "pixel" seats; south stands rebuilt
 * in 2014 with two tiers, suites and an arched roof, wrapped in the undulating
 * timber "veil". Open ends; the Aberdeen Pavilion stands east of the field.
 * +x = east, −z = north.
 */
export const tdPlace: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(255, '#8d9192');
  patch(base, {closed: true, pts: [[86, -70], [230, -70], [230, 80], [86, 80]]}, '#6f9c58');
  ctx.field({kind: ctx.kindFor({soccer: 'pitch'}, 'cfl'), surface: 'turf', area: [148, 74]});
  const pixel = mixedSeats(['#c8202f', '#8d939a', '#2c3137'], [5, 4, 1], 3);
  // North side.
  const n = stand(base, {front: line([-74, -41], [74, -41], 8), rows: 32, y0: 2.2, seat: pixel, section: 14, concrete: '#aaa7a0'});
  const nTop = Math.max(...n.topY);
  canopy(roof, offset(n.back, 0.5), {depth: 30, y: nTop + 7, rise: 0.4, color: '#41454c', mat: 'matte', thickness: 2.8, under: '#2c3035', edge: '#4a4f56'});
  for (let x = -70; x <= 70; x += 14) column(roof, [x, 0, -69.5], nTop + 7, 0.6, '#5c6168', {sides: 6});
  box(base, [0, 0, -84], [152, 18, 26], '#b6b2a9', {top: '#8f9397'});
  box(base, [-42, 0, -110], [62, 9, 24], '#8f4b3b', {top: '#7d8186'});
  box(base, [42, 0, -110], [62, 12, 24], '#6f8e9e', {mat: 'glass', top: '#7d8186'});
  // South side: two tiers, suites, arched roof.
  const redBlue = mixedSeats(['#c8202f', '#2f4a7a'], [5, 3], 5);
  const sl = stand(base, {front: line([-70, 41], [70, 41], 8), rows: 18, y0: 1.2, seat: redBlue, section: 14, concrete: '#b5b1a8', backTo: false});
  const slTop = Math.max(...sl.topY);
  wall(base, offset(sl.back, 0.2), slTop, slTop + 4.2, '#4d6474', {mat: 'glass'});
  const su = stand(base, {front: line([-67, 41 + 18 * 0.85 - 2], [67, 41 + 18 * 0.85 - 2], 8), rows: 16, y0: slTop + 4.8, riser: 0.5, seat: redBlue, section: 14, concrete: '#b5b1a8', backTo: 0});
  const suTop = Math.max(...su.topY);
  const sc = canopy(roof, offset(su.back, 0.5), {depth: 25, y: suTop + 3.5, rise: 3.5, color: '#ced2d5', under: '#8f969c'});
  for (let i = 0; i < sc.inner.pts.length; i += 2) {
    const [ix, iz] = sc.inner.pts[i];
    const [ox, oz] = sc.outer.pts[i];
    const mx = (ix + ox) / 2;
    const mz = (iz + oz) / 2;
    beam(roof, [ox, suTop + 3.6, oz], [mx, suTop + 7.4, mz], 0.6, '#b8bdc2');
    beam(roof, [mx, suTop + 7.4, mz], [ix, suTop + 7.1, iz], 0.6, '#b8bdc2');
  }
  // The timber veil: horizontal slats bulging out round the south stands.
  const veil = halfBox(84, 38, 38);
  for (let k = 0; k < 12; k++) {
    const y0 = 1.4 + k * 1.95;
    const bulge = 3.2 * Math.sin((Math.PI * (y0 + 0.6)) / 25);
    wall(base, offset(veil, bulge, [0, 20]), y0, y0 + 1.25, k % 3 === 1 ? '#a8a192' : '#bcb4a3');
  }
  // West end seats and the Aberdeen Pavilion.
  stand(base, {front: line([-84, -26], [-84, 26], 4), rows: 7, y0: 0.9, seat: pixel, section: 12, concrete: '#aaa7a0'});
  box(base, [150, 0, -6], [40, 9, 104], '#e1d8c2', {top: false});
  vault(base, [150, 9, -6], 104, 40, 9, '#c9cfd1', {rot: Math.PI / 2, ends: '#e1d8c2'});
  box(base, [150, 18, -6], [6, 5, 6], '#e1d8c2', {top: '#c9cfd1'});
  for (const z of [-58, 46]) box(base, [150, 0, z], [12, 15, 12], '#e1d8c2', {top: '#c9cfd1'});
  return {radius: 112, target: 8, view: {azimuth: 52, elevation: 28, distance: 2.3}};
};
