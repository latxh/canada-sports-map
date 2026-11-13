"""Write captions/<id>.txt in the work dir: one pixel-art restyle prompt per venue."""
import os,json,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
out=ISO/'outputs/csm/captions-earth';out.mkdir(parents=True,exist_ok=True)
import subprocess
meta=json.loads(subprocess.run(['node','-e',"import('"+str(HERE.parents[1]/'src/data/venues.ts')+"').then(m=>console.log(JSON.stringify(Object.fromEntries(m.VENUES.map(v=>[v.id,v.roof])))))"],capture_output=True,text=True,check=True).stdout)
for v,n in json.load(open(HERE/'names.json')).items():
    name=n.split(',')[0]
    roofed=meta[v] in ('indoor','fixed-dome','retractable')
    venue=(f'{name} is a roofed venue: keep its roof closed and solid, with exactly the markings and colours the photo shows and nothing added. ' if roofed
           else f'{name} is open-air: keep its field, stands and seats exactly as in the photo. ')
    (out/f'{v}.txt').write_text(
      f'Pixel Art, PixArFK. Redraw this exact aerial photograph of {name} and its neighbourhood as a crisp high-detail isometric pixel art illustration, same camera, framing and layout. '
      +venue+
      'Keep every building, roof shape, tree and road exactly where and as they are in the photo, in their real colours; simplify photographic texture into clean flat pixel shading with fine rows of tiny windows and tiny cars. '
      'Delicate edges drawn in deeper shades of each local colour, soft blue-grey shadows as in the photo, bright clear daylight.\n')
print('captions written to',out)
