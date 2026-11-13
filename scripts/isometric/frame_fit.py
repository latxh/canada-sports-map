"""Fit an exact 1024x640 frame around a venue (plus optional extra 3D points) by choosing the
scale: writes venues/<id>/recipe3.json from recipe2.json. Usage: frame_fit.py <id> [lat,lon,height_above_ground ...]"""
import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import json,sys,pathlib
sys.path.insert(0,str(ISO/'source'))
import numpy as np
from geometry import SceneCoordinates, Camera
from rectangle_frame import expand_aspect
vid=sys.argv[1];d=pathlib.Path('venues')/vid
rec=json.load(open(d/'recipe2.json'));prep=json.load(open(d/'prep.json'));z=json.load(open(d/'src2/capture/source.json'))['focus_elevation_m']
o=rec['origin'];scene=SceneCoordinates(o['lat'],o['lon']);cam=Camera(1,0,0,1,1,scene=scene,view_quadrant=rec['camera']['view_quadrant'])
# venue extent from the src2 footprints of buildings near the centre
fp=json.load(open(d/'src2/capture/footprints.json'))['features']
pts=[]
for f in fp:
    g=f['geometry'];rings=g['coordinates'] if g['type']=='Polygon' else [r for p in g['coordinates'] for r in p]
    xy=np.array(rings[0])[:,:2]
    if np.hypot(*xy.mean(0))>float(np.sqrt(prep['venue_area_m2']))*0.75: continue
    for h in (0,f['height_m']): pts+= [[x,y,z+h] for x,y in xy]
r=float(np.sqrt(prep['venue_area_m2']))*0.6
pts+=[[x,y,z] for x in (-r,r) for y in (-r,r)]
for arg in sys.argv[2:]:
    la,lo,h=map(float,arg.split(','));x,y=scene.local_xy(lo,la);pts.append([float(x),float(y),z+h])
P=cam.project(np.array(pts))[:,:2];(x0,y0),(x1,y1)=P.min(0),P.max(0)
mx,my=(x1-x0)*.12,(y1-y0)*.12
b=expand_aspect((x0-mx,y0-my,x1+mx,y1+my),(16,10))
scale=min(4.0,1024/(b[2]-b[0])*0.99999)
if scale==4.0:
    cx,cy=(b[0]+b[2])/2,(b[1]+b[3])/2;b=(cx-128,cy-80,cx+128,cy+80)
rec['camera'].update(pixels_per_metre=scale,frame={'screen_bounds_metres':list(map(float,b)),'aspect':[16,10],'elevation_range_metres':[z-40,z+260]})
rec['id']=rec['id'].replace('csm2-','csm3-');rec['data_dir']=str((d/'cache3').resolve())
(d/'recipe3.json').write_text(json.dumps(rec,indent=1));print(vid,'scale',round(scale,2),[round(v) for v in b])
