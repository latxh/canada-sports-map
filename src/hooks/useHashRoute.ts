import {useCallback, useSyncExternalStore} from 'react';

export type Route =
  | {kind: 'home'}
  | {kind: 'city'; id: string}
  | {kind: 'team'; id: string; tab?: string; from?: string};

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'city' && parts[1]) return {kind: 'city', id: decodeURIComponent(parts[1])};
  if (parts[0] === 'team' && parts[1]) {
    // #/team/<id>/from/<city>: opened from that city's panel.
    if (parts[2] === 'from' && parts[3]) return {kind: 'team', id: decodeURIComponent(parts[1]), from: decodeURIComponent(parts[3])};
    return {kind: 'team', id: decodeURIComponent(parts[1]), tab: parts[2]};
  }
  return {kind: 'home'};
}

export function routeToHash(route: Route): string {
  switch (route.kind) {
    case 'home':
      return '#/';
    case 'city':
      return `#/city/${encodeURIComponent(route.id)}`;
    case 'team':
      if (route.from) return `#/team/${encodeURIComponent(route.id)}/from/${encodeURIComponent(route.from)}`;
      return `#/team/${encodeURIComponent(route.id)}${route.tab ? `/${route.tab}` : ''}`;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function useHashRoute(): [Route, (route: Route, options?: {replace?: boolean}) => void] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  const navigate = useCallback((route: Route, options?: {replace?: boolean}) => {
    const next = routeToHash(route);
    if (next === window.location.hash) return;
    if (options?.replace) {
      try {
        history.replaceState(null, '', next);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch {
        window.location.hash = next;
      }
    } else {
      window.location.hash = next;
    }
  }, []);
  return [parseHash(hash), navigate];
}
