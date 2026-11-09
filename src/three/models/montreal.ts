import {hash2, rgb, type V2, type V3} from '../kit/core';
import {alongBands, box, canopy, column, hill, patch, screen, shell, stand, tree, treeLine, truss, vault, wall} from '../kit/parts';
import {arc, join, line, obround, offset, resample, type Path} from '../kit/paths';
import {arenaBowl, bleachers, C, floodlights, parking} from './common';
import type {StadiumModelFn} from './types';

/** Rectangle with chamfered corners, centred on the origin. */
function chamfered(w: number, d: number, c: number): Path {
  const x = w / 2;
  const z = d / 2;
  return {
    closed: true,
    pts: [
      [x - c, -z],
      [x, -z + c],
      [x, z - c],
      [x - c, z],
      [-x + c, z],
      [-x, z - c],
      [-x, -z + c],
      [-x + c, -z],
    ],
  };
}

/**
 * Bell Centre. A 146 × 107 m box with cut corners (OSM), terracotta panel walls
 * under a dark top band, glass at the corners, a very low hip roof, the beige
 * entrance tower with the Centre Bell sign, a grey metal volume on the east side
 * and the plaza to the south. Three tiers inside: the reds, the club level and
 * the 300s. +x = east, +z = south.
 */
export const bellCentre: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(190, '#9b9d9e');
  patch(base, {closed: true, pts: [[-70, 54], [30, 54], [30, 92], [-70, 92]]}, '#ad7d66');
  arenaBowl(ctx, {lowerSeats: '#c3202f', clubRows: 6, clubSeats: '#cfd0cc', upperSeats: '#2c4f8f', lowerRows: 22, upperRows: 16});

  const outline = chamfered(146, 107, 16);
  wall(base, outline, 0, 6, '#3c4a55', {mat: 'glass'});
  wall(base, outline, 6, 32, '#b5653f', {mat: 'panel', tile: [6, 6]});
  wall(base, outline, 32, 40, '#363a40', {mat: 'panel'});
  // Glass at the cut corners and the middle of the long sides.
  const cut = offset(outline, 0.25, [0, 0]);
  for (let i = 0; i < 8; i += 2) wall(base, {pts: [cut.pts[i], cut.pts[i + 1]], closed: false}, 6, 32, '#405866', {mat: 'glass'});
  for (const z of [-53.8, 53.8]) wall(base, line([-22, z], [22, z]), 6, 32, '#405866', {mat: 'glass'});
  // Low hip roof (ridge along x).
  shell(
    roof,
    outline,
    (x, z) => 40 + 6.5 * Math.max(0, Math.min(1 - Math.abs(z) / 53.5, (73 - Math.abs(x)) / 53.5)),
    (x, z) => (Math.abs(z) / 53.5 > (Math.abs(x) - 19.5) / 53.5 ? (z > 0 ? '#cdd1d5' : '#bfc3c8') : '#c6cacf'),
    {rings: 6, mat: 'metal'},
  );
  // Entrance tower with the sign, grey metal volume, the three silver flues.
  box(base, [-62, 0, 47], [15, 47, 15], '#d6c8ab', {top: '#b7ab93'});
  base.m('glow').quad([-69, 40, 54.7], [-55, 40, 54.7], [-55, 44, 54.7], [-69, 44, 54.7], rgb('#2f63b0'));
  box(base, [56, 30, 0], [32, 17, 72], '#bcc1c6', {mat: 'panel', top: '#9ea3a8'});
  for (const z of [-9, 0, 9]) column(base, [-75.5, 0, z], 46, 1.3, '#cdd1d5', {sides: 10});
  return {radius: 92, target: 14, view: {azimuth: 125, elevation: 30, distance: 2.4}};
};

/**
 * Saputo Stadium. OSM: pitch 110 × 69 m; a west main stand (108 × 30 m) under a
 * deep canopy, and one U-shaped stand round the south end, the east side and the
 * north end under a continuous canopy with trusses on top (2012 expansion).
 * The two west corners stay open; clubhouse at the south-west. +x = north.
 */
