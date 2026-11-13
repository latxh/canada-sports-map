"""Copy the chosen renders into the app as WebP and write src/data/isometric.ts.
final.json overrides the default results/a2/<id>.png per venue."""
import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import json,pathlib,sys,re
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
osm={};earth={};where={}
for vid in seeds:
    prep=json.load(open(f'venues/{vid}/prep.json'));osm[vid]=prep.get('target');where[vid]=prep.get('target_centre') or prep['centre']
    e=pathlib.Path(f'venues/{vid}/earth')
    credit=(e/'credit.txt').read_text().strip() if (e/'credit.txt').exists() else 'Google'
    earth[vid]={'url':(e/'url.txt').read_text().strip(),'credit':re.sub(r'^Google\s+','Google, ',credit) if credit!='Google' else credit}
    src=pathlib.Path(final.get(vid,f'results/e2/{vid}.png'))
    if not src.exists(): print('MISSING',vid);continue
    im=Image.open(src).convert('RGB');im.save(out/f'{vid}.webp','WEBP',quality=88,method=6)
    (out/'thumbs').mkdir(exist_ok=True);im.resize((240,150),Image.LANCZOS).save(out/'thumbs'/f'{vid}.webp','WEBP',quality=82,method=6)
for a,b in ALIAS.items(): osm[a]=osm[b];earth[a]=earth[b];where[a]=where[b]
def entry(vid):
    f=ALIAS.get(vid,vid)
    e=earth[vid]
    la,lo=where[vid]
    return f"  '{vid}': {{file: '{f}.webp', lat: {la:.5f}, lon: {lo:.5f}, earth: '{e['url']}', credit: {json.dumps(e['credit'])}, year: YEAR}},"
lines=['/**',
' * Pixel-art illustrations of every venue that still stands, in public/isometric/. Each is a',
' * Google Earth 3D view of the venue, framed from OpenStreetMap, repainted on a Mac with',
' * isometric-cities (github.com/Statecraft-Labs/isometric-cities): FLUX.2 [klein] 9B with the Pixel',
' * Art Redmond style. scripts/isometric/ rebuilds them; data.test.ts checks every venue is covered.',
' */',
'const YEAR = 2026;','',
'export interface IsometricArt {',
'  /** In public/isometric/, with a 240×150 copy of the same name in public/isometric/thumbs/. */',
'  file: string;',
"  /** Where the venue is: the map shows its thumbnail here when zoomed in close. */",
'  lat: number;',
'  lon: number;',
'  /** The Google Earth view it was painted from, linked from the lightbox. */',
'  earth: string;',
"  /** Google Earth's imagery attribution for that view. */",
'  credit: string;',
'  year: number;',
'}','',
'export const ISOMETRIC_VENUES: Record<string, IsometricArt> = {',
*[entry(v) for v in sorted(list(seeds)+list(ALIAS))],
'};','',
'/** Venues without an illustration: OpenStreetMap only knows what stands today. */',
'export const NO_ISOMETRIC: Record<string, string> = {',
*[f"  '{k}': '{v}'," for k,v in sorted(GONE.items())],
'};','',
'export const isometricUrl = (art: IsometricArt) => `${import.meta.env.BASE_URL}isometric/${art.file}`;','',
'export const isometricThumbUrl = (art: IsometricArt) => `${import.meta.env.BASE_URL}isometric/thumbs/${art.file}`;','']
(APP/'src/data/isometric.ts').write_text('\n'.join(lines));print('wrote',len(osm))
