"""Look up venues in queries.json with Nominatim (1 request a second) and print their OSM
element and centre, to fill in seeds.json and targets.json for a new venue."""
import json,sys,time,urllib.request,urllib.parse,pathlib
HERE=pathlib.Path(__file__).resolve().parent
queries=json.load(open(HERE/'queries.json'))
for vid in sys.argv[1:] or queries:
    url='https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode({'q':queries[vid],'format':'jsonv2','limit':3,'countrycodes':'ca'})
    for a in json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'canada-sports-map isometric venue renderer (github.com/latxh/canada-sports-map)'}))):
        print(f"{vid:30} {a['osm_type'][0]}{a['osm_id']:<11} {a['category']}={a['type']:14} {a['lat']},{a['lon']}  {a['name']}")
    time.sleep(1.2)