export const stadeSaputo: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(200, '#8f9496');
  patch(base, {closed: true, pts: [[-80, -70], [80, -70], [80, 62], [-80, 62]]}, C.grassDark);
  ctx.field({kind: 'pitch', surface: 'grass', area: [118, 76]});
  const blue = '#24508f';
  const w = stand(base, {front: line([-54, -40], [54, -40], 6), rows: 22, y0: 1.2, seat: blue, section: 13, concrete: '#c3c1bb'});
  const wTop = Math.max(...w.topY);
  canopy(roof, offset(w.back, 0.5), {depth: 22, y: wTop + 5, rise: 1.6, color: '#e4e7e9', under: '#a2a8ae'});
  for (let x = -50; x <= 50; x += 12.5) column(roof, [x, 0, -59.5], wTop + 5, 0.4, '#9aa1a8', {sides: 6});
  const u = join(line([-60, -31], [-60, 28], 4), arc(-46, 28, 14, Math.PI, Math.PI / 2, 5), line([-46, 42], [46, 42], 6), arc(46, 28, 14, Math.PI / 2, 0, 5), line([60, 28], [60, -31], 4));
  const us = stand(base, {front: u, rows: 24, y0: 1.2, seat: blue, section: 13, concrete: '#c3c1bb'});
  const uTop = Math.max(...us.topY);
  const uc = canopy(roof, offset(us.back, 0.5), {depth: 17, y: uTop + 4, rise: 1.2, color: '#e4e7e9', under: '#a2a8ae'});
  const mid = resample({pts: uc.inner.pts.map(([x, z], i) => [(x + uc.outer.pts[i][0]) / 2, (z + uc.outer.pts[i][1]) / 2] as V2), closed: false}, 9);
  truss(roof, mid.pts.map(([x, z]): V3 => [x, uTop + 8.4, z]), 3, '#cdd2d6', {chord: 0.45, web: 0.3});
  box(base, [-63, 0, -52], [24, 9, 18], '#e5e6e3', {top: '#a9acaf'});
  wall(base, line([-75.1, -60], [-75.1, -44]), 4, 7.5, '#4f6878', {mat: 'glass'});
  screen(roof, [-80, uTop + 5, 0], 18, 7, 0, {face: '#2f5fae'});
  floodlights(base, [[-62, -50], [62, -50], [-74, 58], [74, 58]], 34);
  return {radius: 92, target: 6, view: {azimuth: 215, elevation: 30, distance: 2.3}};
};

/**
 * Percival Molson Memorial Stadium. On the slope of Mount Royal; a red running
 * track around the CFL field (the track cuts the end-zone corners). Big old
 * concrete grandstand on one side with a canopy over its top rows, steel-framed
 * aluminium two-tier stand (2010 upper tier) on the other, a curved north end
 * stand, and McGill buildings beyond the open south end. +x = north, −z = west.
 */
export const molsonStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(270, '#8c9190');
  // Mount Royal rises to the north-west.
  const hx = 70;
  const hz = -255;
  const rx = 260;
  const rz = 150;
  const hh = 75;
  hill(base, hx, hz, rx, rz, hh, '#5e8a4b', {sides: 22, rings: 7});
  for (let i = 0; i < 150; i++) {
    const a = hash2(i, 11) * Math.PI * 2;
    const r = Math.sqrt(hash2(i, 12)) * 0.92;
    const x = hx + Math.cos(a) * rx * r;
    const z = hz + Math.sin(a) * rz * r;
    if (Math.hypot(x, z) > 255 || z > -95) continue;
    const s = 1 - r;
    const y = hh * ((1 - Math.cos(s * Math.PI)) / 2) - 1;
    tree(base, x, z, 10 + hash2(i, 13) * 8, hash2(i, 14) > 0.7 ? 'conifer' : 'deciduous', i, y);
  }
  patch(base, obround(52, 48, 48, 18), '#a29e96', 0.012);
  patch(base, obround(52, 33, 33, 18), '#3f8f45', 0.018);
  ctx.field({kind: ctx.kindFor({soccer: 'pitch'}, 'cfl'), surface: 'turf', area: [142, 64]});
  // Red track (drawn over the field: it cuts the end-zone corners, as at the real stadium).
  const tin = obround(52, 33, 33, 18);
  const tout = obround(52, 40.5, 40.5, 18);
  for (let i = 0; i < tin.pts.length; i++) {
    const k = (i + 1) % tin.pts.length;
    base.m('matte').quad([tin.pts[i][0], 0.05, tin.pts[i][1]], [tin.pts[k][0], 0.05, tin.pts[k][1]], [tout.pts[k][0], 0.05, tout.pts[k][1]], [tout.pts[i][0], 0.05, tout.pts[i][1]], rgb('#b4543d'));
  }
  const alu = '#c9ccce';
  // East: the big concrete grandstand, curving round the north-east corner.
  const east = stand(base, {front: join(line([-62, 47], [52, 47], 6), arc(52, 0, 47, Math.PI / 2, 0.85, 4)), rows: 34, y0: 2.0, seat: alu, section: 12, concrete: '#b3ada2', fascia: '#8d8a84', aisleColor: '#a9a59d'});
  const eTop = Math.max(...east.topY);
  canopy(roof, line([-62, 47 + 34 * 0.85 + 0.6], [50, 47 + 34 * 0.85 + 0.6], 6), {depth: 10, y: eTop + 4, rise: 0.8, color: '#d9dcde', under: '#8f969c'});
  box(base, [-6, eTop, 47 + 34 * 0.85 - 2.5], [56, 3.8, 4], '#5c7584', {mat: 'glass', top: '#9fa3a6'});
  for (let x = -60; x <= 48; x += 12) column(roof, [x, eTop, 47 + 34 * 0.85 + 0.2], 4, 0.25, '#8d939a', {sides: 4});
  // West: steel-framed aluminium stands, red seats in the middle of the lower tier.
  const wl = stand(base, {front: line([-58, -47], [52, -47], 6), rows: 14, y0: 1.0, seat: alongBands([[0.3, alu], [0.7, '#c4262e'], [1, alu]]), section: 12, concrete: '#a7abaf', backTo: false});
  const wlTop = Math.max(...wl.topY);
  const wu = stand(base, {front: line([-55, -58.5], [49, -58.5], 6), rows: 18, y0: wlTop + 5, seat: alu, section: 12, concrete: '#a7abaf', backTo: false});
  for (const st of [wl, wu]) {
    resample(st.back, 8).pts.forEach(([x, z]) => column(base, [x, 0, z], Math.max(...st.topY), 0.3, '#7f868d', {sides: 4, cap: false}));
  }
  bleachers(base, {front: arc(52, 0, 47, -Math.PI / 2, 0.42, 7), rows: 16, seat: alu});
  // South end: McGill buildings and the scoreboard.
  box(base, [-113, 0, -40], [28, 22, 40], '#a7a092', {top: '#8b8f93'});
  box(base, [-120, 0, 8], [26, 16, 46], '#9d978a', {top: '#7f8488'});
  box(base, [-110, 0, 55], [24, 26, 30], '#aaa395', {top: '#8b8f93'});
  screen(base, [-98.6, 11, -40], 18, 7, 0, {face: '#c4262e'});
  floodlights(base, [[-72, -70], [72, -66], [-72, 76], [72, 78]], 36);
  treeLine(base, line([-80, 105], [90, 105], 10), 15, 'deciduous', [10, 14], 4);
  return {radius: 108, target: 8, view: {azimuth: 140, elevation: 30, distance: 2.3}};
};

