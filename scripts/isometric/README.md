# Venue illustrations

These scripts make `public/isometric/<venue>.webp` and `src/data/isometric.ts`. For each venue, a headless browser frames a Google Earth 3D view of it, and a local clone of [isometric-cities](https://github.com/Statecraft-Labs/isometric-cities) repaints that view as pixel art. You need an Apple Silicon Mac with about 18 GB of free GPU memory; each venue takes about 2 minutes.

```bash
git clone https://github.com/Statecraft-Labs/isometric-cities ~/isometric-cities
cd ~/isometric-cities && ./setup.sh --models                  # about 9 GB of weights; FLUX Non-Commercial licence
npm i --no-save playwright && npx playwright install chromium   # in this repo
```

Work files go in `$ISOMETRIC_CITIES/outputs/csm` (default `~/isometric-cities/outputs/csm`). Use the clone's Python: `PY=~/isometric-cities/.venv/bin/python`. Run everything outside any sandbox: headless Chromium needs the GPU for Google Earth, and MLX has to compile Metal kernels.

1. **Find the venue.** Run `geocode.py <id>` to look up `queries.json` in Nominatim. Put the venue's centre in `seeds.json`, its OpenStreetMap element in `targets.json` (`{"osm": "w123"}`, or `{"nearest": "stadium"}` / `{"nearest": "building"}`), and its name in `names.json`.
2. **Frame it.** `$PY fetch_osm.py <id>` downloads the OpenStreetMap data within 700 m of the seed (from the OSM API, since Overpass is blocked on a corp Mac). `$PY prep.py <id>` then finds the venue's footprint and writes `venues/<id>/prep.json`: the centre, a zoom that makes the venue fill about 60% of the frame, and the NE or SE view that hides it least. (prep.py also writes a block-model recipe from an earlier pipeline; only `prep.json` is used now.)
3. **Capture.** `node earth-capture.cjs <id> …` opens Google Earth with its Clean basemap (no labels), points a narrow 10° camera at the venue from 55° tilt, hides the controls, waits for the tiles to settle and saves `venues/<id>/earth/raw.png` and `url.txt`. Per-venue zoom overrides are in `SCALE` at the top of the script. `node earth-attrib.cjs <id> …` records Google Earth's imagery attribution for each view in `credit.txt`.
4. **Paint.** Run `$PY captions.py`, then `render.sh <tag> <id> …`. The second command repaints each capture at 1024×640, one model at a time, into `results/<tag>/`.
5. **Review.** `$PY sheet.py <tag> out.png <id> …` puts each capture beside its painting.
6. **Export.** List any render that isn't the default (`results/e2/<id>.png`) in `final.json`, then run `$PY export.py`. It writes the WebPs and `src/data/isometric.ts`, including each view's Google Earth link and credit. `npm test` checks that every venue has an illustration or a reason in `NO_ISOMETRIC`, which comes from `GONE` in `export.py`.

Credits to keep: Google Earth imagery and its per-view data providers (shown in the lightbox), © OpenStreetMap contributors (ODbL), isometric-cities (MIT), FLUX.2 [klein] 9B (FLUX Non-Commercial) and Pixel Art Redmond (Apache 2.0).
