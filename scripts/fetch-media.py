"""Resumable, rate-limit-friendly fetch of team photos, venue photos and historical logos."""
import json, time, urllib.request, urllib.parse, urllib.error, os, re, html, sys
UA='CanadianSportsAtlas/0.1 (personal project; https://github.com/latxh/canada-sports-map)'
API_GAP, DL_GAP = 2.5, 1.5
def get(url, binary=False):
    for a in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=60) as r:
                return r.read() if binary else json.load(r)
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get('Retry-After') or 0) or (20 * (a + 1))
            print(f'  {e.code} → sleep {wait}s', file=sys.stderr, flush=True); time.sleep(min(wait, 120))
        except Exception as e:
            time.sleep(10 * (a + 1))
    print('FAILED', url[:160], file=sys.stderr); return None
def api(p, host='en.wikipedia.org'):
    d = get(f'https://{host}/w/api.php?'+urllib.parse.urlencode({**p,'format':'json'})); time.sleep(API_GAP); return d
def dl(url, fn):
    if os.path.exists(fn): return True
    b = get(url, True); time.sleep(DL_GAP)
    if not b: return False
    open(fn,'wb').write(b); return True
def strip(h): return html.unescape(re.sub(r'<[^>]+>','',h or '')).strip()
def meta_of(ii):
    em=ii.get('extmetadata',{})
    return {'license':strip(em.get('LicenseShortName',{}).get('value','')),'artist':strip(em.get('Artist',{}).get('value',''))[:120],'desc':strip(em.get('ImageDescription',{}).get('value',''))[:300]}
ent=json.load(open('entities.json'))
os.makedirs('logos',exist_ok=True); os.makedirs('photos',exist_ok=True)
media=json.load(open('media.json')) if os.path.exists('media.json') else {'teams':{}, 'venues':{}}
logos2=json.load(open('logos3.json')) if os.path.exists('logos3.json') else {}
def save():
    json.dump(media, open('media.json','w'), indent=1, ensure_ascii=False)
    json.dump(logos2, open('logos3.json','w'), indent=1, ensure_ascii=False)
CITY={'toronto','montreal','montréal','vancouver','calgary','edmonton','ottawa','winnipeg','quebec','québec','hamilton','regina','halifax','saskatchewan','saskatoon','brampton','guelph','niagara','oshawa','scarborough','newfoundland','fc','cf','pwhl'}
SKIP=re.compile(r'(wordmark|alternate|secondary|script|jersey|uniform|patch|anniversary|shoulder|\bcap\b|helmet|text|word mark|centennial|throwback|logotype)', re.I)
YEARS=re.compile(r'(1[89]\d\d|20[0-2]\d)\s*(?:[–\-—]|to)\s*(1[89]\d\d|20[0-2]\d|\d\d|present|current|now)', re.I)
BAD_PHOTO=re.compile(r'(logo|wordmark|icon|flag|map|locator|location|jersey|uniform|kit|seal|coat of arms|signature|svg|diagram|chart|graph|crest|emblem|banner|font|template|pictogram|symbol)', re.I)
FREE=re.compile(r'(CC[ -]?BY|CC0|Public domain|PD|GFDL|Attribution)', re.I)

# 1) Historical logos: one File: search on enwiki and one on Commons per team.
for t in ent['teams']:
    if t['id'] in logos2: continue
    words=[w for w in re.split(r'[\s\-]+', t['name']) if w.lower() not in CITY]
    nick=' '.join(words).lower() if words and len(' '.join(words))>=4 else t['name'].lower()
    cands={}
    ok=True
    for host in ('en.wikipedia.org','commons.wikimedia.org'):
        d=api({'action':'query','list':'search','srnamespace':6,'srsearch':f'{t["name"]} logo','srlimit':40}, host)
        if d is None: ok=False; continue
        for r in d.get('query',{}).get('search',[]):
            title=r['title']; low=title.lower().replace('_',' ')
            if nick not in low and t['name'].lower() not in low: continue
            if SKIP.search(title): continue
            m=YEARS.search(title)
            if not m: continue
            y0=int(m.group(1)); g=m.group(2).lower()
            y1=None if g in ('present','current','now') else int(g) if len(g)==4 else int(str(y0)[:2]+g)
            if y1 is not None and y1 < y0: continue
            cands.setdefault(y0, []).append((title, host, y1))
    if not ok: continue
    rec=[]
    for y0 in sorted(cands):
        title,host,y1=sorted(cands[y0], key=lambda c: (not c[0].lower().endswith('.svg'), c[1]!='en.wikipedia.org'))[0]
        if y1 is None: continue
        d=api({'action':'query','prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':320,'titles':title}, host)
        p=next(iter((d or {}).get('query',{}).get('pages',{}).values()), None)
        if not p or 'imageinfo' not in p: continue
        ii=p['imageinfo'][0]
        svg=ii['url'].lower().endswith('.svg')
        fn=f"logos/{t['id']}--{y0}.{'svg' if svg else 'png'}"
        if not dl(ii['url'] if svg else (ii.get('thumburl') or ii['url']), fn): continue
        rec.append({'file':fn,'from':y0,'to':y1,'title':title,'page':ii.get('descriptionurl'),'license':meta_of(ii)['license']})
    logos2[t['id']]=rec; save()
    print('logos', t['id'], [(r['from'], r['to']) for r in rec], flush=True)

