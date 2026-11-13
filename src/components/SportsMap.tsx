import {useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {geoMercator, geoPath} from 'd3-geo';
import {DESKTOP_QUERY, TOUCH_QUERY, useMediaQuery} from '../hooks/useMediaQuery';
import {select} from 'd3-selection';
import 'd3-transition';
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
import {DitherLayer, siteColor, type DitherMode, type Site} from './DitherLayer';
import {distanceKm, formatKm, type LatLon, type PinDistance} from './MapTools';
import {FitIcon, MinusIcon, PlusIcon} from './icons';
import {POPULATION} from '../data/population';
import type {MapView} from './HeaderControls';


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
  /** Data layer on top of the sports cities ('teams' = none). */
  view?: MapView;
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

const MAX_ZOOM = 40;
const LABEL_FONT = 13;
/** Zoom (1 = all of Canada) from which the detailed coastline, rivers, towns and geography labels show. */
const DETAIL_K = 1.9;
/** Zoom from which a city's dot can become a stack of its venue illustrations. */
const STACK_MIN_K = 2.5;
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
  view = 'teams',
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
      .scaleExtent([minK, MAX_ZOOM])
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

  /** Fly to a city, close enough to separate it from its neighbours. */
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
      const k = Math.min(MAX_ZOOM, Math.max(transformRef.current.k, Math.min(size.w, size.h) < 600 ? 3 : 4, sep));
      const visibleH = size.h - bottomInset - topInset;
      animateTo(
        zoomIdentity
          .translate((size.w - rightInset) / 2, topInset + visibleH / 2)
          .scale(k)
          .translate(-p[0], -p[1]),
        700,
      );
    },
    [projection, size, cities, bottomInset, rightInset, topInset, animateTo],
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
  const closestFieldSites = useMemo<Site[]>(() => closestSites.map(({x, y, rgb}) => ({x, y, rgb})), [closestSites]);

  /** Hover (or tap) readout for the closest-team view. */
  const [probe, setProbe] = useState<{x: number; y: number; text: string; sub: string} | null>(null);
  const probeAt = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el || !projection || closestSites.length === 0) return;
      const rect = el.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const [mx, my] = transformRef.current.invert([sx, sy]);
      const ll = projection.invert?.([mx, my]);
      if (!ll) return;
      let best = closestSites[0];
      let bd = Infinity;
      for (const site of closestSites) {
        const d = (site.x - mx) ** 2 + (site.y - my) ** 2;
        if (d < bd) [best, bd] = [site, d];
      }
      const km = distanceKm({lon: ll[0], lat: ll[1]}, best.city);
      setProbe({
        x: sx,
        y: sy,
        text: best.team.name,
        sub: `${best.city.name}${best.count > 1 ? ` · +${best.count - 1} more team${best.count > 2 ? 's' : ''}` : ''} · ${formatKm(km)}`,
      });
    },
    [projection, closestSites],
  );
  useEffect(() => {
    if (!showClosest) setProbe(null);
  }, [showClosest]);
  // On touch screens the readout from a tap fades after a few seconds.
  useEffect(() => {
    if (!probe || window.matchMedia('(hover: hover)').matches) return;
    const id = window.setTimeout(() => setProbe(null), 3500);
    return () => window.clearTimeout(id);
  }, [probe]);

  /** Every metro area in k=1 map pixels, for the population view. */
  const popPoints = useMemo(() => {
    if (!projection) return [];
    return POPULATION.map((a) => {
      const p = projection([a.lon, a.lat]);
      return p ? {...a, px: p[0], py: p[1]} : null;
    }).filter((a): a is NonNullable<typeof a> => a !== null);
  }, [projection]);

  const showDetail = !!detailPaths && !takeover && transform.k >= DETAIL_K;
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
    const stack = size ? stackGeometry(size) : null;
    const stacks = (id: string) => !!stack && showVenues && !takeover && id !== selectedCityId && venuesByCity.has(id);
    const items = markers.map((m) => {
      const x = transform.applyX(m.px);
      const y = transform.applyY(m.py);
      const r = markerRadius(m.teams.length);
      return {...m, x, y, r};
    });
    const clusters = clusterMarkers(items, selectedCityId);
    // A city's dot becomes its venue stack only where the stack fits clear of every other marker
    // (most important cities first), so crowded areas keep their dots and nothing re-clusters.
    if (stack) {
      const taken: Box[] = [];
      for (const c of clusters) {
        if (c.members.length !== 1 || !stacks(c.head.city.id)) continue;
        const box = {x0: c.x - stack.r - 3, y0: c.y - stack.r - 3, x1: c.x + stack.r + 3, y1: c.y + stack.r + 3};
        const clear =
          !taken.some((b) => overlaps(b, box)) &&
          !clusters.some((o) => o !== c && !o.isStacked && overlaps(box, {x0: o.x - o.r - 3, y0: o.y - o.r - 3, x1: o.x + o.r + 3, y1: o.y + o.r + 3}));
        if (!clear) continue;
        c.r = stack.r;
        c.isStacked = true;
        taken.push(box);
      }
    }
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
    const isDataView = view === 'population' || view === 'titles';
    if (detailPaths && !takeover && !isDataView) {
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
    if (detailPaths && showDetail && !isDataView) {
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
    // Population: one circle per metro area, its area proportional to the people living there.
    // A value label shows only where it does not cover a city name or another value.
    const fitsValue = (x: number, y: number, text: string, fontSize: number) => {
      const w = text.length * fontSize * 0.62;
      const box = {x0: x - w / 2, y0: y - fontSize * 0.6, x1: x + w / 2, y1: y + fontSize * 0.6};
      if (!onScreen(box) || taken.some((b) => overlaps(b, box))) return false;
      taken.push(box);
      return true;
    };
    const popBubbles =
      view === 'population'
        ? popPoints
            .map((a) => ({key: a.name, name: a.name, pop: a.pop, x: transform.applyX(a.px), y: transform.applyY(a.py), r: popRadius(a.pop, transform.k), showValue: false}))
            .filter((b) => !size || (b.x > -b.r && b.y > -b.r && b.x < size.w + b.r && b.y < size.h + b.r))
            .map((b) => ({...b, showValue: b.r >= 15 && fitsValue(b.x, b.y + b.r * 0.45, formatPop(b.pop), valueFont(b.r))}))
        : [];

    // Championships: one circle per city (or merged cluster), its area proportional to the titles won there.
    const titleBubbles =
      view === 'titles'
        ? visibleClusters
            .map((c) => ({key: c.head.city.id, titles: c.members.reduce((n, m) => n + m.teams.reduce((k, t) => k + t.championships.length, 0), 0), x: c.x, y: c.y}))
            .filter((b) => b.titles > 0)
            .map((b) => ({...b, r: titleRadius(b.titles, transform.k)}))
            .sort((a, b) => b.r - a.r)
            .map((b) => ({...b, showValue: b.r >= 13 && fitsValue(b.x, b.y + b.r * 0.5, String(b.titles), valueFont(b.r))}))
        : [];
    return {clusters: visibleClusters, labels, boxes, provinceLabels, geoLabels, towns, popBubbles, titleBubbles};
  }, [markers, transform, selectedCityId, size, paths, detailPaths, takeover, showDetail, view, popPoints, showVenues, venuesByCity]);

  const labelById = useMemo(() => new Map(placed.labels.map((l) => [l.id, l])), [placed.labels]);

  // What the dither layer shows: territories, people, or titles (one at a time).
  const ditherMode = useMemo<DitherMode | null>(() => {
    if (takeover) return null;
    if (showClosest) return closestFieldSites.length ? {kind: 'closest', sites: closestFieldSites} : null;
    if (view === 'population') return {kind: 'blobs', rgb: [238, 108, 52], radius: popRadius, blobs: popPoints.map((a) => ({x: a.px, y: a.py, value: a.pop}))};
    if (view === 'titles') {
      const blobs = markers
        .map((m) => ({x: m.px, y: m.py, value: m.teams.reduce((n, t) => n + t.championships.length, 0)}))
        .filter((b) => b.value > 0);
      return {kind: 'blobs', rgb: [222, 166, 34], radius: titleRadius, sparkle: true, blobs};
    }
    return null;
  }, [takeover, showClosest, closestFieldSites, view, popPoints, markers]);
  // Outlines the dither is clipped to (stable between renders so the field only rebuilds when they change).
  const ditherProvinces = useMemo(
    () => (paths ? (showDetail && detailPaths ? detailPaths.provinces : paths.provinces).map((p) => p.d) : []),
    [paths, detailPaths, showDetail],
  );
  const ditherLakes = useMemo(() => (paths ? (showDetail && detailPaths ? detailPaths.lakes : paths.lakes) : []), [paths, detailPaths, showDetail]);

  const zoomToCluster = useCallback(
    (members: {px: number; py: number}[]) => {
      if (!size) return;
      let minD = Infinity;
      for (let i = 0; i < members.length; i++)
        for (let j = i + 1; j < members.length; j++)
          minD = Math.min(minD, Math.hypot(members[i].px - members[j].px, members[i].py - members[j].py));
      const k = Math.min(MAX_ZOOM, Math.max(transform.k * 1.5, (SEPARATION_PX / minD) * 1.15));
      const cx = members.reduce((a, m) => a + m.px, 0) / members.length;
      const cy = members.reduce((a, m) => a + m.py, 0) / members.length;
      animateTo(
        zoomIdentity
          .translate((size.w - rightInset) / 2, topInset + (size.h - bottomInset - topInset) / 2)
          .scale(k)
          .translate(-cx, -cy),
        600,
      );
    },
    [size, transform.k, bottomInset, rightInset, topInset, animateTo],
  );

  const riverRank = transform.k < 3 ? 5 : transform.k < 5 ? 7 : 9;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{background: 'var(--map-water)'}}
      onPointerMove={(e) => {
        if (showClosest && e.pointerType === 'mouse' && e.buttons === 0) probeAt(e.clientX, e.clientY);
      }}
      onPointerLeave={(e) => {
        // A finger "leaves" right after every tap; only a mouse leaving should hide the readout.
        if (e.pointerType === 'mouse') setProbe(null);
      }}
      onPointerUp={(e) => {
        if (showClosest && e.pointerType !== 'mouse' && !isPinMode) probeAt(e.clientX, e.clientY);
      }}>
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

          {ditherMode && (
            <DitherLayer
              width={size.w}
              height={size.h}
              transform={transform}
              mode={ditherMode}
              provinces={ditherProvinces}
              lakes={ditherLakes}
            />
          )}

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

          {/* Data views: drawn under the city markers so the dots stay clickable. */}
          {placed.popBubbles.length > 0 && (
            <g aria-hidden="true" pointerEvents="none" className="data-layer">
              {placed.popBubbles
                .filter((b) => b.showValue)
                .map((b) => (
                  <text key={`t-${b.key}`} x={b.x} y={b.y + b.r * 0.45} textAnchor="middle" dominantBaseline="central" className="bubble-value pop-value" fontSize={valueFont(b.r)}>
                    {formatPop(b.pop)}
                  </text>
                ))}
            </g>
          )}
          {placed.titleBubbles.length > 0 && (
            <g aria-hidden="true" pointerEvents="none" className="data-layer">
              {placed.titleBubbles
                .filter((b) => b.showValue)
                .map((b) => (
                  <text key={`t-${b.key}`} x={b.x} y={b.y + b.r * 0.5} textAnchor="middle" dominantBaseline="central" className="bubble-value title-value" fontSize={valueFont(b.r)}>
                    {b.titles}
                  </text>
                ))}
            </g>
          )}

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

      {probe && (
        <div className="glass glass-strong card-radius pointer-events-none absolute z-10 px-2.5 py-1.5" style={{left: Math.min(probe.x + 14, (size?.w ?? 0) - 240), top: probe.y + 14}}>
          <div className="text-sm font-semibold text-primary">{probe.text}</div>
          <div className="text-xs text-secondary tabular-nums">{probe.sub}</div>
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

/** Population circle radius in screen pixels: area ∝ people, growing gently with zoom. */
function popRadius(pop: number, k: number) {
  return Math.max(1.6, Math.sqrt(pop / 6_200_000) * 44 * Math.pow(k, 0.55));
}

/** Championship circle radius in screen pixels: area ∝ titles. */
function titleRadius(titles: number, k: number) {
  return Math.sqrt(titles) * 6.5 * Math.pow(k, 0.45) + 3;
}

function valueFont(r: number) {
  return Math.min(14, 9 + r / 9);
}

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${Math.round(n / 1000)}K`;
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
  return (
    <>
      <rect className="city-hit" x={box.x0 - x} y={box.y0 - y} width={box.x1 - box.x0} height={box.y1 - box.y0} />
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
  for (const c of clusters) {
    const teams = c.members.flatMap((m) => m.teams);
    c.teamCount = teams.length;
    c.currentCount = teams.filter((t) => t.status === 'current').length;
    c.leagues = LEAGUE_ORDER.filter((l) => teams.some((t) => t.league === l));
    c.r = markerRadius(teams.length);
    c.containsSelected = c.members.some((m) => m.city.id === selectedId);
  }
  return clusters;
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
    const suffix = extra === 1 ? `& ${second}` : extra > 1 ? `+${extra}` : '';
    const w = Math.max(text.length * LABEL_FONT * 0.58, suffix.length * SUFFIX_FONT * 0.58) + 6;
    const h = LABEL_FONT + 4;
    const below = suffix ? SUFFIX_DY : 0;
    const gap = c.r + 6;
    const right = {x: c.x + gap, anchor: 'start' as const, box: {x0: c.x + gap, y0: c.y - h / 2, x1: c.x + gap + w, y1: c.y + h / 2 + below}};
    const left = {x: c.x - gap, anchor: 'end' as const, box: {x0: c.x - gap - w, y0: c.y - h / 2, x1: c.x - gap, y1: c.y + h / 2 + below}};
    const candidates = sides.get(id) === 'end' ? [left, right] : [right, left];
    const fit = candidates.find(
      (cand) =>
        (!size || (cand.box.x0 >= 2 && cand.box.x1 <= size.w - 2 && cand.box.y0 >= 2 && cand.box.y1 <= size.h - 2)) &&
        !markerBoxes.some((b, j) => j !== i && overlaps(b, cand.box)) &&
        !labelBoxes.some((b) => overlaps(b, cand.box)),
    );
    if (fit) {
      sides.set(id, fit.anchor);
      labelBoxes.push(fit.box);
      out.push({id, text, extra, second, x: fit.x, y: c.y, anchor: fit.anchor, isSelected: c.containsSelected, box: fit.box});
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
function stackGeometry(size: Size) {
  const cardW = size.w < 640 ? 40 : 50;
  const cardH = Math.round((cardW * 10) / 16);
  const w = cardW + STACK_DEPTH * STACK_STEP + 2;
  const h = cardH + STACK_DEPTH * STACK_STEP + 2;
  return {cardW, cardH, w, h, r: Math.ceil(Math.max(w, h) / 2)};
}
