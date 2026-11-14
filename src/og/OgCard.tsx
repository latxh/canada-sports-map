/**
 * Link-preview cards (1200×630), one per share page in ./manifest.
 *
 * Open `?og=<key>` (e.g. `?og=team:toronto-raptors`) to see a card, or `?og=list` for all of
 * them; scripts/render-og.mjs screenshots each into public/og/. Cards are fixed-size images,
 * so they use fixed pixel sizes rather than responsive layout.
 */
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {geoMercator, geoPath} from 'd3-geo';
import {zoomIdentity} from 'd3-zoom';
import type {GeoPermissibleObjects} from 'd3-geo';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {CITY_BY_ID, LEAGUES, LEAGUE_ORDER, PROVINCE_NAMES, TEAMS, TEAM_BY_ID, compareTeams, yearsLabel, isPlayingNow, titleCount, type LeagueId, type Team} from '../data';
import {loadGeo, type Geo} from '../components/SportsMap';
import {DitherLayer, siteColor, type DitherMode, type Site} from '../components/DitherLayer';
import {LeagueLogo, TeamLogo} from '../visuals/Logos';
import {TrophyArt} from '../visuals/Trophies';
import {TrophyDefs} from '../visuals/TrophyDefs';
import {latestEra} from '../lib/venues';
import {OG_BY_KEY, OG_ENTRIES, SITE_NAME, titlesLabel, type OgEntry} from './manifest';

const W = 1200;
const H = 630;
const PANEL_W = 520;
/** Other teams' territories on a team or city card: present, but quiet. */
const MUTED: [number, number, number] = [54, 57, 66];
const FAVICON = `${import.meta.env.BASE_URL}favicon.svg`;
/** Leagues that only play in Canada: their cards don't need "in Canada". */
const CANADIAN_LEAGUES = new Set<LeagueId>(['CFL', 'CPL', 'CEBL', 'NSL']);

const teamRgb = (team: Team) => siteColor(latestEra(team).colors);
const currentTeams = (league?: LeagueId) => TEAMS.filter((t) => isPlayingNow(t) && (!league || t.league === league));

/** The top current team of each city, as closest-team sites. */
function citySites(): {cityId: string; team: Team}[] {
  const best = new Map<string, Team>();
  for (const t of [...currentTeams()].sort(compareTeams)) if (!best.has(t.cityId)) best.set(t.cityId, t);
  return [...best].map(([cityId, team]) => ({cityId, team}));
}

interface Dot {
  cityId: string;
  tone: 'focus' | 'active' | 'former';
  label?: string;
}

type MapSpec =
  | {kind: 'closest'; sites: {cityId: string; rgb: [number, number, number]}[]; reach: number}
  | {kind: 'glow'; cityId: string; rgb: [number, number, number]};

