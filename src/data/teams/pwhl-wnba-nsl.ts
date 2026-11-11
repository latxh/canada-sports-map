import type {Team} from '../types';

const wiki = (slug: string) => `https://en.wikipedia.org/wiki/${slug}`;

/**
 * Professional Women's Hockey League. Seasons run from late fall to May; a
 * team's years are the calendar years it played in (the 2025–26 season ended
 * in 2026, so that Walter Cup is listed as 2026).
 */
export const PWHL_TEAMS: Team[] = [
  {
    id: 'montreal-victoire',
    name: 'Montréal Victoire',
    league: 'PWHL',
    cityId: 'montreal',
    status: 'current',
    from: 2024,
    abbr: 'MTL',
    formerNames: [{name: 'PWHL Montreal', from: 2024, to: 2024}],
    venues: [
      {venueId: 'verdun-auditorium', from: 2024, to: 2024},
      {venueId: 'place-bell', from: 2024},
    ],
    championships: [2026],
    identity: [
      {
        from: 2024,
        colors: ['#862633', '#e1d3c4', '#041e42'],
        badge: 'shield',
        mark: 'MTL',
        jersey: {pattern: 'hem-stripes'},
      },
    ],
    wikipedia: wiki('Montr%C3%A9al_Victoire'),
  },
  {
    id: 'toronto-sceptres',
    name: 'Toronto Sceptres',
    league: 'PWHL',
    cityId: 'toronto',
    status: 'current',
    from: 2024,
    abbr: 'TOR',
    formerNames: [{name: 'PWHL Toronto', from: 2024, to: 2024}],
    venues: [{venueId: 'coca-cola-coliseum', from: 2024}],
    championships: [],
    identity: [
      {
        from: 2024,
        colors: ['#0067b9', '#0c2340', '#ffb81c', '#ffd100'],
        badge: 'shield',
        mark: 'TOR',
        jersey: {pattern: 'hem-stripes'},
      },
    ],
    wikipedia: wiki('Toronto_Sceptres'),
  },
  {
    id: 'ottawa-charge',
    name: 'Ottawa Charge',
    league: 'PWHL',
    cityId: 'ottawa',
    status: 'current',
    from: 2024,
    abbr: 'OTT',
    formerNames: [{name: 'PWHL Ottawa', from: 2024, to: 2024}],
    venues: [
      {venueId: 'td-place-arena', from: 2024, to: 2026},
      {venueId: 'canadian-tire-centre', from: 2026},
    ],
    championships: [],
    identity: [
      {
        from: 2024,
        colors: ['#a6192e', '#ffb81c', '#ffffff', '#4b4f54'],
        badge: 'circle',
        mark: 'OTT',
        jersey: {pattern: 'hem-stripes'},
      },
    ],
    wikipedia: wiki('Ottawa_Charge'),
  },
  {
    id: 'vancouver-goldeneyes',
    name: 'Vancouver Goldeneyes',
    league: 'PWHL',
    cityId: 'vancouver',
    status: 'current',
    from: 2025,
    abbr: 'VAN',
    venues: [{venueId: 'pacific-coliseum', from: 2025}],
    championships: [],
    identity: [
      {
        from: 2025,
        colors: ['#10457f', '#eee9d8', '#a76741', '#e2b12e', '#72b0d5'],
        badge: 'circle',
        mark: 'VAN',
        jersey: {pattern: 'hem-stripes'},
      },
    ],
    wikipedia: wiki('Vancouver_Goldeneyes'),
  },
  {
    id: 'pwhl-hamilton',
    name: 'PWHL Hamilton',
    league: 'PWHL',
    cityId: 'hamilton',
    status: 'current',
    from: 2026,
    abbr: 'HAM',
    venues: [{venueId: 'td-coliseum', from: 2026}],
    championships: [],
    identity: [
      {
        from: 2026,
        colors: ['#f2a900', '#64111d', '#e2d2b8'],
        badge: 'circle',
        mark: 'HAM',
        jersey: {pattern: 'hem-stripes'},
      },
    ],
    wikipedia: wiki('PWHL_Hamilton'),
  },
];

/** Women's National Basketball Association. */
export const WNBA_TEAMS: Team[] = [
  {
    id: 'toronto-tempo',
    name: 'Toronto Tempo',
    league: 'WNBA',
    cityId: 'toronto',
    status: 'current',
    from: 2026,
    abbr: 'TOR',
    venues: [{venueId: 'coca-cola-coliseum', from: 2026}],
    championships: [],
    identity: [
      {
        from: 2026,
        colors: ['#441e36', '#b3c7e7', '#000000', '#ffffff'],
        badge: 'circle',
        mark: 'TMP',
        jersey: {pattern: 'side-panels'},
      },
    ],
    wikipedia: wiki('Toronto_Tempo'),
  },
];

