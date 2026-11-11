/**
 * Renders every link-preview card to public/og/ (and the home card to public/og-image.jpg).
 *
 * The cards come from the app's `?og=<key>` mode (src/og/OgCard.tsx); the list comes from
 * src/og/manifest.ts. Re-run after changing a card's design or adding a team, city or league
 * (the tests fail when a card image is missing).
 *
 *   npm run dev                                   # in another terminal
 *   npm i --no-save playwright && npx playwright install chromium
 *   npm run og                                    # every card
 *   npm run og -- http://localhost:5173/ team:    # only cards whose key starts with "team:"
 */
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173/';
const only = process.argv[3] ?? '';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: {width: 1200, height: 630},
  deviceScaleFactor: 1,
  colorScheme: 'dark',
  // The dither layers hold still, so every render is the same.
  reducedMotion: 'reduce',
});
const page = await context.newPage();
await page.goto(`${base}?og=list`);
await page.waitForFunction(() => Array.isArray(window.__OG_ENTRIES__));
const entries = await page.evaluate(() => window.__OG_ENTRIES__);

mkdirSync('public/og', {recursive: true});
let count = 0;
for (const entry of entries) {
  if (!entry.key.startsWith(only)) continue;
  await page.goto('about:blank');
  await page.goto(`${base}?og=${encodeURIComponent(entry.key)}`);
  await page.waitForFunction(() => document.documentElement.dataset.ogReady === '1', null, {timeout: 30_000});
  await page.waitForTimeout(250);
  await page.screenshot({path: `public/${entry.image}`, type: 'jpeg', quality: 86});
  count++;
  console.log(entry.image);
}
await browser.close();
console.log(`${count} cards rendered`);
