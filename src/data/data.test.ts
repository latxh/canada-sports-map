import {describe, expect, it} from 'vitest';
import {CITIES, CITY_BY_ID, LEAGUES, TEAMS, VENUES, VENUE_BY_ID} from './index';

const HEX = /^#[0-9a-f]{6}$/i;

describe('dataset integrity', () => {
  it('has unique ids', () => {
    for (const list of [TEAMS, VENUES, CITIES]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('references real cities, venues and leagues', () => {
    for (const team of TEAMS) {
      expect(CITY_BY_ID[team.cityId], `${team.id} city`).toBeDefined();
      expect(LEAGUES[team.league], `${team.id} league`).toBeDefined();
      for (const span of team.venues) expect(VENUE_BY_ID[span.venueId], `${team.id} → ${span.venueId}`).toBeDefined();
    }
    for (const venue of VENUES) expect(CITY_BY_ID[venue.cityId], `${venue.id} city`).toBeDefined();
  });

  it('every venue is used by at least one team', () => {
    const used = new Set(TEAMS.flatMap((t) => t.venues.map((v) => v.venueId)));
    expect(VENUES.filter((v) => !used.has(v.id)).map((v) => v.id)).toEqual([]);
  });

  it('every city has at least one team', () => {
    const used = new Set(TEAMS.map((t) => t.cityId));
    expect(CITIES.filter((c) => !used.has(c.id)).map((c) => c.id)).toEqual([]);
  });

  it('keeps status, years and fate consistent', () => {
    for (const team of TEAMS) {
      if (team.status === 'current') {
        expect(team.to, `${team.id} should be open-ended`).toBeUndefined();
        expect(team.fate).toBeUndefined();
      } else {
        expect(team.to, `${team.id} needs an end year`).toBeDefined();
        expect(team.fate, `${team.id} needs a fate`).toBeTruthy();
      }
      if (team.to) expect(team.to).toBeGreaterThanOrEqual(team.from);
    }
  });

  it('lists championships in ascending order with no duplicates', () => {
    for (const team of TEAMS) {
      const sorted = [...team.championships].sort((a, b) => a - b);
      expect(team.championships, team.id).toEqual(sorted);
      expect(new Set(team.championships).size).toBe(team.championships.length);
    }
  });

  it('matches well-known title counts', () => {
    const count = (id: string) => TEAMS.find((t) => t.id === id)!.championships.length;
    expect(count('montreal-canadiens')).toBe(24);
    expect(count('toronto-maple-leafs')).toBe(13);
    expect(count('edmonton-oilers')).toBe(5);
    expect(count('toronto-argonauts')).toBe(19);
    expect(count('edmonton-elks')).toBe(14);
    expect(count('winnipeg-blue-bombers')).toBe(12);
    expect(count('saskatchewan-roughriders')).toBe(5);
    expect(count('toronto-blue-jays')).toBe(2);
    expect(count('toronto-raptors')).toBe(1);
    expect(count('forge-fc')).toBe(4);
    expect(count('toronto-rock')).toBe(7);
    expect(count('calgary-roughnecks')).toBe(3);
    expect(count('edmonton-stingers')).toBe(2);
    expect(count('niagara-river-lions')).toBe(2);
    expect(count('montreal-victoire')).toBe(1);
    expect(count('vancouver-rise-fc')).toBe(1);
  });

  it('has ordered identity eras with valid palettes', () => {
    for (const team of TEAMS) {
      expect(team.identity.length, team.id).toBeGreaterThan(0);
      team.identity.forEach((era, i) => {
        expect(era.colors.length, `${team.id} era ${i}`).toBe(era.colorNames.length);
        for (const c of era.colors) expect(c, `${team.id} colour`).toMatch(HEX);
        if (i > 0) expect(era.from).toBeGreaterThanOrEqual(team.identity[i - 1].from);
      });
      expect(team.identity[team.identity.length - 1].to === undefined || team.status !== 'current', `${team.id} latest era should be open for active teams`).toBe(true);
    }
  });

  it('places every city inside Canada’s bounding box', () => {
    for (const c of CITIES) {
      expect(c.lat).toBeGreaterThan(41.6);
      expect(c.lat).toBeLessThan(83.2);
      expect(c.lon).toBeGreaterThan(-141.1);
      expect(c.lon).toBeLessThan(-52.6);
    }
  });
});

describe('logos', () => {
  it('points every logo at a real file and a known team or league', async () => {
    const fs = await import('node:fs');
    const {LOGOS} = await import('./logos');
    for (const [key, logo] of Object.entries(LOGOS)) {
      expect(fs.existsSync(`public/logos/${logo.file}`), logo.file).toBe(true);
      if (key.startsWith('league-')) expect(LEAGUES[key.slice(7) as keyof typeof LEAGUES], key).toBeDefined();
      else expect(TEAMS.some((t) => t.id === key), key).toBe(true);
      if (logo.eraIndex !== undefined) expect(TEAMS.find((t) => t.id === key)!.identity[logo.eraIndex], key).toBeDefined();
    }
  });
});

describe('media', () => {
  it('points every historical logo and photo at a real file and a known team or venue', async () => {
    const fs = await import('node:fs');
    const {HISTORICAL_LOGOS, TEAM_PHOTOS, VENUE_PHOTOS} = await import('./media');
    for (const [id, list] of Object.entries(HISTORICAL_LOGOS)) {
      expect(TEAMS.some((t) => t.id === id), id).toBe(true);
      for (const l of list) {
        expect(fs.existsSync(`public/media/${l.file}`), l.file).toBe(true);
        if (l.to !== undefined) expect(l.to).toBeGreaterThanOrEqual(l.from);
      }
    }
    for (const [id, list] of Object.entries(TEAM_PHOTOS)) {
      expect(TEAMS.some((t) => t.id === id), id).toBe(true);
      for (const p of list) expect(fs.existsSync(`public/media/${p.file}`), p.file).toBe(true);
    }
    for (const [id, p] of Object.entries(VENUE_PHOTOS)) {
      expect(VENUE_BY_ID[id], id).toBeDefined();
      expect(fs.existsSync(`public/media/${p.file}`), p.file).toBe(true);
    }
  });
});

describe('link-preview cards', () => {
  it('has a share page and a rendered card for every team, city, league and layer', async () => {
    const {OG_ENTRIES, sharePageHtml} = await import('../og/manifest');
    const {existsSync} = await import('node:fs');
    const paths = OG_ENTRIES.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(OG_ENTRIES.filter((e) => e.kind === 'team')).toHaveLength(TEAMS.length);
    const missing = OG_ENTRIES.filter((e) => !existsSync(`public/${e.image}`)).map((e) => e.image);
    // Run `npm run og` (see scripts/render-og.mjs) to render missing cards.
    expect(missing).toEqual([]);
    const html = sharePageHtml(OG_ENTRIES.find((e) => e.key === 'team:toronto-raptors')!);
    expect(html).toContain('<meta property="og:image" content="https://latxh.github.io/canada-sports-map/og/team-toronto-raptors.jpg" />');
    expect(html).toContain('"../../#/team/toronto-raptors"');
  });
});

describe('SportsLogos.net images', () => {
  it('points every image at a file and a SportsLogos.net page', async () => {
    const {SPORTSLOGOS} = await import('./sportslogos');
    const {existsSync} = await import('node:fs');
    for (const [teamId, team] of Object.entries(SPORTSLOGOS)) {
      expect(TEAMS.some((t) => t.id === teamId)).toBe(true);
      for (const img of [...team.logos, ...team.home, ...team.away, ...team.surfaces]) {
        expect(existsSync(`public/sportslogos/${img.file}`)).toBe(true);
        expect(img.page.startsWith('https://www.sportslogos.net/')).toBe(true);
      }
    }
  });
});
