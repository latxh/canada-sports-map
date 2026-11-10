import {useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {List, ListItem} from '@astryxdesign/core/List';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Link} from '@astryxdesign/core/Link';
import {Banner} from '@astryxdesign/core/Banner';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Divider} from '@astryxdesign/core/Divider';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Tooltip} from '@astryxdesign/core/Tooltip';
import {
  CITY_BY_ID,
  LEAGUES,
  PROVINCE_NAMES,
  TEAMS,
  teamsForCity,
  yearsLabel,
  type IdentityEra,
  type Sport,
  type Team,
  type LeagueFilter,
} from '../data';
import {EraLogo, LeagueLogo, TeamLogo} from '../visuals/Logos';
import {Jersey} from '../visuals/Jersey';
import {PlayingSurface} from '../visuals/PlayingSurface';
import {latestEra, shortName, venueEntriesForCity, venueEntriesForTeam} from '../lib/venues';
import {TROPHY_NAME, TrophyArt, TrophyCabinet, TrophyShelf} from '../visuals/Trophies';
import {VenueSection} from './VenueSection';
import {SectionTitle, StatusBadge} from './bits';
import {PinIcon} from './icons';

// ── Shared ────────────────────────────────────────────────────────────────

/**
 * Chrome shared by every panel: a sticky header with the title on the left and
 * a close button on the right that dismisses the panel at any time.
 */
export function PanelFrame({
  title,
  subtitle,
  leading,
  onClose,
  resetKey,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Logo or badge before the title. */
  leading?: ReactNode;
  onClose: () => void;
  /** When this changes, the nearest scrolling container returns to the top. */
  resetKey?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    let el = rootRef.current?.parentElement ?? null;
    while (el) {
      const {overflowY} = getComputedStyle(el);
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        el.scrollTop = 0;
        return;
      }
      el = el.parentElement;
    }
  }, [resetKey]);
  return (
    <VStack gap={4} ref={rootRef}>
      <HStack gap={3} vAlign="center" className="sticky -top-4 z-10 -mx-4 -mt-4 bg-surface px-4 pt-4 pb-3">
        {leading}
        <VStack gap={0} className="min-w-0 flex-1">
          <Heading level={2} maxLines={2}>
            {title}
          </Heading>
          {subtitle ? <Text type="supporting">{subtitle}</Text> : null}
        </VStack>
        <IconButton size="sm" variant="ghost" label="Close panel" tooltip="Close" icon={<Icon icon="close" />} onClick={onClose} />
      </HStack>
      {children}
    </VStack>
  );
}

/** A team as a tappable logo tile: visuals first, name second. */
function TeamTile({team, onOpen}: {team: Team; onOpen: (id: string) => void}) {
  const isFormer = team.status !== 'current';
  return (
    <ClickableCard label={team.name} onClick={() => onOpen(team.id)} padding={2} variant="transparent">
      <VStack gap={1.5} hAlign="center">
        <span className={isFormer ? 'opacity-80 grayscale-[35%]' : undefined}>
          <TeamLogo team={team} size={60} />
        </span>
        <Text size="sm" weight="medium" justify="center" maxLines={2}>
          {shortName(team)}
        </Text>
        <HStack gap={1} vAlign="center" hAlign="center">
          <LeagueLogo league={team.league} size={16} isDecorative plate="none" />
          <Text type="supporting" size="xsm" hasTabularNumbers>
            {isFormer ? yearsLabel(team.from, team.to) : team.championships.length ? `${team.championships.length}×` : team.league}
          </Text>
          {!isFormer && team.championships.length > 0 && <TrophyArt league={team.league} height={14} />}
        </HStack>
      </VStack>
    </ClickableCard>
  );
}

function TeamGrid({teams, onOpen}: {teams: Team[]; onOpen: (id: string) => void}) {
  return (
    <Grid columns={3} gap={1}>
      {teams.map((t) => (
        <TeamTile key={t.id} team={t} onOpen={onOpen} />
      ))}
    </Grid>
  );
}

// ── City ──────────────────────────────────────────────────────────────────

