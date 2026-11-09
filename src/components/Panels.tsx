import {useMemo, useState, type ReactNode} from 'react';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
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
  CITIES,
  CITY_BY_ID,
  LEAGUES,
  LEAGUE_ORDER,
  PROVINCE_NAMES,
  TEAMS,
  teamsForCity,
  yearsLabel,
  type IdentityEra,
  type Sport,
  type Team,
  type TeamFilter,
} from '../data';
import {TeamBadge} from '../visuals/TeamBadge';
import {Jersey} from '../visuals/Jersey';
import {PlayingSurface} from '../visuals/PlayingSurface';
import {latestEra, venueEntriesForCity, venueEntriesForTeam} from '../lib/venues';
import {VenueSection} from './VenueSection';
import {LeagueDot, LeagueToken, SectionTitle, StatusBadge, championshipLabel} from './bits';
import {MapleLeafIcon, PinIcon, TrophyIcon} from './icons';

// ── Shared ────────────────────────────────────────────────────────────────

function BackButton({label, onClick}: {label: string; onClick: () => void}) {
  return <Button size="sm" variant="ghost" label={label} icon={<Icon icon="chevronLeft" />} onClick={onClick} />;
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
      startContent={<TeamBadge era={latestEra(team)} size={36} title={`${team.name} badge illustration`} />}
      endContent={team.status === 'current' ? <LeagueToken league={team.league} /> : <StatusBadge status={team.status} />}
      onClick={() => onOpen(team.id)}
    />
  );
}

// ── Overview (nothing selected) ───────────────────────────────────────────

export function OverviewPanel({
  filter,
  onOpenCity,
}: {
  filter: TeamFilter;
  onOpenCity: (id: string) => void;
}) {
  const rows = useMemo(
    () =>
      CITIES.map((c) => ({city: c, teams: teamsForCity(c.id, filter)}))
        .filter((r) => r.teams.length > 0)
        .sort((a, b) => b.teams.length - a.teams.length || a.city.rank - b.city.rank),
    [filter],
  );
  const visibleTeams = rows.flatMap((r) => r.teams);
  const titles = visibleTeams.reduce((n, t) => n + t.championships.length, 0);
  const current = visibleTeams.filter((t) => t.status === 'current').length;

  return (
    <VStack gap={4}>
      <VStack gap={2}>
        <HStack gap={2} vAlign="center">
          <Icon icon={MapleLeafIcon} size="lg" color="red" />
          <Heading level={2}>Canadian pro sports, mapped</Heading>
        </HStack>
        <Text color="secondary">
          Every Canadian NHL, NBA, MLB, MLS, CFL and CPL team, past and present. Pick a city on the map or below to see its teams,
          venues, championships and identity history.
        </Text>
      </VStack>
      <StatRow>
        <Stat value={visibleTeams.length} label="Teams shown" />
        <Stat value={current} label="Active" />
        <Stat value={titles} label="League titles" />
      </StatRow>
      <VStack gap={2}>
        <SectionTitle>Legend</SectionTitle>
        <Grid columns={2} rowGap={1.5} columnGap={4}>
          {LEAGUE_ORDER.map((l) => (
            <HStack key={l} gap={2} vAlign="center">
              <LeagueDot league={l} />
              <Text type="supporting" maxLines={1}>
                <strong className="text-primary">{l}</strong> · {LEAGUES[l].name}
              </Text>
            </HStack>
          ))}
        </Grid>
        <Text type="supporting">
          Rings show which leagues a city has. A hollow, dashed marker means the city only has former teams.
        </Text>
      </VStack>
      <VStack gap={1}>
        <SectionTitle>Cities</SectionTitle>
        {rows.length === 0 ? (
          <EmptyState title="No teams match these filters" description="Turn on more leagues or switch to All eras." isCompact />
        ) : (
          <List hasDividers edge="flush">
            {rows.map(({city, teams}) => {
              const leagues = LEAGUE_ORDER.filter((l) => teams.some((t) => t.league === l));
              return (
                <ListItem
                  key={city.id}
                  label={city.name}
                  description={`${PROVINCE_NAMES[city.province]} · ${teams.length} team${teams.length === 1 ? '' : 's'}`}
                  startContent={<Icon icon={PinIcon} color="secondary" />}
                  endContent={
                    <HStack gap={1}>
                      {leagues.map((l) => (
                        <LeagueDot key={l} league={l} />
                      ))}
                    </HStack>
                  }
                  onClick={() => onOpenCity(city.id)}
                />
              );
            })}
          </List>
        )}
      </VStack>
    </VStack>
  );
}

