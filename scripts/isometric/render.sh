#!/bin/bash
# render.sh <tag> id1 id2 ... — sequential styling of a centred 1024x640 crop of each venue's src2 source
ISO=${ISOMETRIC_CITIES:-$HOME/isometric-cities}; cd "$ISO"; tag=$1; shift; mkdir -p outputs/csm/results/$tag
for v in "$@"; do
  S=$PWD/outputs/csm/venues/$v/${SRC:-src2/capture}; O=outputs/csm/venues/$v/$tag; C=outputs/csm/captions/$v.txt
  [ -f outputs/csm/results/$tag/$v.png ] && continue
  read W H < <(.venv/bin/python -c "from PIL import Image;i=Image.open('$S/source.png');print(*i.size)")
  X=$(( (W-1024)/2 )); Y=$(( (H-640)/2 )); [ $X -lt 0 ] && X=0; [ $Y -lt 0 ] && Y=0
  CW=$(( W<1024 ? W : 1024 )); CH=$(( H<640 ? H : 640 ))
  args=(outputs/csm/venues/$v/recipe2.json --source $S/source.png --manifest $S/source.json --crop $X $Y $CW $CH --out $O --style --caption-file $C --wait)
  .venv/bin/python atlas.py make "${args[@]}" >/dev/null 2>&1
  for i in $(seq 1 40); do s=$(.venv/bin/python atlas.py make "${args[@]}" 2>&1); echo "$s" | grep -q '"art-ready"\|failed' && break; sleep 10; done
  if [ -f $O/art/raw.png ]; then cp $O/art/raw.png outputs/csm/results/$tag/$v.png; cp $O/source.png outputs/csm/results/$tag/$v.source.png 2>/dev/null; echo "$v done"; else echo "$v FAILED: $(echo "$s" | tail -2 | tr '\n' ' ')"; fi
done
