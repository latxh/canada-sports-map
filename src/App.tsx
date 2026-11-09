import {useCallback, useEffect, useMemo, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {TopNav, TopNavHeading} from '@astryxdesign/core/TopNav';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {HStack} from '@astryxdesign/core/HStack';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';
import {CITY_BY_ID, LEAGUE_ORDER, TEAM_BY_ID, citiesWithTeams, type LeagueFilter, type LeagueId} from './data';
import {SportsMap} from './components/SportsMap';
import {CityPanel, OverviewPanel, PanelFrame, TeamPanel} from './components/Panels';
import {CreditsDialog} from './components/CreditsDialog';
import {LeagueSelect, SiteMenu, type Appearance} from './components/HeaderControls';
import {ListIcon, MapleLeafIcon} from './components/icons';
import {DESKTOP_QUERY, useMediaQuery} from './hooks/useMediaQuery';
import {useHashRoute} from './hooks/useHashRoute';

const PANEL_WIDTH = 400;
const PANEL_GUTTER = 12;

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

export function App() {
  const [appearance, setAppearance] = useState<Appearance>(initialAppearance);
  const [league, setLeague] = useState<LeagueFilter>(initialLeague);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [isOverviewOpen, setIsOverviewOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
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
    const qs = params.toString();
    safely(() => history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`), undefined);
  }, [league]);

  const mapCities = useMemo(() => citiesWithTeams(league), [league]);

  const selectedCityId =
    route.kind === 'city' ? route.id : route.kind === 'team' ? (TEAM_BY_ID[route.id]?.cityId ?? null) : null;

  const openCity = useCallback((id: string) => navigate({kind: 'city', id}), [navigate]);
  const openTeam = useCallback((id: string) => navigate({kind: 'team', id}), [navigate]);
  const goHome = useCallback(() => {
    setIsOverviewOpen(true);
    navigate({kind: 'home'});
  }, [navigate]);
  const closePanel = useCallback(() => {
    setIsOverviewOpen(false);
    navigate({kind: 'home'});
  }, [navigate]);

  const isPanelOpen = route.kind !== 'home' || isOverviewOpen;

  let back: {label: string; onClick: () => void} | undefined;
  let panelBody;
  if (route.kind === 'team') {
    const team = TEAM_BY_ID[route.id];
    const city = team ? CITY_BY_ID[team.cityId] : undefined;
    if (team && city) back = {label: city.name, onClick: () => navigate({kind: 'city', id: city.id})};
    panelBody = (
      <TeamPanel
        key={route.id}
        teamId={route.id}
        tab={route.tab}
        onTabChange={(tab) => navigate({kind: 'team', id: route.id, tab}, {replace: true})}
        onOpenTeam={openTeam}
      />
    );
  } else if (route.kind === 'city') {
    back = {label: 'All cities', onClick: goHome};
    panelBody = <CityPanel key={route.id} cityId={route.id} league={league} onOpenTeam={openTeam} onShowAllLeagues={() => setLeague('all')} />;
  } else {
    panelBody = <OverviewPanel league={league} onOpenCity={openCity} />;
  }
  const panel = (
    <PanelFrame back={back} onClose={closePanel} resetKey={route.kind === 'home' ? 'home' : `${route.kind}:${route.id}`}>
      {panelBody}
    </PanelFrame>
  );

  const [viewportH, setViewportH] = useState(() => window.innerHeight);
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const bottomInset = !isDesktop && isPanelOpen ? Math.round(viewportH * 0.62) : 0;
  const rightInset = isDesktop && isPanelOpen ? PANEL_WIDTH + PANEL_GUTTER * 2 : 0;
  const routeKey = route.kind === 'home' ? 'home' : `${route.kind}:${route.id}`;

  return (
    <Theme theme={neutralTheme} mode={appearance}>
      <div className="flex h-dvh flex-col bg-body text-primary">
        <TopNav
          label="Site"
          heading={
            <TopNavHeading
              logo={<Icon icon={MapleLeafIcon} size="lg" color="red" />}
              heading={isDesktop ? 'Canada Sports Atlas' : 'Sports Atlas'}
              headingHref="#/"
            />
          }
          endContent={
            <HStack gap={1} vAlign="center">
              <LeagueSelect value={league} onChange={setLeague} isCompact={!isDesktop} />
              <SiteMenu appearance={appearance} onAppearanceChange={setAppearance} onOpenCredits={() => setIsCreditsOpen(true)} />
            </HStack>
          }
        />

        <main className="relative min-h-0 flex-1" aria-label="Map and details">
          <VisuallyHidden>
            <h1>Canada Sports Atlas: an interactive map of Canadian professional sports teams</h1>
          </VisuallyHidden>
          <SportsMap
            cities={mapCities}
            selectedCityId={selectedCityId}
            onSelectCity={openCity}
            bottomInset={bottomInset}
            rightInset={rightInset}
          />

          {!isPanelOpen && (
            <div className={isDesktop ? 'absolute top-3 right-3' : 'pointer-events-none absolute inset-x-0 bottom-4 flex justify-center'}>
              <div className="pointer-events-auto">
                <Button
                  label={isDesktop ? 'Cities' : 'Browse cities'}
                  variant={isDesktop ? 'secondary' : 'primary'}
                  elevation="med"
                  icon={<Icon icon={ListIcon} />}
                  onClick={() => setIsOverviewOpen(true)}
                />
              </div>
            </div>
          )}

          {isDesktop && isPanelOpen && (
            <aside
              key={routeKey}
              aria-label="Details"
              className="absolute overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-4 shadow-lg"
              style={{top: PANEL_GUTTER, right: PANEL_GUTTER, bottom: PANEL_GUTTER, width: PANEL_WIDTH}}>
              {panel}
            </aside>
          )}
        </main>
      </div>

      {!isDesktop && (
        <BottomSheet
          label={route.kind === 'team' ? 'Team overview' : route.kind === 'city' ? 'City overview' : 'Cities'}
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
