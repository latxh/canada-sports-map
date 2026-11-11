import './globals.css';

import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';

// `?og=<key>` renders a link-preview card instead of the app (see src/og/), and `?still=<key>`
// one 3D venue model for its pre-rendered still (see src/three/stills.ts).
const params = new URLSearchParams(window.location.search);
const ogKey = params.get('og');
const stillKeyParam = params.get('still');
const OgRoot = lazy(() => import('./og/OgCard').then((m) => ({default: m.OgRoot})));
const StillRoot = lazy(() => import('./three/StillRoot').then((m) => ({default: m.StillRoot})));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {ogKey !== null ? (
      <Suspense fallback={null}>
        <OgRoot cardKey={ogKey} />
      </Suspense>
    ) : stillKeyParam !== null ? (
      <Suspense fallback={null}>
        <StillRoot stillKey={stillKeyParam} />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
