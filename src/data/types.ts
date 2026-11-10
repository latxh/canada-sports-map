/**
 * Core data model for the atlas.
 *
 * Facts are compiled from Wikipedia (CC BY-SA 4.0). Identity eras (logos,
 * uniforms, playing surfaces) are summarised in our own words and drawn as
 * original illustrations in team colours; we link to SportsLogos.net for the
 * actual artwork rather than copying it.
 */

export type LeagueId = 'NHL' | 'NBA' | 'MLB' | 'MLS' | 'CFL' | 'CPL' | 'NLL' | 'CEBL' | 'PWHL' | 'WNBA' | 'NSL';

export type Sport = 'hockey' | 'basketball' | 'baseball' | 'soccer' | 'football' | 'lacrosse';

export interface League {
  id: LeagueId;
  name: string;
  sport: Sport;
  /** Trophy the league champion receives. */
  trophy: string;
  /** Hex colour used for this league's markers and chips. */
  color: string;
  founded: number;
  wikipedia: string;
  /** League index on SportsLogos.net (linked, never scraped). */
  sportsLogos: string;
}

export type Province = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

export interface City {
  id: string;
  name: string;
  province: Province;
  lat: number;
  lon: number;
  /** Lower number = more important; drives label placement priority. */
  rank: number;
  blurb: string;
  wikipedia: string;
}

export type VenueKind =
  | 'arena' // indoor bowl: hockey / basketball
  | 'ballpark' // open-air or domed baseball park
  | 'football' // open-air rectangular stadium with track or sideline stands
  | 'soccer' // compact rectangular stadium
  | 'dome'; // large multipurpose domed / roofed stadium

export type RoofType = 'indoor' | 'open' | 'canopy' | 'retractable' | 'fixed-dome';

export type Surface = 'ice' | 'hardwood' | 'grass' | 'turf' | 'hybrid';

export interface Venue {
  id: string;
  name: string;
  formerNames?: string[];
  cityId: string;
  /** Year it opened; null when we could not confirm it. */
  opened: number | null;
  /** Year it stopped hosting major-league sport (closed, demolished or repurposed). */
  closed?: number;
  /** Capacity in the configuration most associated with its tenants; null when unknown. */
  capacity: number | null;
  kind: VenueKind;
  roof: RoofType;
  surface: Surface;
  facts: string[];
  wikipedia: string;
}

export type TeamStatus = 'current' | 'defunct' | 'relocated';

export interface TenureSpan {
  venueId: string;
  from: number;
  to?: number;
}

export interface NameSpan {
  name: string;
  from: number;
  to?: number;
}

export type JerseyPattern =
  | 'plain'
  | 'hem-stripes' // hockey-style sleeve + hem stripes
  | 'chest-stripe'
  | 'sash'
  | 'hoops'
  | 'pinstripes'
  | 'yoke'
  | 'shoulder-stripes'
  | 'side-panels'
  | 'vertical-stripes'
  | 'chevron';

export type BadgeShape = 'circle' | 'shield' | 'diamond' | 'hexagon' | 'leaf' | 'wordmark' | 'pennant' | 'oval';

export interface IdentityEra {
  from: number;
  to?: number;
  /** Team name in this era, when it differs from the current name. */
  name?: string;
  /** Palette, primary first. */
  colors: string[];
  colorNames: string[];
  /** What the primary logo looked like, in our own words. */
  logo: string;
  /** Shape used for our original badge illustration. */
  badge: BadgeShape;
  /** Short text drawn on the badge (2–4 chars). */
  mark: string;
  jersey: {
    pattern: JerseyPattern;
    note: string;
  };
  /** Playing-surface notes for this era (court, rink, field). */
  surface?: string;
}

export interface Team {
  id: string;
  name: string;
  league: LeagueId;
  cityId: string;
  status: TeamStatus;
  /** Years in this league and city. */
  from: number;
  to?: number;
  /** One-sentence what-happened for defunct / relocated teams. */
  fate?: string;
  abbr: string;
  formerNames?: NameSpan[];
  venues: TenureSpan[];
  championships: number[];
  /** Other notable titles or honours, in plain words. */
  honours?: string[];
  summary: string;
  milestones: {year: number; text: string}[];
  identity: IdentityEra[];
  wikipedia: string;
}
