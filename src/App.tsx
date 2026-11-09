import {useCallback, useEffect, useMemo, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {Icon} from '@astryxdesign/core/Icon';
import {HStack} from '@astryxdesign/core/HStack';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';
import {LEAGUE_ORDER, TEAM_BY_ID, citiesWithTeams, type LeagueFilter, type LeagueId} from './data';
import {SportsMap} from './components/SportsMap';
import {CityPanel, TeamPanel} from './components/Panels';
import {CreditsDialog} from './components/CreditsDialog';
import {LeagueSelect, SiteMenu, type Appearance} from './components/HeaderControls';
import {MapleLeafIcon} from './components/icons';
import {DESKTOP_QUERY, useMediaQuery} from './hooks/useMediaQuery';
import {TrophyDefs} from './visuals/Trophies';
import {useHashRoute} from './hooks/useHashRoute';

const PANEL_WIDTH = 400;
const PANEL_GUTTER = 12;
/** Height of the floating top controls plus their gutter; the panel and map fit below it. */
const CHROME_H = 64;

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
  const closePanel = useCallback(() => navigate({kind: 'home'}), [navigate]);

  const isPanelOpen = route.kind !== 'home';

  let panel = null;
  if (route.kind === 'team') {
    panel = (
      <TeamPanel
        key={route.id}
        teamId={route.id}
        tab={route.tab}
        onTabChange={(tab) => navigate({kind: 'team', id: route.id, tab}, {replace: true})}
        onOpenTeam={openTeam}
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
        onOpenTeam={openTeam}
        onShowAllLeagues={() => setLeague('all')}
        onClose={closePanel}
      />
    );
  }

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
      <TrophyDefs />
      <main className="relative h-dvh overflow-hidden bg-body text-primary" aria-label="Map and details">
        <VisuallyHidden>
          <h1>Canada Sports Atlas: an interactive map of Canadian professional sports teams</h1>
        </VisuallyHidden>
        <SportsMap
          cities={mapCities}
          selectedCityId={selectedCityId}
          onSelectCity={openCity}
          bottomInset={bottomInset}
          rightInset={rightInset}
          topInset={CHROME_H - PANEL_GUTTER}
        />

        {/* Floating chrome: brand on the left, league picker and menu on the right. */}
        <nav aria-label="Site" className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="glass pointer-events-auto flex h-11 items-center rounded-full ps-2.5 pe-4">
            <Link href="#/" color="primary" label="Canada Sports Atlas, home">
              <HStack gap={2} vAlign="center">
                <Icon icon={MapleLeafIcon} size="lg" color="red" />
                <Text weight="semibold">{isDesktop ? 'Canada Sports Atlas' : 'Sports Atlas'}</Text>
              </HStack>
            </Link>
          </div>
          <div className="glass pointer-events-auto flex h-11 items-center gap-0.5 rounded-full px-1">
            <LeagueSelect value={league} onChange={setLeague} isCompact={!isDesktop} />
            <SiteMenu appearance={appearance} onAppearanceChange={setAppearance} onOpenCredits={() => setIsCreditsOpen(true)} />
          </div>
        </nav>

        {isDesktop && isPanelOpen && (
          <aside
            key={routeKey}
            aria-label="Details"
            className="absolute overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-4"
            style={{top: CHROME_H, right: PANEL_GUTTER, bottom: PANEL_GUTTER, width: PANEL_WIDTH, boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)'}}>
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
