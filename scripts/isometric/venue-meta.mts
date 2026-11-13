// Prints each venue's kind, roof and surface as JSON for captions.py.
import {VENUES} from '../../src/data/venues.ts';
console.log(JSON.stringify(Object.fromEntries(VENUES.map((v) => [v.id, {kind: v.kind, roof: v.roof, surface: v.surface, city: v.cityId, name: v.name}]))));
