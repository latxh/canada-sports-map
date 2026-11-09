import {rgb, shade, type V3} from '../kit/core';
import {beam, box, canopy, column, screen, shell, stand, strip, truss, wall} from '../kit/parts';
import {line, offset, roundedRect, slice} from '../kit/paths';
import {arenaBowl} from './common';
import type {StadiumModelFn} from './types';

/**
 * Canada Life Centre. Fills a downtown block (OSM 150 × 101 m) on the old Eaton's
 * site: red-brick walls (a nod to the store) with tall glass bays, a glass
 * clerestory under a projecting cornice, the arena volume and its shallow dome
 * behind, and the glass rotunda at Portage and Donald. Smallest NHL arena.
 * +z = Portage Avenue.
 */
export const canadaLifeCentre: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(190, '#9a9c9d');
  arenaBowl(ctx, {lowerSeats: '#1f3360', upperSeats: '#1f3360', upperRows: 16});
  const block = roundedRect(150, 101, 0);
  wall(base, block, 0, 18, '#9a3f2c', {mat: 'panel', tile: [3, 3]});
  for (let i = -6; i <= 6; i++) wall(base, line([i * 10.6 - 2.2, 50.7], [i * 10.6 + 2.2, 50.7]), 2, 16.5, '#5e7f8e', {mat: 'glass', tile: [2, 4]});
  for (let i = -4; i <= 4; i++) wall(base, line([-75.2, i * 10.6 - 2.2], [-75.2, i * 10.6 + 2.2]), 2, 16.5, '#5e7f8e', {mat: 'glass', tile: [2, 4]});
  wall(base, roundedRect(147, 98, 0), 18, 23, '#7d98a4', {mat: 'glass'});
  strip(base, roundedRect(147, 98, 0), roundedRect(156, 107, 0), 23.6, 23.6, '#4c5157', {thickness: 1.1});
  base.m('matte').flatPolygon(roundedRect(147, 98, 0).pts, 23.5, rgb('#8d9196'));
  const arena = roundedRect(124, 90, 20, 5);
  wall(base, arena, 23.5, 30, '#b9bcbf', {mat: 'panel'});
  shell(roof, arena, (_x, _z, s) => 30 + 5.5 * Math.sin((s * Math.PI) / 2), (_x, _z, s) => shade('#c3c7ca', 0.92 + 0.1 * s), {rings: 5, mat: 'metal'});
  column(base, [71, 0, 46], 24, 6.5, '#86a9b8', {mat: 'glass', sides: 16});
  column(base, [71, 24, 46], 1.6, 9.5, '#4a4f55', {mat: 'matte', sides: 16});
  box(base, [-92, 6, -12], [32, 4.5, 5], '#7d9cab', {mat: 'glass', top: '#8d9196'});
  return {radius: 92, target: 12, view: {azimuth: 52, elevation: 26, distance: 2.4}};
};

/**
 * Princess Auto Stadium (2013), University of Manitoba. A full bowl of navy seats
 * (OSM 263 × 194 m outside) with two sweeping roofs over the sideline upper
 * tiers, hung from white arch trusses 187 m long that rise from 31 m to 61 m,
 * landing on steel diagrids at the corners. Open ends: the big Princess Auto
 * sign box to the south, a video board to the north. +x = north.
 */
export const princessAutoStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(265, '#8f9393');
  ctx.field({kind: ctx.kindFor({soccer: 'pitch'}, 'cfl'), surface: 'turf', area: [150, 74]});
  const navy = '#1f2e57';
  const lower = stand(base, {front: roundedRect(170, 84, 30, 6), rows: 28, y0: 1.5, seat: navy, section: 12, fascia: '#2a3a66', concrete: '#c5c9cd'});
  const lowTop = Math.max(...lower.topY);
  const ring = offset(lower.back, -3);
  for (const [f0, f1, s] of [
    [0.07, 0.43, 1],
    [0.57, 0.93, -1],
  ] as [number, number, number][]) {
    const up = stand(base, {front: slice(ring, f0, f1, 4), rows: 26, y0: lowTop + 4.5, riser: 0.5, seat: navy, section: 12, fascia: '#2a3a66', concrete: '#c5c9cd'});
    const top = Math.max(...up.topY);
    wall(base, offset(up.back, 0.3), 0, top, '#c4c9ce', {mat: 'panel'});
    canopy(roof, offset(up.back, 1), {
      depth: (t) => 22 + 8 * Math.sin(Math.PI * t),
      y: (t) => top - 2 + 12 * Math.sin(Math.PI * t),
      rise: 4,
      color: '#d9dcdf',
      under: '#8f969c',
      thickness: 1.4,
    });
    const z = s * 58;
    const pts: V3[] = [];
    for (let i = 0; i <= 18; i++) {
      const x = -93 + (186 * i) / 18;
      pts.push([x, 31 + 30 * (1 - (x / 93) ** 2), z]);
    }
    truss(roof, pts, 5, '#f2f3f3', {chord: 1.3, web: 0.55});
    for (const ex of [-93, 93]) {
      const top3: V3 = [ex, 31, z];
      beam(base, [ex * 1.08, 0, z - 9], top3, 1.4, '#e6e8ea');
      beam(base, [ex * 1.08, 0, z + 9], top3, 1.4, '#e6e8ea');
      beam(base, [ex * 1.03, 0, z], top3, 1.2, '#e6e8ea');
    }
  }
  box(base, [-112, 10, 0], [10, 14, 64], '#f2f2f0', {top: '#d7d9db'});
  base.m('glow').quad([-106.9, 14, -26], [-106.9, 14, 26], [-106.9, 19, 26], [-106.9, 19, -26], rgb('#3a64a8'));
  for (const z of [-24, 0, 24]) column(base, [-112, 0, z], 10, 1, '#9aa0a6', {sides: 6});
  screen(base, [110, 6, 0], 32, 12, Math.PI, {legs: true, face: '#2f5aa8'});
  return {radius: 125, target: 12, view: {azimuth: 200, elevation: 34, distance: 2.2}};
};
