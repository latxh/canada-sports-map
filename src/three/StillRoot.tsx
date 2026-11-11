/**
 * `?still=<key>`: one 3D venue model, still, on a transparent background, for
 * scripts/render-stills.mjs to screenshot. `?still=list` lists every key.
 */
import {Suspense, lazy, useEffect} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {STILL_SIZE, allStillEntries, stillKey} from './stills';

const StadiumViewer = lazy(() => import('./StadiumViewer'));

export function StillRoot({stillKey: key}: {stillKey: string}) {
  const entries = allStillEntries();
  const entry = entries.find((e) => stillKey(e) === key);
  useEffect(() => {
    (window as unknown as {__STILLS__: string[]}).__STILLS__ = entries.map(stillKey);
  }, [entries]);
  if (!entry) return <pre>{entries.map(stillKey).join('\n')}</pre>;
  return (
    <Theme theme={neutralTheme} mode="light">
      <section className="still-root" style={{width: STILL_SIZE.width}}>
        <Suspense fallback={null}>
          <StadiumViewer venue={entry.venue} sport={entry.sport} seatColor={entry.seatColor} accentColor={entry.accentColor} height={STILL_SIZE.height} hasControls={false} />
        </Suspense>
      </section>
    </Theme>
  );
}
