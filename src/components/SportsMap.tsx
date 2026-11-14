import {useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {geoMercator, geoPath} from 'd3-geo';
import {DESKTOP_QUERY, TOUCH_QUERY, useMediaQuery} from '../hooks/useMediaQuery';
import {select} from 'd3-selection';
import 'd3-transition';
import {interpolateZoom} from 'd3-interpolate';
import {zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform} from 'd3-zoom';
import {feature} from 'topojson-client';
import type {FeatureCollection, Geometry} from 'geojson';
import type {Topology, GeometryCollection} from 'topojson-specification';
import {IconButton} from '@astryxdesign/core/IconButton';
import {ButtonGroup} from '@astryxdesign/core/ButtonGroup';
import {Icon} from '@astryxdesign/core/Icon';
import {CITIES, CITY_BY_ID, LEAGUE_ORDER, VENUE_BY_ID, compareTeams, type City, type LeagueId, type Team} from '../data';
import {ISOMETRIC_VENUES, isometricThumbUrl, type IsometricArt} from '../data/isometric';
import {latestEra} from '../lib/venues';
import {siteColor} from './DitherLayer';
import {territoryShapes, voronoiPolygons, type Pt} from './territories';
import {type LatLon, type PinDistance} from './MapTools';
import {FitIcon, MinusIcon, PlusIcon} from './icons';


type GeoProps = {name: string; code?: string};
export interface Geo {
  provinces: FeatureCollection<Geometry, GeoProps>;
  neighbours: FeatureCollection<Geometry, GeoProps>;
  world: FeatureCollection<Geometry, GeoProps>;
  lakes: FeatureCollection<Geometry, GeoProps>;
}

type GeoLabelKind = 'ocean' | 'water' | 'range' | 'region' | 'island';
interface Detail {
  provinces: FeatureCollection<Geometry, GeoProps>;
  lakes: FeatureCollection<Geometry, {rank: number}>;
  rivers: FeatureCollection<Geometry, {rank: number}>;
  towns: {name: string; z: number; lon: number; lat: number}[];
  labels: {name: string; kind: GeoLabelKind; z: number; lon: number; lat: number}[];
}

let geoPromise: Promise<Geo> | null = null;
/** The boundary data is a separate chunk so it downloads in parallel with the app. */
export function loadGeo(): Promise<Geo> {
  geoPromise ??= import('../data/geo/canada.topo.json').then((mod) => {
    const topo = mod.default as unknown as Topology<{
      provinces: GeometryCollection<GeoProps>;
      neighbours: GeometryCollection<GeoProps>;
      world: GeometryCollection<GeoProps>;
      lakes: GeometryCollection<GeoProps>;
    }>;
    return {
      provinces: feature(topo, topo.objects.provinces) as FeatureCollection<Geometry, GeoProps>,
      neighbours: feature(topo, topo.objects.neighbours) as FeatureCollection<Geometry, GeoProps>,
      world: feature(topo, topo.objects.world) as FeatureCollection<Geometry, GeoProps>,
      lakes: feature(topo, topo.objects.lakes) as FeatureCollection<Geometry, GeoProps>,
    };
  });
  return geoPromise;
}

let detailPromise: Promise<Detail> | null = null;
/** Finer coastline, lakes, rivers, towns and geography labels: a separate, larger chunk fetched after the map is up. */
function loadDetail(): Promise<Detail> {
  detailPromise ??= import('../data/geo/canada-detail.topo.json').then((mod) => {
    const topo = mod.default as unknown as Topology<{
      provinces: GeometryCollection<GeoProps>;
      lakes: GeometryCollection<{rank: number}>;
      rivers: GeometryCollection<{rank: number}>;
      towns: GeometryCollection<{name: string; z: number}>;
      labels: GeometryCollection<{name: string; kind: GeoLabelKind; z: number}>;
    }>;
    const points = <P,>(fc: FeatureCollection<Geometry, P>) =>
      fc.features.flatMap((f) => (f.geometry.type === 'Point' ? [{...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1]}] : []));
    return {
      provinces: feature(topo, topo.objects.provinces) as FeatureCollection<Geometry, GeoProps>,
      lakes: feature(topo, topo.objects.lakes) as FeatureCollection<Geometry, {rank: number}>,
      rivers: feature(topo, topo.objects.rivers) as FeatureCollection<Geometry, {rank: number}>,
      towns: points(feature(topo, topo.objects.towns) as FeatureCollection<Geometry, {name: string; z: number}>),
      labels: points(feature(topo, topo.objects.labels) as FeatureCollection<Geometry, {name: string; kind: GeoLabelKind; z: number}>),
    };
  });
  return detailPromise;
}

interface PlacedGeoLabel {
  key: string;
  kind: GeoLabelKind;
  text: string;
  x: number;
  y: number;
}

interface PlacedTown {
  key: string;
  name: string;
  x: number;
  y: number;
}

const GEO_LABEL_STYLE: Record<GeoLabelKind, {size: number; upper: boolean; className: string}> = {
  ocean: {size: 13, upper: false, className: 'geo-label geo-label-water geo-label-ocean'},
  water: {size: 11, upper: false, className: 'geo-label geo-label-water'},
  range: {size: 10, upper: true, className: 'geo-label geo-label-land geo-label-range'},
  region: {size: 10, upper: true, className: 'geo-label geo-label-land'},
  island: {size: 10.5, upper: false, className: 'geo-label geo-label-land'},
};

export interface MapCity {
  city: City;
  teams: Team[];
}

interface Props {
  cities: MapCity[];
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
  /** Pixels at the bottom of the map hidden behind an overlay (mobile bottom sheet). */
  bottomInset?: number;
  /** Pixels at the right of the map hidden behind an overlay (floating panel). */
  rightInset?: number;
  /** Pixels at the top of the map hidden behind floating controls. */
  topInset?: number;
  /** Fill Canada with a team's logo (the only Canadian team in its league). */
  takeover?: MapTakeover | null;
  /** Pin tool: while on, a click on the map drops (or moves) the pin. */
  isPinMode?: boolean;
  pin?: LatLon | null;
  /** Distance and colour for each city from the pin, for the arcs. */
  pinTargets?: PinDistance[];
  onDropPin?: (p: LatLon) => void;
  /** Colour the map by its closest team. */
  showClosest?: boolean;
}

export interface MapTakeover {
  id: string;
  logoHref: string;
  background: string;
  label: string;
}

interface Size {
  w: number;
  h: number;
}

/**
 * Most zoom on a desktop-width map. k = 1 fits Canada to the screen's width, so a phone's k
 * covers more ground: it gets proportionally more (maxZoomFor).
 */
const MAX_ZOOM = 40;
const maxZoomFor = (size: Size | null) => (size ? MAX_ZOOM * Math.max(1, 1100 / size.w) : MAX_ZOOM);
const LABEL_FONT = 13;
/** Zoom (1 = all of Canada) from which the detailed coastline, rivers, towns and geography labels show. */
const DETAIL_K = 1.9;
/** Zoom from which a city's dot can become a stack of its venue illustrations. */
const STACK_MIN_K = 2.5;
/** Frames sampled when replaying a zoom flight to see where names end up (see stackZoom). */
const FLIGHT_FRAMES = 14;
/** The most a "show all cities" view zooms in, so the country never feels cropped. */
const HOME_MAX_K = 1.3;

