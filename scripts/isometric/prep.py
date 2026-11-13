"""Per venue: find its footprint in OSM, centre and zoom the camera on it, pick the NE/SE view
that hides it least, and cut away buildings that still stand in front of it. Writes
venues/<id>/osm-cut.json, venues/<id>/recipe2.json and venues/<id>/prep.json."""
import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import json,math,sys,pathlib
sys.path.insert(0,str(ISO/'source'))
import numpy as np
from shapely.geometry import MultiPoint, Point
from shapely.ops import unary_union
from geometry import SceneCoordinates, load_features, polygons, Camera
seeds=json.load(open(HERE/'seeds.json'));targets=json.load(open(HERE/'targets.json'));names=json.load(open(HERE/'names.json'))
W,H=1024,640
# Buildings the block model can't draw: the Olympic Stadium's inclined tower is drawn by hand instead (olympic_tower.py).
EXTRA_CUT={'olympic-stadium':['way/20213158']}
# Measured heights OSM lacks (from Wikipedia).
TAG_OVERRIDES={'olympic-stadium':{'way/108505523':{'height':'50'}},
  # BC Place's field, mapped as a 15 m building part inside the bowl: draw it as turf at field level.
  'bc-place':{'way/390133856':{'height':'2','roof:colour':'#4e8f3a'},'way/1415412262':{'roof:colour':'#4e8f3a'}}}
def hull(cam,geom,z0,z1):
    pts=[]
    for p in polygons(geom):
        xy=np.array(p.exterior.coords)[:,:2]
        for z in (z0,z1): pts.append(cam.project(np.column_stack([xy,np.full(len(xy),z)]))[:,:2])
    return MultiPoint(np.concatenate(pts)).convex_hull
def run(vid):
    d=pathlib.Path('venues')/vid;lat,lon=seeds[vid];scene=SceneCoordinates(lat,lon)
    feats,_=load_features(d/'osm.json',scene);spec=targets[vid]
    seed=Point(0,0)
    areal=[f for f in feats if polygons(f.geometry)]
    if 'osm' in spec:
        key={'w':'way/','r':'relation/','n':'node/'}[spec['osm'][0]]+spec['osm'][1:]
        cand=[f for f in areal if f.osm_id.split('#')[0]==key]
        if not cand: raise SystemExit(f'{vid}: {key} not found')
        target=unary_union([f.geometry for f in cand]);tkey=key
    else:
        kind=spec['nearest']
        pool=[f for f in areal if (f.tags.get('leisure')=='stadium' if kind=='stadium' else f.height>0) and f.geometry.distance(seed)<200]
        pool.sort(key=lambda f:(f.geometry.distance(seed),-f.geometry.area) if kind=='stadium' else -f.geometry.area)
        target=pool[0].geometry;tkey=pool[0].osm_id.split('#')[0]
    if target.area>60000:  # a park: shrink to the stadium/pitch inside it
        inner=[f.geometry for f in areal if f.tags.get('leisure') in ('stadium','pitch') and f.geometry.within(target.buffer(5))]
        if inner: target=max(inner,key=lambda g:g.area)
    blds=[f for f in feats if f.height>0]
    mine=[b for b in blds if b.geometry.intersection(target).area>0.5*b.geometry.area]
    venue=unary_union([target]+[b.geometry for b in mine])
    top=max([b.height for b in mine],default=15)
    c=venue.centroid;cx,cy=c.x,c.y
    best=None
    for q in ('SE','NE'):
        cam=Camera(1,0,0,W,H,scene=scene,view_quadrant=q)
        vh=hull(cam,venue,0,top);x0,y0,x1,y1=vh.bounds
        scale=max(2.0,min(4.0,0.62*W/(x1-x0),0.72*H/(y1-y0)))
        vdepth=float(cam.project([cx,cy,top/2])[2])
        occ=[];shapes=[]
        for b in blds:
            if b in mine or b.geometry.distance(venue)>600: continue
            bh=hull(cam,b.geometry,b.min_height,b.height)
            if not bh.intersects(vh): continue
            bc=b.geometry.centroid
            if float(cam.project([bc.x,bc.y,b.height/2])[2])<=vdepth: continue
            ov=bh.intersection(vh).area
            if ov>0.01*vh.area: occ.append(b.osm_id);shapes.append(bh.intersection(vh))
        frac=unary_union(shapes).area/vh.area if shapes else 0
        r=(frac-(0.05 if q=='SE' else 0),q,scale,occ,frac)
        if best is None or r[0]<best[0]: best=r
    _,q,scale,occ,frac=best
    cut={o.split('#')[0].split('@')[0] for o in occ}|set(EXTRA_CUT.get(vid,[]))
    data=json.loads((d/'osm.json').read_text())
    data['elements']=[e for e in data['elements'] if f"{e['type']}/{e['id']}" not in cut]
    for e in data['elements']:
        extra=TAG_OVERRIDES.get(vid,{}).get(f"{e['type']}/{e['id']}")
        if extra: e['tags']={**e['tags'],**extra}
    (d/'osm-cut.json').write_text(json.dumps(data,separators=(',',':')))
    clon,clat=scene.lonlat(cx,cy);clon,clat=float(clon),float(clat)
    prov=json.load(open(d/'provenance.json'));R=prov['radius_m']-80
    dlat=R/111320;dlon=R/(111320*math.cos(math.radians(lat)))
    bbox=[lat-dlat,lon-dlon,lat+dlat,lon+dlon]
    name=names[vid].split(',')[0]
    rec={'id':'csm2-'+vid,'title':name,'subtitle':'Canadian Sports Atlas venue','origin':{'lat':clat,'lon':clon},'bbox':bbox,'patch_bbox':bbox,
         'osm_source':str((d/'osm-cut.json').resolve()),'data_dir':str((d/'cache2').resolve()),'terrain':{'provider':'skadi'},
         'camera':{'view_quadrant':q,'pixels_per_metre':round(scale,2),'pixel_upscale':1,'terrain_cell_metres':4,'patch_terrain_cell_metres':4},
         'landmarks':[{'id':vid,'name':name,'lat':clat,'lon':clon}]}
    (d/'recipe2.json').write_text(json.dumps(rec,indent=1))
    info={'venue':vid,'target':tkey,'view':q,'scale':round(scale,2),'occlusion_before_cut':round(frac,3),'cut':sorted(cut),'venue_area_m2':round(venue.area),'height_m':top,'centre':[clat,clon]}
    (d/'prep.json').write_text(json.dumps(info,indent=1));print(json.dumps(info))
for vid in (sys.argv[1].split(',') if len(sys.argv)>1 and sys.argv[1]!='all' else seeds): run(vid)
