/**
 * Renders a still of every 3D venue model (one per venue and colour scheme) to
 * public/stills/<key>.webp, from the app's `?still=<key>` mode (src/three/StillRoot.tsx).
 * Phones show these until you tap "View in 3D"; desktops show them while the 3D chunk loads.
 * Re-run after changing a model, a team's colours or a team's venue (`npm test` fails when a
 * still is missing). Needs ImageMagick (`magick`) for the WebP conversion.
 *
 *   npm run dev                                         # in another terminal
 *   npm i --no-save playwright && npx playwright install chromium
 *   npm run stills                                      # or: npm run stills -- http://localhost:5173/ rogers-centre
 */
import {mkdirSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173/';
const only = process.argv[3] ?? '';
const SIZE = {width: 480, height: 260};

const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const context = await browser.newContext({viewport: SIZE, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce'});
const page = await context.newPage();
await page.goto(`${base}?still=list`);
await page.waitForFunction(() => Array.isArray(window.__STILLS__));
const keys = await page.evaluate(() => window.__STILLS__);
mkdirSync('public/stills', {recursive: true});
let count = 0;
for (const key of keys) {
  if (!key.startsWith(only)) continue;
  await page.goto('about:blank');
  await page.goto(`${base}?still=${encodeURIComponent(key)}`);
  await page.waitForSelector('.still-root canvas', {timeout: 30_000});
  await page.waitForTimeout(1500);
  const png = `public/stills/${key}.png`;
  await page.screenshot({path: png, omitBackground: true, clip: {x: 0, y: 0, ...SIZE}});
  execFileSync('magick', [png, '-strip', '-quality', '80', '-define', 'webp:alpha-quality=85', `public/stills/${key}.webp`]);
  rmSync(png);
  count++;
  console.log(key);
}
await browser.close();
console.log(`${count} stills rendered`);