// ── City ──────────────────────────────────────────────────────────────────

export function CityPanel({
  cityId,
  filter,
  onBack,
  onOpenTeam,
  onShowAllEras,
}: {
  cityId: string;
  filter: TeamFilter;
  onBack: () => void;
  onOpenTeam: (id: string) => void;
  onShowAllEras: () => void;
}) {
  const city = CITY_BY_ID[cityId];
  const teams = useMemo(() => teamsForCity(cityId, filter), [cityId, filter]);
  const allTeams = useMemo(() => teamsForCity(cityId), [cityId]);
  const venueEntries = useMemo(() => venueEntriesForCity(cityId, filter), [cityId, filter]);
  if (!city) return <EmptyState title="City not found" />;

  const current = teams.filter((t) => t.status === 'current');
  const former = teams.filter((t) => t.status !== 'current');
  const titles = teams.reduce((n, t) => n + t.championships.length, 0);
  const hidden = allTeams.length - teams.length;

  return (
    <VStack gap={4}>
      <HStack>
        <BackButton label="All cities" onClick={onBack} />
      </HStack>
      <VStack gap={1}>
        <Heading level={2}>{city.name}</Heading>
        <Text color="secondary">{PROVINCE_NAMES[city.province]}</Text>
      </VStack>
      <Text>{city.blurb}</Text>
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
      {teams.length === 0 && <EmptyState title="No teams match these filters" isCompact />}
      {hidden > 0 && (
        <Banner
          status="info"
          title={`${hidden} more team${hidden === 1 ? '' : 's'} hidden by your filters`}
          endContent={<Button size="sm" label="Show all" onClick={onShowAllEras} />}
        />
      )}

      {venueEntries.length > 0 && <VenueSection entries={venueEntries} title="Venue" />}

      <Link href={city.wikipedia} isExternalLink isStandalone>
        {city.name} on Wikipedia
      </Link>
    </VStack>
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
  onBack,
  onOpenTeam,
}: {
  teamId: string;
  tab: string | undefined;
  onTabChange: (tab: TeamTab) => void;
  onBack: (cityId: string) => void;
  onOpenTeam: (id: string) => void;
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
    <VStack gap={4}>
      <HStack>
        <BackButton label={city ? city.name : 'Back'} onClick={() => onBack(team.cityId)} />
      </HStack>
      <HStack gap={3} vAlign="center">
        <TeamBadge era={era} size={64} title={`${team.name} badge illustration`} />
        <VStack gap={1}>
          <Heading level={2}>{team.name}</Heading>
          <HStack gap={2} wrap="wrap" vAlign="center">
            <LeagueToken league={team.league} size="md" />
            <StatusBadge status={team.status} />
            <Text type="supporting">{yearsLabel(team.from, team.to)}</Text>
          </HStack>
        </VStack>
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
              <MetadataListItem label="League">{league.name}</MetadataListItem>
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
    </VStack>
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
        title="Original illustrations"
        description="Badges, uniforms and surfaces are drawn by this site in each era’s team colours. They are not the official logos, which belong to the teams. See SportsLogos.net for the real artwork."
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
              startContent={<TeamBadge era={e} size={56} />}
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
