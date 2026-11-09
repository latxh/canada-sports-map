import {rgb, shade, type Layer, type V3} from '../kit/core';
import {beam, box, canopy, column, patch, prism, screen, shell, stand, strip, treeLine, truss, wall} from '../kit/parts';
import {arc, join, line, obround, offset, resample, roundedRect, slice, superellipse, type Path} from '../kit/paths';
import {arenaBowl, C, floodlights} from './common';
import type {StadiumModelFn} from './types';

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Barrel-vault roof panel spanning z = ±rz between x0 and x1. */
function barrel(L: Layer, x0: number, x1: number, rz: number, eave: number, rise: number, color: string, ribs = 3) {
  const buf = L.m('metal');
  const seg = 16;
  const col = rgb(color);
  const at = (x: number, i: number): V3 => {
    const phi = -Math.PI / 2 + (i / seg) * Math.PI;
    return [x, eave + rise * Math.cos(phi), rz * Math.sin(phi)];
  };
  const xs = [x0, x0 + (x1 - x0) / 3, x0 + (2 * (x1 - x0)) / 3, x1];
  for (let k = 0; k < xs.length - 1; k++) {
    for (let i = 0; i < seg; i++) {
      buf.quad(at(xs[k], i), at(xs[k + 1], i), at(xs[k + 1], i + 1), at(xs[k], i + 1), shade(col, 0.94 + 0.08 * Math.cos(((i + 0.5) / seg) * Math.PI - 0.6)));
    }
  }
  // Panel edges (shows the step between panels) and arched ribs.
  for (const x of [x0, x1]) {
    for (let i = 0; i < seg; i++) {
      const a = at(x, i);
      const b = at(x, i + 1);
      buf.quad(a, b, [b[0], b[1] - 2.2, b[2]], [a[0], a[1] - 2.2, a[2]], shade(col, 0.72));
    }
  }
  for (let r = 1; r <= ribs; r++) {
    const x = x0 + ((x1 - x0) * r) / (ribs + 1);
    for (let i = 0; i < seg; i++) {
      const a = at(x, i);
      const b = at(x, i + 1);
      beam(L, [a[0], a[1] + 0.6, a[2]], [b[0], b[1] + 0.6, b[2]], 1.2, shade(col, 0.82));
    }
  }
}

/** Quarter-ellipsoid end panel: centre (cx, 0), depth a along ±x, half-width b. */
function cap(L: Layer, cx: number, dir: 1 | -1, a: number, b: number, eave: number, rise: number, color: string) {
  const buf = L.m('metal');
  const seg = 16;
  const rings = 7;
  const col = rgb(color);
  const at = (i: number, r: number): V3 => {
    const th = -Math.PI / 2 + (i / seg) * Math.PI;
    const v = Math.sin((r / rings) * (Math.PI / 2));
    return [cx + dir * a * v * Math.cos(th), eave + rise * Math.sqrt(Math.max(0, 1 - v * v)), b * v * Math.sin(th)];
  };
  for (let r = 0; r < rings; r++) {
    for (let i = 0; i < seg; i++) {
      buf.quad(at(i, r), at(i + 1, r), at(i + 1, r + 1), at(i, r + 1), shade(col, 0.9 + 0.12 * (1 - r / rings)));
    }
  }
  for (let i = 0; i < seg; i++) {
    const p = at(i, 0);
    const q = at(i + 1, 0);
    buf.quad(p, q, [q[0], q[1] - 2.2, q[2]], [p[0], p[1] - 2.2, p[2]], shade(col, 0.72));
  }
}

/**
 * Rogers Centre. Plan from the OSM footprint (≈221 × 218 m, round south end,
 * squared north end with the hotel). Roof from photos and Wikipedia: a fixed
 * north end panel, two barrel panels that slide north over it, and a south end
 * panel that swings 180° round the stadium to nest under the stack; 86 m high.
 * +x = north (centre field), −x = south (home plate).
 */
