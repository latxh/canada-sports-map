import {describe, expect, it} from 'vitest';
import * as THREE from 'three';
import {LEAGUES, TEAMS, VENUE_BY_ID, VENUES} from '../data';
import {buildStadium} from './buildStadium';
import {hasStadiumModel, STADIUM_MODEL_IDS} from './modelIds';
import {STADIUM_MODELS} from './models';

/** Venues a current team plays in today (open-ended tenure). */
const currentVenueIds = new Set(
  TEAMS.filter((t) => t.status === 'current').flatMap((t) => t.venues.filter((s) => s.to === undefined).map((s) => s.venueId)),
);

describe('stadium models', () => {
  it('cover exactly the venues current teams play in', () => {
    expect([...STADIUM_MODEL_IDS].sort()).toEqual([...currentVenueIds].sort());
    expect(Object.keys(STADIUM_MODELS).sort()).toEqual([...STADIUM_MODEL_IDS].sort());
    expect(STADIUM_MODEL_IDS).toHaveLength(24);
  });

  it('never model a former venue', () => {
    for (const v of VENUES) if (v.closed !== undefined) expect(hasStadiumModel(v.id), v.id).toBe(false);
  });

  for (const id of STADIUM_MODEL_IDS) {
    it(`${id} builds a valid low-poly model`, () => {
      const venue = VENUE_BY_ID[id];
      const tenant = TEAMS.find((t) => t.status === 'current' && t.venues.some((s) => s.venueId === id && s.to === undefined))!;
      const model = buildStadium({venue, sport: LEAGUES[tenant.league].sport, seatColor: '#336699', accentColor: '#cc3333'});
      expect(model).not.toBeNull();
      if (!model) return;
      // Well inside the 100K-triangle mobile budget, and merged into a few draw calls.
      expect(model.triangles).toBeGreaterThan(1500);
      expect(model.triangles).toBeLessThan(60000);
      expect(model.drawCalls).toBeLessThan(16);
      const box = new THREE.Box3();
      let finite = true;
      model.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || mesh.name === 'ground') return;
        const pos = mesh.geometry.getAttribute('position').array;
        for (let i = 0; i < pos.length; i++) if (!Number.isFinite(pos[i])) finite = false;
        mesh.geometry.computeBoundingBox();
        box.union(mesh.geometry.boundingBox!);
      });
      expect(finite).toBe(true);
      const size = box.getSize(new THREE.Vector3());
      expect(Math.max(size.x, size.z)).toBeLessThan(model.radius * 7);
      expect(size.y).toBeLessThan(model.radius * 1.5);
      // Retractable roofs animate; every venue with a roof can hide it.
      expect(Boolean(model.setRoofOpen), 'retractable').toBe(venue.roof === 'retractable');
      if (venue.roof !== 'open') expect(model.roof.length, 'roof objects').toBeGreaterThan(0);
      model.setRoofOpen?.(0.5);
      model.setRoofOpen?.(1);
      model.dispose();
    });
  }
});
