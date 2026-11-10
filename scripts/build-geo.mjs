#!/usr/bin/env node
/**
 * Builds the map data from Natural Earth GeoJSON (public domain,
 * https://www.naturalearthdata.com/):
 *
 *   src/data/geo/canada.topo.json         base map, loaded with the app:
 *       provinces (1:50m), neighbours (USA + Greenland), world (every other
 *       country in the northern hemisphere, 1:50m), lakes (1:50m, large only)
 *   src/data/geo/canada-detail.topo.json  loaded the first time you zoom in:
 *       provinces (1:10m), lakes and rivers (1:10m), towns (populated places
 *       in Canada) and geography labels (seas, bays, lakes, mountain ranges,
 *       plateaus, peninsulas and islands)
 *
 * Download the source files first (they are not committed):
 *
 *   mkdir -p .geo-src && cd .geo-src
 *   BASE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
 *   for f in ne_50m_admin_1_states_provinces ne_50m_admin_0_countries ne_50m_lakes \
 *            ne_10m_admin_1_states_provinces ne_10m_lakes ne_10m_rivers_lake_centerlines \
 *            ne_10m_populated_places_simple ne_10m_geography_marine_polys \
 *            ne_10m_geography_regions_polys; do curl -LO $BASE/$f.geojson; done
 *
 * Then: node scripts/build-geo.mjs [srcDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import {topology} from 'topojson-server';
import {presimplify, simplify, quantile} from 'topojson-simplify';
import {quantize} from 'topojson-client';
import {geoArea, geoCentroid, geoContains} from 'd3-geo';

const src = process.argv[2] ?? '.geo-src';
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, f), 'utf8'));

/** Canada and the waters around it. */
const CANADA_BOX = {west: -141.5, east: -52, south: 41.5, north: 84};
const BBOX = {west: -170, east: -45, south: 38, north: 84};

function polys(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
}

function inBox([x, y], box) {
  return x >= box.west && x <= box.east && y >= box.south && y <= box.north;
}

function polygonsInBox(geometry, box) {
  const kept = polys(geometry).filter((poly) => poly[0].some((p) => inBox(p, box)));
  if (kept.length === 0) return null;
  return {type: 'MultiPolygon', coordinates: kept};
}

function linesInBox(geometry, box) {
  const lines =
    geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'MultiLineString' ? geometry.coordinates : [];
  const kept = lines.filter((line) => line.some((p) => inBox(p, box)));
  if (kept.length === 0) return null;
  return {type: 'MultiLineString', coordinates: kept};
}

/**
 * A label point for a polygon feature: the centroid of its largest part when that falls inside
 * it, otherwise the grid point inside it that is farthest from its outline.
 */
function labelPoint(geometry) {
  const parts = polys(geometry).map((coordinates) => ({type: 'Polygon', coordinates}));
  if (parts.length === 0) return null;
  const largest = parts.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
  const c = geoCentroid(largest);
  if (geoContains(largest, c)) return c;
  const ring = largest.coordinates.flat();
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let best = null;
  let bestD = -1;
  for (let i = 1; i < 24; i++)
    for (let j = 1; j < 24; j++) {
      const p = [x0 + ((x1 - x0) * i) / 24, y0 + ((y1 - y0) * j) / 24];
      if (!geoContains(largest, p)) continue;
      const cos = Math.cos((p[1] * Math.PI) / 180);
      let d = Infinity;
      for (let k = 0; k < ring.length; k += Math.max(1, Math.floor(ring.length / 400))) d = Math.min(d, Math.hypot((ring[k][0] - p[0]) * cos, ring[k][1] - p[1]));
      if (d > bestD) [best, bestD] = [p, d];
    }
  return best ?? ring[0];
}

/** Share of a line's points that fall inside Canada (sampled). */
function shareInCanada(geometry) {
  const pts = (geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates).flat();
  const step = Math.max(1, Math.floor(pts.length / 40));
  let n = 0;
  let inside = 0;
  for (let i = 0; i < pts.length; i += step, n++) if (geoContains(canada, pts[i])) inside++;
  return n ? inside / n : 0;
}

const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/** Topology → simplified (keeping the given share of points) → quantized, delta-encoded arcs. */
function build(objects, keep, q) {
  let topo = presimplify(topology(objects));
  topo = simplify(topo, quantile(topo, keep));
  // Drop the simplification weights before quantizing; they only bloat the file.
  topo.arcs = topo.arcs.map((arc) => arc.map(([x, y]) => [x, y]));
  return quantize(topo, q);
}
const point = (coordinates, properties) => ({type: 'Feature', properties, geometry: {type: 'Point', coordinates: coordinates.map((v) => round(v))}});

