import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import sys,pathlib
from PIL import Image, ImageDraw
tag=sys.argv[1];ids=sys.argv[3:] ;out=sys.argv[2]
W,H=512,320
s=Image.new('RGB',(W*2,H*len(ids)),'white');d=ImageDraw.Draw(s)
for i,v in enumerate(ids):
    s.paste(Image.open(f'results/{tag}/{v}.source.png').convert('RGB').resize((W,H)),(0,i*H))
    s.paste(Image.open(f'results/{tag}/{v}.png').convert('RGB').resize((W,H)),(W,i*H))
    d.rectangle([0,i*H,200,i*H+14],fill='black');d.text((3,i*H+1),v,fill='white')
s.save(out)