export function SportsMap({
  cities,
  selectedCityId,
  onSelectCity,
  bottomInset = 0,
  rightInset = 0,
  topInset = 0,
  takeover = null,
  isPinMode = false,
  pin = null,
  pinTargets = [],
  onDropPin,
  showClosest = false,
}: Props) {
  const clipId = useId();
  const isTouch = useMediaQuery(TOUCH_QUERY);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const maxZoom = maxZoomFor(size);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  useEffect(() => {
    let alive = true;
    loadGeo().then((g) => alive && setGeo(g));
    return () => {
      alive = false;
    };
  }, []);
  // The detailed layer is the biggest download (about 160 KB), and most visits never zoom in
  // far enough to see it. It loads when you zoom in toward it or open a city (which flies in
  // past it); desktops also fetch it once the browser is idle.
  const wantsDetail = !!geo && (transform.k >= DETAIL_K * 0.8 || selectedCityId !== null);
  useEffect(() => {
    if (!wantsDetail) return;
    let alive = true;
    loadDetail().then((d) => alive && setDetail(d));
    return () => {
      alive = false;
    };
  }, [wantsDetail]);
  useEffect(() => {
    if (!geo || !window.matchMedia(DESKTOP_QUERY).matches) return;
    let alive = true;
    const run = () => loadDetail().then((d) => alive && setDetail(d));
    const idle = window.requestIdleCallback?.(run, {timeout: 6000});
    const timer = idle === undefined ? window.setTimeout(run, 3000) : undefined;
    return () => {
      alive = false;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [geo]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect;
      if (width > 0 && height > 0) setSize({w: Math.round(width), h: Math.round(height)});
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const projection = useMemo(() => {
    if (!size || !geo) return null;
    // Web Mercator, the familiar web-map view of the world. Scaled so Canada spans the width
    // at k = 1 (the far north runs off the top), which keeps zoom thresholds in the same range.
    const padX = Math.max(12, size.w * 0.03);
    const p = geoMercator().fitWidth(size.w - padX * 2, geo.provinces);
    const [tx, ty] = p.translate();
    return p.translate([tx + padX, ty + Math.max(12, size.h * 0.04)]);
  }, [size, geo]);

  const paths = useMemo(() => {
    if (!projection || !geo) return null;
    const gen = geoPath(projection);
    return {
      provinces: geo.provinces.features.map((f) => ({
        id: f.properties.code ?? f.properties.name,
        name: f.properties.name,
        d: gen(f) ?? '',
        centroid: gen.centroid(f),
        area: gen.area(f),
      })),
      neighbours: geo.neighbours.features.map((f) => gen(f) ?? ''),
      world: geo.world.features.map((f) => gen(f) ?? ''),
      lakes: geo.lakes.features.map((f) => gen(f) ?? ''),
      bounds: gen.bounds(geo.provinces),
      /** The whole projected world (Mercator stops short of the poles), for the pan and zoom limits. */
      worldBounds: gen.bounds({type: 'FeatureCollection', features: [...geo.world.features, ...geo.neighbours.features, ...geo.provinces.features]}),
    };
  }, [projection, geo]);

  const detailPaths = useMemo(() => {
    if (!projection || !detail) return null;
    const gen = geoPath(projection);
    const at = (lon: number, lat: number) => projection([lon, lat]) ?? [NaN, NaN];
    // Towns that are already sports cities on the map are left out.
    const cityPoints = CITIES.map((c) => at(c.lon, c.lat));
    return {
      provinces: detail.provinces.features.map((f) => ({id: f.properties.code ?? f.properties.name, name: f.properties.name, d: gen(f) ?? ''})),
      lakes: detail.lakes.features.map((f) => gen(f) ?? ''),
      rivers: detail.rivers.features.map((f) => ({d: gen(f) ?? '', rank: f.properties.rank})),
      towns: detail.towns
        .map((t) => ({...t, p: at(t.lon, t.lat)}))
        .filter((t) => Number.isFinite(t.p[0]) && !cityPoints.some((q) => Math.hypot(q[0] - t.p[0], q[1] - t.p[1]) < 4)),
      labels: detail.labels.map((l) => ({...l, p: at(l.lon, l.lat)})).filter((l) => Number.isFinite(l.p[0])),
    };
  }, [projection, detail]);

  const hasMap = paths !== null;

  /** Every sports city, in k=1 map pixels: the "show all cities" view frames this band. */
  const cityBand = useMemo(() => {
    if (!projection) return null;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const c of CITIES) {
      const p = projection([c.lon, c.lat]);
      if (!p) continue;
      x0 = Math.min(x0, p[0]);
      y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
    }
    return Number.isFinite(x0) ? {x0, y0, x1, y1} : null;
  }, [projection]);

  /** The "show all cities" view: the band of cities across southern Canada, centred in the uncovered part of the map. */
  const homeTransform = useCallback(() => {
    if (!size || !cityBand) return zoomIdentity;
    const w2 = size.w - rightInset;
    const h2 = size.h - bottomInset - topInset;
    // Room for the names that sit beside the westernmost and easternmost rings.
    const padL = Math.min(110, w2 * 0.13);
    const padR = Math.min(120, w2 * 0.15);
    const padY = Math.min(80, h2 * 0.12);
    const bw = Math.max(1, cityBand.x1 - cityBand.x0);
    const bh = Math.max(1, cityBand.y1 - cityBand.y0);
    const k = Math.max(0.45, Math.min(HOME_MAX_K, (w2 - padL - padR) / bw, (h2 - padY * 2) / bh));
    const cx = (cityBand.x0 + cityBand.x1) / 2;
    const cy = (cityBand.y0 + cityBand.y1) / 2;
    return zoomIdentity.translate(padL + (w2 - padL - padR) / 2 - k * cx, topInset + h2 / 2 - k * cy).scale(k);
  }, [size, cityBand, rightInset, bottomInset, topInset]);

  /**
   * Mainland Canada for logo takeovers: BC to Newfoundland, from southern Ontario up to about 71°N,
   * so the high Arctic islands fall off the top. Fitted to the part of the map not under panels.
   */
  const mainlandTransform = useCallback(() => {
    if (!size || !projection) return homeTransform();
    const nw = projection([-139, 71]);
    const se = projection([-53, 42]);
    if (!nw || !se) return homeTransform();
    const w2 = size.w - rightInset;
    const h2 = size.h - bottomInset - topInset;
    const padX = Math.min(48, w2 * 0.04);
    const padTop = 64; // clear of the controls pill
    const padBottom = Math.min(32, h2 * 0.04);
    const bw = se[0] - nw[0];
    const bh = se[1] - nw[1];
    const k = Math.min((w2 - padX * 2) / bw, (h2 - padTop - padBottom) / bh);
    const cx = (nw[0] + se[0]) / 2;
    const cy = (nw[1] + se[1]) / 2;
    return zoomIdentity.translate(w2 / 2 - k * cx, topInset + padTop + (h2 - padTop - padBottom) / 2 - k * cy).scale(k);
  }, [size, projection, homeTransform, rightInset, bottomInset, topInset]);


  // Attach d3-zoom once the svg exists.
  const didInit = useRef(false);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !size) return;
    // Zoom out until the whole world fits, and pan anywhere within it (plus a little margin).
    const [[wx0, wy0], [wx1, wy1]] = paths?.worldBounds ?? [
      [-size.w, -size.h],
      [size.w * 2, size.h * 2],
    ];
    const minK = Math.max(0.05, Math.min(size.w / (wx1 - wx0), size.h / (wy1 - wy0)));
    const margin = Math.max(size.w, size.h) * 0.1;
    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([minK, maxZoom])
      .translateExtent([
        [wx0 - margin, wy0 - margin],
        [wx1 + margin, wy1 + margin],
      ])
      .on('zoom', (event: {transform: ZoomTransform}) => {
        transformRef.current = event.transform;
        setTransform(event.transform);
      });
    zoomRef.current = behavior;
    const sel = select(svg);
    sel.call(behavior).on('dblclick.zoom', null);
    if (!didInit.current) {
      didInit.current = true;
      sel.call(behavior.transform, takeover ? mainlandTransform() : homeTransform());
    }
    return () => {
      sel.on('.zoom', null);
    };
    // The start view is read once at init; later changes animate below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, hasMap]);

  const animateTo = useCallback((t: ZoomTransform, ms: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).transition().duration(ms).call(zoomRef.current.transform, t);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).transition().duration(250).call(zoomRef.current.scaleBy, factor);
  }, []);

  const takeoverId = takeover?.id ?? null;

  /**
   * Where a takeover logo sits, in map pixels: big, centred over the Prairies and the
   * territories (clear of Hudson Bay), sized from the mainland's width so it scales with the map.
   */
  const takeoverPlacement = useMemo(() => {
    if (!takeover || !projection) return null;
    const anchor = projection([-104, 60.5]);
    const west = projection([-123, 56]);
    const east = projection([-80, 56]);
    if (!anchor || !west || !east) return null;
    return {anchor: anchor as [number, number], size: Math.abs(east[0] - west[0]) * 0.86};
  }, [takeover, projection]);
  const resetZoom = useCallback(() => {
    animateTo(takeoverId ? mainlandTransform() : homeTransform(), 450);
  }, [animateTo, takeoverId, mainlandTransform, homeTransform]);

  // stackZoom (defined below, once the markers are) for flyToCity.
  const stackZoomRef = useRef<
    ((anchor: {px: number; py: number}, candidates: {px: number; py: number}[], baseK: number, selected: string | null) => {k: number; center: [number, number]}) | null
  >(null);
  // The clusters on screen (set below), so flying to a city can keep its cluster-mates in view.
  const clustersRef = useRef<Cluster[]>([]);
  /** Fly to a city, close enough to separate it from its neighbours and show their venues. */
  const flyToCity = useCallback(
    (cityId: string) => {
      if (!projection || !size) return;
      const city = CITY_BY_ID[cityId];
      if (!city) return;
      const p = projection([city.lon, city.lat]);
      if (!p) return;
      const sep = separationZoom(
        p,
        cities.filter((c) => c.city.id !== city.id).map((c) => projection([c.city.lon, c.city.lat])).filter((q): q is [number, number] => !!q),
      );
      const base = Math.min(maxZoom, Math.max(transformRef.current.k, Math.min(size.w, size.h) < 600 ? 3 : 4, sep));
      // On in until the venue stacks of the cities around it all show, keeping in view the cities
      // it was clustered with (those that fit).
      const mates = clustersRef.current.find((c) => c.members.some((m) => m.city.id === cityId))?.members ?? [];
      const anchor = mates.find((m) => m.city.id === cityId) ?? {px: p[0], py: p[1]};
      const {k, center} = stackZoomRef.current?.(anchor, mates, base, cityId) ?? {k: base, center: [p[0], p[1]] as [number, number]};
      const visibleH = size.h - bottomInset - topInset;
      animateTo(
        zoomIdentity
          .translate((size.w - rightInset) / 2, topInset + visibleH / 2)
          .scale(k)
          .translate(-center[0], -center[1]),
        700,
      );
    },
    [projection, size, cities, bottomInset, rightInset, topInset, animateTo, maxZoom],
  );

  // Where the map should be. Opening a city remembers the view you jumped from, and closing the
  // panel goes back to it (a cluster you had zoomed into stays zoomed). A logo takeover frames
  // mainland Canada, with the high Arctic islands cropped off the top.
  const jumpPoint = useRef<ZoomTransform | null>(null);
  const prevSelected = useRef<string | null>(null);
  const prevTakeover = useRef<string | null>(null);
  useEffect(() => {
    if (!didInit.current || !projection) return;
    const wasSelected = prevSelected.current;
    const selectionChanged = wasSelected !== selectedCityId;
    const takeoverChanged = prevTakeover.current !== takeoverId;
    prevSelected.current = selectedCityId;
    prevTakeover.current = takeoverId;
    if (selectionChanged && !wasSelected && selectedCityId) jumpPoint.current = transformRef.current;
    if (takeoverId) {
      animateTo(mainlandTransform(), 450);
      return;
    }
    if (selectedCityId) {
      if (selectionChanged || takeoverChanged) flyToCity(selectedCityId);
      return;
    }
    if (selectionChanged && wasSelected) {
      animateTo(jumpPoint.current ?? homeTransform(), 600);
      jumpPoint.current = null;
      return;
    }
    // Nothing selected and the space around the map changed (or a takeover ended): frame the cities again.
    animateTo(homeTransform(), 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCityId, takeoverId, rightInset, bottomInset, topInset, hasMap, size?.w, size?.h]);

  const markers = useMemo(() => {
    if (!projection) return [];
    return cities
      .map(({city, teams}) => {
        const p = projection([city.lon, city.lat]);
        if (!p) return null;
        const leagues = LEAGUE_ORDER.filter((l) => teams.some((t) => t.league === l));
        const currentCount = teams.filter((t) => t.status === 'current').length;
        return {city, teams, leagues, currentCount, px: p[0], py: p[1]};
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [cities, projection]);

  /** The team each city 'owns' in the closest-team view: its top active team (league order). */
  const closestSites = useMemo(() => {
    if (!projection || !showClosest) return [];
    return cities
      .map(({city, teams}) => {
        const active = teams.filter((t) => t.status === 'current').sort(compareTeams);
        const p = projection([city.lon, city.lat]);
        if (!active.length || !p) return null;
        const era = latestEra(active[0]);
        return {x: p[0], y: p[1], rgb: siteColor(era.colors), city, team: active[0], count: active.length};
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [projection, cities, showClosest]);


  const showDetail = !!detailPaths && !takeover && transform.k >= DETAIL_K;
  // Each closest-team city's territory: the part of the map nearer to it than to any other
  // (a Voronoi cell), cut to the land that's drawn, so it needs no clip path while panning.
  const territoryCells = useMemo(
    () => (paths && closestSites.length ? voronoiPolygons(closestSites.map((s) => [s.x, s.y] as Pt), paths.bounds as [Pt, Pt]) : null),
    [closestSites, paths],
  );
  // Cut once for the outline land and once (the first time it shows) for the detailed coastline,
  // so zooming back and forth across DETAIL_K doesn't redo the work.
  const coarseTerritories = useMemo(
    () => (territoryCells && paths ? territoryShapes(territoryCells.cells, territoryCells.box, paths.provinces.map((p) => p.d)) : null),
    [territoryCells, paths],
  );
  const [wantsDetailTerritories, setWantsDetailTerritories] = useState(false);
  if (showDetail && territoryCells && !wantsDetailTerritories) setWantsDetailTerritories(true);
  const detailTerritories = useMemo(
    () => (territoryCells && detailPaths && wantsDetailTerritories ? territoryShapes(territoryCells.cells, territoryCells.box, detailPaths.provinces.map((p) => p.d)) : null),
    [territoryCells, detailPaths, wantsDetailTerritories],
  );
  const territories = showDetail && detailTerritories ? detailTerritories : coarseTerritories;
  const markerById = useMemo(() => new Map(markers.map((m) => [m.city.id, m])), [markers]);
  const pinPoint = useMemo(() => (pin && projection ? projection([pin.lon, pin.lat]) : null), [pin, projection]);
  const pinScreen = pinPoint ? ([transform.applyX(pinPoint[0]), transform.applyY(pinPoint[1])] as const) : null;

  // Once you've zoomed in to about a region's scale, a city's dot becomes a small stack of its
  // venue illustrations (current venues first), wherever there's room for it.
  const venuesByCity = useMemo(() => {
    const byCity = new Map<string, {venueId: string; art: IsometricArt}[]>();
    for (const [venueId, art] of Object.entries(ISOMETRIC_VENUES)) {
      // A venue sharing another's illustration (TD Place Arena) is left to its host.
      const venue = VENUE_BY_ID[venueId];
      if (!venue || art.file !== `${venueId}.webp`) continue;
      byCity.set(venue.cityId, [...(byCity.get(venue.cityId) ?? []), {venueId, art}]);
    }
    for (const list of byCity.values())
      list.sort((a, b) => Number(!!VENUE_BY_ID[a.venueId].closed) - Number(!!VENUE_BY_ID[b.venueId].closed) || (VENUE_BY_ID[b.venueId].capacity ?? 0) - (VENUE_BY_ID[a.venueId].capacity ?? 0));
    return byCity;
  }, []);
  // Stacks need a little zoom (k = 1 frames all of Canada); crowded cities keep their dots.
  const showVenues = transform.k >= STACK_MIN_K;
  // Which side of its dot each city's name sat on last time, so names don't flip while zooming.
  const labelSides = useRef(new Map<string, 'start' | 'end'>());
  const placed = useMemo(() => {
    const clusters = layoutMarkers(markers, transform, selectedCityId, size, labelSides.current, showVenues && !takeover ? venuesByCity : null);
    const visibleClusters = takeover && selectedCityId ? clusters.filter((c) => c.containsSelected) : clusters;
    const {labels, boxes} = placeLabels(visibleClusters, selectedCityId, size, labelSides.current);
    const provinceLabels = (takeover ? [] : (paths?.provinces ?? []))
      .filter((p) => p.area * transform.k * transform.k > 9000)
      .map((p) => {
        const x = transform.applyX(p.centroid[0]);
        const y = transform.applyY(p.centroid[1]);
        const text = transform.k < 1.6 && p.name.length > 14 ? p.id : p.name;
        const fontSize = transform.k > 3 ? 12 : 10;
        const w = text.length * fontSize * 0.75;
        return {id: p.id, x, y, text, fontSize, box: {x0: x - w / 2, y0: y - fontSize, x1: x + w / 2, y1: y + 4}};
      })
      .filter((pl) => !boxes.some((b) => overlaps(b, pl.box)));
    const taken: Box[] = [...boxes, ...provinceLabels.map((p) => p.box)];
    const onScreen = (b: Box) => !size || (b.x0 >= 0 && b.y0 >= 0 && b.x1 <= size.w && b.y1 <= size.h);

    // Seas, lakes, mountain ranges and islands, most important first.
    const geoLabels: PlacedGeoLabel[] = [];
    if (detailPaths && !takeover) {
      for (const l of detailPaths.labels) {
        const minK = l.kind === 'ocean' || l.kind === 'water' ? l.z : Math.max(l.z, DETAIL_K);
        if (transform.k < minK) continue;
        const style = GEO_LABEL_STYLE[l.kind];
        const text = style.upper ? l.name.toUpperCase() : l.name;
        const x = transform.applyX(l.p[0]);
        const y = transform.applyY(l.p[1]);
        const w = text.length * style.size * (style.upper ? 0.72 : 0.56);
        const box = {x0: x - w / 2 - 2, y0: y - style.size * 0.75, x1: x + w / 2 + 2, y1: y + style.size * 0.45};
        if (!onScreen(box) || taken.some((b) => overlaps(b, box))) continue;
        taken.push(box);
        geoLabels.push({key: `${l.kind}-${l.name}`, kind: l.kind, text, x, y});
      }
    }

    // Towns: Natural Earth's web-map zoom for each place, mapped onto this map's zoom.
    const towns: PlacedTown[] = [];
    if (detailPaths && showDetail) {
      const townZoom = 3.6 + 1.3 * Math.log2(transform.k);
      for (const t of detailPaths.towns) {
        if (t.z > townZoom) continue;
        const x = transform.applyX(t.p[0]);
        const y = transform.applyY(t.p[1]);
        const w = t.name.length * 11 * 0.56;
        const box = {x0: x - 3, y0: y - 7, x1: x + 6 + w, y1: y + 7};
        if (!onScreen(box) || taken.some((b) => overlaps(b, box))) continue;
        taken.push(box);
        towns.push({key: `${t.name}-${t.lon}`, name: t.name, x, y});
      }
    }
    return {clusters: visibleClusters, labels, boxes, provinceLabels, geoLabels, towns};
  }, [markers, transform, selectedCityId, size, paths, detailPaths, takeover, showDetail, showVenues, venuesByCity]);

  const labelById = useMemo(() => new Map(placed.labels.map((l) => [l.id, l])), [placed.labels]);

  /** The most zoom that, centred on `center`, keeps every point in view with room for its stack and some of its name. */
  const fitZoom = useCallback(
    (center: [number, number], pts: {px: number; py: number}[]) => {
      if (!size) return maxZoom;
      const stackR = stackGeometry(size).r;
      const halfW = Math.max(1, (size.w - rightInset) / 2 - stackR - 40);
      const halfH = Math.max(1, (size.h - bottomInset - topInset) / 2 - stackR - 16);
      let k = maxZoom;
      for (const m of pts) {
        const dx = Math.abs(m.px - center[0]);
        const dy = Math.abs(m.py - center[1]);
        if (dx > 0) k = Math.min(k, halfW / dx);
        if (dy > 0) k = Math.min(k, halfH / dy);
      }
      return k;
    },
    [size, maxZoom, rightInset, bottomInset, topInset],
  );

  /**
   * Where to fly to show `anchor` and the `candidates` around it: the centre, and the zoom (at
   * least `baseK`) at which every city in view with venue art shows its stack (`selected` keeps
   * its dot) while the kept cities stay in view. Steps in until it does; if that never happens,
   * the first zoom showing the most stacks.
   *
   * Names keep the side they had in earlier frames, and a name can block a neighbour's stack, so
   * a candidate is confirmed by replaying the flight there (d3-zoom's own path and easing).
   */
  const stackZoom = useCallback(
    (anchor: {px: number; py: number}, candidates: {px: number; py: number}[], baseK: number, selected: string | null): {k: number; center: [number, number]} => {
      // The cities to keep in view: the anchor and, nearest first, each candidate that can still be
      // told apart from the rest (SEPARATION_PX) at a zoom that fits them all on screen.
      const bboxCentre = (pts: {px: number; py: number}[]): [number, number] => [
        (Math.min(...pts.map((m) => m.px)) + Math.max(...pts.map((m) => m.px))) / 2,
        (Math.min(...pts.map((m) => m.py)) + Math.max(...pts.map((m) => m.py))) / 2,
      ];
      const sepK = (pts: {px: number; py: number}[]) => {
        let minD = Infinity;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) minD = Math.min(minD, Math.hypot(pts[i].px - pts[j].px, pts[i].py - pts[j].py));
        return minD === Infinity ? baseK : Math.max(baseK, (SEPARATION_PX / minD) * 1.15);
      };
      const dist = (m: {px: number; py: number}) => Math.hypot(m.px - anchor.px, m.py - anchor.py);
      let keep = [anchor];
      for (const m of candidates.filter((c) => c !== anchor).sort((a, b) => dist(a) - dist(b))) {
        const next = [...keep, m];
        if (fitZoom(bboxCentre(next), next) >= sepK(next)) keep = next;
      }
      const center = bboxCentre(keep);
      const minK = Math.min(maxZoom, sepK(keep));
      if (!size || takeover) return {k: minK, center};
      const maxK = Math.max(minK, fitZoom(center, keep));
      const right = size.w - rightInset;
      const top = topInset;
      const bottom = size.h - bottomInset;
      const target = (k: number) => zoomIdentity.translate(right / 2, top + (bottom - top) / 2).scale(k).translate(-center[0], -center[1]);
      const missing = (clusters: Cluster[]) => {
        let n = 0;
        for (const c of clusters) {
          if (c.isStacked || c.x < 0 || c.x > right || c.y < top || c.y > bottom) continue;
          n += c.members.filter((m) => m.city.id !== selected && venuesByCity.has(m.city.id)).length;
        }
        return n;
      };
      // The flight from where the map is now, as d3-zoom animates it.
      const from = transformRef.current;
      const w = Math.max(size.w, size.h);
      const mid: [number, number] = [size.w / 2, size.h / 2];
      const view = (t: ZoomTransform): [number, number, number] => [(mid[0] - t.x) / t.k, (mid[1] - t.y) / t.k, w / t.k];
      const flight = (to: ZoomTransform) => {
        const sides = new Map(labelSides.current);
        const path = interpolateZoom(view(from), view(to));
        let clusters: Cluster[] = [];
        for (let f = 1; f <= FLIGHT_FRAMES; f++) {
          const e = f / FLIGHT_FRAMES;
          const v = path(e < 0.5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2);
          const k = w / v[2];
          const t = f === FLIGHT_FRAMES ? to : zoomIdentity.translate(mid[0] - v[0] * k, mid[1] - v[1] * k).scale(k);
          clusters = layoutMarkers(markers, t, selected, size, sides, venuesByCity);
          placeLabels(clusters, selected, size, sides);
        }
        return missing(clusters);
      };
      let best = {k: minK, missing: Infinity};
      let flights = 0;
      for (let k = Math.max(minK, STACK_MIN_K); ; k *= 1.15) {
        const kk = Math.min(k, maxK);
        const t = target(kk);
        // A quick look first (names on their current sides); replay the flight only for a likely zoom.
        const quick = missing(layoutMarkers(markers, t, selected, size, new Map(labelSides.current), venuesByCity));
        const n = quick === 0 && flights < 8 ? (flights++, flight(t)) : quick;
        if (n < best.missing) best = {k: kk, missing: n};
        if (n === 0 || kk >= maxK) break;
      }
      return {k: best.k, center};
    },
    [size, takeover, maxZoom, rightInset, topInset, bottomInset, markers, venuesByCity, fitZoom],
  );
  useLayoutEffect(() => {
    stackZoomRef.current = stackZoom;
    clustersRef.current = placed.clusters;
  }, [stackZoom, placed.clusters]);


  const zoomToCluster = useCallback(
    (members: {px: number; py: number}[]) => {
      if (!size) return;
      // Close enough to split the cluster (or as much of it, around its main city, as fits on
      // screen), then on until every city in view shows its venues.
      const {k, center} = stackZoom(members[0], members, Math.min(maxZoom, transform.k * 1.5), selectedCityId);
      const [cx, cy] = center;
      animateTo(
        zoomIdentity
          .translate((size.w - rightInset) / 2, topInset + (size.h - bottomInset - topInset) / 2)
          .scale(k)
          .translate(-cx, -cy),
        600,
      );
    },
    [size, transform.k, bottomInset, rightInset, topInset, animateTo, stackZoom, selectedCityId, maxZoom],
  );

  const riverRank = transform.k < 3 ? 5 : transform.k < 5 ? 7 : 9;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{background: 'var(--map-water)'}}>
      {size && paths && (
        <svg
          ref={svgRef}
          onClick={(e) => {
            if (!isPinMode || !onDropPin || !projection) return;
            if ((e.target as Element).closest('.city-marker')) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const [mx, my] = transformRef.current.invert([e.clientX - rect.left, e.clientY - rect.top]);
            const ll = projection.invert?.([mx, my]);
            if (ll) onDropPin({lon: ll[0], lat: ll[1]});
          }}
          style={isPinMode ? {cursor: 'crosshair'} : undefined}
          className="map-svg block"
          width={size.w}
          height={size.h}
          role="group"
          aria-label={`Map of Canada showing ${cities.length} cities with professional teams. Use the city buttons to open an overview.`}>
          <defs>
            <linearGradient id="takeover-sheen" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
              <stop offset="0.55" stopColor="#000000" stopOpacity={0} />
              <stop offset="1" stopColor="#000000" stopOpacity={0.32} />
            </linearGradient>
            <clipPath id={clipId}>
              {paths.provinces.map((p) => (
                <path key={p.id} d={p.d} />
              ))}
            </clipPath>
          </defs>
          <g transform={transform.toString()}>
            {paths.world.map((d, i) => (
              <path key={`w${i}`} d={d} fill="var(--map-neighbour)" stroke="var(--map-border)" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
            ))}
            {paths.neighbours.map((d, i) => (
              <path key={`n${i}`} d={d} fill="var(--map-neighbour)" stroke="var(--map-border)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
            ))}
            {(showDetail && detailPaths ? detailPaths.provinces : paths.provinces).map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill="var(--map-land)"
                stroke="var(--map-border)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round">
                <title>{p.name}</title>
              </path>
            ))}
            {takeover && takeoverPlacement && (
              <TakeoverLayer key={takeover.id} takeover={takeover} bounds={paths.bounds} anchor={takeoverPlacement.anchor} logoSize={takeoverPlacement.size} clipId={clipId} />
            )}
            {takeover &&
              paths.provinces.map((p) => (
                <path
                  key={`tb-${p.id}`}
                  d={p.d}
                  fill="none"
                  stroke="rgb(255 255 255 / 0.45)"
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
              ))}
            {showClosest && !takeover && territories && (
              <g aria-hidden="true" pointerEvents="none" className="territories">
                {territories.fills.map((d, i) => {
                  const site = closestSites[i];
                  return site && d ? <path key={site.city.id} d={d} fill={`rgb(${site.rgb.join(' ')})`} fillOpacity={0.3} /> : null;
                })}
                {/* Borders in each team's colour, each drawn just inside its own territory so neighbours' sit side by side. */}
                {territories.borders.map((pieces, i) => {
                  const site = closestSites[i];
                  if (!site || !pieces.length) return null;
                  const o = 0.75 / transform.k;
                  const d = pieces.map((b) => `M${b.a[0] + b.n[0] * o},${b.a[1] + b.n[1] * o}L${b.b[0] + b.n[0] * o},${b.b[1] + b.n[1] * o}`).join('');
                  return <path key={site.city.id} d={d} stroke={`rgb(${site.rgb.join(' ')})`} strokeOpacity={0.85} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="butt" fill="none" />;
                })}
              </g>
            )}
            {(takeover ? [] : showDetail && detailPaths ? detailPaths.lakes : paths.lakes).map((d, i) => (
              <path key={`l${i}`} d={d} fill="var(--map-water)" stroke="none" />
            ))}
            {showDetail &&
              detailPaths?.rivers
                .filter((r) => r.rank <= riverRank)
                .map((r, i) => (
                  <path key={`r${i}`} d={r.d} fill="none" stroke="var(--map-river)" strokeWidth={r.rank <= 4 ? 1.2 : 0.8} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                ))}
          </g>

          {/* Province names: faint, screen-space so they stay readable at any zoom. */}
          <g aria-hidden="true">
            {placed.provinceLabels.map((p) => (
              <text
                key={`pl-${p.id}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                fontSize={p.fontSize}
                letterSpacing="0.12em"
                fill="var(--color-text-secondary)"
                opacity={0.55}
                style={{textTransform: 'uppercase', pointerEvents: 'none'}}>
                {p.text}
              </text>
            ))}
          </g>

          {/* Pin arcs: one flight path from the pin to every city on the map, green (near) to red (far). */}
          {pin && pinScreen && (
            <g aria-hidden="true" pointerEvents="none" key={`${pin.lat},${pin.lon}`}>
              {pinTargets.map((target, i) => {
                const m = markerById.get(target.id);
                if (!m) return null;
                const cx = transform.applyX(m.px);
                const cy = transform.applyY(m.py);
                const d = arcPath(pinScreen[0], pinScreen[1], cx, cy);
                // One light runs along every arc together (timing in CSS), so they pulse as one.
                return (
                  <g key={target.id}>
                    <path d={d} pathLength={1} className="pin-arc" stroke={target.color} style={{animationDelay: `${Math.min(900, i * 35)}ms`}} />
                    <path d={d} pathLength={1} className="pin-glint" stroke={target.color} />
                    <path d={d} pathLength={1} className="pin-glint-core" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Seas, lakes, mountains and towns: context only, so hidden from assistive tech. */}
          <g aria-hidden="true" pointerEvents="none">
            {placed.geoLabels.map((l) => (
              <text key={l.key} x={l.x} y={l.y} textAnchor="middle" className={GEO_LABEL_STYLE[l.kind].className} fontSize={GEO_LABEL_STYLE[l.kind].size}>
                {l.text}
              </text>
            ))}
            {placed.towns.map((t) => (
              <g key={t.key}>
                <circle cx={t.x} cy={t.y} r={2.2} className="town-dot" />
                <text x={t.x + 5} y={t.y} dominantBaseline="central" className="town-label" fontSize={11}>
                  {t.name}
                </text>
              </g>
            ))}
          </g>

          {/* City markers (nearby cities merge into a cluster until you zoom in) */}
          <g>
            {placed.clusters
              .slice()
              .sort((a, b) => Number(a.containsSelected) - Number(b.containsSelected))
              .map((c) =>
                c.members.length === 1 ? (
                  <CityMarker
                    key={c.head.city.id}
                    x={c.x}
                    y={c.y}
                    r={c.r}
                    city={c.head.city}
                    teamCount={c.teamCount}
                    currentCount={c.currentCount}
                    leagues={c.leagues}
                    isSelected={c.head.city.id === selectedCityId}
                    onSelect={() => onSelectCity(c.head.city.id)}
                    label={labelById.get(c.head.city.id)}
                    isStacked={c.isStacked}
                  />
                ) : (
                  <ClusterMarker
                    key={`cluster-${c.head.city.id}`}
                    x={c.x}
                    y={c.y}
                    r={c.r}
                    names={c.members.map((m) => m.city.name)}
                    teamCount={c.teamCount}
                    leagues={c.leagues}
                    isSelected={c.containsSelected}
                    isFormer={c.currentCount === 0}
                    onActivate={() => zoomToCluster(c.members)}
                    label={labelById.get(c.head.city.id)}
                  />
                ),
              )}
          </g>

          {pin && pinScreen && (
            <g transform={`translate(${pinScreen[0]},${pinScreen[1]})`} className="map-pin" role="img" aria-label={`Pin at ${pin.lat.toFixed(2)}, ${pin.lon.toFixed(2)}`}>
              <circle r={10} className="map-pin-pulse" />
              <path d="M0 0 C -2 -6 -9 -10 -9 -17 A 9 9 0 1 1 9 -17 C 9 -10 2 -6 0 0 Z" className="map-pin-body" />
              <circle cy={-17} r={3.4} fill="var(--map-halo)" />
            </g>
          )}
        </svg>
      )}

      {/* The stacks are pictures only: the city marker underneath takes the tap. */}
      {size && placed.clusters.some((c) => c.isStacked) && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {placed.clusters
            .filter((c) => c.isStacked)
            .map((c) => {
              const g = stackGeometry(size);
              const venues = venuesByCity.get(c.head.city.id) ?? [];
              return (
                <span key={c.head.city.id} className="venue-stack absolute" style={{left: c.x - g.w / 2, top: c.y - g.h / 2, width: g.w, height: g.h}}>
                  {venues
                    .slice(0, 3)
                    .reverse()
                    .map((v, i, shown) => {
                      const depth = shown.length - 1 - i;
                      return (
                        <img
                          key={v.venueId}
                          src={isometricThumbUrl(v.art)}
                          alt=""
                          decoding="async"
                          className="venue-stack-card"
                          style={{width: g.cardW, height: g.cardH, left: depth * STACK_STEP, top: (STACK_DEPTH - depth) * STACK_STEP, rotate: `${depth * 4}deg`}}
                        />
                      );
                    })}
                </span>
              );
            })}
        </div>
      )}

      {/* Touch screens pinch to zoom, so the buttons are for mice and keyboards. */}
      {!isTouch && (
        <div className="absolute left-3" style={{bottom: bottomInset + 12, transition: 'bottom 200ms ease'}}>
          <ButtonGroup label="Map zoom" orientation="vertical" className="glass glass-group rounded-full">
            <IconButton variant="ghost" className="rounded-full" label="Zoom in" tooltip="Zoom in" icon={<Icon icon={PlusIcon} />} onClick={() => zoomBy(1.6)} />
            <IconButton variant="ghost" className="rounded-full" label="Zoom out" tooltip="Zoom out" icon={<Icon icon={MinusIcon} />} onClick={() => zoomBy(1 / 1.6)} />
            <IconButton variant="ghost" className="rounded-full" label="Show all cities" tooltip="Show all cities" icon={<Icon icon={FitIcon} />} onClick={resetZoom} />
          </ButtonGroup>
        </div>
      )}


    </div>
  );
}

/** A flight-path arc from (x0, y0) to (x1, y1): a quadratic curve bowed upward, higher for longer hops. */
function arcPath(x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) [nx, ny] = [-nx, -ny];
  const h = Math.min(160, len * 0.22);
  const qx = (x0 + x1) / 2 + nx * h;
  const qy = (y0 + y1) / 2 + ny * h;
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function markerRadius(teamCount: number) {
  // Simple rings: a touch larger for bigger sports cities.
  return 3.5 + Math.min(2.5, Math.sqrt(teamCount) * 0.7);
}

interface MarkerProps {
  label?: PlacedLabel;
  x: number;
  y: number;
  r: number;
  city: City;
  teamCount: number;
  currentCount: number;
  leagues: LeagueId[];
  isSelected: boolean;
  onSelect: () => void;
  /** Zoomed in: the city's venue stack (drawn over the map) stands in for its dot. */
  isStacked?: boolean;
}

function CityMarker({x, y, r, city, teamCount, currentCount, isSelected, onSelect, label, isStacked = false}: MarkerProps) {
  const ringR = r + 3.5;
  const defunctOnly = currentCount === 0;
  const name = `${city.name}: ${teamCount} team${teamCount === 1 ? '' : 's'}${defunctOnly ? ', all former' : ''}. Open city overview.`;
  return (
    <g
      className="city-marker"
      transform={`translate(${x},${y})`}
      role="button"
      tabIndex={0}
      aria-label={name}
      aria-pressed={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}>
      <circle className="city-hit" r={isStacked ? r : Math.max(14, ringR + 6)} />
      {isSelected && <circle className="city-pulse" r={r + 1.5} fill="none" stroke="var(--map-selected)" strokeWidth={2} />}
      <g className="city-core">
        {/* A stacked city's venue illustrations (drawn over the map) stand in for its dot. */}
        {!isStacked && <CityDot r={r + 0.4} isFormer={defunctOnly} isSelected={isSelected} />}
        <circle className="city-focus" r={isStacked ? r + 2 : ringR + 4} fill="none" stroke="transparent" />
      </g>
      {label && <MarkerLabel label={label} x={x} y={y} isFormer={defunctOnly} />}
    </g>
  );
}

/** The words a label shows, so a marker's accessible name can contain them (WCAG 2.5.3). */
function labelText(label: PlacedLabel): string {
  if (label.extra === 0) return label.text;
  return label.extra === 1 ? `${label.text} & ${label.second}` : `${label.text} +${label.extra}`;
}

/** The city name, inside the marker's group so the ring and the name hover and click as one. */
function MarkerLabel({label, x, y, isFormer = false}: {label: PlacedLabel; x: number; y: number; isFormer?: boolean}) {
  const {box} = label;
  // The hit area runs from the dot's centre to the far end of the name, so the gap between
  // them (wider beside a venue stack) is part of the same target.
  const x0 = Math.min(box.x0 - x, 0);
  const x1 = Math.max(box.x1 - x, 0);
  return (
    <>
      <rect className="city-hit" x={x0} y={box.y0 - y} width={x1 - x0} height={box.y1 - box.y0} />
      <text
        x={label.x - x}
        y={label.y - y}
        textAnchor={label.anchor}
        dominantBaseline="central"
        className={isFormer && !label.isSelected ? 'city-label city-label-former' : 'city-label'}
        fontSize={LABEL_FONT}
        fontWeight={label.isSelected ? 700 : 600}>
        {label.text}
      </text>
      {label.extra > 0 && (
        <text
          x={label.x - x}
          y={label.y - y + SUFFIX_DY}
          textAnchor={label.anchor}
          dominantBaseline="central"
          className="city-label city-label-suffix"
          fontSize={SUFFIX_FONT}
          fontWeight={600}>
          {label.extra === 1 ? `& ${label.second}` : `+${label.extra}`}
        </text>
      )}
    </>
  );
}

/** A team's logo filling the shape of Canada, on its colour, clipped to the provinces. */
function TakeoverLayer({
  takeover,
  bounds,
  anchor,
  logoSize,
  clipId,
}: {
  takeover: MapTakeover;
  bounds: [[number, number], [number, number]];
  /** Where the logo centres: over the Prairies, inside the home framing. */
  anchor: [number, number];
  /** Logo size in map pixels. */
  logoSize: number;
  clipId: string;
}) {
  const [[x0, y0], [x1, y1]] = bounds;
  const w = x1 - x0;
  const h = y1 - y0;
  const size = logoSize;
  const [cx, cy] = anchor;
  return (
    <g clipPath={`url(#${clipId})`} className="takeover" aria-hidden="true" pointerEvents="none">
      <rect x={x0} y={y0} width={w} height={h} fill={takeover.background} />
      <rect x={x0} y={y0} width={w} height={h} fill="url(#takeover-sheen)" />
      <image href={takeover.logoHref} x={cx - size / 2} y={cy - size / 2} width={size} height={size} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

/** A solid city dot: dark for cities with active teams, light grey for former-only cities, blue when selected. */
function CityDot({r, isFormer, isSelected}: {r: number; isFormer: boolean; isSelected: boolean}) {
  return (
    <circle
      r={r}
      className={isSelected ? 'city-dot city-dot-selected' : isFormer ? 'city-dot city-dot-former' : 'city-dot'}
      strokeWidth={1.75}
    />
  );
}

const SEPARATION_PX = 34;

/** Zoom level at which `p` is at least SEPARATION_PX from every other point (points in k=1 pixels). */
function separationZoom(p: [number, number], others: [number, number][]) {
  let minD = Infinity;
  for (const o of others) minD = Math.min(minD, Math.hypot(p[0] - o[0], p[1] - o[1]));
  return minD === Infinity ? 1 : (SEPARATION_PX / minD) * 1.05;
}

interface PlacedMarker {
  city: City;
  teams: Team[];
  leagues: LeagueId[];
  currentCount: number;
  px: number;
  py: number;
  x: number;
  y: number;
  r: number;
}

interface Cluster {
  head: PlacedMarker;
  members: PlacedMarker[];
  x: number;
  y: number;
  r: number;
  teamCount: number;
  currentCount: number;
  leagues: LeagueId[];
  containsSelected: boolean;
  /** Drawn as a stack of the city's venue illustrations instead of a dot. */
  isStacked?: boolean;
}

function importance(a: PlacedMarker, b: PlacedMarker, selectedId: string | null) {
  if (a.city.id === selectedId) return -1;
  if (b.city.id === selectedId) return 1;
  return a.city.rank - b.city.rank || b.teams.length - a.teams.length;
}

/** Merge markers that would overlap on screen into a single cluster headed by the most important city. */
function clusterMarkers(items: PlacedMarker[], selectedId: string | null): Cluster[] {
  const ordered = items.slice().sort((a, b) => importance(a, b, selectedId));
  const clusters: Cluster[] = [];
  for (const m of ordered) {
    const host = clusters.find((c) => Math.hypot(c.x - m.x, c.y - m.y) < c.r + m.r + 8);
    if (host) {
      host.members.push(m);
    } else {
      clusters.push({head: m, members: [m], x: m.x, y: m.y, r: m.r, teamCount: 0, currentCount: 0, leagues: [], containsSelected: false});
    }
  }
  for (const c of clusters) summarize(c, selectedId);
  return clusters;
}

/** A cluster's totals, size and selection, from its members. */
function summarize(c: Cluster, selectedId: string | null) {
  const teams = c.members.flatMap((m) => m.teams);
  c.teamCount = teams.length;
  c.currentCount = teams.filter((t) => t.status === 'current').length;
  c.leagues = LEAGUE_ORDER.filter((l) => teams.some((t) => t.league === l));
  c.r = markerRadius(teams.length);
  c.containsSelected = c.members.some((m) => m.city.id === selectedId);
}

/**
 * A big city's name must not lose out to the small cities around it. When a cluster's name fits
 * on neither side only because smaller cities' dots are in the way, those cities fold into its
 * cluster ("Toronto +2") until you zoom in further; repeated until every such name fits.
 */
function makeRoomForNames(clusters: Cluster[], selectedId: string | null, size: Size | null, sides: Map<string, 'start' | 'end'>): Cluster[] {
  let out = clusters;
  for (let pass = 0; pass < 4; pass++) {
    const labelled = new Set(placeLabels(out, selectedId, size, new Map(sides)).labels.map((l) => l.id));
    const ordered = out.slice().sort((a, b) => (a.containsSelected ? -1 : b.containsSelected ? 1 : importance(a.head, b.head, selectedId)));
    let merged = false;
    for (const c of ordered) {
      if (labelled.has(c.head.city.id) || (size && (c.x < 0 || c.x > size.w || c.y < 0 || c.y > size.h))) continue;
      const preferEnd = sides.get(c.head.city.id) === 'end';
      for (const side of preferEnd ? (['end', 'start'] as const) : (['start', 'end'] as const)) {
        const box = labelBox(c, side);
        if (size && (box.x0 < 2 || box.x1 > size.w - 2 || box.y0 < 2 || box.y1 > size.h - 2)) continue;
        const blockers = out.filter((o) => o !== c && overlaps(box, {x0: o.x - o.r - 4, y0: o.y - o.r - 4, x1: o.x + o.r + 4, y1: o.y + o.r + 4}));
        if (!blockers.length || blockers.some((o) => o.containsSelected || importance(o.head, c.head, selectedId) < 0)) continue;
        c.members.push(...blockers.flatMap((o) => o.members));
        summarize(c, selectedId);
        out = out.filter((o) => !blockers.includes(o));
        merged = true;
        break;
      }
      if (merged) break;
    }
    if (!merged) break;
  }
  return out;
}

/** The box a cluster's name (and its grey second line) takes up on one side of its dot. */
function labelBox(c: Cluster, side: 'start' | 'end', dy = 0): Box {
  const text = c.head.city.name;
  const extra = c.members.length - 1;
  const second = c.members[1]?.city.name ?? '';
  const suffix = extra === 1 ? `& ${second}` : extra > 1 ? `+${extra}` : '';
  const w = Math.max(text.length * LABEL_FONT * 0.58, suffix.length * SUFFIX_FONT * 0.58) + 6;
  const h = LABEL_FONT + 4;
  const below = suffix ? SUFFIX_DY : 0;
  const gap = c.r + 6;
  const y0 = c.y + dy - h / 2;
  const y1 = c.y + dy + h / 2 + below;
  return side === 'start' ? {x0: c.x + gap, y0, x1: c.x + gap + w, y1} : {x0: c.x - gap - w, y0, x1: c.x - gap, y1};
}

function ClusterMarker({
  x,
  y,
  r,
  names,
  teamCount,
  isSelected,
  onActivate,
  label,
  isFormer = false,
}: {
  label?: PlacedLabel;
  isFormer?: boolean;
  x: number;
  y: number;
  r: number;
  names: string[];
  teamCount: number;
  leagues: LeagueId[];
  isSelected: boolean;
  onActivate: () => void;
}) {
  const ringR = r + 3.5;
  return (
    <g
      className="city-marker"
      transform={`translate(${x},${y})`}
      role="button"
      tabIndex={0}
      aria-label={`${label ? labelText(label) : names[0]}: ${teamCount} teams in ${names.join(', ')}. Zoom in to separate.`}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}>
      <circle className="city-hit" r={Math.max(14, ringR + 8)} />
      <g className="city-core">
        <CityDot r={r + 1.6} isFormer={isFormer} isSelected={isSelected} />
        <circle className="city-focus" r={ringR + 6} fill="none" stroke="transparent" />
      </g>
      {label && <MarkerLabel label={label} x={x} y={y} isFormer={isFormer} />}
    </g>
  );
}

type Box = {x0: number; y0: number; x1: number; y1: number};

interface PlacedLabel {
  id: string;
  text: string;
  extra: number;
  second: string;
  x: number;
  y: number;
  anchor: 'start' | 'end';
  isSelected: boolean;
  box: Box;
}

/** Greedy label placement: most important clusters first, four candidate positions each. */
/** The grey "& Guelph" / "+3" line under a merged cluster's name: its size and offset. */
const SUFFIX_FONT = 11;
const SUFFIX_DY = 14;

/**
 * Names go only to the right or left of their dot, never above or below, and keep the side
 * they had last time (`sides`, updated here) so they don't flip back and forth as you zoom.
 * A merged cluster's other cities go on a grey second line, aligned with the main name.
 */
function placeLabels(clusters: Cluster[], selectedId: string | null, size: Size | null, sides: Map<string, 'start' | 'end'>): {labels: PlacedLabel[]; boxes: Box[]} {
  const markerBoxes: Box[] = clusters.map((c) => ({x0: c.x - c.r - 4, y0: c.y - c.r - 4, x1: c.x + c.r + 4, y1: c.y + c.r + 4}));
  const labelBoxes: Box[] = [];
  const ordered = clusters
    .map((c, i) => ({c, i}))
    .sort((a, b) => (a.c.containsSelected ? -1 : b.c.containsSelected ? 1 : importance(a.c.head, b.c.head, selectedId)));

  const out: PlacedLabel[] = [];
  for (const {c, i} of ordered) {
    if (size && (c.x < -c.r || c.x > size.w + c.r || c.y < -c.r || c.y > size.h + c.r)) continue;
    const id = c.head.city.id;
    const text = c.head.city.name;
    const extra = c.members.length - 1;
    const second = c.members[1]?.city.name ?? '';
    // Its usual side first; a name may slide a few pixels up or down, but stays beside its dot.
    const order: ('start' | 'end')[] = sides.get(id) === 'end' ? ['end', 'start'] : ['start', 'end'];
    const candidates = order.flatMap((side) =>
      [0, -6, 6].map((dy) => ({x: side === 'start' ? c.x + c.r + 6 : c.x - c.r - 6, y: c.y + dy, anchor: side, box: labelBox(c, side, dy)})),
    );
    const fit = candidates.find(
      (cand) =>
        (!size || (cand.box.x0 >= 2 && cand.box.x1 <= size.w - 2 && cand.box.y0 >= 2 && cand.box.y1 <= size.h - 2)) &&
        !markerBoxes.some((b, j) => j !== i && overlaps(b, cand.box)) &&
        !labelBoxes.some((b) => overlaps(b, cand.box)),
    );
    if (fit) {
      sides.set(id, fit.anchor);
      labelBoxes.push(fit.box);
      out.push({id, text, extra, second, x: fit.x, y: fit.y, anchor: fit.anchor, isSelected: c.containsSelected, box: fit.box});
    }
  }
  return {labels: out, boxes: [...markerBoxes, ...labelBoxes]};
}

function overlaps(a: Box, b: Box) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/** How far each card in a venue stack is offset from the one in front, and how many sit behind. */
const STACK_STEP = 5;
const STACK_DEPTH = 2;

/** The size of a city's venue stack on screen, and the radius it takes up as a marker. */
/**
 * Markers at a view: clustered where they'd overlap, names given room, and (when `venues` is
 * given) each city's dot swapped for its venue stack wherever the stack fits clear of every
 * other marker and name, most important cities first, so crowded areas keep their dots and
 * nothing re-clusters. Updates `sides` (each name's last side).
 */
function layoutMarkers(
  markers: Omit<PlacedMarker, 'x' | 'y' | 'r'>[],
  t: ZoomTransform,
  selectedId: string | null,
  size: Size | null,
  sides: Map<string, 'start' | 'end'>,
  venues: Map<string, unknown> | null,
): Cluster[] {
  const items = markers.map((m) => ({...m, x: t.applyX(m.px), y: t.applyY(m.py), r: markerRadius(m.teams.length)}));
  const clusters = makeRoomForNames(clusterMarkers(items, selectedId), selectedId, size, sides);
  const stack = size && venues && t.k >= STACK_MIN_K ? stackGeometry(size) : null;
  if (!stack || !venues) return clusters;
  // Nor may a stack cover another city's name (placed for plain dots, as a dry run). A name in
  // the way may move to the other side of its dot to make room, if it still fits there, so where
  // stacks show doesn't hang on which side names happened to settle on earlier.
  let names = placeLabels(clusters, selectedId, size, new Map(sides)).labels;
  const taken: Box[] = [];
  for (const c of clusters) {
    const id = c.head.city.id;
    if (c.members.length !== 1 || id === selectedId || !venues.has(id)) continue;
    const box = {x0: c.x - stack.r - 3, y0: c.y - stack.r - 3, x1: c.x + stack.r + 3, y1: c.y + stack.r + 3};
    if (taken.some((b) => overlaps(b, box))) continue;
    if (clusters.some((o) => o !== c && !o.isStacked && overlaps(box, {x0: o.x - o.r - 3, y0: o.y - o.r - 3, x1: o.x + o.r + 3, y1: o.y + o.r + 3}))) continue;
    const blockers = names.filter((l) => l.id !== id && overlaps(l.box, box));
    if (blockers.length) {
      const trial = new Map(sides);
      for (const l of blockers) trial.set(l.id, l.anchor === 'start' ? 'end' : 'start');
      const retry = placeLabels(clusters, selectedId, size, new Map(trial)).labels;
      const placedIds = new Set(retry.map((l) => l.id));
      const ok = !retry.some((l) => l.id !== id && overlaps(l.box, box)) && names.every((l) => placedIds.has(l.id));
      if (!ok) continue;
      for (const l of blockers) sides.set(l.id, trial.get(l.id) ?? l.anchor);
      names = retry;
    }
    c.r = stack.r;
    c.isStacked = true;
    taken.push(box);
  }
  return clusters;
}

function stackGeometry(size: Size) {
  const cardW = size.w < 640 ? 40 : 50;
  const cardH = Math.round((cardW * 10) / 16);
  const w = cardW + STACK_DEPTH * STACK_STEP + 2;
  const h = cardH + STACK_DEPTH * STACK_STEP + 2;
  return {cardW, cardH, w, h, r: Math.ceil(Math.max(w, h) / 2)};
}
