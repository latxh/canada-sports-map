import {useCallback, useEffect, useMemo, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {TopNav, TopNavHeading} from '@astryxdesign/core/TopNav';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {HStack} from '@astryxdesign/core/HStack';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';
import {LEAGUE_ORDER, TEAM_BY_ID, citiesWithTeams, type EraFilter, type LeagueId, type TeamFilter} from './data';
import {SportsMap} from './components/SportsMap';
import {FilterBar} from './components/FilterBar';
import {CityPanel, OverviewPanel, TeamPanel} from './components/Panels';
import {CreditsDialog} from './components/CreditsDialog';
import {MapleLeafIcon, MoonIcon, SunIcon} from './components/icons';
import {DESKTOP_QUERY, useMediaQuery} from './hooks/useMediaQuery';
import {useHashRoute} from './hooks/useHashRoute';

type Mode = 'light' | 'dark';

/** Storage and history can throw inside sandboxed frames (e.g. embedded previews); fail soft. */
function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function initialMode(): Mode {
  const stored = safely(() => localStorage.getItem('csa-mode'), null);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialLeagues(): Set<LeagueId> {
  const param = new URLSearchParams(window.location.search).get('leagues');
  if (!param) return new Set(LEAGUE_ORDER);
  const picked = param.split(',').filter((l): l is LeagueId => (LEAGUE_ORDER as string[]).includes(l));
  return new Set(picked.length ? picked : LEAGUE_ORDER);
}

function initialEra(): EraFilter {
  const param = new URLSearchParams(window.location.search).get('era');
  return param === 'current' || param === 'defunct' ? param : 'all';
}

export function App() {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [leagues, setLeagues] = useState<Set<LeagueId>>(initialLeagues);
  const [era, setEra] = useState<EraFilter>(initialEra);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [route, navigate] = useHashRoute();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  useEffect(() => {
    safely(() => localStorage.setItem('csa-mode', mode), undefined);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  // Keep filters in the query string so views are shareable.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (leagues.size === LEAGUE_ORDER.length) params.delete('leagues');
    else params.set('leagues', LEAGUE_ORDER.filter((l) => leagues.has(l)).join(','));
    if (era === 'all') params.delete('era');
    else params.set('era', era);
    const qs = params.toString();
    safely(() => history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`), undefined);
  }, [leagues, era]);

  const filter: TeamFilter = useMemo(() => ({leagues, era}), [leagues, era]);
  const mapCities = useMemo(() => citiesWithTeams(filter), [filter]);

  const selectedCityId =
    route.kind === 'city' ? route.id : route.kind === 'team' ? (TEAM_BY_ID[route.id]?.cityId ?? null) : null;

  const openCity = useCallback((id: string) => navigate({kind: 'city', id}), [navigate]);
  const openTeam = useCallback((id: string) => navigate({kind: 'team', id}), [navigate]);
  const goHome = useCallback(() => {
    setIsBrowsing(false);
    navigate({kind: 'home'});
  }, [navigate]);

  const panel = (() => {
    if (route.kind === 'team') {
      return (
        <TeamPanel
          key={route.id}
          teamId={route.id}
          tab={route.tab}
          onTabChange={(tab) => navigate({kind: 'team', id: route.id, tab}, {replace: true})}
          onBack={(cityId) => navigate({kind: 'city', id: cityId})}
          onOpenTeam={openTeam}
        />
      );
    }
    if (route.kind === 'city') {
      return (
        <CityPanel
          key={route.id}
          cityId={route.id}
          filter={filter}
          onBack={goHome}
          onOpenTeam={openTeam}
          onShowAllEras={() => {
            setEra('all');
            setLeagues(new Set(LEAGUE_ORDER));
          }}
        />
      );
    }
    return <OverviewPanel filter={filter} onOpenCity={openCity} />;
  })();

  const routeKey = route.kind === 'home' ? 'home' : `${route.kind}:${route.id}`;
  const isSheetOpen = !isDesktop && (route.kind !== 'home' || isBrowsing);
  const [viewportH, setViewportH] = useState(() => window.innerHeight);
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const bottomInset = isSheetOpen ? Math.round(viewportH * 0.62) : 0;

  return (
    <Theme theme={neutralTheme} mode={mode}>
      <div className="flex h-dvh flex-col bg-body text-primary">
        <TopNav
          label="Site"
          heading={
            <TopNavHeading
              logo={<Icon icon={MapleLeafIcon} size="lg" color="red" />}
              heading="Canada Sports Atlas"
              headingHref="#/"
            />
          }
          endContent={
            <HStack gap={1} vAlign="center">
              <Button size="sm" variant="ghost" label="Credits" onClick={() => setIsCreditsOpen(true)} />
              <IconButton
                size="sm"
                variant="ghost"
                label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                tooltip={mode === 'dark' ? 'Light mode' : 'Dark mode'}
                icon={<Icon icon={mode === 'dark' ? SunIcon : MoonIcon} />}
                onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              />
            </HStack>
          }
        />
        <FilterBar leagues={leagues} onLeaguesChange={setLeagues} era={era} onEraChange={setEra} isCompact={!isDesktop} />

        <main className="relative flex min-h-0 flex-1" aria-label="Map and details">
          <VisuallyHidden>
            <h1>Canada Sports Atlas: an interactive map of Canadian professional sports teams</h1>
          </VisuallyHidden>
          <div className="relative min-w-0 flex-1">
            <SportsMap cities={mapCities} selectedCityId={selectedCityId} onSelectCity={openCity} bottomInset={bottomInset} />
            {!isDesktop && !isSheetOpen && (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <div className="pointer-events-auto">
                  <Button label="Browse cities" variant="primary" elevation="med" onClick={() => setIsBrowsing(true)} />
                </div>
              </div>
            )}
          </div>
          {isDesktop && (
            <aside key={routeKey} aria-label="Details" className="w-[420px] shrink-0 overflow-y-auto border-s border-border bg-surface p-4 xl:w-[460px]">
              {panel}
            </aside>
          )}
        </main>
      </div>

      {!isDesktop && (
        <BottomSheet
          label={route.kind === 'team' ? 'Team overview' : route.kind === 'city' ? 'City overview' : 'Cities'}
          isOpen={isSheetOpen}
          onOpenChange={(open) => {
            if (!open) goHome();
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
