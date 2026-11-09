import * as THREE from 'three';
import type {Sport, Venue} from '../data';
import {ModelBuilder, type MaterialKey} from './kit/core';
import type {Path} from './kit/paths';
import {addField, fieldTexture, type FieldKind, type FieldSpec} from './kit/surfaces';
import {glassTexture, panelTexture} from './kit/textures';
import {STADIUM_MODELS} from './models';
import type {ModelContext} from './models/types';

/**
 * Builds the low-poly model of a current venue. Each of the 24 venues has its
 * own hand-written model in src/three/models/, drawn to real dimensions from
 * its footprint and photographs, so models are to scale with each other.
 * Venues without a model (former homes) return null.
 */

export interface StadiumOptions {
  venue: Venue;
  sport: Sport;
  seatColor: string;
  accentColor: string;
}

export interface StadiumModel {
  group: THREE.Group;
  /** Roof objects the viewer hides with its Roof switch. */
  roof: THREE.Object3D[];
  /** Retractable roofs only: 0 = closed, 1 = open. */
  setRoofOpen?: (t: number) => void;
  /** Radius of the main structure, for camera framing (m). */
  radius: number;
  /** Height the camera orbits around. */
  target: number;
  /** Default camera direction (degrees) and distance (× radius). */
  view: {azimuth: number; elevation: number; distance: number};
  triangles: number;
  drawCalls: number;
  dispose: () => void;
}

export function buildStadium(o: StadiumOptions): StadiumModel | null {
  const model = STADIUM_MODELS[o.venue.id];
  if (!model) return null;
  const disposables: {dispose: () => void}[] = [];
  const track = <T extends {dispose: () => void}>(x: T) => {
    disposables.push(x);
    return x;
  };

  const builder = new ModelBuilder();
  const base = builder.layer('base');
  const roof = builder.layer('roof', {roof: true});
  let fieldTex: THREE.CanvasTexture | null = null;
  let fieldKind: FieldKind | null = null;
  let groundSpec: {r: number; color: string; hole?: Path; y: number} | null = null;

  const ctx: ModelContext = {
    base,
    roof,
    layer: (name, spec) => builder.layer(name, spec),
    sport: o.sport,
    team: {seat: o.seatColor, accent: o.accentColor},
    kindFor: (options, fallback) => options[o.sport] ?? fallback,
    ground: (r, color, g = {}) => {
      groundSpec = {r, color, hole: g.hole, y: g.y ?? -0.06};
    },
    field: (spec, at) => {
      const full: FieldSpec = {...spec, accent: spec.accent ?? o.accentColor};
      if (!fieldKind) {
        fieldKind = full.kind;
        const tex = fieldTexture(full);
        if (tex) fieldTex = track(tex);
      }
      addField(base, full, fieldTex !== null, at);
    },
  };
  const result = model(ctx);

  const glass = glassTexture();
  const panel = panelTexture();
  if (glass) track(glass);
  if (panel) track(panel);
  const common = {vertexColors: true, flatShading: true, side: THREE.DoubleSide} as const;
  const materials: Record<MaterialKey, THREE.Material> = {
    matte: track(new THREE.MeshStandardMaterial({...common, roughness: 0.92, metalness: 0})),
    panel: track(new THREE.MeshStandardMaterial({...common, roughness: 0.72, metalness: 0.08, map: panel})),
    metal: track(new THREE.MeshStandardMaterial({...common, roughness: 0.36, metalness: 0.55})),
    glass: track(new THREE.MeshStandardMaterial({...common, roughness: 0.14, metalness: 0.4, map: glass})),
    glow: track(new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.DoubleSide, toneMapped: false})),
    field: track(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        map: fieldTex,
        roughness: fieldKind === 'rink' ? 0.3 : fieldKind === 'court' ? 0.5 : 0.95,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    ),
  };
  const lineMat = track(new THREE.LineBasicMaterial({color: '#59606a', transparent: true, opacity: 0.8}));
  const built = builder.finish(materials, lineMat, track);
  const roofObjects = Object.entries(built.layers)
    .filter(([name, g]) => builder.layer(name).spec.roof && g.children.length > 0)
    .map(([, g]) => g);

  if (groundSpec) built.root.add(groundMesh(groundSpec, track));

  const animate = result.animateRoof;
  return {
    group: built.root,
    roof: roofObjects,
    setRoofOpen: animate ? (t: number) => animate(built.layers, t) : undefined,
    radius: result.radius,
    target: result.target ?? result.radius * 0.08,
    view: {azimuth: result.view?.azimuth ?? 35, elevation: result.view?.elevation ?? 30, distance: result.view?.distance ?? 2.25},
    triangles: built.triangles,
    drawCalls: built.drawCalls,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

/**
 * Ground disc that fades to transparent at its rim (vertex alpha), so the
 * model sits on the viewer's background instead of on a hard-edged plate.
 */
function groundMesh(g: {r: number; color: string; hole?: Path; y: number}, track: <T extends {dispose: () => void}>(x: T) => T): THREE.Mesh {
  const n = 72;
  const rings: [number, number][] = [
    [0.58, 1],
    [0.72, 0.88],
    [0.84, 0.55],
    [0.93, 0.22],
    [1, 0],
  ];
  const c = new THREE.Color(g.color);
  const holeR = (a: number) => {
    if (!g.hole) return 0;
    let best = 0;
    let bestD = Infinity;
    for (const [x, z] of g.hole.pts) {
      const d = Math.abs(Math.atan2(Math.sin(Math.atan2(z, x) - a), Math.cos(Math.atan2(z, x) - a)));
      if (d < bestD) {
        bestD = d;
        best = Math.hypot(x, z);
      }
    }
    return best;
  };
  const pos: number[] = [];
  const col: number[] = [];
  const ringPts: number[][] = [];
  const addRing = (r: (a: number) => number, alpha: number) => {
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r(a);
      idx.push(pos.length / 3);
      pos.push(Math.cos(a) * rr, g.y, Math.sin(a) * rr);
      col.push(c.r, c.g, c.b, alpha);
    }
    ringPts.push(idx);
  };
  const index: number[] = [];
  if (g.hole) addRing(holeR, 1);
  else {
    pos.push(0, g.y, 0);
    col.push(c.r, c.g, c.b, 1);
  }
  for (const [f, alpha] of rings) addRing((a) => Math.max(holeR(a) + 2, g.r * f), alpha);
  if (!g.hole) {
    const first = ringPts[0];
    for (let i = 0; i < n; i++) index.push(0, first[(i + 1) % n], first[i]);
  }
  for (let k = 0; k < ringPts.length - 1; k++) {
    const a = ringPts[k];
    const b = ringPts[k + 1];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      index.push(a[i], b[j], b[i], a[i], a[j], b[j]);
    }
  }
  const geo = track(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geo.setIndex(index);
  const mat = track(new THREE.MeshStandardMaterial({vertexColors: true, transparent: true, depthWrite: false, roughness: 1, metalness: 0, side: THREE.DoubleSide}));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.renderOrder = -1;
  mesh.name = 'ground';
  return mesh;
}