function write(file, topo) {
  const out = path.join('src', 'data', 'geo', file);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, JSON.stringify(topo));
  return `${out}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB`;
}

// ── Base map ───────────────────────────────────────────────────────────────

const admin1 = read('ne_50m_admin_1_states_provinces.geojson');
const provinces = admin1.features
  .filter((f) => f.properties.iso_a2 === 'CA')
  .map((f) => ({
    type: 'Feature',
    id: f.properties.postal,
    properties: {name: f.properties.name, code: f.properties.postal},
    geometry: f.geometry,
  }));
const canada = {type: 'FeatureCollection', features: provinces};

const countries = read('ne_50m_admin_0_countries.geojson');
const neighbours = countries.features
  .filter((f) => ['USA', 'GRL'].includes(f.properties.ADM0_A3))
  .map((f) => {
    const geometry = polygonsInBox(f.geometry, {west: -170, east: -10, south: 24, north: 84});
    return geometry && {type: 'Feature', id: f.properties.ADM0_A3, properties: {name: f.properties.NAME}, geometry};
  })
  .filter(Boolean);

// The rest of the world (minus Antarctica, which this projection cannot draw), so the map never
// ends in empty ocean. The coarse 1:110m outlines are plenty: these countries only show at the edges.
const world = read('ne_110m_admin_0_countries.geojson')
  .features.filter((f) => !['CAN', 'USA', 'GRL', 'ATA'].includes(f.properties.ADM0_A3))
  .map((f) => ({type: 'Feature', properties: {name: f.properties.NAME}, geometry: f.geometry}));

const lakesSrc = read('ne_50m_lakes.geojson');
const lakes = lakesSrc.features
  .filter((f) => (f.properties.scalerank ?? 9) <= 2)
  .map((f) => {
    const geometry = polygonsInBox(f.geometry, BBOX);
    return geometry && {type: 'Feature', properties: {name: f.properties.name ?? ''}, geometry};
  })
  .filter(Boolean);

{
  const topo = build(
    {
      provinces: canada,
      neighbours: {type: 'FeatureCollection', features: neighbours},
      world: {type: 'FeatureCollection', features: world},
      lakes: {type: 'FeatureCollection', features: lakes},
    },
    Number(process.env.BASE_KEEP ?? 0.35),
    3e4,
  );
  console.log(`wrote ${write('canada.topo.json', topo)}; ${provinces.length} provinces, ${neighbours.length} neighbours, ${world.length} world, ${lakes.length} lakes`);
}

// ── Detail layer ───────────────────────────────────────────────────────────

const admin1Fine = read('ne_10m_admin_1_states_provinces.geojson');
const provincesFine = admin1Fine.features
  .filter((f) => f.properties.iso_a2 === 'CA')
  .map((f) => ({type: 'Feature', id: f.properties.postal, properties: {name: f.properties.name, code: f.properties.postal}, geometry: f.geometry}));

// Lakes in Canada, plus the major lakes anywhere nearby (the detailed layer replaces the base lakes).
const lakesFine = read('ne_10m_lakes.geojson')
  .features.filter((f) => (f.properties.scalerank ?? 9) <= Number(process.env.LAKE_RANK ?? 7))
  .filter((f) => (f.properties.scalerank ?? 9) <= 2 || geoContains(canada, labelPoint(f.geometry) ?? [0, 0]))
  .map((f) => {
    const geometry = polygonsInBox(f.geometry, CANADA_BOX);
    return geometry && {type: 'Feature', properties: {rank: f.properties.scalerank ?? 9}, geometry};
  })
  .filter(Boolean);

// Rivers in Canada only (at least half of each river's course).
const rivers = read('ne_10m_rivers_lake_centerlines.geojson')
  .features.filter((f) => f.geometry && f.properties.featurecla !== 'Lake Centerline' && (f.properties.scalerank ?? 9) <= 8)
  .filter((f) => shareInCanada(f.geometry) >= 0.5)
  .map((f) => {
    const geometry = linesInBox(f.geometry, CANADA_BOX);
    return geometry && {type: 'Feature', properties: {rank: f.properties.scalerank ?? 9}, geometry};
  })
  .filter(Boolean);

// Towns: Canadian populated places. min_zoom is Natural Earth's web-map zoom at which a place appears.
const towns = read('ne_10m_populated_places_simple.geojson')
  .features.filter((f) => f.properties.adm0_a3 === 'CAN')
  .map((f) => point([f.properties.longitude, f.properties.latitude], {name: f.properties.name, z: f.properties.min_zoom ?? 7, pop: f.properties.pop_max ?? 0}))
  .sort((a, b) => b.properties.pop - a.properties.pop);