export function CityPanel({
  cityId,
  league,
  onOpenTeam,
  onShowAllLeagues,
  onClose,
}: {
  cityId: string;
  league: LeagueFilter;
  onOpenTeam: (id: string) => void;
  onShowAllLeagues: () => void;
  onClose: () => void;
}) {
  const city = CITY_BY_ID[cityId];
  const teams = useMemo(() => teamsForCity(cityId, league), [cityId, league]);
  const allTeams = useMemo(() => teamsForCity(cityId), [cityId]);
  const venueEntries = useMemo(() => venueEntriesForCity(cityId, league), [cityId, league]);
  if (!city) return <EmptyState title="City not found" />;

  const current = teams.filter((t) => t.status === 'current');
  const former = teams.filter((t) => t.status !== 'current');
  const hidden = allTeams.length - teams.length;

  return (
    <PanelFrame title={city.name} subtitle={PROVINCE_NAMES[city.province]} onClose={onClose} resetKey={`city:${cityId}`}>
      <TrophyShelf teams={teams} />

      {current.length > 0 && (
        <VStack gap={1}>
          <SectionTitle>Active · {current.length}</SectionTitle>
          <TeamGrid teams={current} onOpen={onOpenTeam} />
        </VStack>
      )}
      {former.length > 0 && (
        <VStack gap={1}>
          <SectionTitle>Former · {former.length}</SectionTitle>
          <TeamGrid teams={former} onOpen={onOpenTeam} />
        </VStack>
      )}
      {teams.length === 0 && league !== 'all' && <EmptyState title={`No ${league} teams here`} isCompact />}
      {hidden > 0 && (
        <HStack gap={2} vAlign="center" hAlign="between">
          <Text type="supporting">
            +{hidden} in other leagues
          </Text>
          <Button size="sm" variant="ghost" label="Show all leagues" onClick={onShowAllLeagues} />
        </HStack>
      )}

      <Text color="secondary">{city.blurb}</Text>

      {venueEntries.length > 0 && <VenueSection entries={venueEntries} title="Venue" />}

      <Link href={city.wikipedia} isExternalLink isStandalone>
        {city.name} on Wikipedia
      </Link>
    </PanelFrame>
  );
}

// ── Team ──────────────────────────────────────────────────────────────────

type TeamTab = 'overview' | 'history' | 'identity' | 'venues';

const SURFACE_NAME: Record<Sport, string> = {
  hockey: 'Rink',
  basketball: 'Court',
  baseball: 'Field',
  football: 'Field',
  soccer: 'Pitch',
  lacrosse: 'Floor',
};

const JERSEY_NAME: Record<Sport, string> = {
  hockey: 'Sweater',
  basketball: 'Jersey',
  baseball: 'Uniform',
  football: 'Jersey',
  soccer: 'Kit',
  lacrosse: 'Jersey',
};

