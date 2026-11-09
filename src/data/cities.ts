import type {City} from './types';

const wiki = (slug: string) => `https://en.wikipedia.org/wiki/${slug}`;

export const CITIES: City[] = [
  {
    id: 'toronto',
    name: 'Toronto',
    province: 'ON',
    lat: 43.6532,
    lon: -79.3832,
    rank: 1,
    blurb:
      'Canada’s largest city and its busiest sports market: the only Canadian city with a team in the NHL, NBA, MLB, MLS and CFL at the same time, plus a CPL club.',
    wikipedia: wiki('Toronto'),
  },
  {
    id: 'montreal',
    name: 'Montréal',
    province: 'QC',
    lat: 45.5019,
    lon: -73.5674,
    rank: 1,
    blurb:
      'Birthplace of organized indoor hockey and home of the most decorated franchise in NHL history. Hosted the 1976 Summer Olympics and 35 seasons of Expos baseball.',
    wikipedia: wiki('Montreal'),
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    province: 'BC',
    lat: 49.2827,
    lon: -123.1207,
    rank: 1,
    blurb:
      'West-coast hub with NHL, MLS and CFL teams, two downtown venues side by side on False Creek, and a brief NBA chapter with the Grizzlies.',
    wikipedia: wiki('Vancouver'),
  },
  {
    id: 'calgary',
    name: 'Calgary',
    province: 'AB',
    lat: 51.0447,
    lon: -114.0719,
    rank: 2,
    blurb:
      'Home of the Flames, the Stampeders and Cavalry FC. The Saddledome’s hyperbolic-paraboloid roof is one of the most recognisable arena silhouettes in sport.',
    wikipedia: wiki('Calgary'),
  },
  {
    id: 'edmonton',
    name: 'Edmonton',
    province: 'AB',
    lat: 53.5461,
    lon: -113.4938,
    rank: 2,
    blurb:
      '“City of Champions”: five Stanley Cups for the Oilers between 1984 and 1990 and 14 Grey Cups for the Elks. Commonwealth Stadium is the largest open-air stadium in Canada.',
    wikipedia: wiki('Edmonton'),
  },
  {
    id: 'ottawa',
    name: 'Ottawa',
    province: 'ON',
    lat: 45.4215,
    lon: -75.6972,
    rank: 2,
    blurb:
      'The capital has two NHL eras of Senators, a long CFL history from the Rough Riders to the Redblacks, and Atlético Ottawa at TD Place in Lansdowne Park.',
    wikipedia: wiki('Ottawa'),
  },
  {
    id: 'winnipeg',
    name: 'Winnipeg',
    province: 'MB',
    lat: 49.8951,
    lon: -97.1384,
    rank: 2,
    blurb:
      'The Jets left for Phoenix in 1996 and came back in 2011. The Blue Bombers have played in Winnipeg since 1930.',
    wikipedia: wiki('Winnipeg'),
  },
  {
    id: 'quebec-city',
    name: 'Québec City',
    province: 'QC',
    lat: 46.8139,
    lon: -71.208,
    rank: 3,
    blurb:
      'Former NHL city. The Bulldogs played one NHL season (1919–20) and the Nordiques spent 16 NHL seasons here before moving to Denver in 1995. The Videotron Centre opened in 2015 without a tenant.',
    wikipedia: wiki('Quebec_City'),
  },
  {
    id: 'hamilton',
    name: 'Hamilton',
    province: 'ON',
    lat: 43.2557,
    lon: -79.8711,
    rank: 3,
    blurb:
      'Steel-town football: the Tiger-Cats and Forge FC share Hamilton Stadium. Hamilton also had a short NHL run with the Tigers in the 1920s.',
    wikipedia: wiki('Hamilton,_Ontario'),
  },
  {
    id: 'regina',
    name: 'Regina',
    province: 'SK',
    lat: 50.4452,
    lon: -104.6189,
    rank: 3,
    blurb:
      'Home of the Saskatchewan Roughriders, the community-owned club with one of the most devoted fan bases in sport. Winners of the 112th Grey Cup in 2025.',
    wikipedia: wiki('Regina,_Saskatchewan'),
  },
  {
    id: 'halifax',
    name: 'Halifax',
    province: 'NS',
    lat: 44.6488,
    lon: -63.5752,
    rank: 3,
    blurb:
      'Atlantic Canada’s only top-flight pro club, HFX Wanderers, plays at a modular stadium on the downtown Wanderers Grounds.',
    wikipedia: wiki('Halifax,_Nova_Scotia'),
  },
  {
    id: 'langford',
    name: 'Langford',
    province: 'BC',
    lat: 48.4474,
    lon: -123.4956,
    rank: 4,
    blurb: 'Greater Victoria community on Vancouver Island, home of Pacific FC, the 2021 CPL champions.',
    wikipedia: wiki('Langford,_British_Columbia'),
  },
  {
    id: 'langley',
    name: 'Langley',
    province: 'BC',
    lat: 49.1044,
    lon: -122.66,
    rank: 4,
    blurb: 'Fraser Valley township where Vancouver FC has played at Willoughby Stadium since 2023.',
    wikipedia: wiki('Langley,_British_Columbia_(district_municipality)'),
  },
  {
    id: 'laval',
    name: 'Laval',
    province: 'QC',
    lat: 45.6066,
    lon: -73.7124,
    rank: 4,
    blurb: 'Island city north of Montréal. FC Supra du Québec started play here at Stade Boréale in 2026.',
    wikipedia: wiki('Laval,_Quebec'),
  },
];

export const CITY_BY_ID: Record<string, City> = Object.fromEntries(CITIES.map((c) => [c.id, c]));

export const PROVINCE_NAMES: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Québec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};
