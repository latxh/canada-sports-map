import * as THREE from 'three';

/**
 * Core of the low-poly modelling kit.
 *
 * Parts never create their own meshes. They push flat-shaded triangles into a
 * TriBuffer picked by (layer, material); `ModelBuilder.finish()` turns every
 * buffer into one mesh. A whole stadium therefore renders in a handful of draw
 * calls (one per material per layer), the same win the 3D-web guidance asks for
 * from instancing, while each part keeps its own colour through vertex colours.
 */

export type V2 = [number, number]; // plan coordinates: x, z
export type V3 = [number, number, number];
export type RGB = [number, number, number];
export type ColorIn = string | RGB;

const tmp = new THREE.Color();

/** Linear-space RGB for a CSS hex colour (vertex colours live in linear space). */
export function rgb(c: ColorIn): RGB {
  if (Array.isArray(c)) return c;
  tmp.set(c);
  return [tmp.r, tmp.g, tmp.b];
}

/** Multiply a colour's brightness (in linear space). */
export function shade(c: ColorIn, f: number): RGB {
  const [r, g, b] = rgb(c);
  return [Math.min(1, r * f), Math.min(1, g * f), Math.min(1, b * f)];
}

/** Mix two colours, t = 0 → a, t = 1 → b. */
export function mixRGB(a: ColorIn, b: ColorIn, t: number): RGB {
  const x = rgb(a);
  const y = rgb(b);
  return [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t];
}

/** Deterministic pseudo-random number in [0, 1) for a pair of integers. */
export function hash2(a: number, b: number): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Triangle soup with per-face flat normals, vertex colours and UVs. */
export class TriBuffer {
  readonly pos: number[] = [];
  readonly nor: number[] = [];
  readonly col: number[] = [];
  readonly uv: number[] = [];

  get triangles() {
    return this.pos.length / 9;
  }

  tri(a: V3, b: V3, c: V3, color: RGB, ua: V2 = [0, 0], ub: V2 = [0, 0], uc: V2 = [0, 0]) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-9) return; // degenerate
    nx /= len;
    ny /= len;
    nz /= len;
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.nor.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    this.col.push(color[0], color[1], color[2], color[0], color[1], color[2], color[0], color[1], color[2]);
    this.uv.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
  }

  /** Quad a→b→c→d (any winding; materials are double-sided). */
  quad(a: V3, b: V3, c: V3, d: V3, color: RGB, uvs?: [V2, V2, V2, V2]) {
    const [ua, ub, uc, ud] = uvs ?? [planarUV(a), planarUV(b), planarUV(c), planarUV(d)];
    this.tri(a, b, c, color, ua, ub, uc);
    this.tri(a, c, d, color, ua, uc, ud);
  }

  /** Convex polygon as a fan. */
  fan(points: V3[], color: RGB) {
    for (let i = 1; i < points.length - 1; i++) {
      this.tri(points[0], points[i], points[i + 1], color, planarUV(points[0]), planarUV(points[i]), planarUV(points[i + 1]));
    }
  }

  /** Arbitrary simple polygon in a horizontal plane (earcut via THREE.ShapeUtils). */
  flatPolygon(outline: V2[], y: number, color: RGB) {
    const contour = outline.map(([x, z]) => new THREE.Vector2(x, z));
    if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const [i, j, k] of faces) {
      const a: V3 = [contour[i].x, y, contour[i].y];
      const b: V3 = [contour[j].x, y, contour[j].y];
      const c: V3 = [contour[k].x, y, contour[k].y];
      this.tri(a, b, c, color, planarUV(a), planarUV(b), planarUV(c));
    }
  }
}

/** Default UV: top-down projection in metres / 4 (textures tile every 4 m). */
export function planarUV(p: V3): V2 {
  return [p[0] / 4, p[2] / 4];
}

export type MaterialKey = 'matte' | 'metal' | 'glass' | 'panel' | 'glow' | 'field';

export interface LayerSpec {
  /** Hidden by the viewer's "Roof" switch. */
  roof?: boolean;
}

export class Layer {
  private readonly buffers = new Map<MaterialKey, TriBuffer>();
  readonly lines: number[] = [];

  constructor(
    readonly name: string,
    readonly spec: LayerSpec,
  ) {}

  /** The buffer for a material in this layer. */
  m(key: MaterialKey = 'matte'): TriBuffer {
    let buf = this.buffers.get(key);
    if (!buf) {
      buf = new TriBuffer();
      this.buffers.set(key, buf);
    }
    return buf;
  }

  /** A thin cable or wire, drawn as a line. */
  line(a: V3, b: V3) {
    this.lines.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }

  entries() {
    return [...this.buffers.entries()];
  }
}

export interface BuiltLayers {
  root: THREE.Group;
  layers: Record<string, THREE.Group>;
  triangles: number;
  drawCalls: number;
}

/** Collects layers and turns them into merged meshes. */
export class ModelBuilder {
  private readonly layerMap = new Map<string, Layer>();

  layer(name: string, spec: LayerSpec = {}): Layer {
    let l = this.layerMap.get(name);
    if (!l) {
      l = new Layer(name, spec);
      this.layerMap.set(name, l);
    }
    return l;
  }

  finish(materials: Record<MaterialKey, THREE.Material>, lineMaterial: THREE.LineBasicMaterial, track: <T extends {dispose: () => void}>(x: T) => T): BuiltLayers {
    const root = new THREE.Group();
    const layers: Record<string, THREE.Group> = {};
    let triangles = 0;
    let drawCalls = 0;
    for (const [name, layer] of this.layerMap) {
      const g = new THREE.Group();
      g.name = name;
      for (const [key, buf] of layer.entries()) {
        if (buf.triangles === 0) continue;
        const geo = track(new THREE.BufferGeometry());
        geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(buf.nor, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(buf.col, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(buf.uv, 2));
        geo.computeBoundingSphere();
        const mesh = new THREE.Mesh(geo, materials[key]);
        mesh.castShadow = key !== 'glow' && key !== 'field';
        mesh.receiveShadow = key !== 'glow';
        mesh.name = `${name}:${key}`;
        g.add(mesh);
        triangles += buf.triangles;
        drawCalls++;
      }
      if (layer.lines.length) {
        const geo = track(new THREE.BufferGeometry());
        geo.setAttribute('position', new THREE.Float32BufferAttribute(layer.lines, 3));
        g.add(new THREE.LineSegments(geo, lineMaterial));
        drawCalls++;
      }
      layers[name] = g;
      root.add(g);
    }
    return {root, layers, triangles, drawCalls};
  }
}
