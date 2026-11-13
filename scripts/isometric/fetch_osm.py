"""Fetch OSM for each venue from api.openstreetmap.org (Overpass is unreachable here) and
write an Overpass-shaped osm.json (ways/relations carry `geometry`) plus a recipe."""
import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import json,math,sys,time,pathlib,urllib.request,urllib.error
UA={'User-Agent':'canada-sports-map isometric venue renderer (github.com/latxh/canada-sports-map)'}
KEEP=('building','building:part','highway','railway','leisure','landuse','natural','water','waterway','barrier','historic')
R=float(sys.argv[2]) if len(sys.argv)>2 else 700
def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=120) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (400,509): raise
            time.sleep(5*(attempt+1))
    raise RuntimeError(url)
def fetch_box(s,w,n,e,out,depth=0):
    try:
        data=get(f'https://api.openstreetmap.org/api/0.6/map.json?bbox={w},{s},{e},{n}');time.sleep(1)
    except urllib.error.HTTPError as err:
        if depth>3: raise
        print('  split',err.code,flush=True);mlat=(s+n)/2;mlon=(w+e)/2
        for b in [(s,w,mlat,mlon),(s,mlon,mlat,e),(mlat,w,n,mlon),(mlat,mlon,n,e)]: fetch_box(*b,out,depth+1)
        return
    for el in data['elements']: out[(el['type'],el['id'])]=el
def relevant(t): return any(k in t for k in KEEP) or t.get('tourism')=='attraction'
seeds=json.load(open(HERE/'seeds.json'))
only=sys.argv[1].split(',') if len(sys.argv)>1 and sys.argv[1]!='all' else list(seeds)
for vid in only:
    lat,lon=seeds[vid];d=pathlib.Path('venues')/vid;d.mkdir(parents=True,exist_ok=True)
    if (d/'osm.json').exists(): print(vid,'cached');continue
    dlat=R/111320;dlon=R/(111320*math.cos(math.radians(lat)))
    els={};fetch_box(lat-dlat,lon-dlon,lat+dlat,lon+dlon,els)
    nodes={i:(e['lat'],e['lon']) for (t,i),e in els.items() if t=='node'}
    ways={i:e for (t,i),e in els.items() if t=='way'}
    def geom(w): return [{'lat':nodes[n][0],'lon':nodes[n][1]} for n in w['nodes'] if n in nodes]
    for (t,i),r in list(els.items()):
        if t=='relation' and r.get('tags',{}).get('type')=='multipolygon' and relevant(r['tags']) and any(m['type']=='way' and m['ref'] not in ways for m in r['members']):
            full=get(f'https://api.openstreetmap.org/api/0.6/relation/{i}/full.json');time.sleep(1)
            for el in full['elements']:
                if el['type']=='node': nodes[el['id']]=(el['lat'],el['lon'])
                if el['type']=='way': ways.setdefault(el['id'],el)
    out=[]
    for (t,i),e in els.items():
        tg=e.get('tags',{})
        if t=='node' and tg.get('natural')=='tree': out.append(e)
        elif t=='way' and relevant(tg): out.append({**e,'geometry':geom(e)})
        elif t=='relation' and relevant(tg):
            mem=[{**m,'geometry':geom(ways[m['ref']]) if m['type']=='way' and m['ref'] in ways else []} for m in e['members']]
            out.append({**e,'members':mem})
    payload={'version':0.6,'generator':'api.openstreetmap.org map.json, reshaped like Overpass out geom','elements':out}
    (d/'osm.json').write_text(json.dumps(payload,separators=(',',':')))
    (d/'provenance.json').write_text(json.dumps({'source':'https://api.openstreetmap.org/api/0.6/map.json','radius_m':R,'centre':[lat,lon],'retrieved_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'elements':len(out)},indent=1))
    print(vid,len(els),'raw ->',len(out),flush=True)
