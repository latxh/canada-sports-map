#!/usr/bin/env python3
"""
Turns the downloads of scripts/fetch-media-*.py into the app's media:
public/media/{logos,photos}/* and src/data/media.ts.

  python3 scripts/build-media.py <download dir>   # holds media.json, logos2.json, logos/, photos/
"""
import json, os, re, shutil, sys, subprocess

src = sys.argv[1] if len(sys.argv) > 1 else '.media-src'
media = json.load(open(os.path.join(src, 'media.json')))
logos2 = json.load(open(os.path.join(src, 'logos2.json'))) if os.path.exists(os.path.join(src, 'logos2.json')) else {}
out_dir = os.path.join('public', 'media')
shutil.rmtree(out_dir, ignore_errors=True)
os.makedirs(os.path.join(out_dir, 'logos'))
os.makedirs(os.path.join(out_dir, 'photos'))

def copy(rel):
    dst = os.path.join(out_dir, rel)
    if rel.endswith('.jpg'):
        # Re-encode photos small: 640px wide is plenty for a 256px-wide card on a 2x screen.
        subprocess.run(['magick', os.path.join(src, rel), '-strip', '-resize', '640x640>', '-quality', '76', dst], check=True)
    else:
        shutil.copyfile(os.path.join(src, rel), dst)
    return rel

def caption(p):
    desc = re.sub(r'\s+', ' ', p.get('desc') or '').strip()
    if not desc or len(desc) < 8:
        desc = re.sub(r'\.(jpe?g|png)$', '', p['title'].removeprefix('File:'), flags=re.I)
        desc = re.sub(r'\s*\(\d{6,}\)', '', desc)
    return desc[:140]

def clean_artist(a):
    a = re.sub(r'\s+', ' ', a or '').strip()
    a = re.sub(r'^(Photo by|By)\s+', '', a, flags=re.I)
    return a[:60]

logos = {}
for team_id in sorted(set(media['teams']) | set(logos2)):
    found = {}
    for l in (media['teams'].get(team_id, {}).get('logos', []) + logos2.get(team_id, [])):
        if l.get('to') is None:
            continue  # the current logo is shown from public/logos
        if l['from'] in found:
            continue
        found[l['from']] = {'file': copy(l['file']), 'from': l['from'], 'to': l['to'], 'page': l['page'], 'license': l.get('license', '')}
    if found:
        logos[team_id] = [found[k] for k in sorted(found)]

photos = {}
for team_id, rec in sorted(media['teams'].items()):
    items = []
    for p in rec.get('photos', [])[:5]:
        items.append({'file': copy(p['file']), 'page': p['page'], 'license': p.get('license', ''), 'artist': clean_artist(p.get('artist')), 'caption': caption(p)})
    if items:
        photos[team_id] = items

venues = {}
for venue_id, p in sorted(media.get('venues', {}).items()):
    venues[venue_id] = {'file': copy(p['file']), 'page': p['page'], 'license': p.get('license', ''), 'artist': clean_artist(p.get('artist')), 'caption': caption(p)}

def ts(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2)

header = open('src/data/media.ts').read().split('export const HISTORICAL_LOGOS')[0]
with open('src/data/media.ts', 'w') as f:
    f.write(header)
    f.write(f'export const HISTORICAL_LOGOS: Record<string, MediaLogo[]> = {ts(logos)};\n\n')
    f.write(f'export const TEAM_PHOTOS: Record<string, MediaPhoto[]> = {ts(photos)};\n\n')
    f.write(f'export const VENUE_PHOTOS: Record<string, MediaPhoto> = {ts(venues)};\n')
print(f'{sum(len(v) for v in logos.values())} historical logos for {len(logos)} teams; '
      f'{sum(len(v) for v in photos.values())} team photos; {len(venues)} venue photos')
