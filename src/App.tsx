import {useCallback, useEffect, useMemo, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';
import {LEAGUE_ORDER, TEAMS, TEAM_BY_ID, citiesWithTeams, type LeagueFilter, type LeagueId, type Team} from './data';
import {LOGOS} from './data/logos';
import {logoAsset} from './visuals/Logos';
import {latestEra} from './lib/venues';
import {SportsMap, type MapTakeover} from './components/SportsMap';
import {CityPanel, TeamPanel} from './components/Panels';
import {CreditsDialog} from './components/CreditsDialog';
import {LeagueSelect, MAP_VIEWS, MapViewMenu, SiteMenu, type Appearance, type MapView} from './components/HeaderControls';
import {TimelineBar, TIMELINE_MAX, TIMELINE_MIN} from './components/TimelineBar';
import {DESKTOP_QUERY, useMediaQuery} from './hooks/useMediaQuery';
import {TrophyDefs} from './visuals/Trophies';
import {useHashRoute} from './hooks/useHashRoute';

const PANEL_WIDTH = 400;
const PANEL_GUTTER = 12;
/** Height of the floating top controls plus their gutter; the panel and map fit below it. */
const CHROME_H = 64;
/** Half the width of the centred controls pill (league picker + menu), for overlap checks. */
const PILL_HALF = 104;

/** Background colours for map takeovers, where the logo would vanish on the team's primary colour. */
const TAKEOVER_BACKGROUND: Record<string, string> = {
  'toronto-blue-jays': '#6cace4',
  // The Tempo logo is solid bordeaux, so it sits on the team's borealis blue.
  'toronto-tempo': '#b3c7e7',
};

/** The league's only current Canadian team, if it has exactly one (the Raptors, the Blue Jays, the Tempo). */
function soleCurrentTeam(league: LeagueId): Team | undefined {
  const current = TEAMS.filter((t) => t.league === league && t.status === 'current');
  return current.length === 1 ? current[0] : undefined;
}

/**
 * When a team is the only current Canadian team in its league, its logo takes over the map of
 * Canada while its page is open or its league is the filter.
 */
function takeoverFor(team: Team | undefined): MapTakeover | null {
  if (!team || team.status !== 'current' || soleCurrentTeam(team.league) !== team) return null;
  const logo = LOGOS[team.id];
  if (!logo) return null;
  return {
    id: team.id,
    logoHref: logoAsset(logo.file),
    background: TAKEOVER_BACKGROUND[team.id] ?? latestEra(team).colors[0],
    label: team.name,
  };
}

/** Storage and history can throw inside sandboxed frames (e.g. embedded previews); fail soft. */
function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function initialAppearance(): Appearance {
  const stored = safely(() => localStorage.getItem('csa-appearance'), null);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function initialLeague(): LeagueFilter {
  const param = new URLSearchParams(window.location.search).get('league');
  return param && (LEAGUE_ORDER as string[]).includes(param) ? (param as LeagueId) : 'all';
}

function initialView(): MapView {
  const param = new URLSearchParams(window.location.search).get('view');
  return param && (MAP_VIEWS as string[]).includes(param) ? (param as MapView) : 'teams';
}

function initialYear(): number {
  const param = Number(new URLSearchParams(window.location.search).get('year'));
  return Number.isInteger(param) && param >= TIMELINE_MIN && param <= TIMELINE_MAX ? param : TIMELINE_MAX;
}

export function App() {
  const [appearance, setAppearance] = useState<Appearance>(initialAppearance);
  const [league, setLeague] = useState<LeagueFilter>(initialLeague);
  const [view, setView] = useState<MapView>(initialView);
  const [year, setYear] = useState<number>(initialYear);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [route, navigate] = useHashRoute();

  useEffect(() => {
    safely(() => localStorage.setItem('csa-appearance', appearance), undefined);
    document.documentElement.style.colorScheme = appearance === 'system' ? 'light dark' : appearance;
  }, [appearance]);

  // Keep the league in the query string so a view can be shared.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (league === 'all') params.delete('league');
    else params.set('league', league);
    if (view === 'teams') params.delete('view');
    else params.set('view', view);
    if (view === 'timeline' && year !== TIMELINE_MAX) params.set('year', String(year));
    else params.delete('year');
    const qs = params.toString();
    safely(() => history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`), undefined);
  }, [league, view, year]);

  // The timeline shows only the teams playing in the chosen year.
  const mapCities = useMemo(() => {
    const cities = citiesWithTeams(league);
    if (view !== 'timeline') return cities;
    return cities
      .map((c) => ({...c, teams: c.teams.filter((t) => t.from <= year && (t.to ?? TIMELINE_MAX) >= year)}))
      .filter((c) => c.teams.length > 0);
  }, [league, view, year]);
  const timelineTeams = useMemo(() => mapCities.reduce((n, c) => n + c.teams.length, 0), [mapCities]);

  const selectedCityId =
    route.kind === 'city' ? route.id : route.kind === 'team' ? (TEAM_BY_ID[route.id]?.cityId ?? null) : null;

  const openCity = useCallback((id: string) => navigate({kind: 'city', id}), [navigate]);
  const openTeam = useCallback((id: string) => navigate({kind: 'team', id}), [navigate]);
  // A team opened from a city panel remembers the city, for the back chevron.
  const openTeamFromCity = useCallback((id: string) => navigate({kind: 'team', id, from: route.kind === 'city' ? route.id : undefined}), [navigate, route]);
  // On the map: with a league picked, a city with just one team in it opens straight to that team.
  const selectCityOnMap = useCallback(
    (id: string) => {
      const teams = league === 'all' ? [] : (mapCities.find((c) => c.city.id === id)?.teams ?? []);
      if (teams.length === 1) openTeam(teams[0].id);
      else openCity(id);
    },
    [league, mapCities, openCity, openTeam],
  );
  const closePanel = useCallback(() => navigate({kind: 'home'}), [navigate]);

  const isPanelOpen = route.kind !== 'home';

  let panel = null;
  if (route.kind === 'team') {
    panel = (
      <TeamPanel
        key={route.id}
        teamId={route.id}
        backCityId={route.from}
        onOpenCity={openCity}
        onClose={closePanel}
      />
    );
  } else if (route.kind === 'city') {
    panel = (
      <CityPanel
        key={route.id}
        cityId={route.id}
        league={league}
        onOpenTeam={openTeamFromCity}
        onClose={closePanel}
      />
    );
  }

  const [viewportH, setViewportH] = useState(() => window.innerHeight);
  const [viewportW, setViewportW] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => {
      setViewportH(window.innerHeight);
      setViewportW(window.innerWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const bottomInset = !isDesktop && isPanelOpen ? Math.round(viewportH * 0.62) : 0;
  const rightInset = isDesktop && isPanelOpen ? PANEL_WIDTH + PANEL_GUTTER * 2 : 0;
  const routeKey = route.kind === 'home' ? 'home' : `${route.kind}:${route.id}`;
  // The panel can run to the top of the screen when it clears the centred controls pill.
  const panelTop = viewportW / 2 + PILL_HALF + PANEL_GUTTER < viewportW - PANEL_GUTTER - PANEL_WIDTH ? PANEL_GUTTER : CHROME_H;
  // A team page shows its own takeover; otherwise filtering to a one-team league shows that team's.
  const takeover = useMemo(
    () =>
      view !== 'teams'
        ? null
        : route.kind === 'team'
          ? takeoverFor(TEAM_BY_ID[route.id])
          : league === 'all'
            ? null
            : takeoverFor(soleCurrentTeam(league)),
    [route, league, view],
  );

  return (
    <Theme theme={neutralTheme} mode={appearance}>
      <TrophyDefs />
      <main className="relative h-dvh overflow-hidden bg-body text-primary" aria-label="Map and details">
        <VisuallyHidden>
          <h1>Canada Sports Atlas: an interactive map of Canadian professional sports teams</h1>
        </VisuallyHidden>
        <SportsMap
          cities={mapCities}
          selectedCityId={selectedCityId}
          onSelectCity={selectCityOnMap}
          bottomInset={bottomInset}
          rightInset={rightInset}
          topInset={CHROME_H - PANEL_GUTTER}
          takeover={takeover}
          view={view}
        />

        {view === 'timeline' && (
          <TimelineBar
            year={year}
            onYearChange={setYear}
            teamCount={timelineTeams}
            isCompact={!isDesktop}
            style={{left: 64, right: rightInset + 12, bottom: bottomInset + 12}}
          />
        )}

        {/* Floating controls, centred at the top: league picker and menu. */}
        <nav aria-label="Site" className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
          <div className="glass pointer-events-auto flex items-center gap-0.5 rounded-full p-1">
            <LeagueSelect value={league} onChange={setLeague} isCompact={!isDesktop} />
            <MapViewMenu value={view} onChange={setView} />
            <SiteMenu appearance={appearance} onAppearanceChange={setAppearance} onOpenCredits={() => setIsCreditsOpen(true)} />
          </div>
        </nav>

        {isDesktop && isPanelOpen && (
          <aside
            key={routeKey}
            aria-label="Details"
            className="glass-panel absolute overflow-y-auto overscroll-contain rounded-2xl p-4"
            style={{top: panelTop, right: PANEL_GUTTER, bottom: PANEL_GUTTER, width: PANEL_WIDTH, boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)'}}>
            {panel}
          </aside>
        )}
      </main>

      {!isDesktop && (
        <BottomSheet
          label={route.kind === 'team' ? 'Team overview' : 'City overview'}
          isOpen={isPanelOpen}
          onOpenChange={(open) => {
            if (!open) closePanel();
          }}
          hasScrim={false}
          height="capped"
          snapPoints={[0.3]}>
          {panel}
        </BottomSheet>
      )}

      <CreditsDialog isOpen={isCreditsOpen} onOpenChange={setIsCreditsOpen} />
    </Theme>
  );
}
