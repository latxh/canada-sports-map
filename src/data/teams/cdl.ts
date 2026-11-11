import type {Team} from '../types';

const wiki = (slug: string) => `https://en.wikipedia.org/wiki/${slug}`;

/**
 * Call of Duty League: franchised esports since 2020. Seasons run from late fall to
 * June and are named for the year they end in. Teams play at league-run events rather
 * than a regular home venue.
 */
export const CDL_TEAMS: Team[] = [
  {
    id: 'toronto-koi',
    name: 'Toronto KOI',
    league: 'CDL',
    cityId: 'toronto',
    status: 'current',
    from: 2020,
    abbr: 'TOR',
    formerNames: [{name: 'Toronto Ultra', from: 2020, to: 2025}],
    venues: [],
    championships: [],
    identity: [
      {
        from: 2020,
        to: 2025,
        name: 'Toronto Ultra',
        colors: ['#780df2', '#000000', '#ffffff'],
        badge: 'hexagon',
        mark: 'TU',
        jersey: {pattern: 'side-panels'},
      },
      {
        from: 2026,
        colors: ['#780df2', '#000000', '#ffffff'],
        badge: 'hexagon',
        mark: 'KOI',
        jersey: {pattern: 'side-panels'},
      },
    ],
    wikipedia: wiki('Toronto_KOI'),
  },
  {
    id: 'vancouver-surge',
    name: 'Vancouver Surge',
    league: 'CDL',
    cityId: 'vancouver',
    status: 'current',
    from: 2025,
    abbr: 'VAN',
    venues: [],
    championships: [],
    identity: [
      {
        from: 2025,
        colors: ['#081630', '#01f8cd', '#046177'],
        badge: 'shield',
        mark: 'VS',
        jersey: {pattern: 'side-panels'},
      },
    ],
    wikipedia: wiki('Vancouver_Surge'),
  },
];