# 2) Team photos for teams not done yet.
for t in ent['teams']:
    if t['id'] in media['teams']: continue
    d=api({'action':'parse','page':t['wiki'].replace('_',' '),'prop':'images','redirects':1})
    if not d or 'parse' not in d: continue
    names=['File:'+n.replace('_',' ') for n in d['parse']['images']]
    photos=[n for n in names if re.search(r'\.(jpe?g|png)$', n, re.I) and not BAD_PHOTO.search(n)][:12]
    rec={'logos':[], 'photos':[]}
    if photos:
        dd=api({'action':'query','prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':640,'titles':'|'.join(photos)})
        info={}
        if dd:
            norm={n['to']:n['from'] for n in dd['query'].get('normalized',[])}
            for p in dd['query']['pages'].values():
                if 'imageinfo' in p: info[norm.get(p['title'],p['title'])]=p['imageinfo'][0]
        for n in photos:
            if len(rec['photos'])>=4: break
            ii=info.get(n)
            if not ii: continue
            m=meta_of(ii)
            if not FREE.search(m['license']) or 'fair use' in m['license'].lower() or (ii.get('width') or 0) < 500: continue
            fn=f"photos/{t['id']}--{len(rec['photos'])+1}.jpg"
            if dl(ii.get('thumburl') or ii['url'], fn):
                rec['photos'].append({'file':fn,'title':n,'page':ii.get('descriptionurl'),**m})
    media['teams'][t['id']]=rec; save()
    print('photos', t['id'], len(rec['photos']), flush=True)

# 3) One photo per venue (its article's lead image, free licences only).
todo=[v for v in ent['venues'] if v['id'] not in media['venues']]
for i in range(0,len(todo),40):
    chunk=todo[i:i+40]
    d=api({'action':'query','prop':'pageimages','piprop':'name','pilicense':'free','redirects':1,'titles':'|'.join(v['wiki'].replace('_',' ') for v in chunk)})
    if not d: continue
    norm={n['to']:n['from'] for n in d['query'].get('normalized',[])}
    redir={r['to']:r['from'] for r in d['query'].get('redirects',[])}
    titles={}
    for p in d['query']['pages'].values():
        if p.get('pageimage'):
            s=redir.get(p['title'],p['title']); s=norm.get(s,s)
            titles[s]='File:'+p['pageimage'].replace('_',' ')
    want=list(titles.values())
    info={}
    for j in range(0,len(want),40):
        dd=api({'action':'query','prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':640,'titles':'|'.join(want[j:j+40])})
        if not dd: continue
        nn={n['to']:n['from'] for n in dd['query'].get('normalized',[])}
        for p in dd['query']['pages'].values():
            if 'imageinfo' in p: info[nn.get(p['title'],p['title'])]=p['imageinfo'][0]
    for v in chunk:
        f=titles.get(v['wiki'].replace('_',' '))
        ii=info.get(f) if f else None
        if not ii: continue
        m=meta_of(ii)
        if not FREE.search(m['license']): continue
        fn=f"photos/venue--{v['id']}.jpg"
        if dl(ii.get('thumburl') or ii['url'], fn):
            media['venues'][v['id']]={'file':fn,'title':f,'page':ii.get('descriptionurl'),**m}
    save(); print('venues', len(media['venues']), flush=True)
print('DONE', flush=True)
