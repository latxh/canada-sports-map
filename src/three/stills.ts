/**
 * Pre-rendered stills of the 3D venue models, one per venue and colour scheme (a venue looks
 * different for each tenant: field markings and seat colours). Phones show the still until you
 * ask for 3D, and desktops show it while the 3D chunk loads. Rendered from the app's
 * `?still=<key>` mode by scripts/render-stills.mjs into public/stills/.
 */
import {CITIES, LEAGUE_ORDER, TEAMS, type LeagueFilter} from '../data';
import {venueEntriesForCity, venueEntriesForTeam} from '../lib/venues';
import type {VenueEntry} from '../components/VenueSection';
import {hasStadiumModel} from './modelIds';

/** Width and height (CSS px) the stills are rendered at; the inline viewer is this tall. */
export const STILL_SIZE = {width: 480, height: 260};

type StillEntry = Pick<VenueEntry, 'venue' | 'sport' | 'seatColor' | 'accentColor'>;

export function stillKey(e: StillEntry): string {
  return `${e.venue.id}--${e.sport}--${e.seatColor.replace('#', '')}-${e.accentColor.replace('#', '')}`.toLowerCase();
}

export function stillUrl(e: StillEntry): string {
  return `${import.meta.env.BASE_URL}stills/${stillKey(e)}.webp`;
}

/** Every venue entry a panel can show a 3D model for, one per still. */
export function allStillEntries(): VenueEntry[] {
  const byKey = new Map<string, VenueEntry>();
  const add = (e: VenueEntry) => hasStadiumModel(e.venue.id) && byKey.set(stillKey(e), e);
  for (const team of TEAMS) venueEntriesForTeam(team).forEach(add);
  for (const city of CITIES) {
    for (const league of ['all', ...LEAGUE_ORDER] as LeagueFilter[]) venueEntriesForCity(city.id, league, {activeOnly: true}).forEach(add);
  }
  return [...byKey.values()].sort((a, b) => stillKey(a).localeCompare(stillKey(b)));
}
