import * as THREE from 'three';
import type {Sport, Venue} from '../data';

/**
 * Procedural stadium builder. Each venue is described by a few parameters
 * (kind, roof, surface, capacity, signature feature) and turned into a
 * stylised low-poly model. Shapes are approximate and not to scale with
 * each other beyond rough capacity-based sizing.
 */

export interface StadiumOptions {
  venue: Venue;
  sport: Sport;
  seatColor: string;
  accentColor: string;
}

export interface StadiumModel {
  group: THREE.Group;
  /** Roof meshes (toggle visibility / opacity). */
  roof: THREE.Object3D[];
  /** Pieces that slide when a retractable roof opens; each moves along its own vector. */
  movingRoof: {object: THREE.Object3D; openOffset: THREE.Vector3; shrink?: boolean; openRotationY?: number; openScale?: number}[];
  /** Approximate radius of the model, for camera framing. */
  radius: number;
  dispose: () => void;
}

type Vec2 = [number, number];

/** Point on a superellipse |x/a|^p + |z/b|^p = 1 at parameter t. */
function superellipse(a: number, b: number, p: number, t: number): Vec2 {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const e = 2 / p;
  return [a * Math.sign(c) * Math.abs(c) ** e, b * Math.sign(s) * Math.abs(s) ** e];
}

interface RingSpec {
  a: number;
  b: number;
  p: number;
  /** Angular range, radians. Full ring by default. */
  t0?: number;
  t1?: number;
}

/**
 * Stepped seating bowl between an inner and outer outline.
 * Rows climb from y0 to y1 with treads + risers.
 */
