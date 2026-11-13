"""Draw the Montreal Tower, inclined 45 degrees over the Olympic Stadium, into its source render
(the block model only extrudes footprints straight up). Writes src2/capture-edit/{source.png,source.json}."""
import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import json,math,hashlib,shutil,sys,pathlib
sys.path.insert(0,str(ISO/'source'))
import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import Polygon
from shapely import affinity
from geometry import SceneCoordinates
d=pathlib.Path('venues/olympic-stadium');src=sys.argv[1] if len(sys.argv)>1 else 'src2';cap=d/src/'capture';out=d/src/'capture-edit';out.mkdir(exist_ok=True)
m=json.load(open(cap/'source.json'));M=np.array(m['camera']['pixel_matrix']);o=m['camera']['world_origin']
scene=SceneCoordinates(o['lat'],o['lon'])
osm=json.load(open(d/'osm.json'));tw=next(e for e in osm['elements'] if e['type']=='way' and e['id']==20213158)
fp=Polygon([scene.local_xy(p['lon'],p['lat']) for p in tw['geometry']]).minimum_rotated_rectangle
z0=m['focus_elevation_m']-2;H=165.0
bc=np.array(fp.centroid.coords[0]);toward=-bc/np.linalg.norm(bc)   # stadium centre is the scene origin
base=np.array(affinity.scale(fp,.7,.7,origin='centroid').exterior.coords)[:4]
top_c=bc+toward*H*.95
top=(base-bc)*.3+top_c
B=np.column_stack([base,np.full(4,z0)]);T=np.column_stack([top,np.full(4,z0+H)])
proj=lambda P:(np.column_stack([P,np.ones(len(P))])@M.T)
depth=lambda P:float(np.mean(P@np.array([1,-1,1])))
img=Image.open(cap/'source.png').convert('RGB');dr=ImageDraw.Draw(img)
faces=[]
for i in range(4):
    j=(i+1)%4;q=np.array([B[i],B[j],T[j],T[i]])
    e=B[j,:2]-B[i,:2];n=np.array([e[1],-e[0]]);n/=np.linalg.norm(n)
    if np.dot(n,(B[i,:2]+B[j,:2])/2-bc)<0:n=-n
    shade=.73+.18*float(n@np.array([-.45,-.89]))
    faces.append((depth(q),q,tuple(int(c*shade) for c in (214,208,196))))
faces.append((depth(T)+1e3,T,(226,222,212)))
for _,q,col in sorted(faces,key=lambda f:f[0]):
    dr.polygon([tuple(p) for p in proj(q)],fill=col,outline=tuple(int(c*.8) for c in col))
img.save(out/'source.png')
m['source_sha256']=hashlib.sha256((out/'source.png').read_bytes()).hexdigest()
m.setdefault('limitations',[]).append('Hand edit: the Montreal Tower (OSM way 20213158) is drawn as a 165 m prism inclined toward the stadium, replacing its straight extrusion.')
json.dump(m,open(out/'source.json','w'),indent=1);print('ok')
