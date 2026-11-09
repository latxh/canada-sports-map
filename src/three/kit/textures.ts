import * as THREE from 'three';

/**
 * Small procedural textures shared by every model. They are near-white so the
 * vertex colour tints them: a teal facade times the glass texture gives teal
 * glass with darker mullions. Returns null outside the browser (tests).
 */

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  return ctx ? [c, ctx] : null;
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Curtain wall: mullions every 2 m, a transom every 4 m (one tile = 4 m). */
export function glassTexture(): THREE.CanvasTexture | null {
  const r = canvas(64);
  if (!r) return null;
  const [c, ctx] = r;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#d9dee2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#5f666d';
  ctx.fillRect(0, 0, 3, 64);
  ctx.fillRect(32, 0, 2, 64);
  ctx.fillRect(0, 0, 64, 4);
  return toTexture(c);
}

/** Cladding panels with faint joints. */
export function panelTexture(): THREE.CanvasTexture | null {
  const r = canvas(64);
  if (!r) return null;
  const [c, ctx] = r;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#d3d5d7';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillRect(0, 32, 64, 1);
  ctx.fillRect(0, 0, 1, 64);
  ctx.fillRect(16, 0, 1, 64);
  ctx.fillRect(32, 0, 1, 64);
  ctx.fillRect(48, 0, 1, 64);
  return toTexture(c);
}
