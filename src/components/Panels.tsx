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
import {Token} from '@astryxdesign/core/Token';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Divider} from '@astryxdesign/core/Divider';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
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
import {latestEra, venueEntriesForCity, venueEntriesForTeam} from '../lib/venues';
import {VenueSection} from './VenueSection';
import {LeagueToken, SectionTitle, StatusBadge, championshipLabel} from './bits';
import {PinIcon, TrophyIcon} from './icons';

// ── Shared ────────────────────────────────────────────────────────────────

/**
 * Chrome shared by every panel: a sticky header with the title on the left and
 * a close button on the right that dismisses the panel at any time.
 */
export function PanelFrame({
  title,
  leading,
  onClose,
  resetKey,
  children,
}: {
  title: ReactNode;
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
      <HStack
        gap={3}
        vAlign="center"
        className="sticky -top-4 z-10 -mx-4 -mt-4 border-b border-border bg-surface px-4 pt-4 pb-3">
        {leading}
        <div className="min-w-0 flex-1">
          <Heading level={2} maxLines={2}>
            {title}
          </Heading>
        </div>
        <IconButton size="sm" variant="ghost" label="Close panel" tooltip="Close" icon={<Icon icon="close" />} onClick={onClose} />
      </HStack>
      {children}
    </VStack>
  );
}

function Stat({value, label}: {value: ReactNode; label: string}) {
  return (
    <Card variant="muted" padding={2}>
      <VStack gap={0.5}>
        <Text type="large" weight="bold" hasTabularNumbers>
          {value}
        </Text>
        <Text type="supporting" maxLines={1}>
          {label}
        </Text>
      </VStack>
    </Card>
  );
}

function StatRow({children}: {children: ReactNode}) {
  return (
    <Grid columns={3} gap={2}>
      {children}
    </Grid>
  );
}

function teamDescription(team: Team) {
  return `${team.league} · ${yearsLabel(team.from, team.to)} · ${championshipLabel(team)}`;
}

