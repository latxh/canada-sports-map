import type {City, LeagueId, Team} from './types';
import {CITIES} from './cities';
import {NHL_TEAMS} from './teams/nhl';
import {NBA_TEAMS, MLB_TEAMS, MLS_TEAMS} from './teams/nba-mlb-mls';
import {CFL_TEAMS, CPL_TEAMS} from './teams/cfl-cpl';

export * from './types';
export {LEAGUES, LEAGUE_ORDER} from './leagues';
export {CITIES, CITY_BY_ID, PROVINCE_NAMES} from './cities';
export {VENUES, VENUE_BY_ID} from './venues';

/** When the dataset was last reviewed against its sources. */
export const DATA_AS_OF = 'November 2026';

export const TEAMS: Team[] = [...NHL_TEAMS, ...NBA_TEAMS, ...MLB_TEAMS, ...MLS_TEAMS, ...CFL_TEAMS, ...CPL_TEAMS];

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

export type EraFilter = 'all' | 'current' | 'defunct';

export interface TeamFilter {
  leagues: ReadonlySet<LeagueId>;
  era: EraFilter;
}

export function teamMatches(team: Team, filter: TeamFilter): boolean {
  if (!filter.leagues.has(team.league)) return false;
  if (filter.era === 'current') return team.status === 'current';
  if (filter.era === 'defunct') return team.status !== 'current';
  return true;
}

export function teamsForCity(cityId: string, filter?: TeamFilter): Team[] {
  return TEAMS.filter((t) => t.cityId === cityId && (!filter || teamMatches(t, filter))).sort(compareTeams);
}

const LEAGUE_RANK: Record<LeagueId, number> = {NHL: 0, NBA: 1, MLB: 2, MLS: 3, CFL: 4, CPL: 5};

export function compareTeams(a: Team, b: Team): number {
  const status = Number(a.status !== 'current') - Number(b.status !== 'current');
  if (status !== 0) return status;
  const league = LEAGUE_RANK[a.league] - LEAGUE_RANK[b.league];
  if (league !== 0) return league;
  return (b.to ?? 9999) - (a.to ?? 9999) || a.from - b.from;
}

export function citiesWithTeams(filter: TeamFilter): {city: City; teams: Team[]}[] {
  return CITIES.map((city) => ({city, teams: teamsForCity(city.id, filter)})).filter((c) => c.teams.length > 0);
}

export function yearsLabel(from: number, to?: number): string {
  return to ? `${from}–${to}` : `${from}–present`;
}
