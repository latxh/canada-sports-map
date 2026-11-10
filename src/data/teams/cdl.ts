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
    honours: [
      'CDL Championship finalists in 2021 and 2023 (as the Ultra).',
      'Major wins: 2021 Major 2, 2023 Major 3 and 2024 Major 1.',
    ],
    summary:
      'One of the Call of Duty League’s five founding cities. Owned by OverActive Media, the Ultra reached two championship finals and won three Majors before taking the KOI name for the 2026 season.',
    milestones: [
      {year: 2019, text: 'Toronto is named one of the first five CDL cities.'},
      {year: 2021, text: 'Win Major 2; lose the championship final to Atlanta FaZe.'},
      {year: 2023, text: 'Win Major 3; lose the championship final to the New York Subliners.'},
      {year: 2024, text: 'Win Major 1.'},
      {year: 2026, text: 'Play the season as the Toronto KOI.'},
    ],
    identity: [
      {
        from: 2020,
        to: 2025,
        name: 'Toronto Ultra',
        colors: ['#780df2', '#000000', '#ffffff'],
        colorNames: ['Purple', 'Black', 'White'],
        logo: 'The Toronto Ultra emblem in purple, black and white.',
        badge: 'hexagon',
        mark: 'TU',
        jersey: {pattern: 'side-panels', note: 'Purple and black jerseys.'},
        surface: 'League events on a shared stage; no regular home venue.',
      },
      {
        from: 2026,
        colors: ['#780df2', '#000000', '#ffffff'],
        colorNames: ['Purple', 'Black', 'White'],
        logo: 'A tall purple banner with “TORONTO” across the top over stacked “KOI” letters.',
        badge: 'hexagon',
        mark: 'KOI',
        jersey: {pattern: 'side-panels', note: 'Purple and black jerseys.'},
        surface: 'League events on a shared stage; no regular home venue.',
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
    honours: ['2025 CDL Championship finalists, losing 5–3 to OpTic Texas.', 'Won 2022 Major 3 as the Seattle Surge.'],
    summary:
      'The Seattle Surge moved north for the 2025 season, owned by Enthusiast Gaming and Canucks Sports & Entertainment under the Luminosity Gaming banner. In their first Vancouver season they reached the championship final.',
    milestones: [
      {year: 2022, text: 'Win Major 3 as the Seattle Surge.'},
      {year: 2024, text: 'Move to Vancouver as the Vancouver Surge.'},
      {year: 2025, text: 'Reach the CDL Championship final, losing 5–3 to OpTic Texas.'},
    ],
    identity: [
      {
        from: 2025,
        colors: ['#081630', '#01f8cd', '#046177'],
        colorNames: ['Navy', 'Teal', 'Deep teal'],
        logo: 'A navy and teal trident above a “VANCOUVER SURGE” wordmark.',
        badge: 'shield',
        mark: 'VS',
        jersey: {pattern: 'side-panels', note: 'Navy jerseys with teal accents.'},
        surface: 'League events on a shared stage; no regular home venue.',
      },
    ],
    wikipedia: wiki('Vancouver_Surge'),
  },
];
