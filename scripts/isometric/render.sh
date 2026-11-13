#!/bin/bash
# render_earth.sh <tag> id... — pixel-art restyle of each venue's Google Earth capture (venues/<id>/earth/raw.png)
ISO=${ISOMETRIC_CITIES:-$HOME/isometric-cities}; cd "$ISO"; tag=$1; shift; mkdir -p outputs/csm/results/$tag
for v in "$@"; do
  E=outputs/csm/venues/$v/earth; O=$E/$tag; C=outputs/csm/captions-earth/$v.txt
  [ -f outputs/csm/results/$tag/$v.png ] && continue
  .venv/bin/python -c "from PIL import Image;Image.open('$E/raw.png').convert('RGB').resize((1024,640),Image.LANCZOS).save('$E/source.png')"
  args=(outputs/csm/venues/$v/recipe2.json --source $PWD/$E/source.png --out $O --style --caption-file $C --wait)
  .venv/bin/python atlas.py make "${args[@]}" >/dev/null 2>&1
  for i in $(seq 1 60); do s=$(.venv/bin/python atlas.py make "${args[@]}" 2>&1); echo "$s" | grep -q '"art-ready"\|failed' && break; sleep 10; done
  if [ -f $O/art/raw.png ]; then cp $O/art/raw.png outputs/csm/results/$tag/$v.png; cp $E/source.png outputs/csm/results/$tag/$v.source.png; echo "$v done"; else echo "$v FAILED: $(echo "$s" | tail -2 | tr '\n' ' ')"; fi
done
