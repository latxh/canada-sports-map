import {defineConfig, runnerImport, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Share pages: one small page per team, city, league and map layer (team/<id>/, city/<id>/,
 * league/<id>/, view/<layer>/), each with its own link-preview tags, that sends visitors on to
 * the app. Generated from src/og/manifest.ts on every build.
 */
function sharePages(): Plugin {
  return {
    name: 'share-pages',
    apply: 'build',
    async generateBundle() {
      // Loaded through Vite's module runner: the manifest is app TypeScript.
      const {module} = await runnerImport<typeof import('./src/og/manifest')>('/src/og/manifest.ts', {configFile: false, logLevel: 'warn'});
      const {OG_ENTRIES, sharePageHtml} = module;
      for (const entry of OG_ENTRIES) {
        if (entry.path) this.emitFile({type: 'asset', fileName: `${entry.path}index.html`, source: sharePageHtml(entry)});
      }
    },
  };
}

// `base` lets the build run from a sub-path (e.g. GitHub Pages: /canada-sports-map/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), sharePages()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
