import * as THREE from 'three';
import {rgb, type Layer, type V2, type V3} from './core';
import {beam, box, column, wall} from './parts';
import {roundedRect, transform} from './paths';

/**
 * Playing surfaces: a canvas texture for the markings plus a little 3D
 * furniture (goals, goalposts, rink boards, hoops). Every surface is drawn
 * with its long axis along x, centred on the origin, then placed.
 */

export type FieldKind = 'rink' | 'court' | 'cfl' | 'pitch' | 'diamond';

export const FIELD_SIZE: Record<FieldKind, V2> = {
  rink: [61, 26],
  court: [28.65, 15.24],
  cfl: [137.16, 59.44], // 110 yd field + two 20 yd end zones, 65 yd wide
  pitch: [105, 68],
  diamond: [128, 176],
};

export interface FieldSpec {
  kind: FieldKind;
  /** Team colour for end zones, the court paint and centre marks. */
  accent: string;
  surface: 'turf' | 'grass' | 'hybrid' | 'ice' | 'hardwood';
  /** Whole surfaced area (field plus run-off), metres. Defaults to the field plus a margin. */
  area?: V2;
  /** Colour of the run-off when no texture is available. */
  areaColor?: string;
  /** For diamonds: dirt infield (Rogers Centre has had one since 2016). */
  dirtInfield?: boolean;
  /** For diamonds: distance from the area's −x edge to home plate (m). */
  homeOffset?: number;
}

export function fieldArea(spec: FieldSpec): V2 {
  if (spec.area) return spec.area;
  const [w, h] = FIELD_SIZE[spec.kind];
  if (spec.kind === 'rink' || spec.kind === 'court') return [w, h];
  if (spec.kind === 'diamond') return [w, h];
  return [w + 10, h + 10];
}

const GRASS = {turf: ['#3f8f45', '#367f3c'], grass: ['#4a9a49', '#418c41'], hybrid: ['#469647', '#3d8840']} as const;

function stripes(ctx: CanvasRenderingContext2D, w: number, h: number, surface: FieldSpec['surface'], count: number) {
  const [a, b] = surface === 'turf' ? GRASS.turf : surface === 'hybrid' ? GRASS.hybrid : GRASS.grass;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = i % 2 ? a : b;
    ctx.fillRect((i * w) / count, 0, w / count + 0.05, h);
  }
}

