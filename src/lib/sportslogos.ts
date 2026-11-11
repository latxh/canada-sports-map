import type {SlnTeam} from '../data/sportslogos';

/**
 * SportsLogos.net images are only needed on team pages, so their list is its own chunk:
 * prefetched once the map is up (see App) and loaded on demand otherwise.
 */
let sportsLogosPromise: Promise<Record<string, SlnTeam>> | null = null;
export function loadSportsLogos() {
  sportsLogosPromise ??= import('../data/sportslogos').then((m) => m.SPORTSLOGOS);
  return sportsLogosPromise;
}
