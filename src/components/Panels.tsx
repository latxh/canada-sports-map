import {useLayoutEffect, useMemo, useRef, type ReactNode} from 'react';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Grid} from '@astryxdesign/core/Grid';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {CITY_BY_ID, LEAGUES, TEAMS, teamsForCity, yearsLabel, type Sport, type Team, type LeagueFilter} from '../data';
import {HISTORICAL_LOGOS, TEAM_PHOTOS, VENUE_PHOTOS, type MediaPhoto} from '../data/media';
import {EraLogo, LeagueLogo, LogoImage, TeamLogo} from '../visuals/Logos';
import {LOGOS} from '../data/logos';
import {Jersey} from '../visuals/Jersey';
import {PlayingSurface} from '../visuals/PlayingSurface';
import {latestEra, venueEntriesForCity, venueEntriesForTeam} from '../lib/venues';
import {TitleCabinet, TrophyCabinet} from '../visuals/Trophies';
import {VenueSection} from './VenueSection';
import {CardCarousel, CarouselCard, PhotoFigure, mediaAsset} from './Media';
import {SectionTitle, StatusBadge} from './bits';
import {ExternalIcon, PinIcon} from './icons';

// ── Shared ────────────────────────────────────────────────────────────────

/**
 * Chrome shared by every panel: a sticky one-line header with the title (and an optional
 * quieter aside, like the province) on the left and a close button on the right.
 */
export function PanelFrame({
  title,
  aside,
  onClose,
  resetKey,
  children,
}: {
  title: string;
  /** Shown after the title in smaller grey type, e.g. "ON". */
  aside?: string;
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
        <Heading level={2} maxLines={1} className="min-w-0 flex-1">
          {title}
          {aside ? (
            <Text color="secondary" size="lg" weight="normal">
              {` ${aside}`}
            </Text>
          ) : null}
        </Heading>
        <IconButton size="sm" variant="ghost" label="Close panel" tooltip="Close" icon={<Icon icon="close" />} onClick={onClose} />
      </HStack>
      {children}
    </VStack>
  );
}

function Section({title, children}: {title: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </VStack>
  );
}

/** Full-width link buttons for further reading at the bottom of a panel. */
function LinkButtons({links}: {links: {label: string; href: string}[]}) {
  return (
    <VStack gap={2} paddingBlockStart={2}>
      {links.map((l) => (
        <Button key={l.href} href={l.href} target="_blank" width="100%" variant="secondary" label={l.label} icon={<Icon icon={ExternalIcon} />} />
      ))}
    </VStack>
  );
}

/** A team as a tappable tile: the logo, with its league and years underneath. */
function TeamTile({team, onOpen}: {team: Team; onOpen: (id: string) => void}) {
  const isFormer = team.status !== 'current';
  return (
    <ClickableCard label={team.name} onClick={() => onOpen(team.id)} padding={2} variant="transparent">
      <VStack gap={2} hAlign="center">
        <span className={isFormer ? 'opacity-80 grayscale-[35%]' : undefined}>
          <TeamLogo team={team} size={76} />
        </span>
        <HStack gap={1} vAlign="center" hAlign="center">
          <LeagueLogo league={team.league} size={16} isDecorative />
          <Text type="supporting" size="xsm" hasTabularNumbers>
            {yearsLabel(team.from, team.to)}
          </Text>
        </HStack>
      </VStack>
    </ClickableCard>
  );
}

// ── City ──────────────────────────────────────────────────────────────────

export function CityPanel({
  cityId,
  league,
  onOpenTeam,
  onClose,
}: {
  cityId: string;
  league: LeagueFilter;
  onOpenTeam: (id: string) => void;
  onClose: () => void;
}) {
  const city = CITY_BY_ID[cityId];
  const teams = useMemo(() => teamsForCity(cityId, league), [cityId, league]);
  const venueEntries = useMemo(() => venueEntriesForCity(cityId, league, {activeOnly: true}), [cityId, league]);
  if (!city) return <EmptyState title="City not found" />;
  const hasTitles = teams.some((t) => t.championships.length > 0);

  return (
    <PanelFrame title={city.name} aside={city.province} onClose={onClose} resetKey={`city:${cityId}`}>
      <Section title="Teams">
        {teams.length > 0 ? (
          <Grid columns={3} gap={1}>
            {teams.map((t) => (
              <TeamTile key={t.id} team={t} onOpen={onOpenTeam} />
            ))}
          </Grid>
        ) : (
          <EmptyState title={`No ${league} teams here`} isCompact />
        )}
      </Section>

      {hasTitles && (
        <Section title="Trophy Cabinet">
          <TitleCabinet teams={teams} />
        </Section>
      )}

      {venueEntries.length > 0 && <VenueSection entries={venueEntries} title="Venues" />}

      <LinkButtons links={[{label: `${city.name} on Wikipedia`, href: city.wikipedia}]} />
    </PanelFrame>
  );
}

// ── Team ──────────────────────────────────────────────────────────────────

const SURFACES: Record<Sport, string> = {
  hockey: 'Rinks',
  basketball: 'Courts',
  baseball: 'Fields',
  football: 'Fields',
  soccer: 'Pitches',
  lacrosse: 'Floors',
};

const JERSEYS: Record<Sport, string> = {
  hockey: 'Sweaters',
  basketball: 'Jerseys',
  baseball: 'Uniforms',
  football: 'Jerseys',
  soccer: 'Kits',
  lacrosse: 'Jerseys',
};

