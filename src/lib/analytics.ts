/**
 * Google Analytics (GA4), loaded by index.html. Every call is a no-op when gtag isn't there:
 * local development, link-preview card renders (?og=) and blocked trackers.
 *
 * The app sends its own page views: one per city, team, league and map layer, under the same
 * paths as their share pages (e.g. /team/toronto-raptors/), so reports read like a normal site.
 */
type Gtag = (...args: unknown[]) => void;

const gtag = (): Gtag | undefined => (window as unknown as {gtag?: Gtag}).gtag;

/** Campaign parameters on the landing URL (e.g. utm_source=reddit), kept so GA can attribute the visit. */
function campaignQuery(): string {
  const params = new URLSearchParams(window.location.search);
  const kept = new URLSearchParams();
  params.forEach((value, key) => {
    if (key.startsWith('utm_') || key === 'gclid' || key === 'fbclid') kept.set(key, value);
  });
  const qs = kept.toString();
  return qs ? `?${qs}` : '';
}

let lastPath: string | null = null;

/** `path` is relative to the site root, with a trailing slash ('' for the home page). */
export function trackPageView(path: string, title: string) {
  if (path === lastPath) return;
  lastPath = path;
  gtag()?.('event', 'page_view', {
    page_location: `${window.location.origin}${import.meta.env.BASE_URL}${path}${campaignQuery()}`,
    page_title: title,
  });
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  gtag()?.('event', name, params);
}
