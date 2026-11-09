import {hash2, rgb, shade, type V2} from '../kit/core';
import {box, canopy, lightPole, mixedSeats, screen, shell, stand, wall} from '../kit/parts';
import {line, offset, roundedRect, slice, superellipse} from '../kit/paths';
import {arenaBowl} from './common';
import type {StadiumModelFn} from './types';

/**
 * Rogers Place. A 204 × 164 m pebble (OSM, 43 m high) clad in stainless-steel
 * shingles, with swooping bands, a roof that curves down into the walls, a
 * green glass ground floor, a high ribbon window and the glass Ford Hall /
 * Winter Garden at the south-east corner.
 */
export const rogersPlace: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  ctx.ground(200, '#9a9c9d');
  arenaBowl(ctx, {lowerSeats: ctx.team.seat, upperSeats: ctx.team.seat});
  const fp = superellipse(97, 77, 2.7, 64);
  wall(base, offset(fp, -1.2), 0, 6.5, '#7fa69b', {mat: 'glass'});
  base.m('matte').flatPolygon(fp.pts, 6.5, rgb('#9da1a4'));
  wall(base, fp, 6.5, 28, '#c5cad0', {mat: 'metal', colorAt: (_t, i) => shade('#c5cad0', 0.94 + 0.1 * hash2(i, 7))});
  // Swooping dark bands.
  for (const [y, amp, ph] of [
    [12, 5.5, 0.4],
    [18, 5, 2.1],
    [23.5, 3.2, 4.0],
  ]) {
    const band = offset(fp, 0.2);
    const yAt = (x: number, z: number) => y + amp * Math.sin(Math.atan2(z / 77, x / 97) + ph);
    wall(base, band, yAt, (x, z) => yAt(x, z) + 0.9, '#596067', {mat: 'matte'});
  }
  // Roof: rings shrinking inward as it curves over.
  const prof: [number, number][] = [
    [0, 28],
    [0.015, 33],
    [0.05, 37.5],
    [0.12, 40.6],
    [0.24, 42.4],
    [0.44, 43.4],
    [0.7, 43.8],
    [1, 43.9],
  ];
  const yOf = (s: number) => {
    for (let i = 1; i < prof.length; i++) {
      if (s <= prof[i][0]) {
        const [s0, y0] = prof[i - 1];
        const [s1, y1] = prof[i];
        return y0 + ((s - s0) / (s1 - s0)) * (y1 - y0);
      }
    }
    return prof[prof.length - 1][1];
  };
  shell(roof, fp, (_x, _z, s) => yOf(s), (x, z, s) => shade('#c9ced3', 0.9 + 0.08 * s + 0.04 * hash2(Math.round(x), Math.round(z))), {
    rings: prof.length - 1,
    ringAt: (i) => prof[i][0],
    mat: 'metal',
  });
  const ribbon = offset(slice(fp, 0.9, 0.12, 4), -0.5);
  wall(roof, ribbon, 29, 33, '#7896a6', {mat: 'glass'});
  // Winter Garden.
  box(base, [92, 0, 62], [44, 24, 26], '#78a9b9', {mat: 'glass', rot: -0.62, top: '#8fb2be'});
  return {radius: 104, target: 14, view: {azimuth: 42, elevation: 22, distance: 2.3}};
};

/**
 * Commonwealth Stadium. Canada's largest open-air stadium: the field sits below
 * grade inside a continuous lower bowl, with upper decks on both sidelines,
 * thin roofs and light frames on top. Seats in a mix of green and gold; the
 * scoreboard is at the north end and the east food court building outside.
 */
export const commonwealthStadium: StadiumModelFn = (ctx) => {
  const {base, roof} = ctx;
  const fy = -13;
  base.m('matte').flatPolygon(roundedRect(196, 112, 36, 6).pts, fy, rgb('#5d6166'));
  ctx.field({kind: 'cfl', surface: 'turf', area: [152, 76]}, {y: fy + 0.03});
  const mix = mixedSeats(['#2b6b3f', '#e9b52e'], [1, 1], 4);
  const lower = stand(base, {front: roundedRect(180, 98, 32, 6), rows: 36, y0: fy + 1, riser: 0.36, seat: mix, section: 12, fascia: '#2f3337', backTo: false});
  const lowTop = Math.max(...lower.topY);
  ctx.ground(255, '#8f9393', {hole: lower.back, y: lowTop});
  for (const s of [-1, 1]) {
    const z0 = s * (49 + 36 * 0.85 - 6);
    const front = {pts: [[-92, z0 - s * 12], [-72, z0], [72, z0], [92, z0 - s * 12]] as V2[], closed: false};
    wall(base, offset(front, -0.5), lowTop, lowTop + 5.5, '#4e6474', {mat: 'glass'});
    const up = stand(base, {front, rows: 28, y0: lowTop + 6, riser: 0.5, seat: mix, section: 12, fascia: '#2f3337', concrete: '#c5c1b6'});
    const top = Math.max(...up.topY);
    canopy(roof, offset(up.back, 0.5), {depth: 9, y: top + 3, rise: 0.5, color: '#d6d9db', thickness: 1});
    const bz = up.back.pts[1][1];
    for (let x = -66; x <= 66; x += 14.6) lightPole(base, x, bz + s * 0.5, 13, [x * 0.2, 0], {base: top + 3.5, head: [5, 3]});
  }
  screen(base, [117, lowTop + 2, 0], 40, 14, Math.PI, {legs: true, face: '#2b6b3f'});
  box(base, [0, lowTop, 132], [158, 13, 36], '#b06a55', {top: '#8b9094'});
  wall(base, line([-79, 113.8], [79, 113.8], 6), lowTop + 9, lowTop + 11, '#2b6b3f');
  return {radius: 128, target: 0, view: {azimuth: 210, elevation: 34, distance: 2.2}};
};
