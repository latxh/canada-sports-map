import {box, canopy, gableRoof, lightPole, screen, stand, wall} from '../kit/parts';
import {line, offset} from '../kit/paths';

import type {StadiumModelFn} from './types';

/**
 * Hamilton Stadium (Tim Hortons Field). OSM: pitch 139 × 61 m between two
 * separate sideline stands, no end stands. The west stand has two tiers, suites
 * and a flat roof with the lights on it; the east stand is one deep open tier
 * with floodlight masts along its back. Grey seats with gold tier fronts; the
 * stadium sits among the houses of the Lansdale/Stipley neighbourhood.
 * +x = north, −z = west.
 */
export const hamiltonStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(245, '#8e9293');
  // Neighbourhood houses on the surrounding blocks.
  for (const z of [-150, -170, 150, 170]) {
    for (let x = -200; x <= 200; x += 13) {
      if (Math.hypot(x, z) > 236) continue;
      const h = 6 + ((x * 7 + z) % 3);
      box(base, [x, 0, z], [9, h, 11], ((x + z) / 13) % 2 ? '#c9bba5' : '#b5a68f', {top: false});
      gableRoof(base, [x, h, z], 9, 11, 3, '#5d5249', Math.PI / 2, 0.6);
    }
  }
  ctx.field({kind: ctx.kindFor({soccer: 'pitch'}, 'cfl'), surface: 'turf', area: [148, 70]});
  const grey = '#7d848b';
  const gold = '#e9b220';
  // West: two tiers + suites + roof.
  const wl = stand(base, {front: line([-74, -38], [74, -38], 8), rows: 24, y0: 1.4, seat: grey, section: 14, fascia: gold, concrete: '#bdbab3', backTo: false});
  const wlTop = Math.max(...wl.topY);
  wall(base, offset(wl.back, 0.2), wlTop, wlTop + 4.4, '#4f6575', {mat: 'glass'});
  const wu = stand(base, {front: line([-70, -38 - 24 * 0.85 + 2], [70, -38 - 24 * 0.85 + 2], 8), rows: 22, y0: wlTop + 5, riser: 0.48, seat: grey, section: 14, fascia: gold, concrete: '#c9c6c0'});
  const wTop = Math.max(...wu.topY);
  wall(base, offset(wu.back, 0.3), 0, wTop + 1, '#cfccc6', {mat: 'panel'});
  const wc = canopy(roof, offset(wu.back, 0.6), {depth: 25, y: wTop + 5, rise: 1.2, color: '#dfe2e4', under: '#8f969c'});
  box(base, [0, wTop, wu.back.pts[0][1] + 3], [70, 4.5, 5], '#506676', {mat: 'glass', top: '#8f9397'});
  for (const [x, z] of wc.inner.pts.filter((_, i) => i % 2 === 0)) roof.m('glow').quad([x - 3, wTop + 6.5, z], [x + 3, wTop + 6.5, z], [x + 3, wTop + 8, z], [x - 3, wTop + 8, z], [1, 0.96, 0.82]);
  // East: one deep open tier, floodlight masts on its back.
  const e = stand(base, {front: line([-70, 38], [70, 38], 8), rows: 46, y0: 1.4, riser: 0.44, seat: grey, section: 14, fascia: gold, concrete: '#c9c6c0'});
  const eTop = Math.max(...e.topY);
  wall(base, offset(e.back, 0.3), 0, eTop + 1, '#cfccc6', {mat: 'panel'});
  const eb = e.back.pts[0][1] + 1.5;
  for (const x of [-60, -30, 0, 30, 60]) lightPole(base, x, eb, eTop + 17, [x * 0.3, 0], {head: [8, 4.5]});
  // Ends: north party deck, south video board.
  box(base, [88, 0, 0], [14, 7, 60], '#9ea3a8', {top: '#7f8489'});
  stand(base, {front: line([80, -27], [80, 27], 4), rows: 7, y0: 1.0, seat: grey, section: 12, fascia: gold});
  screen(base, [-92, 10, 22], 30, 12, 0, {legs: true, face: '#2f5aa8'});
  return {radius: 110, target: 10, view: {azimuth: 205, elevation: 30, distance: 2.3}};
};
