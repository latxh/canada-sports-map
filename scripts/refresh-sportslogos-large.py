#!/usr/bin/env python3
"""
Rebuild the lightbox copies (public/sportslogos/**/*-lg.webp) of every SportsLogos.net image in
src/data/sportslogos.ts from the untouched original: no background removal, no trimming, just
resized. The card copies (*.webp) keep their cleared, trimmed backgrounds.

Fetches each image's page on SportsLogos.net and then its full-size image, with their
permission. Polite like fetch-sportslogos.py: one request at a time, at least 1.2 s apart,
an identifying User-Agent, and an on-disk cache ($SLN_DIR, default ~/.cache/csm-sln) so a
re-run fetches only what is missing. Converts with ImageMagick (`magick`) when it's installed,
otherwise with Pillow (run it with a Python that has Pillow).

  python3 scripts/refresh-sportslogos-large.py
"""
import hashlib
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get('SLN_DIR', os.path.expanduser('~/.cache/csm-sln'))
OUT = os.path.join(ROOT, 'public', 'sportslogos')
UA = 'CanadianSportsAtlas/1.0 (fan project, with permission from SportsLogos.net; https://github.com/latxh/canada-sports-map)'
GAP = 1.2
LARGE = 1200
_last = [0.0]


def fetch(url, binary=False):
    """GET with an on-disk cache and a polite gap between live requests."""
    path = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest())
    if os.path.exists(path):
        data = open(path, 'rb').read()
        return data if binary else data.decode('utf-8', 'replace')
    for attempt in range(4):
        wait = GAP - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            # Page URLs can hold accents (Montréal): send them percent-encoded.
            req = urllib.request.Request(urllib.parse.quote(url, safe=':/?&=%#~'), headers={'User-Agent': UA, 'Referer': 'https://www.sportslogos.net/'})
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
            break
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(max(int(e.headers.get('Retry-After') or 0), 10 * (attempt + 1)))
                continue
            raise
    else:
        raise RuntimeError(f'gave up on {url}')
    os.makedirs(CACHE, exist_ok=True)
    open(path, 'wb').write(data)
    return data if binary else data.decode('utf-8', 'replace')


def convert(original, dest):
    """The original's first frame, shrunk to fit LARGE (never enlarged), as WebP."""
    if shutil.which('magick'):
        subprocess.run(['magick', original + '[0]', '-resize', f'{LARGE}x{LARGE}>', '-strip', '-quality', '86', '-define', 'webp:alpha-quality=95', dest], check=True)
        return
    from PIL import Image

    im = Image.open(original)
    im.seek(0)
    im = im.convert('RGBA') if (im.mode in ('RGBA', 'LA', 'P') and ('transparency' in im.info or im.mode != 'P')) else im.convert('RGB')
    im.thumbnail((LARGE, LARGE), Image.LANCZOS)
    im.save(dest, 'WEBP', quality=86, method=6)


def main():
    src = open(os.path.join(ROOT, 'src', 'data', 'sportslogos.ts')).read()
    entries = re.findall(r'file: "([^"]+)",[^}]*?page: "([^"]+)"', src)
    print(f'{len(entries)} images', flush=True)
    done = failed = 0
    for i, (rel, page) in enumerate(entries):
        try:
            html = fetch(page)
            m = re.search(r'https://content\.sportslogos\.net/logos/\d+/\d+/full/[^"\'\s>]+', html)
            if not m:
                print('no full image:', page, flush=True)
                failed += 1
                continue
            original = os.path.join(CACHE, 'raw', rel.rsplit('.', 1)[0] + os.path.splitext(m[0])[1].lower())
            if not os.path.exists(original) or os.path.getsize(original) == 0:
                os.makedirs(os.path.dirname(original), exist_ok=True)
                data = fetch(m[0], binary=True)
                tmp = original + '.part'
                open(tmp, 'wb').write(data)
                os.replace(tmp, original)
            dest = os.path.join(OUT, rel[: -len('.webp')] + '-lg.webp')
            convert(original, dest)
            done += 1
        except Exception as e:  # keep going; report at the end
            print('failed:', rel, e, flush=True)
            failed += 1
        if (i + 1) % 25 == 0:
            print(f'{i + 1}/{len(entries)}', flush=True)
    print(f'done: {done} rebuilt, {failed} failed', flush=True)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
