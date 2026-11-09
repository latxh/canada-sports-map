import {rgb, shade, type V2, type V3} from '../kit/core';
import {beam, box, canopy, column, hipRoof, patch, screen, shell, stand, strip, treeLine, wall, type SeatCtx} from '../kit/parts';
import {arc, line, offset, roundedRect, superellipse} from '../kit/paths';
import {arenaBowl, bleachers, C, floodlights, parking} from './common';
import type {StadiumModelFn} from './types';

/** Point on a superellipse at polar angle a (not the parametric angle). */
function seAt(a: number, b: number, p: number, ang: number): V2 {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const r = 1 / ((Math.abs(c) / a) ** p + (Math.abs(s) / b) ** p) ** (1 / p);
  return [r * c, r * s];
}

/**
 * BC Place. A 232 × 192 m oval (OSM). Since 2011 a cable-supported roof: 36 white
 * masts round the rim hold a ring of puffy fabric cushions; the retractable
 * centre gathers into the hub hung in the middle, under which the scoreboard
 * hangs. Beige concrete facade with teal glass concourse bands and gates.
 */
export const bcPlace: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(265, '#8d9192');
  ctx.field({kind: ctx.kindFor({football: 'cfl'}, 'pitch'), surface: 'turf', area: [150, 78]});
  const seat = '#34507a';
  const lower = stand(base, {front: superellipse(78, 44, 3.4, 72), rows: 30, y0: 1.5, seat, section: 13, backTo: false});
  const lowTop = Math.max(...lower.topY);
  wall(base, offset(lower.back, 0.2), lowTop, lowTop + 4.4, '#4c6372', {mat: 'glass'});
  stand(base, {front: offset(lower.back, -3.5), rows: 24, y0: lowTop + 5, riser: 0.5, seat, section: 13, backTo: false});

  const A = 116;
  const B = 96;
  const P = 2.4;
  const outer = superellipse(A, B, P, 72);
  const bands: [number, number, string, 'matte' | 'glass' | 'panel'][] = [
    [0, 6, '#d6d1c6', 'matte'],
    [6, 12, '#4f9aa0', 'glass'],
    [12, 26, '#d6d1c6', 'panel'],
    [26, 31, '#575c63', 'matte'],
    [31, 35, '#e7eaec', 'matte'],
  ];
  for (const [y0, y1, c, m] of bands) wall(base, outer, y0, y1, c, {mat: m});
  strip(base, offset(outer, -9), outer, 35, 35, '#c9cccf');
  for (const [x, z, w, d] of [
    [0, 98, 40, 12],
    [0, -98, 40, 12],
    [118, 0, 12, 34],
    [-118, 0, 12, 34],
  ]) {
    box(base, [x, 0, z], [w, 14, d], '#d6d1c6', {top: '#b9b5ab'});
    box(base, [x * 1.02, 2, z * 1.02], [w * 0.9 + (w < 20 ? 1 : 0), 9, d * 0.9 + (d < 20 ? 1 : 0)], '#4f9aa0', {mat: 'glass', top: false});
  }

  // Masts, cables and the cushion ring.
  const masts = 36;
  const hubTop: V3 = [0, 71, 0];
  const innerA = 62;
  const innerB = 46;
  for (let i = 0; i < masts; i++) {
    const ang = (i / masts) * Math.PI * 2;
    const [x, z] = seAt(A + 1, B + 1, P, ang);
    const len = Math.hypot(x, z);
    const nx = x / len;
    const nz = z / len;
    const b: V3 = [x, 35, z];
    const t: V3 = [x + nx * 9, 79, z + nz * 9];
    beam(base, b, t, 1.5, C.white);
    const k: V3 = [x - nx * 14, 37, z - nz * 14];
    beam(base, [x + nx * 3.5, 52, z + nz * 3.5], k, 0.9, '#e4e7e9');
    const [ix, iz] = seAt(innerA, innerB, P, ang);
    roof.line(t, [ix, 51, iz]);
    roof.line(t, hubTop);
  }
  const buf = roof.m('matte');
  const white = rgb('#f3f4f2');
  const pt = (ang: number, r: number, u: number): V3 => {
    const [ox, oz] = seAt(A - 2, B - 2, P, ang);
    const [ix, iz] = seAt(innerA, innerB, P, ang);
    const y = 36 + (51 - 36) * r + 2.6 * Math.sin(Math.PI * r) * (1 - Math.abs(2 * u - 1));
    return [ox + (ix - ox) * r, y, oz + (iz - oz) * r];
  };
  for (let i = 0; i < masts; i++) {
    const a0 = (i / masts) * Math.PI * 2;
    const a1 = ((i + 1) / masts) * Math.PI * 2;
    for (let h = 0; h < 2; h++) {
      const u0 = h / 2;
      const u1 = (h + 1) / 2;
      for (let r = 0; r < 4; r++) {
        const r0 = r / 4;
        const r1 = (r + 1) / 4;
        const angAt = (u: number) => a0 + (a1 - a0) * u;
        buf.quad(pt(angAt(u0), r0, u0), pt(angAt(u1), r0, u1), pt(angAt(u1), r1, u1), pt(angAt(u0), r1, u0), shade(white, h === 0 ? 0.93 : 1.02));
      }
    }
  }
  // Hub, the retractable centre and the scoreboard.
  column(roof, [0, 62, 0], 9, 13, '#e9ecee', {sides: 16});
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const [ix, iz] = seAt(innerA, innerB, P, ang);
    roof.line([Math.cos(ang) * 13, 64, Math.sin(ang) * 13], [ix, 51, iz]);
  }
  const centre = ctx.layer('centre', {roof: true});
  shell(centre, superellipse(innerA + 1, innerB + 1, P, 48), (_x, _z, s) => 51 + 4 * Math.sin((s * Math.PI) / 2), (_x, _z, s) => shade('#f4f5f3', 0.94 + 0.08 * s), {rings: 4});
  box(base, [0, 33, 0], [22, 10, 14], '#26292e');
  for (const [rot, w, d] of [
    [0, 14, 11.05],
    [Math.PI, 14, 11.05],
    [Math.PI / 2, 22, 7.05],
    [-Math.PI / 2, 22, 7.05],
  ] as [number, number, number][]) screen(base, [Math.cos(rot) * d, 33.4, Math.sin(rot) * d], w - 0.8, 9.2, rot, {depth: 0.2, face: '#c8102e'});
  base.line([0, 43, 0], [0, 62, 0]);
  return {
    radius: 132,
    target: 20,
    view: {azimuth: 32, elevation: 28, distance: 2.2},
    animateRoof: (layers, t) => {
      const s = 1 - 0.82 * t;
      layers.centre?.scale.set(s, 1, s);
      if (layers.centre) layers.centre.position.y = 9 * t;
    },
  };
};