export function TeamPanel({
  teamId,
  tab,
  onTabChange,
  onOpenTeam,
  onOpenCity,
  onClose,
}: {
  teamId: string;
  tab: string | undefined;
  onTabChange: (tab: TeamTab) => void;
  onOpenTeam: (id: string) => void;
  onOpenCity: (id: string) => void;
  onClose: () => void;
}) {
  const team = TEAMS.find((t) => t.id === teamId);
  const venueEntries = useMemo(() => (team ? venueEntriesForTeam(team) : []), [team]);
  if (!team) return <EmptyState title="Team not found" />;
  const city = CITY_BY_ID[team.cityId];
  const league = LEAGUES[team.league];
  const era = latestEra(team);
  const active: TeamTab = (['overview', 'history', 'identity', 'venues'] as const).includes(tab as TeamTab) ? (tab as TeamTab) : 'overview';
  const panelId = `team-panel-${active}`;
  const siblings = TEAMS.filter((t) => t.cityId === team.cityId && t.id !== team.id && t.league === team.league);
  const titleCount = team.championships.length;

  return (
    <PanelFrame title={team.name} leading={<TeamLogo team={team} size={44} />} onClose={onClose} resetKey={`team:${teamId}`}>
      {/* Hero: the logo, big, on a wash of the team's colour. */}
      <VStack
        gap={3}
        hAlign="center"
        className="rounded-2xl px-4 pt-5 pb-4"
        style={{background: `linear-gradient(160deg, color-mix(in srgb, ${era.colors[0]} 20%, var(--color-background-surface)), color-mix(in srgb, ${era.colors[0]} 4%, var(--color-background-surface)))`}}>
        <TeamLogo team={team} size={132} />
        <HStack gap={2} wrap="wrap" vAlign="center" hAlign="center">
          <HStack gap={1} vAlign="center">
            <LeagueLogo league={team.league} size={22} plate="none" />
            <Text weight="semibold">{team.league}</Text>
          </HStack>
          <Text color="secondary" hasTabularNumbers>
            {yearsLabel(team.from, team.to)}
          </Text>
          {team.status !== 'current' && <StatusBadge status={team.status} />}
          {titleCount > 0 && (
            <HStack gap={0.5} vAlign="center">
              <TrophyArt league={team.league} height={20} />
              <Text weight="semibold" hasTabularNumbers>
                ×{titleCount}
              </Text>
            </HStack>
          )}
        </HStack>
        {city && (
          <Button size="sm" variant="ghost" label={`${city.name}, ${city.province}`} icon={<Icon icon={PinIcon} />} onClick={() => onOpenCity(city.id)} />
        )}
      </VStack>

      <TabList value={active} onChange={(v) => onTabChange(v as TeamTab)} hasDivider role="tablist" layout="fill" size="sm">
        <Tab value="overview" label="Overview" panelId="team-panel-overview" />
        <Tab value="history" label="History" panelId="team-panel-history" />
        <Tab value="identity" label="Identity" panelId="team-panel-identity" />
        <Tab value="venues" label="Venues" panelId="team-panel-venues" />
      </TabList>

      <div id={panelId} role="tabpanel" aria-label={active}>
        {active === 'overview' && (
          <VStack gap={4}>
            {team.fate && <Banner status="warning" title={team.status === 'relocated' ? 'Relocated' : 'Defunct'} description={team.fate} />}

            <VStack gap={2}>
              <SectionTitle>{titleCount > 0 ? `${titleCount} × ${TROPHY_NAME[team.league]}` : TROPHY_NAME[team.league]}</SectionTitle>
              <TrophyCabinet team={team} />
              {team.honours && (
                <ul className="flex list-disc flex-col gap-1 ps-5">
                  {team.honours.map((h) => (
                    <li key={h}>
                      <Text type="supporting">{h}</Text>
                    </li>
                  ))}
                </ul>
              )}
            </VStack>

            <Text>{team.summary}</Text>

            <MetadataList label={{position: 'start', width: 110}}>
              <MetadataListItem label="League">{league.name}</MetadataListItem>
              {team.formerNames && team.formerNames.length > 0 && (
                <MetadataListItem label="Also known as">
                  {team.formerNames.map((n) => `${n.name} (${yearsLabel(n.from, n.to)})`).join('; ')}
                </MetadataListItem>
              )}
              <MetadataListItem label="Colours">
                <HStack gap={1} wrap="wrap" vAlign="center">
                  {era.colors.map((c, i) => (
                    <ColorDot key={c + i} color={c} name={era.colorNames[i]} />
                  ))}
                </HStack>
              </MetadataListItem>
            </MetadataList>

            {siblings.length > 0 && (
              <VStack gap={1}>
                <SectionTitle>Other {league.id} teams in {city?.name}</SectionTitle>
                <TeamGrid teams={siblings} onOpen={onOpenTeam} />
              </VStack>
            )}
            <SourceLinks team={team} />
          </VStack>
        )}

        {active === 'history' && (
          <VStack gap={3}>
            <ol className="relative flex flex-col gap-3 border-s-2 border-border ps-4">
              {team.milestones.map((m, i) => (
                <li key={i} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 size-2.5 rounded-full"
                    style={{insetInlineStart: 'calc(-1rem - 6px)', background: era.colors[0], boxShadow: '0 0 0 2px var(--color-background-surface)'}}
                  />
                  <HStack gap={1.5} vAlign="center">
                    <Text weight="semibold" hasTabularNumbers>
                      {m.year}
                    </Text>
                    {team.championships.includes(m.year) && <TrophyArt league={team.league} height={16} />}
                  </HStack>
                  <Text display="block">{m.text}</Text>
                </li>
              ))}
            </ol>
            <SourceLinks team={team} />
          </VStack>
        )}

        {active === 'identity' && <IdentityTab team={team} />}

        {active === 'venues' &&
          (venueEntries.length > 0 ? <VenueSection entries={venueEntries} title="Home" /> : <EmptyState title="No venue data" isCompact />)}
      </div>
    </PanelFrame>
  );
}