/** Northern Super League, Canada's top-division women's soccer league since 2025. */
export const NSL_TEAMS: Team[] = [
  {
    id: 'vancouver-rise-fc',
    name: 'Vancouver Rise FC',
    league: 'NSL',
    cityId: 'vancouver',
    status: 'current',
    from: 2025,
    abbr: 'VAN',
    venues: [{venueId: 'swangard-stadium', from: 2025}],
    championships: [2025],
    identity: [
      {
        from: 2025,
        colors: ['#84ae99', '#000000', '#dbcb8e'],
        badge: 'shield',
        mark: 'VAN',
        jersey: {pattern: 'plain'},
      },
    ],
    wikipedia: wiki('Vancouver_Rise_FC'),
  },
  {
    id: 'afc-toronto',
    name: 'AFC Toronto',
    league: 'NSL',
    cityId: 'toronto',
    status: 'current',
    from: 2025,
    abbr: 'TOR',
    venues: [
      {venueId: 'york-lions-stadium', from: 2025},
      {venueId: 'bmo-field', from: 2025},
    ],
    championships: [],
    identity: [
      {
        from: 2025,
        colors: ['#631127', '#ed3425'],
        badge: 'circle',
        mark: 'AFC',
        jersey: {pattern: 'plain'},
      },
    ],
    wikipedia: wiki('AFC_Toronto'),
  },
  {
    id: 'montreal-roses-fc',
    name: 'Montreal Roses FC',
    league: 'NSL',
    cityId: 'montreal',
    status: 'current',
    from: 2025,
    abbr: 'MTL',
    venues: [{venueId: 'stade-boreale', from: 2025}],
    championships: [],
    identity: [
      {
        from: 2025,
        colors: ['#0c0516', '#647dff', '#d1ae6f'],
        badge: 'shield',
        mark: 'MTL',
        jersey: {pattern: 'plain'},
      },
    ],
    wikipedia: wiki('Montreal_Roses_FC'),
  },
  {
    id: 'ottawa-rapid-fc',
    name: 'Ottawa Rapid FC',
    league: 'NSL',
    cityId: 'ottawa',
    status: 'current',
    from: 2025,
    abbr: 'OTT',
    venues: [{venueId: 'td-place-stadium', from: 2025}],
    championships: [],
    identity: [
      {
        from: 2025,
        colors: ['#55cee6', '#152029'],
        badge: 'circle',
        mark: 'OTT',
        jersey: {pattern: 'plain'},
      },
    ],
    wikipedia: wiki('Ottawa_Rapid_FC'),
  },
  {
    id: 'calgary-wild-fc',
    name: 'Calgary Wild FC',
    league: 'NSL',
    cityId: 'calgary',
    status: 'current',
    from: 2025,
    abbr: 'CGY',
    venues: [{venueId: 'mcmahon-stadium', from: 2025}],
    championships: [],
    identity: [
      {
        from: 2025,
        colors: ['#ff0028', '#300047'],
        badge: 'shield',
        mark: 'CGY',
        jersey: {pattern: 'plain'},
      },
    ],
    wikipedia: wiki('Calgary_Wild_FC'),
  },
  {
    id: 'halifax-tides-fc',
    name: 'Halifax Tides FC',
    league: 'NSL',
    cityId: 'halifax',
    status: 'current',
    from: 2025,
    abbr: 'HFX',
    venues: [{venueId: 'wanderers-grounds', from: 2025}],
    championships: [],
    identity: [
      {
        from: 2025,
        colors: ['#4fc4ba', '#261f35', '#b7c9d2'],
        badge: 'shield',
        mark: 'HFX',
        jersey: {pattern: 'plain'},
      },
    ],
    wikipedia: wiki('Halifax_Tides_FC'),
  },
  {
    id: 'winnipeg-ember-fc',
    name: 'Winnipeg Ember FC',
    league: 'NSL',
    cityId: 'winnipeg',
    status: 'current',
    from: 2027,
    abbr: 'WPG',
    venues: [{venueId: 'ralph-cantafio-soccer-complex', from: 2027}],
    championships: [],
    identity: [
      {
        from: 2027,
        colors: ['#120428', '#f20cc8', '#f3e4a7'],
        badge: 'shield',
        mark: 'WEF',
        jersey: {pattern: 'plain'},
      },
    ],
    wikipedia: wiki('Winnipeg_Ember_FC'),
  },
];
