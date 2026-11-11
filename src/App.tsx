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
import {CityPanel, TeamPanel, loadSportsLogos} from './components/Panels';
import {CreditsDialog} from './components/CreditsDialog';
import {LeagueSelect, MAP_VIEWS, SiteMenu, type Appearance, type MapView} from './components/HeaderControls';
import {MapToolToggles, PinCard, distanceColor, distanceKm, type LatLon, type PinDistance} from './components/MapTools';
import {DESKTOP_QUERY, useMediaQuery} from './hooks/useMediaQuery';
import {TrophyDefs} from './visuals/Trophies';
import {useHashRoute} from './hooks/useHashRoute';
import {SITE_URL, shareEntryFor} from './og/manifest';
import {trackEvent, trackPageView} from './lib/analytics';

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

/** Logos to use for a takeover instead of today's: the Raptors' original 1995 logo (SportsLogos.net). */
const TAKEOVER_LOGO: Record<string, string> = {
  'toronto-raptors': `${import.meta.env.BASE_URL}sportslogos/toronto-raptors/logo-1996-kqmesaae0efg-lg.webp`,
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
    logoHref: TAKEOVER_LOGO[team.id] ?? logoAsset(logo.file),
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

function initialPin(): LatLon | null {
  const [lat, lon] = (new URLSearchParams(window.location.search).get('pin') ?? '').split(',').map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? {lat, lon} : null;
}

export function App() {
  const [appearance, setAppearance] = useState<Appearance>(initialAppearance);
  const [league, setLeague] = useState<LeagueFilter>(initialLeague);
  const [view, setView] = useState<MapView>(initialView);
  const [pin, setPin] = useState<LatLon | null>(() => (initialView() === 'teams' ? initialPin() : null));
  // The four map modes (Population, Championships, Closest team, Drop a pin) are exclusive.
  const [isPinMode, setIsPinMode] = useState(() => initialView() === 'teams' && initialPin() !== null);
  const [locateError, setLocateError] = useState(false);
  // Closest team is a layer like Population and Championships: only one shows at a time.
  const [showClosest, setShowClosest] = useState(
    () => initialView() === 'teams' && initialPin() === null && new URLSearchParams(window.location.search).get('closest') === '1',
  );
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
    params.delete('year');
    if (pin) params.set('pin', `${pin.lat.toFixed(3)},${pin.lon.toFixed(3)}`);
    else params.delete('pin');
    if (showClosest) params.set('closest', '1');
    else params.delete('closest');
    const qs = params.toString();
    safely(() => history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`), undefined);
  }, [league, view, pin, showClosest]);

  const mapCities = useMemo(() => citiesWithTeams(league), [league]);

  // Pin tool: every city on the map, nearest first, coloured green (near) to red (far).
  const pinTargets = useMemo<PinDistance[]>(() => {
    if (!pin) return [];
    const list = mapCities.map(({city}) => ({id: city.id, name: city.name, km: distanceKm(pin, city), color: ''}));
    list.sort((a, b) => a.km - b.km);
    const min = list[0]?.km ?? 0;
    const max = list[list.length - 1]?.km ?? 1;
    return list.map((d) => ({...d, color: distanceColor(max > min ? (d.km - min) / (max - min) : 0)}));
  }, [pin, mapCities]);
  const setPinMode = useCallback((on: boolean) => {
    setIsPinMode(on);
    setLocateError(false);
    if (on) {
      setView('teams');
      setShowClosest(false);
    } else setPin(null);
  }, []);
  const leavePinMode = useCallback(() => {
    setIsPinMode(false);
    setPin(null);
    setLocateError(false);
  }, []);
  const locate = useCallback(() => {
    setLocateError(false);
    if (!navigator.geolocation) {
      setLocateError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({lat: pos.coords.latitude, lon: pos.coords.longitude});
        trackEvent('drop_pin', {method: 'location'});
      },
      () => setLocateError(true),
      {enableHighAccuracy: false, timeout: 8000, maximumAge: 600000},
    );
  }, []);

  // What the app shows, as a share page: drives the Share link and analytics page views.
  const shareEntry = useMemo(
    () =>
      shareEntryFor({
        teamId: route.kind === 'team' ? route.id : undefined,
        cityId: route.kind === 'city' ? route.id : undefined,
        league,
        view,
        showClosest,
      }),
    [route, league, view, showClosest],
  );
  useEffect(() => trackPageView(shareEntry.path, shareEntry.title), [shareEntry]);
  // Team pages' SportsLogos.net list: fetch it once the page has settled.
  useEffect(() => {
    const id = window.setTimeout(() => void loadSportsLogos(), 1500);
    return () => window.clearTimeout(id);
  }, []);

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
      view !== 'teams' || isPinMode || showClosest
        ? null
        : route.kind === 'team'
          ? takeoverFor(TEAM_BY_ID[route.id])
          : league === 'all'
            ? null
            : takeoverFor(soleCurrentTeam(league)),
    [route, league, view, isPinMode, showClosest],
  );

  return (
    <Theme theme={neutralTheme} mode={appearance}>
      <TrophyDefs />
      <main className="relative h-dvh overflow-hidden bg-body text-primary" aria-label="Map and details">
        <VisuallyHidden>
          <h1>Canadian Sports Atlas: an interactive map of Canadian professional sports teams</h1>
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
          isPinMode={isPinMode}
          pin={pin}
          pinTargets={pinTargets}
          onDropPin={(p) => {
          setPin(p);
          trackEvent('drop_pin', {method: 'tap'});
        }}
          showClosest={showClosest}
        />

        {isPinMode && (
          // Desktop: top-left corner. Phones: along the bottom, beside the map controls.
          <div
            className="pointer-events-none absolute"
            style={isDesktop ? {left: 12, top: PANEL_GUTTER} : {left: 64, right: 12, bottom: bottomInset + 12, transition: 'bottom 200ms ease'}}>
            <PinCard
              distances={pinTargets}
              hasPin={pin !== null}
              onLocate={locate}
              locateError={locateError}
              onClear={() => setPin(null)}
              onOpenCity={openCity}
              isCompact={!isDesktop}
            />
          </div>
        )}


        {/* Floating controls, centred at the top: league picker and menu. */}
        <nav aria-label="Site" className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
          <div className="glass pointer-events-auto flex items-center gap-0.5 rounded-full p-1">
            <LeagueSelect
              value={league}
              onChange={(l) => {
                setLeague(l);
                trackEvent('select_league', {league: l});
              }}
              isCompact={!isDesktop}
            />
            <MapToolToggles
              view={view}
              onViewChange={(v) => {
                setView(v);
                trackEvent('toggle_layer', {layer: v === 'teams' ? view : v, on: v !== 'teams'});
                if (v !== 'teams') {
                  setShowClosest(false);
                  leavePinMode();
                }
              }}
              isPinMode={isPinMode}
              onPinModeChange={(on) => {
                setPinMode(on);
                trackEvent('toggle_layer', {layer: 'pin', on});
              }}
              showClosest={showClosest}
              onShowClosestChange={(on) => {
                setShowClosest(on);
                trackEvent('toggle_layer', {layer: 'closest', on});
                if (on) {
                  setView('teams');
                  leavePinMode();
                }
              }}
            />
            <SiteMenu
              appearance={appearance}
              onAppearanceChange={setAppearance}
              onOpenCredits={() => setIsCreditsOpen(true)}
              // A dropped pin isn't a share page, so that view shares its full address.
              shareUrl={pin ? window.location.href : SITE_URL + shareEntry.path}
              shareTitle={shareEntry.title}
              onShared={(method) => trackEvent('share', {method, content_type: shareEntry.kind, item_id: shareEntry.id})}
            />
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