export const rogersCentre: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(250, '#a4a6a6');
  // Field: home plate ≈ 18 m inside the south seats, centre field toward the hotel.
  ctx.field({kind: 'diamond', surface: 'turf', area: [154, 160], dirtInfield: true, homeOffset: 21}, {x: 4});

  const blue = '#1f5394';
  const inner = superellipse(74, 78, 2.4, 72);
  const innerShifted: Path = {closed: true, pts: inner.pts.map(([x, z]) => [x + 2, z])};
  const lower = stand(base, {
    front: innerShifted,
    rows: (t) => 14 + 14 * ((1 - Math.cos(2 * Math.PI * t)) / 2),
    rowDepth: 0.8,
    y0: 1.3,
    seat: blue,
    section: 14,
    fascia: '#24425f',
    backTo: false,
  });
  const lowTop = Math.max(...lower.topY);
  const clubFront = offset(slice(lower.back, 0.12, 0.88), -2, [2, 0]);
  const club = stand(base, {front: clubFront, focus: [2, 0], rows: 8, rowDepth: 0.85, riser: 0.5, y0: lowTop + 3.4, seat: blue, section: 14, fascia: '#30363d', backTo: false});
  const clubTop = Math.max(...club.topY);
  wall(base, offset(club.back, 0.3, [2, 0]), clubTop, clubTop + 3.2, '#4f6170', {mat: 'glass'});
  stand(base, {front: offset(club.back, -2.5, [2, 0]), focus: [2, 0], rows: 17, rowDepth: 0.8, riser: 0.42, y0: clubTop + 3.6, seat: blue, section: 14, fascia: '#30363d', concrete: '#bdb9b0', backTo: 0});

  // Centre-field wall: hotel rooms and the restaurant over the field, video board above.
  wall(base, {pts: [[88, -62], [88, 62]], closed: false}, 0, 32, '#bdb9b0');
  wall(base, {pts: [[87.6, -36], [87.6, 36]], closed: false}, 4, 19, '#6f8694', {mat: 'glass'});
  box(base, [88.5, 20, 0], [1.5, 10.4, 34.5], '#24272b');
  base.m('glow').quad([87.5, 20.3, -17], [87.5, 20.3, 17], [87.5, 30.1, 17], [87.5, 30.1, -17], rgb('#3f6db0'));

  // Drum walls.
  const drum = obround(62, 50, 111, 20);
  wall(base, drum, 0, 5, '#3f4b55', {mat: 'glass'});
  const bands: [number, number, string][] = [
    [5, 12, C.precast],
    [12, 12.7, '#8e9195'],
    [12.7, 19, C.precast],
    [19, 19.7, '#8e9195'],
    [19.7, 26, C.precast],
    [26, 26.7, '#8e9195'],
    [26.7, 31, C.precast],
    [31, 33, '#b5b2aa'],
  ];
  for (const [y0, y1, c] of bands) wall(base, drum, y0, y1, c, {mat: c === C.precast ? 'panel' : 'matte'});
  strip(base, offset(drum, -6, [0, 0]), drum, 33, 33, '#a9a69f');
  // Roof tracks along the straight sides.
  for (const z of [-110, 110]) beam(base, [-62, 34, z], [114, 34, z], 1.6, '#8f959b');

  // North block: offices, hotel and the squared north corners.
  prism(base, {closed: true, pts: [[86, -111], [114, -111], [114, 111], [86, 111]]}, 0, 32, C.precast, {mat: 'panel', top: '#a9a8a3'});
  prism(base, {closed: true, pts: [[102, -40], [115, -40], [115, 40], [102, 40]]}, 32, 46, '#7f99a6', {mat: 'glass', top: '#9c9b96'});
  wall(base, {pts: [[114.2, -105], [114.2, 105]], closed: false}, 6, 30, '#7c95a3', {mat: 'glass', colorAt: (t) => (Math.floor(t * 14) % 2 ? '#7c95a3' : '#d3d0c7')});

  // Roof: fixed north panel in the roof layer, the three moving panels in their own layers.
  const eave = 33.5;
  cap(roof, 62, 1, 47, 108, eave, 49, '#cfd3d6');
  const p2 = ctx.layer('p2', {roof: true});
  const p3 = ctx.layer('p3', {roof: true});
  const p4 = ctx.layer('p4', {roof: true});
  barrel(p2, 0, 62, 108, eave, 51, '#d6dadd');
  barrel(p3, -62, 0, 108.5, eave, 52.5, '#cbd0d3');
  cap(p4, -62, -1, 47, 108, eave, 47, '#d1d5d8');

  return {
    radius: 118,
    target: 20,
    view: {azimuth: 205, elevation: 30, distance: 2.3},
    animateRoof: (layers, t) => {
      const s1 = smooth(t / 0.55);
      const s2 = smooth((t - 0.45) / 0.55);
      layers.p2?.position.set(44 * s1, 2.5 * s1, 0);
      layers.p3?.position.set(106 * s1, 5 * s1, 0);
      if (layers.p4) {
        layers.p4.rotation.y = Math.PI * s2;
        layers.p4.position.y = -1.5 * s2;
      }
    },
  };
};

const rotAbout = (x: number, z: number, a: number): [number, number] => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];

/**
 * Scotiabank Arena. A dark metal arena box (≈125 × 95 m) set at a slight angle
 * inside the Art Deco shell of the 1941 Toronto Postal Delivery Building, which
 * still fronts Bay Street (east) and Lake Shore Boulevard (south); a glass
 * atrium with a big screen faces Maple Leaf Square (west) and the Gardiner
 * Expressway passes just south. +x = east, +z = south.
 */
