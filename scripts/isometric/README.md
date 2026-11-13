# Isometric venue illustrations

These scripts make `public/isometric/<venue>.webp` and `src/data/isometric.ts`. They drive a local clone of [isometric-cities](https://github.com/Statecraft-Labs/isometric-cities) (Apple Silicon, about 18 GB of GPU memory per job, about 1.5 minutes per venue).

```bash
git clone https://github.com/Statecraft-Labs/isometric-cities ~/isometric-cities
cd ~/isometric-cities && ./setup.sh --models     # about 9 GB of weights; FLUX Non-Commercial licence
```

The scripts run in `$ISOMETRIC_CITIES/outputs/csm` (default `~/isometric-cities/outputs/csm`). Use the clone's Python: `PY=~/isometric-cities/.venv/bin/python`.

1. **Find the venue.** `geocode.py <id>` looks up `queries.json` in Nominatim. Put the venue's centre in `seeds.json` and its OpenStreetMap element (`{"osm": "w123"}`, or `{"nearest": "stadium"}` / `{"nearest": "building"}`) in `targets.json`, and its name in `names.json`.
2. **Fetch OpenStreetMap.** `$PY fetch_osm.py <id>` downloads 700 m around the seed from the OSM API (`map.json`; Overpass can't be reached from a corp Mac) and reshapes it like Overpass `out geom`.
3. **Frame it.** `$PY prep.py <id>` finds the venue's footprint, centres and zooms on it, picks the NE or SE view that hides it least, and leaves out the buildings that still stand in front of it. It writes `venues/<id>/recipe2.json`. `EXTRA_CUT` and `TAG_OVERRIDES` in `prep.py` hold the hand fixes (the Olympic Stadium's height and tower, BC Place's field).
4. **Render the block model.** `$PY $ISOMETRIC_CITIES/atlas.py make venues/<id>/recipe2.json --out venues/<id>/src2` (from the clone's root, with the paths under `outputs/csm/`).
   - For a venue that won't fit a 2 px/m frame, `frame_fit.py <id> [lat,lon,height …]` writes `recipe3.json` with an exact 1024×640 frame around the venue and any extra points; build that into `src3`.
   - `olympic_tower.py src3` draws the Montreal Tower, inclined over the stadium, into the Olympic Stadium's render (`src3/capture-edit`).
5. **Caption it.** `$PY captions.py` writes `captions/<id>.txt` from each venue's kind, roof and surface, plus `NOTES` and `BODY` for distinctive venues.
6. **Paint.** `render.sh <tag> <id> …` paints the centred 1024×640 crop of each source, one model at a time, into `results/<tag>/`. Set `SRC=src3/capture` (or `src3/capture-edit`) for venues framed in step 4's variants. If the worker log says `No Metal device available` or `Unable to build metal library`, run it outside any sandbox.
7. **Review.** `$PY sheet.py <tag> out.png <id> …` puts each source beside its painting. The model invents seats, windows and cars, and sometimes stands or whole buildings: check each one against photos and re-caption or re-frame the ones that drift.
8. **Export.** List the accepted render per venue in `final.json` (default `results/a2/<id>.png`), then `$PY export.py` writes the WebPs and `src/data/isometric.ts`. `npm test` checks every venue has an illustration or a reason in `NO_ISOMETRIC` (`export.py`'s `GONE`).

Credits to keep: © OpenStreetMap contributors (ODbL), Mapzen Terrain Tiles, isometric-cities (MIT), FLUX.2 [klein] 9B (FLUX Non-Commercial) and Pixel Art Redmond (Apache 2.0).
