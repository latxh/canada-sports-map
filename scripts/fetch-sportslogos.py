#!/usr/bin/env python3
"""
Download logo, uniform and playing-surface history from SportsLogos.net for every team in
src/data/teams/, with SportsLogos.net's permission (credited on every image and in Credits).

Polite by design: one request at a time, at least 1.2 s apart, a User-Agent that names the
project, and every page cached on disk so a re-run fetches only what is missing.

  python3 scripts/fetch-sportslogos.py index    # match our teams to SportsLogos.net teams
  python3 scripts/fetch-sportslogos.py pages    # fetch each matched team's page, list its images
  python3 scripts/fetch-sportslogos.py images   # fetch each image's page and the full-size image

Writes to $SLN_DIR (default /tmp/sln): cache/, raw/<team>/, index.json, items.json.
scripts/build-sportslogos.py then turns raw/ into public/sportslogos/ and src/data/sportslogos.ts.
"""
import glob
import html
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('SLN_DIR', '/tmp/sln')
BASE = 'https://www.sportslogos.net'
UA = 'CanadianSportsAtlas/1.0 (fan project, with permission from SportsLogos.net; https://github.com/latxh/canada-sports-map)'
GAP = 1.2

LEAGUE_PAGES = {
    'NHL': '/teams/list_by_league/1/National-Hockey-League-Logos/NHL-Logos/',
    'NBA': '/teams/list_by_league/6/National-Basketball-Association-Logos/NBA-Logos/',
    'MLB': '/teams/list_by_league/4/Major-League-Baseball-Logos/MLB-Logos/',
    'MLS': '/teams/list_by_league/9/Major-League-Soccer-Logos/MLS-Logos/',
    'CFL': '/teams/list_by_league/8/Canadian_Football_League/CFL/logos/',
    'CPL': '/teams/list_by_league/231/Canadian_Premier_League/CanPL/logos/',
    'NLL': '/teams/list_by_league/25/National_Lacrosse_League/NLL/logos/',
    'CEBL': '/teams/list_by_league/236/Canadian_Elite_Basketball_League/CEBL/logos/',
    'PWHL': '/teams/list_by_league/235/Professional_Womens_Hockey_League/PWHL/logos/',
    'WNBA': '/teams/list_by_league/16/Womens_National_Basketball_Association/WNBA/logos/',
    # NSL and CDL: not on SportsLogos.net (November 2026).
}

# Teams the league lists don't name the same way (or at all).
OVERRIDES = {
    'montreal-expos': ['/logos/list_by_team/66/Montréal-Expos-Logos/'],  # linked from the Nationals' page
    'quebec-bulldogs': ['/logos/list_by_team/42/Quebec-Athletics-Logos/'],  # the 1919–20 NHL Quebec club
}

# Sections we use, by the start of their heading after the team name.
KINDS = [
    ('logo', re.compile(r'^Primary Logos History')),
    ('home', re.compile(r'^(Primary White|Home|Light|Primary Light) Uniforms History')),
    ('away', re.compile(r'^(Primary Dark|Road|Away|Dark|Primary Colou?red) Uniforms History')),
    ('surface', re.compile(r'^Playing Surfaces? History')),
]

_last = [0.0]


