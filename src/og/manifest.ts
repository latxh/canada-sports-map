/**
 * Every shareable view of the atlas, with its link-preview text and image.
 *
 * Link previews (X, Reddit, iMessage, Discord, Slack) read static <meta> tags and ignore
 * everything after `?` or `#`, so each view gets its own small page at a real path
 * (`team/<id>/`, `city/<id>/`, `league/<id>/`, `view/<layer>/`). The page carries that view's
 * tags and sends visitors on to the app. Those pages are generated at build time from this
 * list (see vite.config.ts); the preview images live in public/og/ and are rendered from the
 * app's `?og=<key>` card mode by scripts/render-og.mjs.
 *
 * Plain data only (no React, no import.meta): vite.config.ts imports it too.
 */
import {CITIES, LEAGUES, LEAGUE_ORDER, PROVINCE_NAMES, TEAMS, CITY_BY_ID, yearsLabel, type LeagueId, type Team} from '../data';

export const SITE_URL = 'https://latxh.github.io/canada-sports-map/';
export const SITE_NAME = 'Canadian Sports Atlas';

export type OgKind = 'home' | 'view' | 'league' | 'city' | 'team';
export type OgView = 'population' | 'championships' | 'closest';

export interface OgEntry {
  /** `?og=` value that renders this card, e.g. `team:toronto-raptors`. */
  key: string;
  kind: OgKind;
  id: string;
  /** Share page path under the site root, with a trailing slash ('' for the home page). */
  path: string;
  /** Where the share page sends visitors, relative to the site root. */
  target: string;
  title: string;
  description: string;
  /** Preview image path under the site root. */
  image: string;
  imageAlt: string;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function titlesLabel(team: Team): string {
  const n = team.championships.length;
  return `${n} ${LEAGUES[team.league].trophy} ${n === 1 ? 'title' : 'titles'}`;
}

const titleCount = (teams: Team[]) => teams.reduce((n, t) => n + t.championships.length, 0);

export const OG_VIEWS: {id: OgView; label: string; target: string; description: string}[] = [
  {
    id: 'closest',
    label: 'Closest team',
    target: '?closest=1',
    description: 'Every spot in Canada coloured by its closest pro sports team. Find yours on the Canadian Sports Atlas.',
  },
  {
    id: 'population',
    label: 'Population',
    target: '?view=population',
    description: "Canada's 152 metro areas by population, beside every pro sports city. On the Canadian Sports Atlas.",
  },
  {
    id: 'championships',
    label: 'Championships',
    target: '?view=titles',
    description: `All ${titleCount(TEAMS)} championships won by Canadian pro teams, mapped by city. On the Canadian Sports Atlas.`,
  },
];

function teamEntry(team: Team): OgEntry {
  const city = CITY_BY_ID[team.cityId];
  const years = yearsLabel(team.from, team.to);
  const titles = team.championships.length > 0 ? ` ${titlesLabel(team)}.` : '';
  const what = team.status === 'current' ? `${team.league} team in ${city.name}, ${years}.` : `former ${team.league} team in ${city.name} (${years}).`;
  return {
    key: `team:${team.id}`,
    kind: 'team',
    id: team.id,
    path: `team/${team.id}/`,
    target: `#/team/${team.id}`,
    title: `${team.name} · ${SITE_NAME}`,
    description: `${team.name}: ${what}${titles} Logos, uniforms, venues and trophies on the Canadian Sports Atlas.`,
    image: `og/team-${team.id}.jpg`,
    imageAlt: `${team.name} logo beside a map of Canada highlighting ${city.name}`,
  };
}

function cityEntry(cityId: string): OgEntry {
  const city = CITY_BY_ID[cityId];
  const teams = TEAMS.filter((t) => t.cityId === cityId);
  const active = teams.filter((t) => t.status === 'current').length;
  const former = teams.length - active;
  const titles = titleCount(teams);
  const parts = [active > 0 ? plural(active, 'pro team') + ' today' : 'no pro teams today', former > 0 ? `${former} former` : '', titles > 0 ? plural(titles, 'championship') : ''].filter(Boolean);
  return {
    key: `city:${cityId}`,
    kind: 'city',
    id: cityId,
    path: `city/${cityId}/`,
    target: `#/city/${cityId}`,
    title: `${city.name} · ${SITE_NAME}`,
    description: `${city.name}, ${PROVINCE_NAMES[city.province]}: ${parts.join(', ')}. Teams, trophies and venues on the Canadian Sports Atlas.`,
    image: `og/city-${cityId}.jpg`,
    imageAlt: `${city.name}'s team logos beside a map of Canada highlighting the city`,
  };
}

function leagueEntry(league: LeagueId): OgEntry {
  const teams = TEAMS.filter((t) => t.league === league);
  const active = teams.filter((t) => t.status === 'current').length;
  const former = teams.length - active;
  const titles = titleCount(teams);
  const counts = `${active} today${former > 0 ? ` and ${former} former` : ''}`;
  const won = titles > 0 ? `, with ${plural(titles, 'championship')}` : '';
  return {
    key: `league:${league.toLowerCase()}`,
    kind: 'league',
    id: league,
    path: `league/${league.toLowerCase()}/`,
    target: `?league=${league}`,
    title: `${league} in Canada · ${SITE_NAME}`,
    description: `Every ${LEAGUES[league].name} team that has played in Canada: ${counts}${won}. On the Canadian Sports Atlas.`,
    image: `og/league-${league.toLowerCase()}.jpg`,
    imageAlt: `${league} logo and its Canadian teams beside a map of Canada coloured by closest ${league} team`,
  };
}

export const OG_HOME: OgEntry = {
  key: 'home',
  kind: 'home',
  id: 'home',
  path: '',
  target: '',
  title: SITE_NAME,
  description: `Every pro team in Canada, past and present, on one living map: ${LEAGUE_ORDER.length} leagues, ${TEAMS.length} teams, ${new Set(TEAMS.map((t) => t.cityId)).size} cities, 3D stadiums, trophies and logo history.`,
  image: 'og-image.jpg',
  imageAlt: "Map of Canada coloured by each area's closest NHL team, with the title Canadian Sports Atlas",
};

export const OG_ENTRIES: OgEntry[] = [
  OG_HOME,
  ...OG_VIEWS.map(
    (v): OgEntry => ({
      key: `view:${v.id}`,
      kind: 'view',
      id: v.id,
      path: `view/${v.id}/`,
      target: v.target,
      title: `${v.label} · ${SITE_NAME}`,
      description: v.description,
      image: `og/view-${v.id}.jpg`,
      imageAlt: `Map of Canada showing the ${v.label.toLowerCase()} layer of the Canadian Sports Atlas`,
    }),
  ),
  ...LEAGUE_ORDER.map(leagueEntry),
  ...CITIES.filter((c) => TEAMS.some((t) => t.cityId === c.id)).map((c) => cityEntry(c.id)),
  ...TEAMS.map(teamEntry),
];

export const OG_BY_KEY: Record<string, OgEntry> = Object.fromEntries(OG_ENTRIES.map((e) => [e.key, e]));

export interface ShareState {
  teamId?: string;
  cityId?: string;
  league: LeagueId | 'all';
  view: 'teams' | 'population' | 'titles';
  showClosest: boolean;
}

/** The share page for what the app is showing, so the right preview travels with a link. */
export function shareEntryFor(state: ShareState): OgEntry {
  const key = state.teamId
    ? `team:${state.teamId}`
    : state.cityId
      ? `city:${state.cityId}`
      : state.view === 'population'
        ? 'view:population'
        : state.view === 'titles'
          ? 'view:championships'
          : state.showClosest
            ? 'view:closest'
            : state.league !== 'all'
              ? `league:${state.league.toLowerCase()}`
              : 'home';
  return OG_BY_KEY[key] ?? OG_HOME;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * A share page: the view's preview tags, then straight on to the app. Any query string on
 * the share link (e.g. utm_source) is passed through.
 */
export function sharePageHtml(entry: OgEntry): string {
  const url = SITE_URL + entry.path;
  const image = SITE_URL + entry.image;
  const depth = entry.path.split('/').filter(Boolean).length;
  const root = '../'.repeat(depth) || './';
  const target = root + entry.target;
  const meta = (attr: 'property' | 'name', key: string, value: string) => `    <meta ${attr}="${key}" content="${esc(value)}" />`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(entry.title)}</title>
    <meta name="description" content="${esc(entry.description)}" />
    <meta name="theme-color" content="#e61017" />
    <link rel="icon" type="image/svg+xml" href="${root}favicon.svg" />
    <link rel="apple-touch-icon" href="${root}apple-touch-icon.png" />
    <link rel="canonical" href="${url}" />
${[
  meta('property', 'og:type', 'website'),
  meta('property', 'og:site_name', SITE_NAME),
  meta('property', 'og:locale', 'en_CA'),
  meta('property', 'og:url', url),
  meta('property', 'og:title', entry.title),
  meta('property', 'og:description', entry.description),
  meta('property', 'og:image', image),
  meta('property', 'og:image:type', 'image/jpeg'),
  meta('property', 'og:image:width', '1200'),
  meta('property', 'og:image:height', '630'),
  meta('property', 'og:image:alt', entry.imageAlt),
  meta('name', 'twitter:card', 'summary_large_image'),
  meta('name', 'twitter:title', entry.title),
  meta('name', 'twitter:description', entry.description),
  meta('name', 'twitter:image', image),
  meta('name', 'twitter:image:alt', entry.imageAlt),
].join('\n')}
    <script>
      (function () {
        var next = new URL(${JSON.stringify(target)}, location.href);
        new URLSearchParams(location.search).forEach(function (v, k) { next.searchParams.set(k, v); });
        location.replace(next.href);
      })();
    </script>
  </head>
  <body>
    <p><a href="${esc(target)}">Open ${esc(entry.title.replace(` · ${SITE_NAME}`, ''))} on the ${SITE_NAME}</a></p>
  </body>
</html>
`;
}
