import './globals.css';

import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';

// `?og=<key>` renders a link-preview card instead of the app (see src/og/).
const ogKey = new URLSearchParams(window.location.search).get('og');
const OgRoot = lazy(() => import('./og/OgCard').then((m) => ({default: m.OgRoot})));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {ogKey !== null ? (
      <Suspense fallback={null}>
        <OgRoot cardKey={ogKey} />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