/**
 * Rogers Arena. A white, shallow elliptical dome on a boxy grey precast base
 * with ribbon windows, service blocks at the corners, the blue entrance tower
 * and blue awnings; the Georgia Viaduct swings past its west side.
 */
export const rogersArena: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(195, '#8f9395');
  arenaBowl(ctx, {lowerSeats: '#1f3e73', upperSeats: '#1f3e73'});
  const footprint = roundedRect(152, 114, 26, 5);
  wall(base, footprint, 0, 5, '#46525c', {mat: 'glass'});
  wall(base, footprint, 5, 24, '#cacccd', {mat: 'panel'});
  for (const y of [9, 16]) wall(base, offset(footprint, 0.2), y, y + 2.2, '#56707f', {mat: 'glass'});
  wall(base, footprint, 24, 25, '#aeb2b5');
  base.m('matte').flatPolygon(footprint.pts, 25, rgb('#9da1a4'));
  for (const [x, z, w, d, h] of [
    [-70, -42, 22, 26, 28],
    [68, 44, 24, 22, 27],
    [-36, 56, 44, 12, 22],
    [30, -58, 30, 10, 21],
  ]) box(base, [x, 0, z], [w, h, d], '#c1c4c6', {mat: 'panel', top: '#a3a7aa'});
  wall(base, superellipse(72, 54, 2.3, 56), 24, 27, '#d8dbdd');
  shell(roof, superellipse(72, 54, 2.3, 56), (_x, _z, s) => 27 + 15 * Math.sin((s * Math.PI) / 2) ** 0.85, (_x, _z, s) => shade('#eceff1', 0.92 + 0.1 * s), {rings: 6, mat: 'metal'});
  box(base, [58, 0, -55], [18, 31, 12], '#1f5bb0', {top: '#1a4c94'});
  base.m('glow').quad([50, 26, -61.1], [66, 26, -61.1], [66, 28.5, -61.1], [50, 28.5, -61.1], rgb('#e8414b'));
  strip(base, line([-62, -57.3], [36, -57.3], 4), line([-62, -62], [36, -62], 4), 7.6, 6.6, '#2a64b8', {thickness: 0.35});
  // Georgia Viaduct.
  const vIn = arc(0, 0, 96, 1.9, 4.2, 14);
  const vOut = arc(0, 0, 114, 1.9, 4.2, 14);
  strip(base, vIn, vOut, 8.5, 8.5, '#b1aea8', {thickness: 1.4});
  arc(0, 0, 105, 1.9, 4.2, 7).pts.forEach(([x, z]) => column(base, [x, 0, z], 7.1, 1.2, '#a5a29b', {mat: 'matte', sides: 6}));
  return {radius: 92, target: 12, view: {azimuth: -42, elevation: 30, distance: 2.4}};
};

/**
 * Starlight Stadium, Langford. OSM: pitch 100 × 66 m; the main stand (127 m)
 * on the south side with purple seats spelling white "P"s, the clubhouse behind
 * it and a timber canopy over its middle; a covered stand at the west end;
 * open north and east sides among tall Douglas firs.
 */
