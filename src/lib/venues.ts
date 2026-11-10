import {CITY_BY_ID, LEAGUES, TEAMS, VENUE_BY_ID, VENUES, yearsLabel, type LeagueFilter, type LeagueId, type Team} from '../data';
import {teamMatches} from '../data';
import {mix} from './color';
import type {VenueEntry} from '../components/VenueSection';

export function latestEra(team: Team) {
  return team.identity[team.identity.length - 1];
}

function colorsFor(team: Team) {
  const era = latestEra(team);
  const [primary, secondary = '#ffffff'] = era.colors;
  return {seatColor: mix(primary, '#4a4f55', 0.15), accentColor: secondary.toLowerCase() === '#ffffff' ? primary : secondary};
}

export function shortName(team: Team) {
  const base = team.name.replace(/\s*\(.*\)$/, '');
  const city = CITY_BY_ID[team.cityId]?.name ?? '';
  const plain = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const rest = plain(base).startsWith(plain(city) + ' ') ? base.slice(city.length + 1) : base;
  return rest.length <= 3 ? base : rest;
}

export function venueEntriesForTeam(team: Team): VenueEntry[] {
  const colors = colorsFor(team);
  return team.venues
    .slice()
    .reverse()
    .map((span) => VENUE_BY_ID[span.venueId])
    .filter(Boolean)
    .map((venue) => {
      const span = team.venues.find((s) => s.venueId === venue.id)!;
      return {venue, note: yearsLabel(span.from, span.to), sport: LEAGUES[team.league].sport, ...colors};
    });
}

/**
 * A city's venues for the league filter. With `activeOnly`, only venues a current team
 * plays in today.
 */
export function venueEntriesForCity(cityId: string, league: LeagueFilter, {activeOnly = false}: {activeOnly?: boolean} = {}): VenueEntry[] {
  const venues = VENUES.filter((v) => v.cityId === cityId);
  const entries: (VenueEntry & {rank: number})[] = [];
  for (const venue of venues) {
    const tenants = TEAMS.filter(
      (t) =>
        teamMatches(t, league) &&
        t.venues.some((s) => s.venueId === venue.id && (!activeOnly || (t.status === 'current' && s.to === undefined))),
    );
    if (tenants.length === 0) continue;
    // Most recent tenant drives the model's field and colours.
    const lead = tenants
      .slice()
      .sort((a, b) => (spanOf(b, venue.id).to ?? 9999) - (spanOf(a, venue.id).to ?? 9999) || LEAGUE_PRIORITY[a.league] - LEAGUE_PRIORITY[b.league])[0];
    entries.push({
      venue,
      note: tenants.map((t) => shortName(t)).join(', '),
      sport: LEAGUES[lead.league].sport,
      ...colorsFor(lead),
      rank: (venue.closed ? 1e6 : 0) - (venue.capacity ?? 0),
    });
  }
  return entries.sort((a, b) => a.rank - b.rank);
}

const LEAGUE_PRIORITY: Record<LeagueId, number> = {MLB: 0, NHL: 1, NBA: 2, CFL: 3, MLS: 4, CPL: 5, PWHL: 6, WNBA: 7, NLL: 8, CEBL: 9, NSL: 10};

function spanOf(team: Team, venueId: string) {
  return team.venues.find((s) => s.venueId === venueId)!;
}
