import type {City, LeagueId, Team} from './types';
import {CITIES} from './cities';
import {NHL_TEAMS} from './teams/nhl';
import {NBA_TEAMS, MLB_TEAMS, MLS_TEAMS} from './teams/nba-mlb-mls';
import {CFL_TEAMS, CPL_TEAMS} from './teams/cfl-cpl';
import {NLL_TEAMS} from './teams/nll';
import {CEBL_TEAMS} from './teams/cebl';
import {PWHL_TEAMS, WNBA_TEAMS, NSL_TEAMS} from './teams/pwhl-wnba-nsl';
import {CDL_TEAMS} from './teams/cdl';

export * from './types';
export {LEAGUES, LEAGUE_ORDER} from './leagues';
export {CITIES, CITY_BY_ID, PROVINCE_NAMES} from './cities';
export {VENUES, VENUE_BY_ID} from './venues';

/** When the dataset was last reviewed against its sources. */
export const DATA_AS_OF = 'November 2026';

export const TEAMS: Team[] = [
  ...NHL_TEAMS,
  ...NBA_TEAMS,
  ...MLB_TEAMS,
  ...MLS_TEAMS,
  ...CFL_TEAMS,
  ...CPL_TEAMS,
  ...NLL_TEAMS,
  ...CEBL_TEAMS,
  ...PWHL_TEAMS,
  ...WNBA_TEAMS,
  ...NSL_TEAMS,
  ...CDL_TEAMS,
];

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

/** Which league the map shows; 'all' shows every team. */
export type LeagueFilter = LeagueId | 'all';

export function teamMatches(team: Team, league: LeagueFilter): boolean {
  return league === 'all' || team.league === league;
}

export function teamsForCity(cityId: string, league: LeagueFilter = 'all'): Team[] {
  return TEAMS.filter((t) => t.cityId === cityId && teamMatches(t, league)).sort(compareTeams);
}

const LEAGUE_RANK: Record<LeagueId, number> = {NHL: 0, NBA: 1, MLB: 2, MLS: 3, CFL: 4, CPL: 5, NLL: 6, CEBL: 7, PWHL: 8, WNBA: 9, NSL: 10, CDL: 11};

export function compareTeams(a: Team, b: Team): number {
  const status = Number(a.status !== 'current') - Number(b.status !== 'current');
  if (status !== 0) return status;
  const league = LEAGUE_RANK[a.league] - LEAGUE_RANK[b.league];
  if (league !== 0) return league;
  return (b.to ?? 9999) - (a.to ?? 9999) || a.from - b.from;
}

export function citiesWithTeams(league: LeagueFilter): {city: City; teams: Team[]}[] {
  return CITIES.map((city) => ({city, teams: teamsForCity(city.id, league)})).filter((c) => c.teams.length > 0);
}

/** The latest season the data covers; a team starting after it hasn't played yet. */
export const DATA_YEAR = 2026;

export function yearsLabel(from: number, to?: number): string {
  if (to === from) return String(from);
  if (!to && from > DATA_YEAR) return `From ${from}`;
  return to ? `${from}–${to}` : `${from}–present`;
}