function TeamRow({team, onOpen}: {team: Team; onOpen: (id: string) => void}) {
  return (
    <ListItem
      label={team.name}
      description={teamDescription(team)}
      startContent={<TeamLogo team={team} size={36} />}
      endContent={team.status === 'current' ? <LeagueToken league={team.league} /> : <StatusBadge status={team.status} />}
      onClick={() => onOpen(team.id)}
    />
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
  const titles = teams.reduce((n, t) => n + t.championships.length, 0);
  const hidden = allTeams.length - teams.length;

  return (
    <PanelFrame title={city.name} onClose={onClose} resetKey={`city:${cityId}`}>
      <VStack gap={1}>
        <Text color="secondary">{PROVINCE_NAMES[city.province]}</Text>
        <Text>{city.blurb}</Text>
      </VStack>
      <StatRow>
        <Stat value={current.length} label="Active teams" />
        <Stat value={former.length} label="Former teams" />
        <Stat value={titles} label="League titles" />
      </StatRow>

      {current.length > 0 && (
        <VStack gap={1}>
          <SectionTitle>Active teams</SectionTitle>
          <List hasDividers edge="flush">
            {current.map((t) => (
              <TeamRow key={t.id} team={t} onOpen={onOpenTeam} />
            ))}
          </List>
        </VStack>
      )}
      {former.length > 0 && (
        <VStack gap={1}>
          <SectionTitle>Former teams</SectionTitle>
          <List hasDividers edge="flush">
            {former.map((t) => (
              <TeamRow key={t.id} team={t} onOpen={onOpenTeam} />
            ))}
          </List>
        </VStack>
      )}
      {teams.length === 0 && league !== 'all' && <EmptyState title={`No ${league} teams here`} isCompact />}
      {hidden > 0 && (
        <Banner
          status="info"
          title={`${hidden} more team${hidden === 1 ? '' : 's'} in other leagues`}
          endContent={<Button size="sm" label="Show all leagues" onClick={onShowAllLeagues} />}
        />
      )}

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
};

const JERSEY_NAME: Record<Sport, string> = {
  hockey: 'Sweater',
  basketball: 'Jersey',
  baseball: 'Uniform',
  football: 'Jersey',
  soccer: 'Kit',
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

  return (
    <PanelFrame title={team.name} leading={<TeamLogo team={team} size={40} />} onClose={onClose} resetKey={`team:${teamId}`}>
      <HStack gap={2} wrap="wrap" vAlign="center">
        <LeagueToken league={team.league} size="md" />
        <StatusBadge status={team.status} />
        <Text type="supporting">{yearsLabel(team.from, team.to)}</Text>
        {city && (
          <Button size="sm" variant="ghost" label={`${city.name}, ${city.province}`} icon={<Icon icon={PinIcon} />} onClick={() => onOpenCity(city.id)} />
        )}
      </HStack>

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
            <Text>{team.summary}</Text>
            <MetadataList label={{position: 'start', width: 120}}>
              <MetadataListItem label="League">
                <HStack gap={2} vAlign="center">
                  <LeagueLogo league={team.league} size={22} />
                  <Text>{league.name}</Text>
                </HStack>
              </MetadataListItem>
              <MetadataListItem label="City">{city ? `${city.name}, ${PROVINCE_NAMES[city.province]}` : '—'}</MetadataListItem>
              <MetadataListItem label="Years">{yearsLabel(team.from, team.to)}</MetadataListItem>
              {team.formerNames && team.formerNames.length > 0 && (
                <MetadataListItem label="Also known as">
                  {team.formerNames.map((n) => `${n.name} (${yearsLabel(n.from, n.to)})`).join('; ')}
                </MetadataListItem>
              )}
              <MetadataListItem label="Colours">
                <HStack gap={1.5} wrap="wrap" vAlign="center">
                  {era.colors.map((c, i) => (
                    <Swatch key={c + i} color={c} name={era.colorNames[i]} />
                  ))}
                </HStack>
              </MetadataListItem>
            </MetadataList>

            <VStack gap={2}>
              <SectionTitle endContent={<Icon icon={TrophyIcon} color="secondary" size="sm" />}>{championshipLabel(team)}</SectionTitle>
              {team.championships.length > 0 ? (
                <HStack gap={1.5} wrap="wrap">
                  {team.championships.map((y) => (
                    <Token key={y} label={String(y)} size="sm" color="yellow" />
                  ))}
                </HStack>
              ) : (
                <Text type="supporting">This team has not won a {league.trophy} in {league.id} play.</Text>
              )}
              {team.honours && (
                <ul className="flex list-disc flex-col gap-1 ps-5">
                  {team.honours.map((h) => (
                    <li key={h}>
                      <Text>{h}</Text>
                    </li>
                  ))}
                </ul>
              )}
            </VStack>

            {siblings.length > 0 && (
              <VStack gap={1}>
                <SectionTitle>Other {league.id} teams in {city?.name}</SectionTitle>
                <List hasDividers edge="flush" density="compact">
                  {siblings.map((t) => (
                    <TeamRow key={t.id} team={t} onOpen={onOpenTeam} />
                  ))}
                </List>
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
                  <Text weight="semibold" hasTabularNumbers>
                    {m.year}
                  </Text>
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

function Swatch({color, name}: {color: string; name?: string}) {
  return (
    <Token
      size="sm"
      label={name ?? color}
      icon={<span aria-hidden className="inline-block size-3 rounded-full border border-border" style={{background: color}} />}
    />
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
      <Banner
        status="info"
        title="About these images"
        description="Where we have it, the team’s official logo (via Wikipedia) appears for its era. Other eras’ badges, the uniforms and the playing surfaces are illustrations in each era’s colours. See SportsLogos.net for the full logo archive."
      />

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
                  <HStack gap={1.5} wrap="wrap">
                    {e.colors.map((c, j) => (
                      <Swatch key={c + j} color={c} name={e.colorNames[j]} />
                    ))}
                  </HStack>
                </VStack>
              }
              startContent={<EraLogo team={team} index={i} size={56} />}
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
