import {hash2, type V2} from '../kit/core';
import {beam, container, hill, prism, stand, tent, tree, wall} from '../kit/parts';
import {line, roundedRect, transform} from '../kit/paths';
import {bleachers, floodlights, patio} from './common';
import type {StadiumModelFn} from './types';

/**
 * Wanderers Grounds, Halifax. A modular stadium on the historic grounds between
 * Citadel Hill and the Public Gardens: aluminium bleachers on the north side
 * with a marquee behind, a line of shipping containers and a patio along the
 * south side, timber deck terraces in the south-east corner and a two-storey
 * container stack at the east end. Grass pitch. +x = east, −z = north.
 */
export const wanderersGrounds: StadiumModelFn = (ctx) => {
  const {base} = ctx;
  ctx.ground(290, '#7fa564');
  // Citadel Hill and its star fort.
  hill(base, 0, -232, 230, 100, 34, '#86a85e', {sides: 22, rings: 6});
  const star: V2[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 30 : 48;
    const a = (i / 10) * Math.PI * 2;
    star.push([Math.cos(a) * r, -232 + Math.sin(a) * r * 0.75]);
  }
  prism(base, {pts: star, closed: true}, 32, 37, '#a49e90', {top: '#8fae67'});
  // Public Gardens trees to the south.
  for (let i = 0; i < 70; i++) {
    const x = -130 + hash2(i, 1) * 190;
    const z = 92 + hash2(i, 2) * 120;
    if (Math.hypot(x, z) < 250) tree(base, x, z, 9 + hash2(i, 3) * 7, hash2(i, 4) > 0.75 ? 'conifer' : 'deciduous', i);
  }
  ctx.field({kind: 'pitch', surface: 'grass', area: [112, 76]});
  const alu = '#d5d8db';
  bleachers(base, {front: line([-50, -40], [14, -40], 6), rows: 16, seat: alu});
  bleachers(base, {front: line([22, -40], [52, -40], 4), rows: 10, seat: alu});
  tent(base, [-18, -64], 56, 11, 4, 3, '#f4f4f2');
  const colors = ['#e8eaec', '#3b6ea8', '#cfd5db', '#e8eaec', '#2f4f7a'];
  for (let i = 0; i < 8; i++) container(base, [-48 + i * 12.6, 0, 44], 0, colors[i % colors.length]);
  patio(base, [-46, 39.5], [40, 39.5], 14);
  stand(base, {front: line([30, 37], [56, 37], 3), rows: 6, y0: 0.5, riser: 0.42, rowDepth: 1.1, seat: '#8a5a3a', concrete: '#73492f', fascia: '#73492f', section: 0});
  for (let i = 0; i < 4; i++) container(base, [63, 0, -26 + i * 12.8], Math.PI / 2, colors[(i + 1) % colors.length]);
  for (let i = 0; i < 3; i++) container(base, [63, 2.6, -19.6 + i * 12.8], Math.PI / 2, colors[(i + 3) % colors.length]);
  wall(base, line([61.6, -26], [61.6, 20]), 5.2, 6.3, '#2f3338');
  beam(base, [67, 0, 26], [67, 5.2, 16], 1.2, '#4a4f55');
  // The old horse ring at the west end.
  const ring = transform(roundedRect(40, 30, 6, 3), {x: -98, z: 12});
  base.m('matte').flatPolygon(ring.pts, 0.02, [0.42, 0.3, 0.2]);
  floodlights(base, [[-60, -48], [60, -48], [-60, 50], [60, 50]], 26);
  return {radius: 90, target: 3, view: {azimuth: 135, elevation: 30, distance: 2.05}};
};
