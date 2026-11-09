import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {geoConicConformal, geoPath} from 'd3-geo';
import {select} from 'd3-selection';
import 'd3-transition';
import {zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform} from 'd3-zoom';
import {feature} from 'topojson-client';
import type {FeatureCollection, Geometry} from 'geojson';
import type {Topology, GeometryCollection} from 'topojson-specification';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {LEAGUES, LEAGUE_ORDER, type City, type LeagueId, type Team} from '../data';
import {FitIcon, MinusIcon, PlusIcon} from './icons';

type GeoProps = {name: string; code?: string};
interface Geo {
  provinces: FeatureCollection<Geometry, GeoProps>;
  neighbours: FeatureCollection<Geometry, GeoProps>;
  lakes: FeatureCollection<Geometry, GeoProps>;
}

let geoPromise: Promise<Geo> | null = null;
/** The boundary data is a separate chunk so it downloads in parallel with the app. */
function loadGeo(): Promise<Geo> {
  geoPromise ??= import('../data/geo/canada.topo.json').then((mod) => {
    const topo = mod.default as unknown as Topology<{
      provinces: GeometryCollection<GeoProps>;
      neighbours: GeometryCollection<GeoProps>;
      lakes: GeometryCollection<GeoProps>;
    }>;
    return {
      provinces: feature(topo, topo.objects.provinces) as FeatureCollection<Geometry, GeoProps>,
      neighbours: feature(topo, topo.objects.neighbours) as FeatureCollection<Geometry, GeoProps>,
      lakes: feature(topo, topo.objects.lakes) as FeatureCollection<Geometry, GeoProps>,
    };
  });
  return geoPromise;
}

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
}

interface Size {
  w: number;
  h: number;
}

const MAX_ZOOM = 40;
const LABEL_FONT = 13;

