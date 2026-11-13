"""Copy the chosen renders into the app as WebP and write src/data/isometric.ts.
final.json overrides the default results/a2/<id>.png per venue."""
import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import json,pathlib,sys
from PIL import Image
APP=HERE.parents[1]
seeds=json.load(open(HERE/'seeds.json'));targets=json.load(open(HERE/'targets.json'))
final=json.load(open(HERE/'final.json')) if (HERE/'final.json').exists() else {}
out=APP/'public/isometric';out.mkdir(parents=True,exist_ok=True)
GONE={
 'mutual-street-arena':'Demolished in 1989','exhibition-stadium':'Demolished in 1999','westmount-arena':'Destroyed by fire in 1918',
 'ottawa-auditorium':'Demolished in 1967','deys-arena':'Demolished','quebec-arena':'Destroyed by fire in 1942',
 'ivor-wynne-stadium':'Demolished in 2012; Hamilton Stadium stands on its site','barton-street-arena':'Demolished',
 'winnipeg-arena':'Demolished in 2006','winnipeg-stadium':'Demolished in 2013','taylor-field':'Demolished in 2017',
 'stampede-corral':'Demolished','empire-stadium':'Demolished in 1993',
}
ALIAS={'td-place-arena':'td-place-stadium'}  # the arena sits under TD Place Stadium's south stands
osm={}
for vid in seeds:
    osm[vid]=json.load(open(f'venues/{vid}/prep.json')).get('target')
    src=pathlib.Path(final.get(vid,f'results/a2/{vid}.png'))
    if not src.exists(): print('MISSING',vid);continue
    Image.open(src).convert('RGB').save(out/f'{vid}.webp','WEBP',quality=88,method=6)
for a,b in ALIAS.items(): osm[a]=osm[b]
def entry(vid):
    f=ALIAS.get(vid,vid)
    q=f", osm: '{osm[vid]}'" if osm.get(vid) else ''
    return f"  '{vid}': {{file: '{f}.webp'{q}}},"
lines=['/**',
' * Isometric pixel-art illustrations of every venue that still stands, in public/isometric/.',
' * Painted on a Mac with isometric-cities (github.com/Statecraft-Labs/isometric-cities): a block',
' * model of OpenStreetMap buildings around the venue, repainted by FLUX.2 [klein] 9B with the Pixel',
' * Art Redmond style. scripts/isometric/ rebuilds them; data.test.ts checks every venue is covered.',
' */',
'export interface IsometricArt {',
'  file: string;',
"  /** The venue's OpenStreetMap element, e.g. 'way/123', linked from the lightbox. */",
'  osm?: string;',
'}','',
'export const ISOMETRIC_VENUES: Record<string, IsometricArt> = {',
*[entry(v) for v in sorted(list(seeds)+list(ALIAS))],
'};','',
'/** Venues without an illustration: OpenStreetMap only knows what stands today. */',
'export const NO_ISOMETRIC: Record<string, string> = {',
*[f"  '{k}': '{v}'," for k,v in sorted(GONE.items())],
'};','',
'export const isometricUrl = (art: IsometricArt) => `${import.meta.env.BASE_URL}isometric/${art.file}`;','',
"export const osmUrl = (art: IsometricArt) => (art.osm ? `https://www.openstreetmap.org/${art.osm}` : 'https://www.openstreetmap.org/copyright');",'']
(APP/'src/data/isometric.ts').write_text('\n'.join(lines));print('wrote',len(osm))