export const scotiabankArena: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(200, '#9a9c9d');
  patch(base, {closed: true, pts: [[-150, -70], [-82, -70], [-82, 60], [-150, 60]]}, C.plaza);
  arenaBowl(ctx, {lowerSeats: ctx.team.seat, upperSeats: ctx.team.seat});

  const shell = roundedRect(130, 100, 18, 5);
  wall(base, shell, 0, 12, '#46505a', {mat: 'glass'});
  wall(base, shell, 12, 36, '#3a3e44', {mat: 'panel'});
  wall(base, shell, 36, 37.5, '#2c2f34');
  wall(base, {pts: [[-65.3, -26], [-65.3, 26]], closed: false}, 32, 35, '#c8102e');
  shell2(roof, shell, 37.5, 5.5, '#6a7077');

  // Postal Delivery Building: limestone L along Bay St and Lake Shore, turned ≈11° to the arena.
  const a = -0.19;
  const lime = '#d9cfb7';
  const east = rotAbout(73, -4, a);
  const south = rotAbout(6, 58, a);
  box(base, [east[0], 0, east[1]], [22, 22, 124], lime, {rot: a, top: '#bfb8a6'});
  box(base, [south[0], 0, south[1]], [156, 22, 22], lime, {rot: a, top: '#bfb8a6'});
  // Vertical window bays and the cornice.
  for (let i = -8; i <= 8; i++) {
    const p0 = rotAbout(84.2, i * 7 - 1.5, a);
    const p1 = rotAbout(84.2, i * 7 + 1.5, a);
    wall(base, {pts: [p0, p1], closed: false}, 3, 19, '#58818a', {mat: 'glass', tile: [3, 4]});
  }
  for (let i = -10; i <= 10; i++) {
    const p0 = rotAbout(i * 7 - 1.5, 69.2, a);
    const p1 = rotAbout(i * 7 + 1.5, 69.2, a);
    wall(base, {pts: [p0, p1], closed: false}, 3, 19, '#58818a', {mat: 'glass', tile: [3, 4]});
  }
  const corner = [rotAbout(84.25, 52, a), rotAbout(84.25, 69.25, a), rotAbout(70, 69.25, a)] as [number, number][];
  for (const y of [5, 9, 13, 17]) wall(base, {pts: corner, closed: false}, y, y + 1.6, '#4d6f78', {mat: 'glass'});

  // Maple Leaf Square atrium and screen; Air Canada office tower to the north-east.
  box(base, [-71, 0, 0], [16, 26, 72], '#6e8ea0', {mat: 'glass', top: '#4a4f55'});
  screen(base, [-79.2, 9, 0], 15.2, 9.1, Math.PI, {face: '#2f63b0', depth: 0.6});
  box(base, [62, 0, -66], [32, 64, 28], '#6a8798', {mat: 'glass', top: '#53595f'});
  box(base, [20, 0, -54], [80, 10, 12], '#7d98a6', {mat: 'glass', top: '#8c9094'});

  // The Gardiner Expressway on its columns, just south of Lake Shore.
  strip(base, line([-200, 96], [200, 96], 8), line([-200, 120], [200, 120], 8), 13, 13, '#b4b1aa', {thickness: 1.6});
  for (let x = -195; x <= 195; x += 30) {
    column(base, [x, 0, 101], 11.4, 1.1, '#a9a69f', {mat: 'matte', sides: 6});
    column(base, [x, 0, 115], 11.4, 1.1, '#a9a69f', {mat: 'matte', sides: 6});
  }
  return {radius: 92, target: 14, view: {azimuth: 38, elevation: 28, distance: 2.4}};
};

/** Shallow dome over an outline (arena roofs). */
function shell2(L: Layer, outline: Path, y: number, rise: number, color: string, mat: 'metal' | 'matte' = 'metal') {
  shell(L, outline, (_x, _z, s) => y + rise * Math.sin((s * Math.PI) / 2), (_x, _z, s) => shade(color, 0.92 + 0.12 * s), {rings: 5, mat});
}

/**
 * BMO Field. OSM pitch 128 × 70 m inside a 200 × 179 m stadium. Two-tier west
 * and east stands under canopies hung from long white arch trusses (2016), a
 * lower bowl wrapping the south end, a small north end stand and scoreboard.
 * Red seats. +x = north, −z = west.
 */
