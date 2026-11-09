import {rgb} from '../kit/core';
import {box, canopy, screen, stand, vault} from '../kit/parts';
import {offset, roundedRect, slice, superellipse} from '../kit/paths';

import type {StadiumModelFn} from './types';

/**
 * Mosaic Stadium (2017). A full bowl (OSM 226 × 219 m outside, 156 × 92 m inside)
 * set into the ground, green seats throughout, with two big white crescent
 * canopies over the sideline upper tiers joined by a narrow roof across the
 * north end; the south end is open, with the video board block. Stair towers at
 * the corners. +x = north.
 */
export const mosaicStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  const fy = -12;
  base.m('matte').flatPolygon(roundedRect(176, 106, 36, 6).pts, fy, rgb('#5d6166'));
  ctx.field({kind: 'cfl', surface: 'turf', area: [150, 76]}, {y: fy + 0.03});
  const green = '#1f6b3c';
  const lower = stand(base, {front: superellipse(80, 47, 2.6, 72), rows: 30, y0: fy + 1, riser: 0.4, seat: green, section: 12, fascia: '#2d3134', backTo: false});
  const lowTop = Math.max(...lower.topY);
  ctx.ground(245, '#8f9393', {hole: lower.back, y: lowTop});
  const ring = offset(lower.back, -3);
  const ups = [slice(ring, 0.11, 0.39, 4), slice(ring, 0.61, 0.89, 4)];
  for (const p of ups) {
    const up = stand(base, {front: p, rows: 26, y0: lowTop + 4.5, riser: 0.5, seat: green, section: 12, fascia: '#2d3134', concrete: '#d9d8d3'});
    const top = Math.max(...up.topY);
    canopy(roof, offset(up.back, 1), {
      depth: (t) => 10 + 24 * Math.sin(Math.PI * t),
      y: (t) => top + 1 + 2 * Math.sin(Math.PI * t),
      rise: 6,
      color: '#f2f2ee',
      mat: 'matte',
      under: '#b2b7bc',
      thickness: 1.6,
    });
  }
  const north = stand(base, {front: slice(ring, 0.92, 0.08, 4), rows: 12, y0: lowTop + 4.5, riser: 0.5, seat: green, section: 12, fascia: '#2d3134', concrete: '#d9d8d3'});
  canopy(roof, offset(north.back, 1), {depth: 8, y: Math.max(...north.topY) + 4, rise: 1, color: '#f2f2ee', mat: 'matte', under: '#b2b7bc'});
  // South end video board block.
  box(base, [-108, lowTop, 0], [10, 18, 46], '#2f4a3b', {top: false});
  vault(base, [-108, lowTop + 18, 0], 46, 10, 2.2, '#f2f2ee', {rot: Math.PI / 2, mat: 'matte', ends: '#f2f2ee'});
  screen(base, [-102.8, lowTop + 7, 0], 42, 9, 0, {depth: 0.3, face: '#2c8a4e'});
  base.m('glow').quad([-102.7, lowTop + 2.5, -18], [-102.7, lowTop + 2.5, 18], [-102.7, lowTop + 5.5, 18], [-102.7, lowTop + 5.5, -18], rgb('#f4f4f2'));
  for (const [x, z] of [
    [96, 84],
    [96, -84],
    [-96, 84],
    [-96, -84],
  ]) box(base, [x, 0, z], [18, lowTop + 22, 18], '#e9e9e6', {top: '#c6c9cc'});
  return {radius: 120, target: 2, view: {azimuth: 205, elevation: 36, distance: 2.2}};
};