def fetch(url, binary=False):
    """GET with on-disk cache and a polite gap between live requests."""
    key = re.sub(r'[^A-Za-z0-9._-]+', '_', url.replace(BASE, ''))[-180:]
    path = os.path.join(OUT, 'cache', key)
    if os.path.exists(path):
        with open(path, 'rb') as f:
            data = f.read()
        return data if binary else data.decode('utf8', 'ignore')
    wait = GAP - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    for attempt in range(4):
        try:
            req = urllib.request.Request(urllib.parse.quote(url, safe=':/?=&%#'), headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
            break
        except Exception as e:  # noqa: BLE001
            status = getattr(e, 'code', None)
            if status == 404:
                raise
            retry = int(getattr(e, 'headers', {}).get('Retry-After', 0) or 0) if hasattr(e, 'headers') else 0
            time.sleep(max(retry, 10 * (attempt + 1)))
    else:
        raise RuntimeError(f'failed: {url}')
    _last[0] = time.time()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(data)
    return data if binary else data.decode('utf8', 'ignore')


def norm(name):
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    name = re.sub(r'\(.*?\)', '', name)
    return re.sub(r'[^a-z0-9]+', ' ', name.lower()).strip()


def our_teams():
    """id, name, league, from, to and former names, read from src/data/teams/*.ts."""
    teams = []
    for path in sorted(glob.glob(os.path.join(ROOT, 'src/data/teams/*.ts'))):
        src = open(path, encoding='utf8').read()
        starts = [m.start() for m in re.finditer(r"\n  \{\n    id: '", src)]
        for i, s in enumerate(starts):
            block = src[s:starts[i + 1] if i + 1 < len(starts) else len(src)]
            get = lambda k: (re.search(rf"\n    {k}: '([^']*)'", block) or [None, None])[1]  # noqa: E731
            num = lambda k: (lambda m: int(m[1]) if m else None)(re.search(rf"\n    {k}: (\d+)", block))  # noqa: E731
            former = re.findall(r"\{name: '([^']+)', from: (\d+)(?:, to: (\d+))?\}", block)
            teams.append({
                'id': get('id'), 'name': get('name').replace("\\'", "'"), 'league': get('league'), 'cityId': get('cityId'),
                'from': num('from'), 'to': num('to'),
                'former': [{'name': n, 'from': int(f), 'to': int(t) if t else None} for n, f, t in former],
            })
    return teams


def parse_years(text):
    m = re.search(r'\((\d{4})(?:\s*-\s*(\d{4}|Pres))?\)', text)
    if not m:
        return None, None
    start = int(m[1])
    end = None if m[2] == 'Pres' else int(m[2]) if m[2] else start
    return start, end


def cmd_index():
    teams = our_teams()
    sln = {}
    for league, page in LEAGUE_PAGES.items():
        s = fetch(BASE + page)
        rows = []
        for href, inner in re.findall(r'<a[^>]+href="(/logos/list_by_team/\d+/[^"]+)"[^>]*>(.*?)</a>', s, re.S):
            text = html.unescape(re.sub(r'<[^>]+>', ' ', inner))
            text = re.sub(r'\s+', ' ', text).strip()
            m = re.match(r'(.*?)\s+(\d{4})(?:/\d{2})?(?:\s*-\s*(\d{4}(?:/\d{2})?|Pres))?$', text)
            name = m[1] if m else text
            rows.append({'href': href, 'name': name, 'years': text[len(name):].strip()})
        sln[league] = {r['href']: r for r in rows}.values()
    def span(years):
        nums = re.findall(r'(\d{4})(?:/\d{2})?', years)
        start = int(nums[0]) if nums else 0
        end = 9999 if 'Pres' in years else int(nums[1]) if len(nums) > 1 else start
        return start, end

    matched, unmatched = {}, []
    for t in teams:
        if t['league'] not in sln:
            continue
        # Same name *and* overlapping years: keeps today's Senators and Jets apart from the originals.
        names = [(t['name'], t['from'], t['to'] or 9999)] + [(f['name'], f['from'], f['to'] or 9999) for f in t['former']]
        hits = {}
        for r in sln[t['league']]:
            start, end = span(r['years'])
            for name, a, b in names:
                if norm(r['name']) == norm(name) and start <= max(b, t['to'] or 9999) and end >= min(a, t['from']) - 1:
                    team_num = re.search(r'/list_by_team/(\d+)/', r['href'])[1]
                    hits.setdefault(team_num, r['href'])
        if hits:
            matched[t['id']] = sorted(hits.values())
        else:
            unmatched.append(f"{t['id']} ({t['league']}, {t['name']})")
    json.dump({'matched': matched, 'teams': teams, 'sln': {k: list(v) for k, v in sln.items()}}, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
    print(f'matched {len(matched)} teams; unmatched {len(unmatched)}:')
    for u in unmatched:
        print('  ', u)


def cmd_pages():
    idx = json.load(open(os.path.join(OUT, 'index.json')))
    matched = {**idx['matched'], **OVERRIDES}
    items, sections = [], {}
    for team_id, hrefs in sorted(matched.items()):
        for href in hrefs:
            s = fetch(BASE + href)
            heads = [(m.start(), html.unescape(re.sub(r'<[^>]+>', '', m[1])).strip()) for m in re.finditer(r'<h3[^>]*>(.*?)</h3>', s, re.S)]
            # Headings read "<Team name> <Section>": strip the team name, the start they all share.
            history = [h for _, h in heads if h.endswith('History')]
            prefix = os.path.commonprefix(history) if len(history) > 1 else ''
            prefix = prefix[: prefix.rfind(' ') + 1] if ' ' in prefix else ''
            for i, (pos, head) in enumerate(heads):
                seg = s[pos:heads[i + 1][0] if i + 1 < len(heads) else len(s)]
                label = head[len(prefix):] if head.startswith(prefix) else head
                sections[label] = sections.get(label, 0) + 1
                kind = next((k for k, rx in KINDS if rx.match(label)), None)
                if not kind:
                    continue
                for view, title in re.findall(r'<a\s+href="(/logos/view/[^"]+)"\s+title="([^"]+)"', seg):
                    start, end = parse_years(title)
                    items.append({'team': team_id, 'kind': kind, 'view': BASE + view, 'title': html.unescape(title), 'slnFrom': start, 'slnTo': end, 'slnTeam': href})
    # The same image can be listed twice (e.g. a team page split by name): keep one.
    seen, unique = set(), []
    for it in items:
        if (it['team'], it['view']) not in seen:
            seen.add((it['team'], it['view']))
            unique.append(it)
    json.dump(unique, open(os.path.join(OUT, 'items.json'), 'w'), indent=1)
    by_kind = {}
    for it in unique:
        by_kind[it['kind']] = by_kind.get(it['kind'], 0) + 1
    print(f'{len(unique)} images across {len({i["team"] for i in unique})} teams: {by_kind}')
    print('section headings seen:', json.dumps(dict(sorted(sections.items(), key=lambda kv: -kv[1])), indent=0)[:3000])


def cmd_images():
    items = json.load(open(os.path.join(OUT, 'items.json')))
    done = 0
    for it in items:
        if it.get('file') and os.path.exists(os.path.join(OUT, it['file'])):
            continue
        page = fetch(it['view'])
        m = re.search(r'https://content\.sportslogos\.net/logos/\d+/\d+/full/[^"\'\s>]+', page)
        if not m:
            print('no full image:', it['view'])
            continue
        url = m[0]
        ext = os.path.splitext(url)[1].lower() or '.png'
        slug = it['view'].split('/logos/view/')[1].split('/')[0]
        rel = f"raw/{it['team']}/{it['kind']}-{it['slnFrom'] or 0}-{slug}{ext}"
        path = os.path.join(OUT, rel)
        if not os.path.exists(path):
            data = fetch(url, binary=True)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, 'wb').write(data)
        it['file'] = rel
        it['image'] = url
        done += 1
        if done % 25 == 0:
            json.dump(items, open(os.path.join(OUT, 'items.json'), 'w'), indent=1)
            print(f'{done} downloaded', flush=True)
    json.dump(items, open(os.path.join(OUT, 'items.json'), 'w'), indent=1)
    print(f'done: {sum(1 for i in items if i.get("file"))}/{len(items)} images')


if __name__ == '__main__':
    os.makedirs(os.path.join(OUT, 'cache'), exist_ok=True)
    {'index': cmd_index, 'pages': cmd_pages, 'images': cmd_images}[sys.argv[1]]()
