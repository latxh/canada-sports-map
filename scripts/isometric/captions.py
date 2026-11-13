import os,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ISO=pathlib.Path(os.environ.get("ISOMETRIC_CITIES",pathlib.Path.home()/"isometric-cities"))
(ISO/"outputs/csm").mkdir(parents=True,exist_ok=True);os.chdir(ISO/"outputs/csm")
import json,pathlib
import subprocess
meta=json.loads(subprocess.run(['node',str(HERE/'venue-meta.mts')],capture_output=True,text=True,check=True).stdout);seeds=json.load(open(HERE/'seeds.json'));names=json.load(open(HERE/'names.json'))
NOTES={
 'rogers-centre':'The stadium is a big round concrete dome with a white segmented retractable roof, closed.',
 'bc-place':'The stadium is a large oval with a white fabric cable roof held by a ring of thin white masts, over beige concrete walls with bands of teal glass. Through the oval opening in the roof, a bright green artificial turf field with white lines.',
 'olympic-stadium':'The stadium is a huge oval of ribbed pale concrete with a white fabric roof, and a tall tapering concrete tower leans steeply out over it.',
 'saddledome':'The arena has a saddle-shaped curved concrete roof that dips in the middle.',
 'scotiabank-arena':'The arena has a dark flat roof over red brick and glass walls, beside wide railway tracks.',
 'bell-centre':'The arena is a dark glass and brown stone block with a flat grey roof, among downtown towers.',
 'maple-leaf-gardens':'A historic square yellow-brick arena with a pale arched roof, now a supermarket and university rink.',
 'montreal-forum':'A historic low arena with red brick and glass walls on a downtown corner.',
 'td-place-stadium':'The north stand is wrapped in a wavy wooden slat facade.',
 'princess-auto-stadium':'The stands have tall dark roof canopies.',
 'mosaic-stadium':'The bowl has a continuous white roof canopy over the seats.',
 'commonwealth-stadium':'A large open concrete bowl around the field.',
}
# Venues whose building today isn't what their kind suggests.
BODY={
 'jarry-park':'Jarry Park Stadium is today a tennis stadium: a blue hard tennis court in its bowl, ringed by tiers of seats, with smaller outdoor tennis courts beside it.',
 'ralph-cantafio-soccer-complex':'The Ralph Cantafio Soccer Complex is a modest community soccer ground: bright green artificial turf fields with white lines, with low metal bleachers along the main field.',
}
def caption(vid):
    m=meta[vid];name=names[vid].split(',')[0];kind,roof,surf=m['kind'],m['roof'],m['surface']
    if kind=='arena': body=f'{name} is a large indoor arena with a flat roof and simple walls.'
    elif kind=='dome': body=f'{name} is a large domed stadium.'
    else:
        field={'grass':'a striped green grass field','turf':'a bright green artificial turf field','hybrid':'a striped green grass field'}[surf]
        ftype={'football':'football','soccer':'soccer','ballpark':'baseball'}[kind]
        lines={'football':'white yard lines','soccer':'white pitch lines','ballpark':'a brown infield'}[kind]
        canopy=' under roof canopies' if roof=='canopy' else ''
        body=(f'{name} is an open-air {ftype} stadium with {field} marked with {lines}. The buildings right beside the field are its seating stands, '
              f'drawn as tiers of coloured seats stepping up away from the field{canopy}. Sides of the field with no building in the reference stay open ground.')
    body=BODY.get(vid,body)
    note=NOTES.get(vid,'')
    return ('Pixel Art, PixArFK. Redraw this exact render of a sports venue as a crisp high-detail isometric pixel art map, same camera, framing and layout. '
            'Every building keeps its exact reference footprint, height, roofline and roof colour. '+body+(' '+note if note else '')+
            ' Surrounding buildings with fine rows of tiny windows, grey asphalt streets with lane markings and tiny cars, parking lots, pale paving, lawns and trees with sunlit tops, soft blue-grey cast shadows as in the reference. '
            'Delicate edges drawn in deeper shades of each local colour, rich natural colour variation, bright clear daylight.')
pathlib.Path('captions').mkdir(exist_ok=True)
for v in seeds: pathlib.Path(f'captions/{v}.txt').write_text(caption(v)+'\n')
print('captions written')
