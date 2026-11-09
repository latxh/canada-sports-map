import {useCallback, useSyncExternalStore} from 'react';

export type Route =
  | {kind: 'home'}
  | {kind: 'city'; id: string}
  | {kind: 'team'; id: string; tab?: string};

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'city' && parts[1]) return {kind: 'city', id: decodeURIComponent(parts[1])};
  if (parts[0] === 'team' && parts[1]) return {kind: 'team', id: decodeURIComponent(parts[1]), tab: parts[2]};
  return {kind: 'home'};
}

export function routeToHash(route: Route): string {
  switch (route.kind) {
    case 'home':
      return '#/';
    case 'city':
      return `#/city/${encodeURIComponent(route.id)}`;
    case 'team':
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
      history.replaceState(null, '', next);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = next;
    }
  }, []);
  return [parseHash(hash), navigate];
}