export const bmoField: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(235, '#8e9293');
  ctx.field({kind: ctx.kindFor({football: 'cfl'}, 'pitch'), surface: 'hybrid', area: [150, 80]});
  const red = '#b8222e';
  const u = join(line([62, -41], [-62, -41], 6), arc(-62, -26, 15, -Math.PI / 2, -Math.PI, 5), line([-77, -26], [-77, 26], 3), arc(-62, 26, 15, Math.PI, Math.PI / 2, 5), line([-62, 41], [62, 41], 6));
  stand(base, {front: u, rows: 24, y0: 1.2, seat: red, section: 15, concrete: '#c2c0ba', fascia: '#2f3338'});
  const wUp = stand(base, {front: line([-58, -59], [58, -59], 6), rows: 20, y0: 15.4, riser: 0.46, seat: red, section: 15, concrete: '#cfd1d2', fascia: '#2f3338'});
  const eUp = stand(base, {front: line([-58, 60], [58, 60], 6), rows: 22, y0: 16.2, riser: 0.46, seat: red, section: 15, concrete: '#cfd1d2', fascia: '#2f3338'});
  for (const s of [wUp, eUp]) wall(base, offset(s.back, 0.3), 0, Math.max(...s.topY), '#d9dbdc', {mat: 'panel'});
  wall(base, offset(eUp.back, 0.4), 21, 25, '#b5202e');
  stand(base, {front: line([77, -30], [77, 30], 4), rows: 14, y0: 1.0, seat: red, section: 15, concrete: '#c2c0ba', fascia: '#2f3338'});
  screen(base, [93, 9, 0], 26, 10, Math.PI, {legs: true, face: '#c8102e'});

  // Canopies and the arch trusses they hang from.
  const wC = canopy(roof, offset(wUp.back, 0.5), {depth: 31, y: 27.5, rise: 2.2, color: C.roofWhite, mat: 'matte', under: '#aeb3b8'});
  const eC = canopy(roof, offset(eUp.back, 0.5), {depth: 33, y: 29.5, rise: 2.2, color: C.roofWhite, mat: 'matte', under: '#aeb3b8'});
  canopy(roof, line([-98, -38], [-98, 38], 4), {depth: 19, y: 15, rise: 1.5, color: C.roofWhite, mat: 'matte', under: '#aeb3b8'});
  for (const [z, y] of [
    [-67, 30],
    [70, 32],
  ]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 16; i++) {
      const x = -84 + (168 * i) / 16;
      pts.push([x, y + 19 * (1 - (x / 84) ** 2), z]);
    }
    truss(roof, pts, 3.2, '#f4f5f5', {chord: 0.9, web: 0.4});
    for (let i = 2; i <= 14; i += 2) roof.line(pts[i], [pts[i][0], y, z]);
  }
  for (const c of [wC, eC]) {
    const pts = c.inner.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      roof.m('glow').quad([x0, 28.2, z0], [x1, 28.2, z1], [x1, 28.9, z1], [x0, 28.9, z0], rgb('#fff3cf'));
    }
  }
  return {radius: 110, target: 8, view: {azimuth: 230, elevation: 32, distance: 2.3}};
};

/**
 * York Lions Stadium. Built as the 2015 Pan Am athletics stadium; the track was
 * removed in 2021 for a larger turf field, inside the old oval. One covered
 * main grandstand (≈151 m, red seats) on the west side. +x = north.
 */
export const yorkLions: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(190, C.grass);
  patch(base, obround(42, 46, 46), '#55595d');
  ctx.field({kind: 'pitch', surface: 'turf', area: [128, 84]});
  const s = stand(base, {front: line([-70, -50], [70, -50], 8), rows: 20, y0: 1.6, seat: '#c4262e', section: 14, concrete: '#c4c1ba', fascia: '#3b3f45'});
  const top = Math.max(...s.topY);
  box(base, [0, 0, -72.5], [150, 12, 9], '#cfccc5', {mat: 'panel', top: '#9fa2a5'});
  box(base, [0, top, -64], [26, 4, 5], '#5a7686', {mat: 'glass', top: '#55595e'});
  const c = canopy(roof, offset(s.back, 1), {depth: 16, y: top + 4.5, rise: 1.4, color: '#dcdfe1'});
  const front = c.inner.pts.map(([x, z]): V3 => [x, top + 5.9, z]);
  truss(roof, resample({pts: front.map(([x, , z]) => [x, z] as [number, number]), closed: false}, 7).pts.map(([x, z]): V3 => [x, top + 6.6, z]), 1.8, '#c9cdd1', {chord: 0.45, web: 0.25});
  for (let x = -66; x <= 66; x += 13.2) column(roof, [x, 0, -67.5], top + 4.6, 0.35, '#9aa1a8', {sides: 6});
  floodlights(base, [[-58, -62], [0, -64], [58, -62], [-58, 60], [0, 60], [58, 60]], 30);
  treeLine(base, line([-110, 70], [110, 70], 10), 13, 'deciduous', [10, 15], 2);
  treeLine(base, line([118, -70], [118, 70], 6), 14, 'deciduous', [10, 15], 5);
  treeLine(base, line([-118, -70], [-118, 70], 6), 14, 'deciduous', [10, 15], 7);
  return {radius: 100, target: 4, view: {azimuth: 125, elevation: 28, distance: 2.2}};
};