/** A colour swatch; the name is in the tooltip and accessible label rather than on screen. */
function ColorDot({color, name}: {color: string; name?: string}) {
  return (
    <Tooltip content={name ?? color}>
      <span
        role="img"
        aria-label={name ?? color}
        tabIndex={0}
        className="inline-block size-6 rounded-full border border-border"
        style={{background: color}}
      />
    </Tooltip>
  );
}

function SourceLinks({team}: {team: Team}) {
  return (
    <>
      <Divider />
      <HStack gap={4} wrap="wrap">
        <Link href={team.wikipedia} isExternalLink isStandalone>
          Wikipedia
        </Link>
        <Link href={LEAGUES[team.league].sportsLogos} isExternalLink isStandalone>
          Logo archive on SportsLogos.net
        </Link>
      </HStack>
    </>
  );
}

function IdentityTab({team}: {team: Team}) {
  const sport = LEAGUES[team.league].sport;
  const [eraIndex, setEraIndex] = useState(team.identity.length - 1);
  const eras = team.identity;
  const surfaceEra = eras[Math.min(eraIndex, eras.length - 1)];

  return (
    <VStack gap={5}>
      <Text type="supporting">Official logo where we have it; other eras, uniforms and surfaces are illustrations in each era’s colours.</Text>

      <VStack gap={2}>
        <SectionTitle>Logo history</SectionTitle>
        <List hasDividers edge="flush">
          {eras.map((e, i) => (
            <ListItem
              key={i}
              align="start"
              label={`${yearsLabel(e.from, e.to)}${e.name ? ` · ${e.name}` : ''}`}
              description={
                <VStack gap={1.5}>
                  <Text type="supporting">{e.logo}</Text>
                  <HStack gap={1} wrap="wrap">
                    {e.colors.map((c, j) => (
                      <ColorDot key={c + j} color={c} name={e.colorNames[j]} />
                    ))}
                  </HStack>
                </VStack>
              }
              startContent={<EraLogo team={team} index={i} size={72} />}
            />
          ))}
        </List>
      </VStack>

      <VStack gap={2}>
        <SectionTitle>{JERSEY_NAME[sport]} history</SectionTitle>
        <div tabIndex={0} role="region" aria-label={`${JERSEY_NAME[sport]} history by era`} className="scrollbar-none -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {eras.map((e, i) => (
            <EraCard key={i} era={e}>
              <HStack gap={1} hAlign="center">
                <Jersey era={e} sport={sport} variant="home" size={84} />
                <Jersey era={e} sport={sport} variant="away" size={84} />
              </HStack>
              <Text type="supporting">{e.jersey.note}</Text>
            </EraCard>
          ))}
        </div>
      </VStack>

      <VStack gap={2}>
        <SectionTitle>{SURFACE_NAME[sport]} history</SectionTitle>
        {eras.length > 1 && (
          <HStack gap={1.5} wrap="wrap" role="group" aria-label="Choose an era">
            {eras.map((e, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === eraIndex ? 'primary' : 'secondary'}
                label={yearsLabel(e.from, e.to)}
                onClick={() => setEraIndex(i)}
              />
            ))}
          </HStack>
        )}
        <Card variant="muted" padding={3}>
          <HStack hAlign="center">
            <PlayingSurface era={surfaceEra} sport={sport} width={340} />
          </HStack>
        </Card>
        <Text type="supporting">
          {surfaceEra.surface ?? `Regulation ${SURFACE_NAME[sport].toLowerCase()} shown in this era’s colours.`}
        </Text>
      </VStack>
    </VStack>
  );
}

function EraCard({era, children}: {era: IdentityEra; children: ReactNode}) {
  return (
    <Card variant="muted" padding={3} width={220} className="shrink-0 snap-start">
      <VStack gap={2}>
        <Text weight="semibold">
          {yearsLabel(era.from, era.to)}
          {era.name ? (
            <Text color="secondary" weight="normal">
              {` · ${era.name}`}
            </Text>
          ) : null}
        </Text>
        {children}
      </VStack>
    </Card>
  );
}