export function SportsMap({cities, selectedCityId, onSelectCity, bottomInset = 0, rightInset = 0}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    let alive = true;
    loadGeo().then((g) => alive && setGeo(g));
    return () => {
      alive = false;
    };
  }, []);

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
    const padX = Math.max(12, size.w * 0.03);
    const padY = Math.max(12, size.h * 0.04);
    return geoConicConformal()
      .parallels([49, 77])
      .rotate([96, 0])
      .fitExtent(
        [
          [padX, padY],
          [size.w - padX, size.h - padY],
        ],
        geo.provinces,
      );
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
      lakes: geo.lakes.features.map((f) => gen(f) ?? ''),
    };
  }, [projection, geo]);

  const hasMap = paths !== null;

  /** The "whole country" view, shrunk to fit the part of the map not covered by panels. */
  const homeTransform = useCallback(() => {
    if (!size) return zoomIdentity;
    const w2 = size.w - rightInset;
    const h2 = size.h - bottomInset;
    const s = Math.min(1, w2 / size.w, h2 / size.h);
    return zoomIdentity.translate((w2 - size.w * s) / 2, (h2 - size.h * s) / 2).scale(s);
  }, [size, rightInset, bottomInset]);

  // Attach d3-zoom once the svg exists.
  const didInit = useRef(false);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !size) return;
    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, MAX_ZOOM])
      .translateExtent([
        [-size.w, -size.h],
        [size.w * 2, size.h * 2],
      ])
      .on('zoom', (event: {transform: ZoomTransform}) => setTransform(event.transform));
    zoomRef.current = behavior;
    const sel = select(svg);
    sel.call(behavior).on('dblclick.zoom', null);
    if (!didInit.current) {
      didInit.current = true;
      sel.call(behavior.transform, homeTransform());
    }
    return () => {
      sel.on('.zoom', null);
    };
    // homeTransform is read once at init; later changes animate below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, hasMap]);

  const zoomBy = useCallback((factor: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).transition().duration(250).call(zoomRef.current.scaleBy, factor);
  }, []);

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).transition().duration(450).call(zoomRef.current.transform, homeTransform());
  }, [homeTransform]);

  // With no city selected, re-fit the country whenever a panel opens or closes.
  useEffect(() => {
    if (selectedCityId || !didInit.current) return;
    resetZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightInset, bottomInset, selectedCityId === null]);

  // Fly to the selected city.
  const lastFlown = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedCityId || !projection || !size || !svgRef.current || !zoomRef.current) {
      if (!selectedCityId) lastFlown.current = null;
      return;
    }
    if (lastFlown.current === selectedCityId) return;
    lastFlown.current = selectedCityId;
    const city = cities.find((c) => c.city.id === selectedCityId)?.city;
    if (!city) return;
    const p = projection([city.lon, city.lat]);
    if (!p) return;
    const sep = separationZoom(
      p,
      cities.filter((c) => c.city.id !== city.id).map((c) => projection([c.city.lon, c.city.lat])).filter((q): q is [number, number] => !!q),
    );
    const k = Math.min(MAX_ZOOM, Math.max(transform.k, Math.min(size.w, size.h) < 600 ? 3 : 4, sep));
    const visibleH = size.h - bottomInset;
    const t = zoomIdentity
      .translate((size.w - rightInset) / 2, visibleH / 2)
      .scale(k)
      .translate(-p[0], -p[1]);
    select(svgRef.current).transition().duration(700).call(zoomRef.current.transform, t);
    // transform intentionally omitted: we only fly when the selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCityId, projection, size, bottomInset, rightInset, cities]);

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

  const placed = useMemo(() => {
    const items = markers.map((m) => {
      const x = transform.applyX(m.px);
      const y = transform.applyY(m.py);
      const r = markerRadius(m.teams.length);
      return {...m, x, y, r};
    });
    const clusters = clusterMarkers(items, selectedCityId);
    const {labels, boxes} = placeLabels(clusters, selectedCityId, size);
    const provinceLabels = (paths?.provinces ?? [])
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
    return {clusters, labels, provinceLabels};
  }, [markers, transform, selectedCityId, size, paths]);

  const zoomToCluster = useCallback(
    (members: {px: number; py: number}[]) => {
      const svg = svgRef.current;
      if (!svg || !zoomRef.current || !size) return;
      let minD = Infinity;
      for (let i = 0; i < members.length; i++)
        for (let j = i + 1; j < members.length; j++)
          minD = Math.min(minD, Math.hypot(members[i].px - members[j].px, members[i].py - members[j].py));
      const k = Math.min(MAX_ZOOM, Math.max(transform.k * 1.5, (SEPARATION_PX / minD) * 1.15));
      const cx = members.reduce((a, m) => a + m.px, 0) / members.length;
      const cy = members.reduce((a, m) => a + m.py, 0) / members.length;
      const t = zoomIdentity
        .translate((size.w - rightInset) / 2, (size.h - bottomInset) / 2)
        .scale(k)
        .translate(-cx, -cy);
      select(svg).transition().duration(600).call(zoomRef.current.transform, t);
    },
    [size, transform.k, bottomInset, rightInset],
  );


  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{background: 'var(--map-water)'}}>
      {size && paths && (
        <svg
          ref={svgRef}
          className="map-svg block"
          width={size.w}
          height={size.h}
          role="group"
          aria-label={`Map of Canada showing ${cities.length} cities with professional teams. Use the city buttons to open an overview.`}>
          <g transform={transform.toString()}>
            {paths.neighbours.map((d, i) => (
              <path key={`n${i}`} d={d} fill="var(--map-neighbour)" stroke="var(--map-border)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
            ))}
            {paths.provinces.map((p) => (
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
            {paths.lakes.map((d, i) => (
              <path key={`l${i}`} d={d} fill="var(--map-water)" stroke="none" />
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
                    onActivate={() => zoomToCluster(c.members)}
                  />
                ),
              )}
          </g>

          {/* City labels */}
          <g aria-hidden="true">
            {placed.labels.map((l) => (
              <text
                key={`label-${l.id}`}
                x={l.x}
                y={l.y}
                textAnchor={l.anchor}
                dominantBaseline="central"
                className="city-label"
                fontSize={LABEL_FONT}
                fontWeight={l.isSelected ? 700 : 600}>
                {l.text}
                {l.extra > 0 && <tspan fontWeight={600} fill="var(--color-text-secondary)">{l.extra === 1 ? ` & ${l.second}` : ` +${l.extra}`}</tspan>}
              </text>
            ))}
          </g>
        </svg>
      )}

      <div
        className="absolute left-3 flex flex-col gap-2"
        style={{bottom: bottomInset + 12, transition: 'bottom 200ms ease'}}>
        <IconButton label="Zoom in" tooltip="Zoom in" icon={<Icon icon={PlusIcon} />} elevation="med" onClick={() => zoomBy(1.6)} />
        <IconButton label="Zoom out" tooltip="Zoom out" icon={<Icon icon={MinusIcon} />} elevation="med" onClick={() => zoomBy(1 / 1.6)} />
        <IconButton label="Show all of Canada" tooltip="Show all of Canada" icon={<Icon icon={FitIcon} />} elevation="med" onClick={resetZoom} />
      </div>
    </div>
  );
}

function markerRadius(teamCount: number) {
  return 8.5 + Math.sqrt(teamCount) * 1.4;
}

function CountText({count, fill}: {count: number; fill: string}) {
  return (
    <text aria-hidden="true" textAnchor="middle" dominantBaseline="central" fontSize={count > 9 ? 10 : 11} fontWeight={800} fill={fill} style={{pointerEvents: 'none'}}>
      {count}
    </text>
  );
}

interface MarkerProps {
  x: number;
  y: number;
  r: number;
  city: City;
  teamCount: number;
  currentCount: number;
  leagues: LeagueId[];
  isSelected: boolean;
  onSelect: () => void;
}

function CityMarker({x, y, r, city, teamCount, currentCount, leagues, isSelected, onSelect}: MarkerProps) {
  const ringR = r + 3.5;
  const defunctOnly = currentCount === 0;
  const label = `${city.name}: ${teamCount} team${teamCount === 1 ? '' : 's'}${defunctOnly ? ', all former' : ''}. Open city overview.`;
  return (
    <g
      className="city-marker"
      transform={`translate(${x},${y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
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
      <circle className="city-hit" r={Math.max(22, ringR + 8)} />
      {isSelected && <circle className="city-pulse" r={ringR} fill="none" stroke="var(--color-accent)" strokeWidth={2} />}
      <g className="city-core">
        <LeagueRing r={ringR} leagues={leagues} dashed={defunctOnly} />
        <circle
          r={r}
          fill={isSelected ? 'var(--color-accent)' : defunctOnly ? 'var(--map-land)' : 'var(--color-text-primary)'}
          stroke="var(--map-halo)"
          strokeWidth={2}
        />
        <CountText count={teamCount} fill={isSelected ? 'var(--color-on-accent)' : defunctOnly ? 'var(--color-text-primary)' : 'var(--map-halo)'} />
        <circle className="city-focus" r={ringR + 4} fill="none" stroke="transparent" />
      </g>
    </g>
  );
}

function LeagueRing({r, leagues, dashed}: {r: number; leagues: LeagueId[]; dashed: boolean}) {
  if (leagues.length === 0) return null;
  const width = 3.5;
  if (leagues.length === 1) {
    return (
      <circle
        r={r}
        fill="none"
        stroke={LEAGUES[leagues[0]].color}
        strokeWidth={width}
        strokeDasharray={dashed ? '3 2' : undefined}
      />
    );
  }
  const gap = 0.18;
  const step = (Math.PI * 2) / leagues.length;
  return (
    <g>
      {leagues.map((l, i) => {
        const a0 = -Math.PI / 2 + i * step + gap / 2;
        const a1 = a0 + step - gap;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const d = `M ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)}`;
        return (
          <path
            key={l}
            d={d}
            fill="none"
            stroke={LEAGUES[l].color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={dashed ? '3 2' : undefined}
          />
        );
      })}
    </g>
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
  leagues,
  isSelected,
  onActivate,
}: {
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
      aria-label={`${teamCount} teams in ${names.join(', ')}. Zoom in to separate.`}
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
      <circle className="city-hit" r={Math.max(22, ringR + 8)} />
      <g className="city-core">
        <circle r={ringR + 5} fill="var(--map-halo)" opacity={0.85} />
        <LeagueRing r={ringR} leagues={leagues} dashed={false} />
        <circle r={r} fill={isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)'} stroke="var(--map-halo)" strokeWidth={2} />
        <CountText count={teamCount} fill={isSelected ? 'var(--color-on-accent)' : 'var(--map-halo)'} />
        <circle className="city-focus" r={ringR + 4} fill="none" stroke="transparent" />
      </g>
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
  anchor: 'start' | 'end' | 'middle';
  isSelected: boolean;
}

/** Greedy label placement: most important clusters first, four candidate positions each. */
function placeLabels(clusters: Cluster[], selectedId: string | null, size: Size | null): {labels: PlacedLabel[]; boxes: Box[]} {
  const markerBoxes: Box[] = clusters.map((c) => ({x0: c.x - c.r - 4, y0: c.y - c.r - 4, x1: c.x + c.r + 4, y1: c.y + c.r + 4}));
  const labelBoxes: Box[] = [];
  const ordered = clusters
    .map((c, i) => ({c, i}))
    .sort((a, b) => (a.c.containsSelected ? -1 : b.c.containsSelected ? 1 : importance(a.c.head, b.c.head, selectedId)));

  const out: PlacedLabel[] = [];
  for (const {c, i} of ordered) {
    if (size && (c.x < -c.r || c.x > size.w + c.r || c.y < -c.r || c.y > size.h + c.r)) continue;
    const text = c.head.city.name;
    const extra = c.members.length - 1;
    const second = c.members[1]?.city.name ?? '';
    const suffix = extra === 1 ? ` & ${second}` : extra > 1 ? ` +${extra}` : '';
    const w = (text.length + suffix.length) * LABEL_FONT * 0.58 + 6;
    const h = LABEL_FONT + 4;
    const gap = c.r + 6;
    const candidates: {x: number; y: number; anchor: PlacedLabel['anchor']; box: Box}[] = [
      {x: c.x + gap, y: c.y, anchor: 'start', box: {x0: c.x + gap, y0: c.y - h / 2, x1: c.x + gap + w, y1: c.y + h / 2}},
      {x: c.x - gap, y: c.y, anchor: 'end', box: {x0: c.x - gap - w, y0: c.y - h / 2, x1: c.x - gap, y1: c.y + h / 2}},
      {x: c.x, y: c.y - gap - h / 2, anchor: 'middle', box: {x0: c.x - w / 2, y0: c.y - gap - h, x1: c.x + w / 2, y1: c.y - gap}},
      {x: c.x, y: c.y + gap + h / 2, anchor: 'middle', box: {x0: c.x - w / 2, y0: c.y + gap, x1: c.x + w / 2, y1: c.y + gap + h}},
    ];
    if (size) {
      // Let centred labels slide sideways to stay on screen.
      for (const cand of candidates) {
        if (cand.anchor !== 'middle') continue;
        const shift = cand.box.x0 < 2 ? 2 - cand.box.x0 : cand.box.x1 > size.w - 2 ? size.w - 2 - cand.box.x1 : 0;
        cand.box = {...cand.box, x0: cand.box.x0 + shift, x1: cand.box.x1 + shift};
        cand.x += shift;
      }
    }
    const fit = candidates.find(
      (cand) =>
        (!size || (cand.box.x0 >= 2 && cand.box.x1 <= size.w - 2 && cand.box.y0 >= 2 && cand.box.y1 <= size.h - 2)) &&
        !markerBoxes.some((b, j) => j !== i && overlaps(b, cand.box)) &&
        !labelBoxes.some((b) => overlaps(b, cand.box)),
    );
    if (fit) {
      labelBoxes.push(fit.box);
      out.push({id: c.head.city.id, text, extra, second, x: fit.x, y: fit.y, anchor: fit.anchor, isSelected: c.containsSelected});
    }
  }
  return {labels: out, boxes: [...markerBoxes, ...labelBoxes]};
}

function overlaps(a: Box, b: Box) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}