/** Canvas texture for the surface, or null outside the browser (tests). */
export function fieldTexture(spec: FieldSpec): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const [W, H] = fieldArea(spec);
  const scale = Math.min(9, 1024 / Math.max(W, H));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  const [fw, fh] = FIELD_SIZE[spec.kind];
  const ox = (W - fw) / 2;
  const oy = (H - fh) / 2;
  const white = '#f4f6f2';

  switch (spec.kind) {
    case 'cfl': {
      stripes(ctx, W, H, spec.surface, 30);
      ctx.save();
      ctx.translate(ox, oy);
      const yd = fw / 150;
      ctx.fillStyle = spec.accent;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(0, 0, 20 * yd, fh);
      ctx.fillRect(fw - 20 * yd, 0, 20 * yd, fh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = white;
      for (let y = 20; y <= 130; y += 5) {
        ctx.lineWidth = y % 10 === 0 ? 0.32 : 0.18;
        ctx.beginPath();
        ctx.moveTo(y * yd, 0);
        ctx.lineTo(y * yd, fh);
        ctx.stroke();
      }
      ctx.lineWidth = 0.15;
      for (let y = 21; y < 130; y++) {
        for (const hz of [0.4, fh / 2 - 8.5, fh / 2 + 8.5, fh - 0.4]) {
          ctx.beginPath();
          ctx.moveTo(y * yd, hz - 0.35);
          ctx.lineTo(y * yd, hz + 0.35);
          ctx.stroke();
        }
      }
      ctx.lineWidth = 0.6;
      ctx.strokeRect(0, 0, fw, fh);
      ctx.fillStyle = spec.accent;
      ctx.beginPath();
      ctx.arc(fw / 2, fh / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'pitch': {
      stripes(ctx, W, H, spec.surface, 20);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.strokeStyle = white;
      ctx.lineWidth = 0.24;
      ctx.strokeRect(0, 0, fw, fh);
      ctx.beginPath();
      ctx.moveTo(fw / 2, 0);
      ctx.lineTo(fw / 2, fh);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(fw / 2, fh / 2, 9.15, 0, Math.PI * 2);
      ctx.stroke();
      for (const side of [0, 1]) {
        const x0 = side ? fw - 16.5 : 0;
        ctx.strokeRect(x0, fh / 2 - 20.16, 16.5, 40.32);
        ctx.strokeRect(side ? fw - 5.5 : 0, fh / 2 - 9.16, 5.5, 18.32);
        const spot = side ? fw - 11 : 11;
        ctx.beginPath();
        ctx.arc(spot, fh / 2, 9.15, side ? Math.PI - 0.93 : -0.93, side ? Math.PI + 0.93 : 0.93);
        ctx.stroke();
        for (const cy of [0, fh]) {
          ctx.beginPath();
          ctx.arc(side ? fw : 0, cy, 1, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
      break;
    }
    case 'rink': {
      ctx.fillStyle = '#2f3237';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f3f7fa';
      ctx.beginPath();
      ctx.roundRect(0, 0, fw, fh, 8.5);
      ctx.fill();
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(fw / 2 - 0.15, 0, 0.3, fh);
      ctx.fillRect(3.35, 0, 0.06, fh);
      ctx.fillRect(fw - 3.41, 0, 0.06, fh);
      ctx.fillStyle = '#0b4ea2';
      ctx.fillRect(fw / 2 - 7.62 - 0.3, 0, 0.3, fh);
      ctx.fillRect(fw / 2 + 7.62, 0, 0.3, fh);
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 0.06;
      for (const [x, y] of [
        [9.45, fh / 2 - 6.7],
        [9.45, fh / 2 + 6.7],
        [fw - 9.45, fh / 2 - 6.7],
        [fw - 9.45, fh / 2 + 6.7],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 4.57, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#0b4ea2';
      ctx.beginPath();
      ctx.arc(fw / 2, fh / 2, 4.57, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7fb2e5';
      for (const side of [0, 1]) {
        ctx.beginPath();
        ctx.arc(side ? fw - 3.38 : 3.38, fh / 2, 1.83, side ? Math.PI / 2 : -Math.PI / 2, side ? (3 * Math.PI) / 2 : Math.PI / 2);
        ctx.fill();
      }
      ctx.fillStyle = spec.accent;
      ctx.beginPath();
      ctx.arc(fw / 2, fh / 2, 2.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'court': {
      ctx.fillStyle = '#d9a66b';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let y = 0; y < H; y += 0.5) ctx.fillRect(0, y, W, 0.04);
      ctx.fillStyle = spec.accent;
      ctx.fillRect(0, fh / 2 - 2.44, 5.8, 4.88);
      ctx.fillRect(fw - 5.8, fh / 2 - 2.44, 5.8, 4.88);
      ctx.strokeStyle = white;
      ctx.lineWidth = 0.08;
      ctx.strokeRect(0, 0, fw, fh);
      ctx.beginPath();
      ctx.moveTo(fw / 2, 0);
      ctx.lineTo(fw / 2, fh);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(fw / 2, fh / 2, 1.83, 0, Math.PI * 2);
      ctx.stroke();
      for (const side of [0, 1]) {
        ctx.beginPath();
        ctx.arc(side ? fw - 1.6 : 1.6, fh / 2, 7.24, side ? Math.PI - 1.37 : -1.37, side ? Math.PI + 1.37 : 1.37);
        ctx.stroke();
      }
      break;
    }
    case 'diamond': {
      // Home plate at -x end (centre of the left edge), outfield toward +x.
      const turf = spec.surface === 'turf';
      ctx.fillStyle = turf ? '#3a8a40' : '#45974a';
      ctx.fillRect(0, 0, W, H);
      const hx = spec.homeOffset ?? 6;
      const hy = H / 2;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.fillStyle = turf ? '#7a5a3c' : '#b47a4a'; // warning track
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 122, -Math.PI / 4, Math.PI / 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = turf ? '#3f9446' : '#4aa04e';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 117, -Math.PI / 4, Math.PI / 4);
      ctx.closePath();
      ctx.fill();
      if (spec.dirtInfield !== false) {
        const grassIn = turf ? '#3f9446' : '#4aa04e';
        const dirt = '#b8794b';
        // Infield arc: 29 m radius from the pitcher's plate, clipped to fair territory.
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(60, -66);
        ctx.lineTo(60, 66);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = dirt;
        ctx.beginPath();
        ctx.arc(18.4, 0, 29, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        const b = 27.43 / Math.SQRT2;
        ctx.fillStyle = grassIn;
        ctx.beginPath();
        ctx.moveTo(2.2, 0);
        ctx.lineTo(b, -b + 2.2);
        ctx.lineTo(2 * b - 2.2, 0);
        ctx.lineTo(b, b - 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = dirt;
        ctx.beginPath();
        ctx.arc(18.4, 0, 2.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = white;
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(100 * Math.SQRT1_2, -100 * Math.SQRT1_2);
      ctx.moveTo(0, 0);
      ctx.lineTo(100 * Math.SQRT1_2, 100 * Math.SQRT1_2);
      ctx.stroke();
      ctx.fillStyle = white;
      const b = 27.43 / Math.SQRT2;
      for (const [x, y] of [
        [b, -b],
        [2 * b, 0],
        [b, b],
        [0, 0],
      ]) ctx.fillRect(x - 0.3, y - 0.3, 0.6, 0.6);
      ctx.restore();
      break;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export interface Placement {
  x?: number;
  z?: number;
  /** Rotation in radians, counter-clockwise seen from above. */
  rot?: number;
  y?: number;
}

/** Push the surfaced area quad (UV 0..1) and the furniture for the field kind. */
export function addField(L: Layer, spec: FieldSpec, hasTexture: boolean, at: Placement = {}) {
  const [W, H] = fieldArea(spec);
  const {x = 0, z = 0, rot = 0, y = 0.03} = at;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (px: number, pz: number, py = y): V3 => [x + px * c - pz * s, py, z + px * s + pz * c];
  const color = hasTexture ? rgb('#ffffff') : rgb(spec.kind === 'rink' ? '#eef3f6' : spec.kind === 'court' ? '#d9a66b' : '#3f8f45');
  // Note: canvas y runs down, which maps to +z here.
  L.m('field').quad(P(-W / 2, H / 2), P(W / 2, H / 2), P(W / 2, -H / 2), P(-W / 2, -H / 2), color, [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]);
  const [fw, fh] = FIELD_SIZE[spec.kind];
  const white = '#f2f2ee';
  switch (spec.kind) {
    case 'pitch':
      for (const side of [-1, 1]) {
        const gx = side * (fw / 2);
        const a = P(gx, -3.66, 0);
        const b = P(gx, 3.66, 0);
        beam(L, a, [a[0], 2.44, a[2]], 0.18, white);
        beam(L, b, [b[0], 2.44, b[2]], 0.18, white);
        beam(L, [a[0], 2.44, a[2]], [b[0], 2.44, b[2]], 0.18, white);
      }
      break;
    case 'cfl':
      for (const side of [-1, 1]) {
        const gx = side * 50.29; // goal line
        const base = P(gx, 0, 0);
        beam(L, base, [base[0], 3.05, base[2]], 0.3, '#f2c230');
        const a = P(gx, -2.82, 3.05);
        const b = P(gx, 2.82, 3.05);
        beam(L, a, b, 0.22, '#f2c230');
        beam(L, a, [a[0], 12, a[2]], 0.18, '#f2c230');
        beam(L, b, [b[0], 12, b[2]], 0.18, '#f2c230');
      }
      break;
    case 'rink': {
      const boards = transform(roundedRect(fw, fh, 8.5, 5), {x, z, rot});
      wall(L, boards, y, 1.1, '#f4f4f2');
      wall(L, boards, 1.1, 1.18, '#e5b821');
      wall(L, boards, 1.18, 2.9, '#cfe4ef', {mat: 'glass', tile: [1.5, 2]});
      break;
    }
    case 'court':
      for (const side of [-1, 1]) {
        const b = P(side * (fw / 2 + 1.2), 0, 0);
        column(L, b, 3.05, 0.25, '#2b2f35', {sides: 4});
        box(L, P(side * (fw / 2 - 1.2), 0, 2.9), [0.1, 1.05, 1.8], '#f4f4f2', {rot});
        beam(L, [b[0], 3.05, b[2]], P(side * (fw / 2 - 1.2), 0, 3.5), 0.18, '#2b2f35');
      }
      break;
    case 'diamond':
      break;
  }
}