/** Canada with a living-dither layer, sized for a card. `frame` crops to the band of cities. */
function OgMap({geo, width, height, spec, dots, frame = 'canada'}: {geo: Geo; width: number; height: number; spec: MapSpec; dots: Dot[]; frame?: 'canada' | 'band'}) {
  const projection = useMemo(() => {
    const p = geoMercator();
    if (frame === 'band') {
      // Southern Canada fills the top of a full-bleed card; the Arctic runs off the top edge.
      const band: GeoPermissibleObjects = {
        type: 'MultiPoint',
        coordinates: [
          [-134, 58.5],
          [-124, 48],
          [-96, 61],
          [-81, 42.3],
          [-60, 47],
          [-53, 50],
        ],
      };
      return p.fitExtent(
        [
          [70, 70],
          [width - 70, height * 0.6],
        ],
        band,
      );
    }
    return p.fitExtent(
      [
        [28, 40],
        [width - 28, height - 40],
      ],
      geo.provinces,
    );
  }, [geo, width, height, frame]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const provinces = useMemo(() => geo.provinces.features.map((f) => path(f) ?? ''), [geo, path]);
  const lakes = useMemo(() => geo.lakes.features.map((f) => path(f) ?? ''), [geo, path]);
  const at = (cityId: string) => {
    const c = CITY_BY_ID[cityId];
    return projection([c.lon, c.lat]) ?? [0, 0];
  };
  const mode = useMemo<DitherMode>(() => {
    if (spec.kind === 'closest') {
      const sites: Site[] = spec.sites.map((s) => {
        const [x, y] = at(s.cityId);
        return {x, y, rgb: s.rgb};
      });
      return {kind: 'closest', sites, reach: spec.reach};
    }
    const [x, y] = at(spec.cityId);
    return {kind: 'blobs', rgb: spec.rgb, radius: (r) => r, blobs: [{x, y, value: 120}]};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, projection]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="og-map">
      {provinces.map((d, i) => (
        <path key={i} d={d} className="og-land" />
      ))}
      {lakes.map((d, i) => (
        <path key={`l${i}`} d={d} className="og-lake" />
      ))}
      <DitherLayer width={width} height={height} transform={zoomIdentity} mode={mode} provinces={provinces} lakes={lakes} />
      {dots
        .filter((d) => d.tone !== 'focus')
        .map((d) => {
          const [x, y] = at(d.cityId);
          return <circle key={d.cityId} cx={x} cy={y} r={d.tone === 'active' ? 3.6 : 2.6} className={`og-dot og-dot-${d.tone}`} />;
        })}
      {dots
        .filter((d) => d.tone === 'focus')
        .map((d) => {
          const [x, y] = at(d.cityId);
          const isRight = x > width * 0.62;
          return (
            <g key={d.cityId}>
              <circle cx={x} cy={y} r={15} className="og-focus-ring" />
              <circle cx={x} cy={y} r={6.5} className="og-dot og-dot-focus" />
              {d.label && (
                <text x={isRight ? x - 22 : x + 22} y={y + 7} textAnchor={isRight ? 'end' : 'start'} className="og-map-label">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}

function Brand() {
  return (
    <p className="og-brand">
      <img src={FAVICON} alt="" width={34} height={34} />
      {SITE_NAME}
    </p>
  );
}

function Pills({items}: {items: string[]}) {
  return (
    <p className="og-pills">
      {items.map((s) => (
        <span key={s}>{s}</span>
      ))}
    </p>
  );
}

function LogoTile({size, children}: {size: number; children: ReactNode}) {
  return (
    <span className="og-tile" style={{width: size, height: size, borderRadius: Math.round(size * 0.22)}}>
      {children}
    </span>
  );
}

/** A name sized to fit the copy column: long names step down. */
function Name({text, max = 64}: {text: string; max?: number}) {
  const size = text.length > 24 ? max - 18 : text.length > 18 ? max - 10 : max;
  return (
    <h1 className="og-name" style={{fontSize: size}}>
      {text}
    </h1>
  );
}

function SplitCard({copy, map}: {copy: ReactNode; map: ReactNode}) {
  return (
    <main className="og-card">
      <section className="og-copy">
        <Brand />
        <div className="og-body">{copy}</div>
      </section>
      <section className="og-panel" style={{width: PANEL_W}}>
        {map}
      </section>
    </main>
  );
}

function TeamCard({geo, team}: {geo: Geo; team: Team}) {
  const league = LEAGUES[team.league];
  const city = CITY_BY_ID[team.cityId];
  const n = team.championships.length;
  // Its league's territories across Canada, with this team's in colour.
  const rivals = currentTeams(team.league).filter((t) => t.id !== team.id && t.cityId !== team.cityId);
  const sites = [{cityId: team.cityId, rgb: teamRgb(team)}, ...rivals.map((t) => ({cityId: t.cityId, rgb: MUTED}))];
  const dots: Dot[] = [...rivals.map((t): Dot => ({cityId: t.cityId, tone: 'active'})), {cityId: team.cityId, tone: 'focus', label: city.name}];
  const shown = Math.min(n, 12);
  return (
    <SplitCard
      copy={
        <>
          <LogoTile size={150}>
            <TeamLogo team={team} size={120} plate="none" />
          </LogoTile>
          <Name text={team.name} />
          <p className="og-meta">
            <LogoTile size={44}>
              <LeagueLogo league={team.league} size={34} isDecorative />
            </LogoTile>
            {team.league} · {city.name} · {yearsLabel(team.from, team.to)}
          </p>
          {n > 0 ? (
            <figure className="og-trophies">
              <span>
                {Array.from({length: shown}, (_, i) => (
                  <TrophyArt key={i} league={team.league} height={n > 6 ? 58 : 70} />
                ))}
                {n > shown && <b>+{n - shown}</b>}
              </span>
              <figcaption>{titlesLabel(team)}</figcaption>
            </figure>
          ) : (
            <Pills items={team.status === 'current' ? [`Chasing the ${league.trophy}`] : ['Former team', yearsLabel(team.from, team.to)]} />
          )}
        </>
      }
      map={<OgMap geo={geo} width={PANEL_W} height={H} spec={{kind: 'closest', sites, reach: 90}} dots={dots} />}
    />
  );
}

function CityCard({geo, cityId}: {geo: Geo; cityId: string}) {
  const city = CITY_BY_ID[cityId];
  const teams = TEAMS.filter((t) => t.cityId === cityId).sort(compareTeams);
  const active = teams.filter(isPlayingNow);
  const former = teams.filter((t) => t.status !== 'current').length;
  const titles = titleCount(teams);
  const others = citySites().filter((s) => s.cityId !== cityId);
  const own = active[0] ?? teams[0];
  const dots: Dot[] = [...others.map((s): Dot => ({cityId: s.cityId, tone: 'active'})), {cityId, tone: 'focus', label: city.name}];
  const logos = (active.length > 0 ? active : teams).slice(0, 14);
  const tile = logos.length > 7 ? 64 : 76;
  return (
    <SplitCard
      copy={
        <>
          <h1 className="og-name og-city">
            {city.name}
            <small>{PROVINCE_NAMES[city.province]}</small>
          </h1>
          <Pills
            items={[
              active.length > 0 ? `${active.length} ${active.length === 1 ? 'team' : 'teams'} today` : 'No teams today',
              ...(former > 0 ? [`${former} former`] : []),
              ...(titles > 0 ? [`${titles} ${titles === 1 ? 'title' : 'titles'}`] : []),
            ]}
          />
          <p className="og-logos" style={{maxWidth: 7 * (tile + 12)}}>
            {logos.map((t) => (
              <LogoTile key={t.id} size={tile}>
                <TeamLogo team={t} size={tile - 14} plate="none" />
              </LogoTile>
            ))}
          </p>
        </>
      }
      map={<OgMap geo={geo} width={PANEL_W} height={H} spec={{kind: 'glow', cityId, rgb: teamRgb(own)}} dots={dots} />}
    />
  );
}

function LeagueCard({geo, league}: {geo: Geo; league: LeagueId}) {
  const info = LEAGUES[league];
  const teams = TEAMS.filter((t) => t.league === league).sort(compareTeams);
  const active = teams.filter(isPlayingNow);
  const formerCities = [...new Set(teams.filter((t) => t.status !== 'current').map((t) => t.cityId))].filter((c) => !active.some((t) => t.cityId === c));
  const titles = titleCount(teams);
  const sites = active.map((t) => ({cityId: t.cityId, rgb: teamRgb(t)}));
  const dots: Dot[] = [...formerCities.map((c): Dot => ({cityId: c, tone: 'former'})), ...active.map((t): Dot => ({cityId: t.cityId, tone: 'active'}))];
  const tile = active.length > 7 ? 60 : 72;
  return (
    <SplitCard
      copy={
        <>
          <LogoTile size={124}>
            <LeagueLogo league={league} size={96} isDecorative />
          </LogoTile>
          <h1 className="og-name og-league">
            {info.name}
            {!CANADIAN_LEAGUES.has(league) && <small>in Canada</small>}
          </h1>
          <Pills
            items={[
              `${active.length} ${active.length === 1 ? 'team' : 'teams'} today`,
              ...(teams.some((t) => t.status !== 'current') ? [`${teams.filter((t) => t.status !== 'current').length} former`] : []),
              ...(titles > 0 ? [`${titles} ${titles === 1 ? 'title' : 'titles'}`] : []),
            ]}
          />
          <p className="og-logos" style={{maxWidth: 8 * (tile + 12)}}>
            {active.map((t) => (
              <LogoTile key={t.id} size={tile}>
                <TeamLogo team={t} size={tile - 14} plate="none" />
              </LogoTile>
            ))}
          </p>
        </>
      }
      map={<OgMap geo={geo} width={PANEL_W} height={H} spec={{kind: 'closest', sites, reach: 60}} dots={dots} />}
    />
  );
}

/** Full-bleed map cards: the home card and the closest-team layer. */
function MapCard({geo, entry}: {geo: Geo; entry: OgEntry}) {
  const cities = [...new Set(TEAMS.map((t) => t.cityId))];
  const activeCities = new Set(currentTeams().map((t) => t.cityId));
  const dots: Dot[] = cities.map((c) => ({cityId: c, tone: activeCities.has(c) ? 'active' : 'former'}));
  let spec: MapSpec;
  let title = SITE_NAME;
  let pitch = 'Every pro team in Canada, past and present, on one living map.';
  let pills = [`${LEAGUE_ORDER.length} leagues`, `${TEAMS.length} teams`, `${cities.length} cities`, 'Isometric venues'];
  if (entry.key === 'home') {
    spec = {kind: 'closest', sites: currentTeams('NHL').map((t) => ({cityId: t.cityId, rgb: teamRgb(t)})), reach: 70};
  } else {
    spec = {kind: 'closest', sites: citySites().map((s) => ({cityId: s.cityId, rgb: teamRgb(s.team)})), reach: 60};
    title = 'Closest team';
    pitch = 'Every spot in Canada, coloured by its nearest pro team.';
    pills = [`${currentTeams().length} teams today`, `${activeCities.size} cities`, `${LEAGUE_ORDER.length} leagues`];
  }
  return (
    <main className="og-card og-full">
      <OgMap geo={geo} width={W} height={H} spec={spec} dots={dots} frame="band" />
      <section className="og-full-copy">
        {entry.key === 'home' ? (
          <p className="og-brand og-brand-hero">
            <img src={FAVICON} alt="" width={72} height={72} />
            <span>{SITE_NAME}</span>
          </p>
        ) : (
          <>
            <Brand />
            <h1 className="og-name">{title}</h1>
          </>
        )}
        <p className="og-pitch">{pitch}</p>
        <Pills items={pills} />
      </section>
    </main>
  );
}

function CardList() {
  return (
    <main className="og-list">
      <h1>{OG_ENTRIES.length} link-preview cards</h1>
      <ul>
        {OG_ENTRIES.map((e) => (
          <li key={e.key}>
            <a href={`?og=${e.key}`}>{e.key}</a> · <a href={`${import.meta.env.BASE_URL}${e.image}`}>image</a> · {e.title}
          </li>
        ))}
      </ul>
    </main>
  );
}

export function OgRoot({cardKey}: {cardKey: string}) {
  const entry = OG_BY_KEY[cardKey];
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    document.documentElement.style.colorScheme = 'dark';
    document.title = entry ? `Card · ${entry.title}` : `Cards · ${SITE_NAME}`;
    void loadGeo().then(setGeo);
    // The render script reads the list from the page.
    (window as unknown as {__OG_ENTRIES__: OgEntry[]}).__OG_ENTRIES__ = OG_ENTRIES;
  }, [entry]);
  // Ready once the map is up and every logo has decoded.
  useEffect(() => {
    if (!geo) return;
    const images = [...document.images];
    void Promise.allSettled(images.map((img) => img.decode())).then(() => {
      requestAnimationFrame(() => (document.documentElement.dataset.ogReady = '1'));
    });
  }, [geo]);

  let card: ReactNode = <CardList />;
  if (entry && geo) {
    if (entry.kind === 'team') card = <TeamCard geo={geo} team={TEAM_BY_ID[entry.id]} />;
    else if (entry.kind === 'city') card = <CityCard geo={geo} cityId={entry.id} />;
    else if (entry.kind === 'league') card = <LeagueCard geo={geo} league={entry.id as LeagueId} />;
    else card = <MapCard geo={geo} entry={entry} />;
  } else if (entry) card = null;
  return (
    <Theme theme={neutralTheme} mode="dark">
      <TrophyDefs />
      {card}
    </Theme>
  );
}
