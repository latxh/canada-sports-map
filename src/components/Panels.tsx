import {useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
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
import {EraLogo, LeagueLogo, LogoImage, TeamLogo, logoAsset} from '../visuals/Logos';
import {LOGOS} from '../data/logos';
import {Jersey} from '../visuals/Jersey';
import {PlayingSurface} from '../visuals/PlayingSurface';
import type {SlnImage, SlnTeam} from '../data/sportslogos';
import {latestEra, venueEntriesForCity, venueEntriesForTeam} from '../lib/venues';
import {TitleCabinet, TrophyCabinet} from '../visuals/Trophies';
import {VenueSection} from './VenueSection';
import {CardCarousel, CarouselCard, GalleryCarousel, PhotoCarousel, mediaAsset, SportsLogosCredit, type GalleryItem} from './Media';
import {SectionTitle, StatusBadge} from './bits';
import {ExternalIcon, PinIcon} from './icons';

// ── Shared ────────────────────────────────────────────────────────────────

/**
 * Chrome shared by every panel: a sticky one-line header with an optional back chevron,
 * the title, and a close button on the right.
 */
export function PanelFrame({
  title,
  backLabel,
  onBack,
  onClose,
  resetKey,
  children,
}: {
  title: string;
  /** Where the back chevron goes, e.g. "Back to Toronto". */
  backLabel?: string;
  onBack?: () => void;
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
      <HStack gap={2} vAlign="center" className="glass-panel-header sticky -top-4 z-10 -mx-4 -mt-4 px-4 pt-4 pb-3">
        {onBack && (
          <IconButton size="sm" variant="ghost" label={backLabel ?? 'Back'} tooltip={backLabel ?? 'Back'} icon={<Icon icon="chevronLeft" />} onClick={onBack} className="-ms-1.5" />
        )}
        <Heading level={2} maxLines={1} className="min-w-0 flex-1">
          {title}
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
        <Button key={l.href} href={l.href} target="_blank" width="100%" variant="ghost" label={l.label} icon={<Icon icon={ExternalIcon} />} />
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
        <span className={isFormer ? 'team-former' : undefined}>
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
    <PanelFrame title={city.name} onClose={onClose} resetKey={`city:${cityId}`}>
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
  esports: 'Stages',
};

const JERSEYS: Record<Sport, string> = {
  hockey: 'Sweaters',
  basketball: 'Jerseys',
  baseball: 'Uniforms',
  football: 'Jerseys',
  soccer: 'Kits',
  lacrosse: 'Jerseys',
  esports: 'Jerseys',
};

/**
 * SportsLogos.net images are only needed on team pages, so their list is its own chunk:
 * prefetched once the map is up (see App) and loaded on demand otherwise.
 */
let sportsLogosPromise: Promise<Record<string, SlnTeam>> | null = null;
export function loadSportsLogos() {
  sportsLogosPromise ??= import('../data/sportslogos').then((m) => m.SPORTSLOGOS);
  return sportsLogosPromise;
}

/** The team's SportsLogos.net images: undefined while loading, null when it has none. */
function useSportsLogos(teamId: string): SlnTeam | null | undefined {
  const [all, setAll] = useState<Record<string, SlnTeam> | null>(null);
  useEffect(() => {
    void loadSportsLogos().then(setAll);
  }, []);
  return all ? (all[teamId] ?? null) : undefined;
}

/** Links out for each team: its article, the league's logo archive, and court/uniform archives where they exist. */
function teamLinks(team: Team, sln: SlnTeam | null | undefined) {
  const links = [
    {label: 'Wikipedia', href: team.wikipedia},
    {label: 'Logo history on SportsLogos.net', href: sln?.page ?? LEAGUES[team.league].sportsLogos},
  ];
  if (team.league === 'NBA') links.push({label: 'Courts on Basketball Jersey Archive', href: 'https://basketballjerseyarchive.com/nba-courts-l758/'});
  return links;
}

export function TeamPanel({
  teamId,
  backCityId,
  onOpenCity,
  onClose,
}: {
  teamId: string;
  /** Set when the team was opened from a city panel: shows a back chevron to that city. */
  backCityId?: string;
  onOpenCity: (id: string) => void;
  onClose: () => void;
}) {
  const team = TEAMS.find((t) => t.id === teamId);
  const venueEntries = useMemo(() => (team ? venueEntriesForTeam(team) : []), [team]);
  const sln = useSportsLogos(teamId);
  // Until the list arrives, hold the history carousels back rather than flash the drawings.
  const isLoadingHistory = sln === undefined;
  if (!team) return <EmptyState title="Team not found" />;
  const city = CITY_BY_ID[team.cityId];
  const era = latestEra(team);
  const sport = LEAGUES[team.league].sport;
  const photos = teamPhotos(team);

  return (
    <PanelFrame
      title={team.name}
      backLabel={backCityId ? `Back to ${CITY_BY_ID[backCityId]?.name ?? 'city'}` : undefined}
      onBack={backCityId ? () => onOpenCity(backCityId) : undefined}
      onClose={onClose}
      resetKey={`team:${teamId}`}>
      {/* Hero: the logo, big, on a wash of the team's colour. */}
      <VStack
        gap={3}
        hAlign="center"
        className="card-radius px-4 pt-5 pb-4"
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

      {!isLoadingHistory && (
      <>
      <Section title="Logos">
        <LogoCarousel team={team} sln={sln} />
      </Section>

      <Section title={JERSEYS[sport]}>
        {sln && (sln.home.length > 0 || sln.away.length > 0) ? (
          <UniformCarousel team={team} sln={sln} label={`${JERSEYS[sport]} by era`} />
        ) : (
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
        )}
      </Section>

      <Section title={SURFACES[sport]}>
        {sln && sln.surfaces.length > 0 ? (
          <GalleryCarousel
            label={`${SURFACES[sport]} by era`}
            items={sln.surfaces.map((img) => {
              const alt = `${team.name} ${SURFACES[sport].toLowerCase().replace(/s$/, '')}, ${yearsLabel(img.from, img.to)}`;
              return {
                key: img.file,
                width: 260,
                caption: yearsLabel(img.from, img.to),
                credit: <SportsLogosCredit page={img.page} />,
                thumb: <SlnPicture img={img} alt={alt} height={150} maxWidth={228} />,
                full: slnFull(img, alt),
              };
            })}
          />
        ) : (
          <CardCarousel label={`${SURFACES[sport]} by era`}>
            {team.identity.map((e, i) => (
              <CarouselCard key={i} width={260} caption={yearsLabel(e.from, e.to)}>
                <PlayingSurface era={e} sport={sport} width={228} />
              </CarouselCard>
            ))}
          </CardCarousel>
        )}
      </Section>
      </>
      )}

      {photos.length > 0 && (
        <Section title="Photos">
          <PhotoCarousel photos={photos} />
        </Section>
      )}

      <LinkButtons links={teamLinks(team, sln)} />
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

const slnAsset = (file: string) => `${import.meta.env.BASE_URL}sportslogos/${file}`;
/** The larger copy of a SportsLogos.net image, for the lightbox. */
const slnFull = (img: SlnImage, alt: string) => ({
  src: slnAsset(img.file.replace(/\.webp$/, '-lg.webp')),
  alt,
  caption: `${yearsLabel(img.from, img.to)} · ${img.label} · Source: SportsLogos.net`,
});

/** An image from SportsLogos.net at a set height, its width following its shape. */
function SlnPicture({img, alt, height, maxWidth}: {img: SlnImage; alt: string; height: number; maxWidth: number}) {
  const width = Math.min(maxWidth, Math.round((height * img.width) / img.height));
  const h = Math.round((width * img.height) / img.width);
  return <img src={slnAsset(img.file)} alt={alt} width={width} height={h} loading="lazy" decoding="async" className="sln-image" />;
}

/**
 * Which uniform, in SportsLogos.net's own words (hockey has Light and Dark sweaters, basketball
 * White and Dark, baseball and football Home and Road), so the label is never wrong about
 * which one a team wore at home in a given year.
 */
function uniformSide(img: SlnImage, fallback: string) {
  const m = img.label.match(/(Primary White|Primary Dark|Primary Light|Light|Dark|White|Home|Road|Away|Colou?red)\s+Uniform/);
  return m ? m[1].replace('Primary ', '') : fallback;
}

/** Light/home and dark/road uniforms from SportsLogos.net, one card each, in order. */
function UniformCarousel({team, sln, label}: {team: Team; sln: SlnTeam; label: string}) {
  const cards = [...sln.home.map((img) => ({img, side: uniformSide(img, 'Home')})), ...sln.away.map((img) => ({img, side: uniformSide(img, 'Road')}))].sort(
    (a, b) => a.img.from - b.img.from || (a.img.to ?? 9999) - (b.img.to ?? 9999) || a.side.localeCompare(b.side),
  );
  return (
    <GalleryCarousel
      label={label}
      items={cards.map(({img, side}) => {
        const width = Math.min(232, Math.max(112, Math.round((112 * img.width) / img.height) + 24));
        const years = yearsLabel(img.from, img.to);
        const alt = `${team.name} ${side.toLowerCase()} uniform, ${years}`;
        return {
          key: img.file,
          width,
          caption: `${side} · ${years}`,
          credit: <SportsLogosCredit page={img.page} />,
          thumb: <SlnPicture img={img} alt={alt} height={112} maxWidth={width - 24} />,
          full: slnFull(img, alt),
        };
      })}
    />
  );
}

/**
 * Logos through the years: SportsLogos.net's primary logo history when it has the team;
 * otherwise official files where Wikipedia or Commons has them, an illustrated badge for any
 * other era, and today's official logo last.
 */
function LogoCarousel({team, sln}: {team: Team; sln: SlnTeam | null}) {
  const label = 'Logos through the years';
  if (sln && sln.logos.length > 0) {
    return (
      <GalleryCarousel
        label={label}
        items={sln.logos.map((img) => {
          const years = yearsLabel(img.from, img.to);
          return {
            key: img.file,
            caption: years,
            credit: <SportsLogosCredit page={img.page} />,
            thumb: <LogoImage src={slnAsset(img.file)} alt={`${team.name} logo, ${years}`} size={104} />,
            full: slnFull(img, `${team.name} logo, ${years}`),
          };
        })}
      />
    );
  }
  const files = HISTORICAL_LOGOS[team.id] ?? [];
  const official = LOGOS[team.id];
  const officialEra = official ? (official.eraIndex ?? team.identity.length - 1) : -1;
  const overlaps = (from: number, to: number | undefined, f: {from: number; to?: number}) => from <= (f.to ?? 9999) && (to ?? 9999) >= f.from;
  const items: (GalleryItem & {from: number})[] = files.map((f) => {
    const years = yearsLabel(f.from, f.to);
    const alt = `${team.name} logo, ${years}`;
    return {key: f.file, from: f.from, caption: years, thumb: <LogoImage src={mediaAsset(f.file)} alt={alt} size={104} />, full: {src: mediaAsset(f.file), alt, caption: `${years} · ${team.name} logo · Wikimedia Commons`}};
  });
  team.identity.forEach((e, i) => {
    const years = yearsLabel(e.from, e.to);
    if (i === officialEra && official) {
      const alt = `${team.name} logo, ${years}`;
      items.push({key: `official-${i}`, from: e.from, caption: years, thumb: <TeamLogo team={team} size={104} />, full: {src: logoAsset(official.file), alt, caption: `${years} · ${team.name} logo · Wikipedia`}});
    } else if (!files.some((f) => overlaps(e.from, e.to, f))) {
      // An illustrated badge: shown in the carousel, but there's no image to enlarge.
      items.push({key: `era-${i}`, from: e.from, caption: `${years}${e.name ? ` · ${e.name}` : ''}`, thumb: <EraLogo team={team} index={i} size={104} />});
    }
  });
  items.sort((a, b) => a.from - b.from);
  return <GalleryCarousel label={label} items={items} />;
}