/** Links out for each team: its article, the league's logo archive, and court/uniform archives where they exist. */
function teamLinks(team: Team) {
  const links = [
    {label: 'Wikipedia', href: team.wikipedia},
    {label: 'Logo history on SportsLogos.net', href: LEAGUES[team.league].sportsLogos},
  ];
  if (team.league === 'NBA') links.push({label: 'Courts on Basketball Jersey Archive', href: 'https://basketballjerseyarchive.com/nba-courts-l758/'});
  return links;
}

export function TeamPanel({
  teamId,
  onOpenCity,
  onClose,
}: {
  teamId: string;
  onOpenCity: (id: string) => void;
  onClose: () => void;
}) {
  const team = TEAMS.find((t) => t.id === teamId);
  const venueEntries = useMemo(() => (team ? venueEntriesForTeam(team) : []), [team]);
  if (!team) return <EmptyState title="Team not found" />;
  const city = CITY_BY_ID[team.cityId];
  const era = latestEra(team);
  const sport = LEAGUES[team.league].sport;
  const photos = teamPhotos(team);

  return (
    <PanelFrame title={team.name} onClose={onClose} resetKey={`team:${teamId}`}>
      {/* Hero: the logo, big, on a wash of the team's colour. */}
      <VStack
        gap={3}
        hAlign="center"
        className="rounded-2xl px-4 pt-5 pb-4"
        style={{background: `linear-gradient(160deg, color-mix(in srgb, ${era.colors[0]} 20%, var(--color-background-surface)), color-mix(in srgb, ${era.colors[0]} 4%, var(--color-background-surface)))`}}>
        <TeamLogo team={team} size={132} />
        <HStack gap={2} wrap="wrap" vAlign="center" hAlign="center">
          <HStack gap={1} vAlign="center">
            <LeagueLogo league={team.league} size={22} />
            <Text weight="semibold">{team.league}</Text>
          </HStack>
          <Text color="secondary" hasTabularNumbers>
            {yearsLabel(team.from, team.to)}
          </Text>
          {team.status !== 'current' && <StatusBadge status={team.status} />}
        </HStack>
        {city && (
          <Button size="sm" variant="ghost" label={`${city.name}, ${city.province}`} icon={<Icon icon={PinIcon} />} onClick={() => onOpenCity(city.id)} />
        )}
      </VStack>

      {team.championships.length > 0 && (
        <Section title="Trophy Cabinet">
          <TrophyCabinet team={team} />
        </Section>
      )}

      {venueEntries.length > 0 && <VenueSection entries={venueEntries} title="Venues" />}

      <Section title="Logos">
        <LogoCarousel team={team} />
      </Section>

      <Section title={JERSEYS[sport]}>
        <CardCarousel label={`${JERSEYS[sport]} by era`}>
          {team.identity.map((e, i) => (
            <CarouselCard key={i} width={200} caption={yearsLabel(e.from, e.to)}>
              <HStack gap={1} hAlign="center">
                <Jersey era={e} sport={sport} variant="home" size={80} />
                <Jersey era={e} sport={sport} variant="away" size={80} />
              </HStack>
            </CarouselCard>
          ))}
        </CardCarousel>
      </Section>

      <Section title={SURFACES[sport]}>
        <CardCarousel label={`${SURFACES[sport]} by era`}>
          {team.identity.map((e, i) => (
            <CarouselCard key={i} width={260} caption={yearsLabel(e.from, e.to)}>
              <PlayingSurface era={e} sport={sport} width={228} />
            </CarouselCard>
          ))}
        </CardCarousel>
      </Section>

      {photos.length > 0 && (
        <Section title="Photos">
          <CardCarousel label="Photos">
            {photos.map((p) => (
              <span key={p.file} className="w-64 shrink-0">
                <PhotoFigure photo={p} height={170} />
              </span>
            ))}
          </CardCarousel>
        </Section>
      )}

      <LinkButtons links={teamLinks(team)} />
    </PanelFrame>
  );
}

/** Team photos from Commons, then the current home venue. */
function teamPhotos(team: Team): MediaPhoto[] {
  const photos = [...(TEAM_PHOTOS[team.id] ?? [])];
  const home = team.venues[team.venues.length - 1];
  const venuePhoto = home ? VENUE_PHOTOS[home.venueId] : undefined;
  if (venuePhoto && !photos.some((p) => p.page === venuePhoto.page)) photos.push(venuePhoto);
  return photos;
}

/**
 * Official logos through the years where Wikipedia has them (plus today's), otherwise one
 * illustrated badge per identity era.
 */
function LogoCarousel({team}: {team: Team}) {
  const files = (HISTORICAL_LOGOS[team.id] ?? []).slice().sort((a, b) => a.from - b.from);
  const era = latestEra(team);
  if (files.length > 0) {
    return (
      <CardCarousel label="Logos through the years">
        {files.map((f) => (
          <CarouselCard key={f.file} caption={yearsLabel(f.from, f.to)}>
            <LogoImage src={mediaAsset(f.file)} alt={`${team.name} logo, ${yearsLabel(f.from, f.to)}`} size={104} />
          </CarouselCard>
        ))}
        {LOGOS[team.id] && (
          <CarouselCard caption={yearsLabel(era.from, era.to)}>
            <TeamLogo team={team} size={104} />
          </CarouselCard>
        )}
      </CardCarousel>
    );
  }
  return (
    <CardCarousel label="Logos through the years">
      {team.identity.map((e, i) => (
        <CarouselCard key={i} caption={`${yearsLabel(e.from, e.to)}${e.name ? ` · ${e.name}` : ''}`}>
          <EraLogo team={team} index={i} size={104} />
        </CarouselCard>
      ))}
    </CardCarousel>
  );
}
