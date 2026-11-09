#!/usr/bin/env node
/**
 * Builds src/data/geo/canada.topo.json from Natural Earth 1:50m GeoJSON.
 *
 * Natural Earth is public domain (https://www.naturalearthdata.com/).
 * Download the three source files first (they are not committed):
 *
 *   mkdir -p .geo-src && cd .geo-src
 *   BASE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
 *   curl -LO $BASE/ne_50m_admin_1_states_provinces.geojson
 *   curl -LO $BASE/ne_50m_admin_0_countries.geojson
 *   curl -LO $BASE/ne_50m_lakes.geojson
 *
 * Then: node scripts/build-geo.mjs [srcDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import {topology} from 'topojson-server';
import {presimplify, simplify, quantile} from 'topojson-simplify';

const src = process.argv[2] ?? '.geo-src';
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, f), 'utf8'));

const BBOX = {west: -170, east: -45, south: 38, north: 84};

function polygonsInBox(geometry, box) {
  const polys =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  const kept = polys.filter((poly) =>
    poly[0].some(([x, y]) => x >= box.west && x <= box.east && y >= box.south && y <= box.north),
  );
  if (kept.length === 0) return null;
  return {type: 'MultiPolygon', coordinates: kept};
}

const admin1 = read('ne_50m_admin_1_states_provinces.geojson');
const provinces = admin1.features
  .filter((f) => f.properties.iso_a2 === 'CA')
  .map((f) => ({
    type: 'Feature',
    id: f.properties.postal,
    properties: {name: f.properties.name, code: f.properties.postal},
    geometry: f.geometry,
  }));

const countries = read('ne_50m_admin_0_countries.geojson');
const neighbours = countries.features
  .filter((f) => ['USA', 'GRL'].includes(f.properties.ADM0_A3))
  .map((f) => {
    const geometry = polygonsInBox(f.geometry, {west: -170, east: -10, south: 24, north: 84});
    return geometry && {type: 'Feature', id: f.properties.ADM0_A3, properties: {name: f.properties.NAME}, geometry};
  })
  .filter(Boolean);

const lakesSrc = read('ne_50m_lakes.geojson');
const lakes = lakesSrc.features
  .filter((f) => (f.properties.scalerank ?? 9) <= 2)
  .map((f) => {
    const geometry = polygonsInBox(f.geometry, BBOX);
    return geometry && {type: 'Feature', properties: {name: f.properties.name ?? ''}, geometry};
  })
  .filter(Boolean);

let topo = topology({
  provinces: {type: 'FeatureCollection', features: provinces},
  neighbours: {type: 'FeatureCollection', features: neighbours},
  lakes: {type: 'FeatureCollection', features: lakes},
}, 3e4);
topo = presimplify(topo);
topo = simplify(topo, quantile(topo, 0.35));

const out = path.join('src', 'data', 'geo', 'canada.topo.json');
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(topo));
console.log(`wrote ${out}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB; ` +
  `${provinces.length} provinces, ${neighbours.length} neighbours, ${lakes.length} lakes`);