/**
 * Stade Boréale (Centre sportif Bois-de-Boulogne, Laval). Modular grandstands
 * round the main turf field (5,581 seats): seats behind the benches and an
 * elevated platform of boxes and press gallery on the west side, new bleachers
 * on the east, the giant screen behind the north goal (2026 layout). Next to the
 * complex's white indoor soccer domes. +x = north.
 */
export const stadeBoreale: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(210, C.grass);
  parking(base, [-20, -125], 170, 50);
  ctx.field({kind: 'pitch', surface: 'turf', area: [114, 76]});
  const grey = '#c9ccd0';
  stand(base, {front: line([-38, -41], [38, -41], 6), rows: 9, y0: 0.9, riser: 0.42, seat: '#4c5157', section: 12, concrete: '#9ca0a4'});
  box(base, [0, 7.2, -52.5], [58, 4.6, 6.5], '#41566a', {mat: 'glass', top: '#3a3e44'});
  box(base, [0, 11.8, -52.5], [60, 0.8, 8], '#3a3e44');
  for (let x = -27; x <= 27; x += 9) column(base, [x, 0, -52.5], 7.2, 0.3, '#7f868d', {sides: 4});
  bleachers(base, {front: line([-50, 41], [50, 41], 6), rows: 14, seat: grey});
  bleachers(base, {front: line([-60, -31], [-60, 31], 4), rows: 10, seat: grey});
  bleachers(base, {front: line([60, -42], [60, -20], 2), rows: 6, seat: grey});
  screen(base, [64, 4.5, 6], 12, 7, Math.PI, {legs: true, face: '#2b62b4'});
  floodlights(base, [[-58, -50], [0, -64], [58, -50], [-58, 52], [0, 54], [58, 52]], 26);
  // The complex: indoor domes and the brick building.
  vault(base, [0, 0, 120], 120, 64, 22, '#f2f3f2', {mat: 'matte', ends: '#e4e6e5', seg: 14});
  vault(base, [-115, 0, 120], 70, 50, 17, '#eef0ef', {mat: 'matte', ends: '#e0e2e1', seg: 12});
  box(base, [95, 0, 120], [50, 10, 46], '#a24d36', {top: '#8b8f93'});
  patch(base, {closed: true, pts: [[-75, 60], [75, 60], [75, 84], [-75, 84]]}, C.asphalt);
  void roof;
  return {radius: 92, target: 4, view: {azimuth: 215, elevation: 32, distance: 2.4}};
};