export const starlightStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(205, '#7fa564');
  parking(base, [0, 112], 170, 40);
  ctx.field({kind: 'pitch', surface: 'turf', area: [112, 76]});
  const purple = '#5b2c86';
  const letters = (c: SeatCtx) => (c.section % 3 === 1 && c.row >= 4 && c.row <= 10 ? '#f1eef5' : purple);
  const main = stand(base, {front: line([-60, 40], [60, 40], 8), rows: 14, y0: 1.2, seat: letters, section: 10, concrete: '#a9a39b'});
  const top = Math.max(...main.topY);
  box(base, [0, 0, 58], [94, 9.5, 13], '#5b4636', {top: '#3f4246'});
  wall(base, line([-47, 51.4], [47, 51.4], 4), 4.5, 8.5, '#516a77', {mat: 'glass'});
  strip(base, line([-49, 50], [49, 50], 4), line([-49, 66], [49, 66], 4), 9.8, 9.8, '#2f3236', {thickness: 0.5});
  canopy(roof, line([-26, 50.5], [26, 50.5], 4), {depth: 12, y: top + 3.8, rise: 1.3, color: '#6f5039', mat: 'matte', under: '#b08a62'});
  for (const x of [-24, -8, 8, 24]) column(roof, [x, top, 39.5], 4.6, 0.3, '#8a6748', {mat: 'matte', sides: 4});
  const west = stand(base, {front: line([-57, -21], [-57, 21], 4), rows: 10, y0: 1.0, seat: purple, section: 10, concrete: '#a9a39b'});
  const wTop = Math.max(...west.topY);
  canopy(roof, offset(west.back, 0.5), {depth: 13, y: wTop + 3.6, rise: 1.4, color: '#4b3b2f', mat: 'matte', under: '#b08a62'});
  for (const z of [-19, -6, 6, 19]) column(roof, [-57.5, 0, z], wTop + 3.8, 0.3, '#8a6748', {mat: 'matte', sides: 4});
  floodlights(base, [[-50, -48], [0, -50], [50, -48], [-50, 70], [50, 70]], 26);
  treeLine(base, line([-120, 82], [120, 82], 10), 11, 'conifer', [24, 34], 1);
  treeLine(base, line([-125, 96], [125, 96], 10), 12, 'conifer', [26, 36], 2);
  treeLine(base, line([-96, -60], [-96, 60], 6), 11, 'conifer', [22, 32], 4);
  treeLine(base, line([-112, -64], [-112, 70], 6), 12, 'conifer', [24, 34], 5);
  treeLine(base, line([-60, -84], [70, -84], 6), 26, 'conifer', [20, 30], 3);
  return {radius: 88, target: 4, view: {azimuth: -48, elevation: 26, distance: 2.3}};
};

/**
 * Willoughby Community Park Stadium, Langley. Modular stadium (2023) on the
 * Langley Events Centre grounds: scaffold grandstands on the west, east and
 * south sides with light-grey seats and a row of tents along the top of the
 * west stand; the north end is open beside a small green-roofed pavilion.
 * +x = north.
 */
export const willoughbyStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(205, '#7fa564');
  ctx.field({kind: 'pitch', surface: 'turf', area: [112, 76]});
  const grey = '#c9ccd0';
  const w = bleachers(base, {front: line([-62, -40], [62, -40], 8), rows: 16, seat: grey});
  const wTop = Math.max(...w.topY);
  for (let x = -54; x <= 54; x += 12) {
    const z = -40 - 16 * 0.85 + 1.8;
    for (const [dx, dz] of [
      [-1.5, -1.5],
      [1.5, -1.5],
      [-1.5, 1.5],
      [1.5, 1.5],
    ]) column(roof, [x + dx, wTop, z + dz], 2.3, 0.06, '#d0d3d6', {sides: 4, cap: false});
    hipRoof(roof, [x, wTop + 2.3, z], 3.4, 3.4, 1.1, (x / 12) % 2 ? '#f3f3f1' : '#2d3e66');
  }
  bleachers(base, {front: line([-50, 40], [50, 40], 6), rows: 12, seat: grey});
  bleachers(base, {front: line([-59, -34], [-59, 34], 4), rows: 10, seat: grey});
  box(base, [68, 0, -50], [20, 4, 12], '#e3d9c0', {top: false});
  hipRoof(base, [68, 4, -50], 22, 14, 3, '#3d6b48');
  floodlights(base, [[-45, -54], [0, -56], [45, -54], [-45, 52], [0, 54], [45, 52]], 28);
  box(base, [10, 0, -150], [140, 18, 60], '#c4c7ca', {mat: 'panel', top: '#9fa3a7'});
  patch(base, {closed: true, pts: [[-70, -120], [90, -120], [90, -92], [-70, -92]]}, C.asphalt);
  treeLine(base, line([-110, 80], [110, 80], 10), 12, 'conifer', [16, 26], 6);
  treeLine(base, line([-110, -60], [-110, 70], 6), 13, 'deciduous', [10, 15], 7);
  return {radius: 88, target: 4, view: {azimuth: 140, elevation: 28, distance: 2.3}};
};