function seatingBowl(inner: RingSpec, depthA: number, depthB: number, rows: number, y0: number, y1: number, segments = 120) {
  const t0 = inner.t0 ?? 0;
  const t1 = inner.t1 ?? Math.PI * 2;
  const closed = inner.t0 === undefined;
  const cols = closed ? segments : Math.max(8, Math.round((segments * (t1 - t0)) / (Math.PI * 2)));
  // Profile: for each row, two points (front of tread, back of tread) then riser.
  const profile: {f: number; y: number}[] = [];
  const rise = (y1 - y0) / rows;
  for (let r = 0; r < rows; r++) {
    const fFront = r / rows;
    const fBack = (r + 1) / rows;
    const y = y0 + r * rise;
    profile.push({f: fFront, y});
    profile.push({f: fBack, y});
    profile.push({f: fBack, y: y + rise});
  }
  // Back wall down to y0 - small so stands look solid from outside.
  profile.push({f: 1, y: Math.max(0, y0 - 2)});

  const positions: number[] = [];
  const indices: number[] = [];
  const ringCount = closed ? cols : cols + 1;
  for (let i = 0; i < ringCount; i++) {
    const t = t0 + ((t1 - t0) * i) / cols;
    const [ix, iz] = superellipse(inner.a, inner.b, inner.p, t);
    const [ox, oz] = superellipse(inner.a + depthA, inner.b + depthB, inner.p, t);
    for (const pt of profile) {
      positions.push(ix + (ox - ix) * pt.f, pt.y, iz + (oz - iz) * pt.f);
    }
  }
  const P = profile.length;
  for (let i = 0; i < cols; i++) {
    const a = i;
    const b = closed ? (i + 1) % cols : i + 1;
    for (let j = 0; j < P - 1; j++) {
      const p00 = a * P + j;
      const p01 = a * P + j + 1;
      const p10 = b * P + j;
      const p11 = b * P + j + 1;
      indices.push(p00, p10, p01, p01, p10, p11);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** A flat ring (annulus) following a superellipse, optionally tilted upward toward the outside. */
function ringPlate(a: number, b: number, p: number, width: number, y: number, rise = 0, segments = 120) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const [ix, iz] = superellipse(a, b, p, t);
    const [ox, oz] = superellipse(a + width, b + width, p, t);
    positions.push(ix, y, iz, ox, y + rise, oz);
  }
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments;
    indices.push(i * 2, n * 2, i * 2 + 1, i * 2 + 1, n * 2, n * 2 + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Dome cap over a superellipse footprint: height follows a smooth bump; optional saddle term. */
function domeCap(a: number, b: number, p: number, baseY: number, height: number, opts: {saddle?: number; xRange?: [number, number]} = {}) {
  const radial = 18;
  const segments = 96;
  const positions: number[] = [];
  const indices: number[] = [];
  const [xMin, xMax] = opts.xRange ?? [-Infinity, Infinity];
  for (let r = 0; r <= radial; r++) {
    const f = r / radial; // 0 = centre, 1 = edge
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      let [x, z] = superellipse(a * f, b * f, p, t);
      x = Math.min(xMax, Math.max(xMin, x));
      const bump = Math.cos((f * Math.PI) / 2);
      let y = baseY + height * bump;
      if (opts.saddle) y += opts.saddle * ((x / a) ** 2 - (z / b) ** 2);
      positions.push(x, y, z);
    }
  }
  const row = segments + 1;
  for (let r = 0; r < radial; r++) {
    for (let i = 0; i < segments; i++) {
      const p00 = r * row + i;
      const p01 = r * row + i + 1;
      const p10 = (r + 1) * row + i;
      const p11 = (r + 1) * row + i + 1;
      indices.push(p00, p10, p01, p01, p10, p11);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Vertical outer wall around a superellipse. */
function outerWall(a: number, b: number, p: number, height: number, segments = 120, topAt?: (x: number, z: number) => number) {
  const shape: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const [x, z] = superellipse(a, b, p, (i / segments) * Math.PI * 2);
    shape.push(new THREE.Vector2(x, z));
  }
  const positions: number[] = [];
  const indices: number[] = [];
  shape.forEach((v) => positions.push(v.x, 0, v.y, v.x, topAt ? topAt(v.x, v.y) : height, v.y));
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments;
    indices.push(i * 2, n * 2, i * 2 + 1, i * 2 + 1, n * 2, n * 2 + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ── Playing surface textures ──────────────────────────────────────────────

type FieldKind = 'rink' | 'court' | 'cfl' | 'pitch' | 'diamond';

function fieldKind(sport: Sport, venue: Venue): FieldKind {
  if (venue.kind === 'arena') return venue.surface === 'hardwood' || sport === 'basketball' ? (sport === 'hockey' ? 'rink' : 'court') : 'rink';
  if (sport === 'baseball') return 'diamond';
  if (sport === 'football') return 'cfl';
  return 'pitch';
}

const FIELD_SIZE: Record<FieldKind, Vec2> = {
  rink: [61, 26],
  court: [28.7, 15.2],
  cfl: [137, 59.4],
  pitch: [105, 68],
  diamond: [120, 120],
};

function surfaceTexture(kind: FieldKind, accent: string, surface: Venue['surface']): THREE.CanvasTexture {
  const [w, h] = FIELD_SIZE[kind];
  const scale = 8;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  const grass = surface === 'turf' ? '#3b8a3e' : '#3f9a44';
  const line = '#ffffff';
  ctx.lineWidth = 0.25;
  switch (kind) {
    case 'rink': {
      ctx.fillStyle = '#f4f8fb';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(w / 2 - 0.15, 0, 0.3, h);
      ctx.fillRect(3.4, 0, 0.1, h);
      ctx.fillRect(w - 3.5, 0, 0.1, h);
      ctx.fillStyle = '#0b4ea2';
      ctx.fillRect(w / 2 - 7.8, 0, 0.3, h);
      ctx.fillRect(w / 2 + 7.5, 0, 0.3, h);
      ctx.strokeStyle = '#c8102e';
      for (const [x, y] of [
        [9.4, 6.2],
        [9.4, 19.8],
        [w - 9.4, 6.2],
        [w - 9.4, 19.8],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#0b4ea2';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'court': {
      ctx.fillStyle = '#d8a46a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      for (let y = 0; y < h; y += 0.6) ctx.fillRect(0, y, w, 0.05);
      ctx.fillStyle = accent;
      ctx.fillRect(0, h / 2 - 2.45, 5.8, 4.9);
      ctx.fillRect(w - 5.8, h / 2 - 2.45, 5.8, 4.9);
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.08;
      ctx.strokeRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 1.8, 0, Math.PI * 2);
      ctx.stroke();
      for (const [x, dir] of [
        [1.6, 1],
        [w - 1.6, -1],
      ]) {
        ctx.beginPath();
        ctx.arc(x, h / 2, 7.24, dir > 0 ? -1.2 : Math.PI - 1.2 + 0, dir > 0 ? 1.2 : Math.PI + 1.2);
        ctx.stroke();
      }
      break;
    }
    case 'cfl': {
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = i % 2 ? grass : '#449a46';
        ctx.fillRect(i * (w / 15), 0, w / 15, h);
      }
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, (w * 20) / 150, h);
      ctx.fillRect(w - (w * 20) / 150, 0, (w * 20) / 150, h);
      ctx.strokeStyle = line;
      for (let yd = 20; yd <= 130; yd += 5) {
        const x = (yd / 150) * w;
        ctx.lineWidth = yd % 10 === 0 ? 0.3 : 0.15;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.lineWidth = 0.4;
      ctx.strokeRect(0, 0, w, h);
      break;
    }
    case 'pitch': {
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = i % 2 ? grass : '#47a64c';
        ctx.fillRect((i * w) / 14, 0, w / 14, h);
      }
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.25;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0.5);
      ctx.lineTo(w / 2, h - 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 9.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(0.5, h / 2 - 20.16, 16.5, 40.32);
      ctx.strokeRect(w - 17, h / 2 - 20.16, 16.5, 40.32);
      break;
    }
    case 'diamond': {
      ctx.fillStyle = '#2f7a33';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = grass;
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 8);
      ctx.arc(w / 2, h - 8, 105, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b9784a';
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 8);
      ctx.arc(w / 2, h - 8, 38, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = grass;
      ctx.beginPath();
      const s = 27.4 / Math.SQRT2;
      ctx.moveTo(w / 2, h - 10);
      ctx.lineTo(w / 2 - s + 2, h - 8 - s);
      ctx.lineTo(w / 2, h - 8 - 2 * s + 2);
      ctx.lineTo(w / 2 + s - 2, h - 8 - s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 8);
      ctx.lineTo(w / 2 - 74, h - 82);
      ctx.moveTo(w / 2, h - 8);
      ctx.lineTo(w / 2 + 74, h - 82);
      ctx.stroke();
      break;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ── Builder ───────────────────────────────────────────────────────────────

export function buildStadium({venue, sport, seatColor, accentColor}: StadiumOptions): StadiumModel {
  const group = new THREE.Group();
  const roof: THREE.Object3D[] = [];
  const movingRoof: StadiumModel['movingRoof'] = [];
  const disposables: {dispose: () => void}[] = [];
  const track = <T extends {dispose: () => void}>(x: T) => {
    disposables.push(x);
    return x;
  };

  const kind = fieldKind(sport, venue);
  const [fw, fh] = FIELD_SIZE[kind];
  const capacity = venue.capacity ?? (venue.kind === 'arena' ? 12000 : 8000);

  const seatMat = track(new THREE.MeshStandardMaterial({color: seatColor, roughness: 0.85, side: THREE.DoubleSide}));
  const concrete = track(new THREE.MeshStandardMaterial({color: '#b9b7b0', roughness: 0.95, side: THREE.DoubleSide}));
  const steel = track(new THREE.MeshStandardMaterial({color: '#d9dde1', metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide}));
  const roofMat = track(
    new THREE.MeshStandardMaterial({color: '#f1f3f5', roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide, transparent: true, opacity: 0.72, depthWrite: false}),
  );
  const accentMat = track(new THREE.MeshStandardMaterial({color: accentColor, roughness: 0.6, side: THREE.DoubleSide}));

  // Shape of the bowl's inner edge.
  let p = 2.2;
  let innerA = fw / 2 + 6;
  let innerB = fh / 2 + 6;
  if (venue.kind === 'arena' && venue.feature === 'saddle-roof') {
    p = 2;
    innerA = 36;
    innerB = 26;
  } else if (venue.kind === 'arena') {
    p = 3.2;
    innerA = 61 / 2 + 2; // arenas are sized to the rink even when configured for basketball
    innerB = 26 / 2 + 2;
  } else if (venue.kind === 'football' || venue.kind === 'soccer') {
    p = venue.kind === 'soccer' ? 8 : 5;
    innerA = fw / 2 + (venue.kind === 'soccer' ? 5 : 10);
    innerB = fh / 2 + (venue.kind === 'soccer' ? 5 : 8);
  } else if (venue.kind === 'dome') {
    p = venue.feature === 'segmented-dome' ? 2 : 2.4;
    const base = Math.max(fw, fh) / 2;
    innerA = base + 12;
    innerB = (kind === 'diamond' ? base : fh / 2) + 14;
  } else if (venue.kind === 'ballpark') {
    p = 2;
  }

  // Ground.
  const groundR = Math.max(innerA, innerB) * 2.6 + 60;
  const ground = new THREE.Mesh(
    track(new THREE.CircleGeometry(groundR, 64)),
    track(new THREE.MeshStandardMaterial({color: '#7b8187', roughness: 1})),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  group.add(ground);

  // Playing surface.
  const surfTex = track(surfaceTexture(kind, accentColor, venue.surface));
  const surfaceGeo =
    kind === 'diamond' ? track(new THREE.PlaneGeometry(fw, fh)) : track(new THREE.PlaneGeometry(fw, fh));
  const surfaceMesh = new THREE.Mesh(surfaceGeo, track(new THREE.MeshStandardMaterial({map: surfTex, roughness: kind === 'rink' ? 0.3 : 0.9})));
  surfaceMesh.rotation.x = -Math.PI / 2;
  surfaceMesh.position.y = 0.02;
  if (kind === 'diamond') surfaceMesh.position.z = -fh / 2 + 20;
  surfaceMesh.receiveShadow = true;
  group.add(surfaceMesh);

  // Apron around the field (floor between field and stands).
  const indoorFloor = kind === 'rink' || kind === 'court';
  const apronGeo =
    venue.kind === 'arena'
      ? track(new THREE.CircleGeometry(1, 64))
      : track(new THREE.PlaneGeometry(kind === 'diamond' ? fw : fw + 14, kind === 'diamond' ? fh : fh + 12));
  const apron = new THREE.Mesh(apronGeo, track(new THREE.MeshStandardMaterial({color: indoorFloor ? '#3a3d42' : '#2f6f33', roughness: 1})));
  apron.rotation.x = -Math.PI / 2;
  if (venue.kind === 'arena') apron.scale.set(innerA + 1, innerB + 1, 1);
  if (kind === 'diamond') apron.position.z = -fh / 2 + 20;
  apron.position.y = 0.01;
  apron.receiveShadow = true;
  group.add(apron);

  // Seating.
  let outerA = innerA;
  let outerB = innerB;
  let topY = 0;

  const addBowl = (rows: number, depthA: number, depthB: number, y0: number, y1: number, startA: number, startB: number, mat = seatMat) => {
    const geo = track(seatingBowl({a: startA, b: startB, p}, depthA, depthB, rows, y0, y1));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    outerA = Math.max(outerA, startA + depthA);
    outerB = Math.max(outerB, startB + depthB);
    topY = Math.max(topY, y1);
  };

  if (venue.feature === 'temporary-stands') {
    // Modular grandstands along the long sides only, plus a small end stand.
    const standDepth = 10 + capacity / 1500;
    const standH = 6 + capacity / 1500;
    const sideGeo = track(new THREE.BoxGeometry(fw * 0.85, 1, standDepth));
    for (const side of [-1, 1]) {
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const m = new THREE.Mesh(sideGeo, i % 2 ? seatMat : concrete);
        m.scale.set(1, (standH / steps) * (i + 1), 1 / steps);
        m.position.set(0, ((standH / steps) * (i + 1)) / 2, side * (fh / 2 + 4 + (standDepth / steps) * (i + 0.5)));
        m.castShadow = true;
        group.add(m);
      }
      // Scaffold legs.
      const legGeo = track(new THREE.CylinderGeometry(0.2, 0.2, standH, 6));
      for (let x = -fw * 0.4; x <= fw * 0.4; x += fw / 10) {
        const leg = new THREE.Mesh(legGeo, steel);
        leg.position.set(x, standH / 2, side * (fh / 2 + 4 + standDepth));
        group.add(leg);
      }
    }
    outerA = fw / 2 + 8;
    outerB = fh / 2 + 4 + standDepth;
    topY = standH;
  } else if (venue.kind === 'ballpark') {
    // Grandstand wraps behind home plate; low bleachers in the outfield.
    const homeZ = fh / 2 - 12;
    const tiers = capacity > 25000 ? 2 : 1;
    for (let tier = 0; tier < tiers; tier++) {
      const r0 = 26 + tier * 30;
      const geo = track(
        seatingBowl({a: r0, b: r0, p: 2, t0: -Math.PI * 0.08, t1: Math.PI * 1.08}, 26, 26, 16, tier * 12, tier * 12 + 13),
      );
      const m = new THREE.Mesh(geo, seatMat);
      m.position.z = homeZ - 6;
      m.castShadow = true;
      group.add(m);
    }
    const bleachers = track(seatingBowl({a: 100, b: 100, p: 2, t0: Math.PI * 1.25, t1: Math.PI * 1.75}, 14, 14, 8, 1, 6));
    const bm = new THREE.Mesh(bleachers, seatMat);
    bm.position.z = homeZ - 6;
    group.add(bm);
    outerA = outerB = 114;
    topY = tiers * 13;
  } else {
    const tiers =
      venue.kind === 'arena' ? (capacity > 12000 ? 2 : 1) : capacity > 45000 ? 3 : capacity > 18000 ? 2 : 1;
    const sideBias = venue.kind === 'football' ? 1.6 : 1;
    let a = innerA;
    let b = innerB;
    let y = venue.kind === 'arena' ? 1.2 : 1.5;
    const unit = venue.kind === 'arena' ? 12 : 9 + capacity / 6000;
    for (let tier = 0; tier < tiers; tier++) {
      const rows = venue.kind === 'arena' ? (tier === 0 ? 22 : 18) : 16;
      const depthA = unit * (tier === 0 ? 1.2 : 1);
      const depthB = unit * (tier === 0 ? 1.2 : 1) * sideBias;
      const rise = depthB * 0.55 + 2;
      addBowl(rows, depthA, depthB, y, y + rise, a, b);
      // Concourse fascia between tiers.
      if (tier < tiers - 1) {
        const fascia = new THREE.Mesh(track(ringPlate(a + depthA - 2, b + depthB - 2, p, 2.5, y + rise + 0.3)), accentMat);
        group.add(fascia);
      }
      a += depthA * 0.82;
      b += depthB * 0.82;
      y += rise + 3;
    }
    // Outer facade.
    const saddleWall = venue.feature === 'saddle-roof';
    const sagW = Math.max(outerA, outerB) * 0.12;
    const wall = new THREE.Mesh(
      track(
        saddleWall
          ? outerWall(outerA + 1, outerB + 1, p, 0, 120, (x, z) => topY + 2 + sagW * 0.7 + sagW * ((x / (outerA + 1)) ** 2 - (z / (outerB + 1)) ** 2))
          : outerWall(outerA + 0.5, outerB + 0.5, p, topY + 2),
      ),
      concrete,
    );
    wall.castShadow = true;
    group.add(wall);
  }

  // ── Roofs ──────────────────────────────────────────────────────────────
  const R = Math.max(outerA, outerB);
  if (venue.roof === 'indoor' || venue.roof === 'fixed-dome') {
    const saddle = venue.feature === 'saddle-roof';
    const sag = R * 0.12;
    const geo = track(
      saddle
        ? domeCap(outerA + 1, outerB + 1, p, topY + 2 + sag * 0.7, 0, {saddle: sag})
        : domeCap(outerA + 1, outerB + 1, p, topY + 2, venue.kind === 'dome' ? R * 0.22 : R * 0.12),
    );
    const cap = new THREE.Mesh(geo, roofMat);
    cap.castShadow = false;
    group.add(cap);
    roof.push(cap);
  } else if (venue.roof === 'retractable' && venue.feature === 'segmented-dome') {
    // Three shells: the two outer shells slide over the fixed end shell when opened.
    const h = R * 0.32;
    const thirds: [number, number][] = [
      [-outerA - 1, -outerA / 3],
      [-outerA / 3, outerA / 3],
      [outerA / 3, outerA + 1],
    ];
    thirds.forEach((range, i) => {
      const shell = new THREE.Mesh(track(domeCap(outerA + 1, outerB + 1, p, topY + 2 + (2 - i) * 0.8, h, {xRange: range})), roofMat);
      shell.castShadow = false;
      group.add(shell);
      roof.push(shell);
    });
    // Opening: the centre panel slides over the fixed east panel, and the west panel swings round on top of both.
    movingRoof.push({object: roof[roof.length - 2], openOffset: new THREE.Vector3(outerA * 0.56, 2, 0), openScale: 0.8});
    movingRoof.push({object: roof[roof.length - 3], openOffset: new THREE.Vector3(0, 2.4, 0), openRotationY: Math.PI});
  } else if (venue.roof === 'retractable' && venue.feature === 'cable-crown') {
    // Ring of masts with a fabric ring roof; the centre panel retracts.
    const masts = 36;
    const mastH = topY + 30;
    const mastGeo = track(new THREE.CylinderGeometry(0.6, 0.9, mastH, 8).translate(0, mastH / 2, 0));
    for (let i = 0; i < masts; i++) {
      const t = (i / masts) * Math.PI * 2;
      const [x, z] = superellipse(outerA + 3, outerB + 3, p, t);
      const mast = new THREE.Mesh(mastGeo, steel);
      mast.position.set(x, 0, z);
      // Lean each mast slightly outward, around the tangent of the bowl.
      const axis = new THREE.Vector3(z, 0, -x).normalize();
      mast.quaternion.setFromAxisAngle(axis, -0.12);
      group.add(mast);
    }
    const ring = new THREE.Mesh(track(ringPlate(R * 0.35, R * 0.35 * (outerB / outerA), p, R * 0.68, topY + 10, -6)), roofMat);
    group.add(ring);
    roof.push(ring);
    const centre = new THREE.Mesh(track(domeCap(R * 0.36, R * 0.36 * (outerB / outerA), p, topY + 10, 3)), roofMat);
    group.add(centre);
    roof.push(centre);
    movingRoof.push({object: centre, openOffset: new THREE.Vector3(0, 0, 0), shrink: true});
  } else if (venue.roof === 'canopy') {
    const width = Math.max(8, (outerB - innerB) * 0.75);
    const canopy = new THREE.Mesh(track(ringPlate(outerA - width + 1, outerB - width + 1, p, width + 1, topY + 4, 3)), roofMat);
    canopy.castShadow = false;
    group.add(canopy);
    roof.push(canopy);
  }

  if (venue.feature === 'inclined-tower') {
    // Olympic Stadium's 45° tower, rising over one end.
    const towerH = R * 1.35;
    const towerGeo = track(new THREE.CylinderGeometry(4, 9, towerH, 4, 1));
    const tower = new THREE.Mesh(towerGeo, concrete);
    tower.rotation.y = Math.PI / 4;
    const pivot = new THREE.Group();
    pivot.add(tower);
    tower.position.y = towerH / 2;
    pivot.position.set(outerA + 18, 0, 0);
    pivot.rotation.z = Math.PI / 4.2;
    tower.castShadow = true;
    group.add(pivot);
    // Cables from the tower top to the roof rim.
    const top = new THREE.Vector3(outerA + 18 - Math.sin(Math.PI / 4.2) * towerH, Math.cos(Math.PI / 4.2) * towerH, 0);
    const cableMat = track(new THREE.LineBasicMaterial({color: '#555a60'}));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      const [x, z] = superellipse(outerA * 0.6, outerB * 0.6, p, t);
      pts.push(top.clone(), new THREE.Vector3(x, topY + R * 0.18, z));
    }
    const cables = new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(pts)), cableMat);
    group.add(cables);
  }

  // Light towers for open-air stadiums.
  if (venue.roof === 'open' || (venue.roof === 'canopy' && venue.kind !== 'arena')) {
    const poleH = topY + 18;
    const poleGeo = track(new THREE.CylinderGeometry(0.4, 0.6, poleH, 6));
    const lampGeo = track(new THREE.BoxGeometry(4, 2.5, 0.8));
    const lampMat = track(new THREE.MeshStandardMaterial({color: '#fffbe6', emissive: '#fff4c2', emissiveIntensity: 0.6}));
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const pole = new THREE.Mesh(poleGeo, steel);
      const x = sx * (outerA + 2) * 0.8;
      const z = sz * (outerB + 2) * 0.8;
      pole.position.set(x, poleH / 2, z);
      group.add(pole);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(x, poleH, z);
      lamp.lookAt(0, 0, 0);
      group.add(lamp);
    }
  }

  return {
    group,
    roof,
    movingRoof,
    radius: Math.max(R, venue.feature === 'inclined-tower' ? R * 1.4 : R),
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
