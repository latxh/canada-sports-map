import {useSyncExternalStore} from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const DESKTOP_QUERY = '(min-width: 900px)';

/** Touch screens (phones, tablets): people pinch to zoom there, so the map's zoom buttons hide. */
export const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';