// Geography labels. `z` is the map zoom (1 = all of Canada) from which a label shows.
const rankZoom = (rank) => [1, 1, 1.4, 2, 2.6, 3.4, 4.5, 6, 8, 10][Math.min(9, Math.max(0, rank))];
const WATERS = new Set([
  'Beaufort Sea', 'Labrador Sea', 'Hudson Bay', 'Baffin Bay', 'Davis Strait', 'James Bay', 'Hudson Strait',
  'Gulf of Saint Lawrence', 'Bay of Fundy', 'Amundsen Gulf', 'Viscount Melville Sound', 'Ungava Bay', 'Foxe Basin',
  'Gulf of Boothia', 'Queen Charlotte Sound', 'Hecate Strait', 'Dixon Entrance', 'Strait of Belle Isle', 'Frobisher Bay',
  'Cumberland Sound', "M'Clure Strait", 'Jones Sound', 'Salish Sea', 'Mackenzie Bay', 'Lincoln Sea', 'Bras d\'Or Lake',
  'Hamilton Inlet', 'Wager Bay', 'Bathurst Inlet', 'Coronation Gulf',
]);
const labels = [
  // The open oceans have no useful centroid; place their names by hand.
  point([-136, 46.5], {name: 'Pacific Ocean', kind: 'ocean', z: 0}),
  point([-43, 46.5], {name: 'Atlantic Ocean', kind: 'ocean', z: 0}),
  point([-128, 77.5], {name: 'Arctic Ocean', kind: 'ocean', z: 0}),
];
for (const f of read('ne_10m_geography_marine_polys.geojson').features) {
  const name = f.properties.name;
  if (!f.geometry || !WATERS.has(name)) continue;
  const p = labelPoint(f.geometry);
  if (p) labels.push(point(p, {name, kind: 'water', z: rankZoom(f.properties.scalerank ?? 6)}));
}
const LAND_CLASSES = new Set(['Range/mtn', 'Plateau', 'Plain', 'Tundra', 'Pen/cape', 'Island', 'Island group']);
// Regions that straddle the border, labelled where they are in Canada.
const LABEL_AT = {'Rocky Mountains': [-118.2, 53.2], 'Great Plains': [-108.5, 51], 'Canadian Shield': [-96.5, 57.5]};
const seen = new Set();
const regions = read('ne_10m_geography_regions_polys.geojson').features.filter((f) => f.geometry);
regions.sort((a, b) => geoArea(b) - geoArea(a));
for (const f of regions) {
  const {NAME: raw, FEATURECLA: cls, SCALERANK: rank} = f.properties;
  if (!f.geometry || !LAND_CLASSES.has(cls) || !raw) continue;
  const name = raw
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())
    .replace(/\bOf\b/g, 'of')
    .replace(/\bD’/g, 'd’');
  const p = LABEL_AT[name] ?? labelPoint(f.geometry);
  if (!p || !geoContains(canada, p) || seen.has(name)) continue;
  seen.add(name);
  const kind = cls === 'Range/mtn' ? 'range' : cls === 'Island' || cls === 'Island group' ? 'island' : 'region';
  labels.push(point(p, {name, kind, z: rankZoom(rank ?? 6) + (kind === 'island' ? 0.6 : 0)}));
}
// Big lakes get their names too: lakes inside Canada, and the Great Lakes it shares.
const SHARED_LAKES = new Set(['Lake Superior', 'Lake Huron', 'Lake Erie', 'Lake Ontario', 'Georgian Bay', 'North Channel']);
for (const f of read('ne_10m_lakes.geojson').features) {
  const {name, scalerank} = f.properties;
  if (!name || (scalerank ?? 9) > 3 || !f.geometry || /Bay$|River$/.test(name) && !SHARED_LAKES.has(name)) continue;
  const p = labelPoint(f.geometry);
  if (!p || seen.has(name) || !(SHARED_LAKES.has(name) || geoContains(canada, p))) continue;
  seen.add(name);
  labels.push(point(p, {name, kind: 'water', z: rankZoom(scalerank + 2)}));
}

{
  const topo = build(
    {
      provinces: {type: 'FeatureCollection', features: provincesFine},
      lakes: {type: 'FeatureCollection', features: lakesFine},
      rivers: {type: 'FeatureCollection', features: rivers},
      towns: {type: 'FeatureCollection', features: towns},
      labels: {type: 'FeatureCollection', features: labels},
    },
    Number(process.env.DETAIL_KEEP ?? 0.3),
    1e5,
  );
  console.log(
    `wrote ${write('canada-detail.topo.json', topo)}; ${provincesFine.length} provinces, ${lakesFine.length} lakes, ` +
      `${rivers.length} rivers, ${towns.length} towns, ${labels.length} labels`,
  );
}
