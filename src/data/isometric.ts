/**
 * Pixel-art illustrations of every venue that still stands, in public/isometric/. Each is a
 * Google Earth 3D view of the venue, framed from OpenStreetMap, repainted on a Mac with
 * isometric-cities (github.com/Statecraft-Labs/isometric-cities): FLUX.2 [klein] 9B with the Pixel
 * Art Redmond style. scripts/isometric/ rebuilds them; data.test.ts checks every venue is covered.
 */
const YEAR = 2026;

export interface IsometricArt {
  file: string;
  /** The Google Earth view it was painted from, linked from the lightbox. */
  earth: string;
  /** Google Earth's imagery attribution for that view. */
  credit: string;
  year: number;
}

export const ISOMETRIC_VENUES: Record<string, IsometricArt> = {
  'atco-field': {file: 'atco-field.webp', earth: 'https://earth.google.com/web/@50.883994,-114.098645,1093.9a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'bc-place': {file: 'bc-place.webp', earth: 'https://earth.google.com/web/@49.276698,-123.112007,10.0a,1663d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'bell-centre': {file: 'bell-centre.webp', earth: 'https://earth.google.com/web/@45.496058,-73.569279,30.0a,965d,10y,315h,35t,0r', credit: "Google", year: YEAR},
  'bmo-field': {file: 'bmo-field.webp', earth: 'https://earth.google.com/web/@43.633213,-79.418550,85.4a,1663d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'caa-centre': {file: 'caa-centre.webp', earth: 'https://earth.google.com/web/@43.667302,-79.708509,200.0a,989d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'canada-life-centre': {file: 'canada-life-centre.webp', earth: 'https://earth.google.com/web/@49.892638,-97.143752,226.0a,1112d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'canadian-tire-centre': {file: 'canadian-tire-centre.webp', earth: 'https://earth.google.com/web/@45.296934,-75.926940,119.6a,1191d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'clarke-stadium': {file: 'clarke-stadium.webp', earth: 'https://earth.google.com/web/@53.557209,-113.478240,668.2a,1030d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'coca-cola-coliseum': {file: 'coca-cola-coliseum.webp', earth: 'https://earth.google.com/web/@43.635671,-79.414839,88.4a,1604d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'commonwealth-stadium': {file: 'commonwealth-stadium.webp', earth: 'https://earth.google.com/web/@53.559691,-113.476344,652.6a,1829d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'edmonton-expo-centre': {file: 'edmonton-expo-centre.webp', earth: 'https://earth.google.com/web/@53.568917,-113.457524,662.1a,2032d,10y,225h,55t,0r', credit: "Google", year: YEAR},
  'hamilton-stadium': {file: 'hamilton-stadium.webp', earth: 'https://earth.google.com/web/@43.252076,-79.830124,84.7a,1829d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'jarry-park': {file: 'jarry-park.webp', earth: 'https://earth.google.com/web/@45.532998,-73.627161,54.4a,963d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'langley-events-centre': {file: 'langley-events-centre.webp', earth: 'https://earth.google.com/web/@49.145992,-122.666299,77.0a,1266d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'le-colisee': {file: 'le-colisee.webp', earth: 'https://earth.google.com/web/@46.830823,-71.246337,19.8a,935d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'maple-leaf-gardens': {file: 'maple-leaf-gardens.webp', earth: 'https://earth.google.com/web/@43.662201,-79.380302,100.0a,1022d,10y,315h,40t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'mcmahon-stadium': {file: 'mcmahon-stadium.webp', earth: 'https://earth.google.com/web/@51.070426,-114.121550,1096.4a,1626d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'meridian-centre': {file: 'meridian-centre.webp', earth: 'https://earth.google.com/web/@43.156289,-79.244061,94.0a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'molson-stadium': {file: 'molson-stadium.webp', earth: 'https://earth.google.com/web/@45.510159,-73.580853,70.0a,1463d,10y,225h,55t,0r', credit: "Google", year: YEAR},
  'montreal-forum': {file: 'montreal-forum.webp', earth: 'https://earth.google.com/web/@45.490131,-73.584679,50.0a,914d,10y,135h,40t,0r', credit: "Google", year: YEAR},
  'mosaic-stadium': {file: 'mosaic-stadium.webp', earth: 'https://earth.google.com/web/@50.450549,-104.633045,577.9a,1820d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'northlands-coliseum': {file: 'northlands-coliseum.webp', earth: 'https://earth.google.com/web/@53.571289,-113.455974,679.4a,963d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'olympic-stadium': {file: 'olympic-stadium.webp', earth: 'https://earth.google.com/web/@45.557803,-73.551640,29.9a,2709d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'pacific-coliseum': {file: 'pacific-coliseum.webp', earth: 'https://earth.google.com/web/@49.285780,-123.042776,39.4a,1019d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'place-bell': {file: 'place-bell.webp', earth: 'https://earth.google.com/web/@45.555885,-73.721653,32.0a,1335d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'princess-auto-stadium': {file: 'princess-auto-stadium.webp', earth: 'https://earth.google.com/web/@49.807840,-97.142905,228.0a,1829d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'ralph-cantafio-soccer-complex': {file: 'ralph-cantafio-soccer-complex.webp', earth: 'https://earth.google.com/web/@49.842919,-97.176745,228.0a,914d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'rogers-arena': {file: 'rogers-arena.webp', earth: 'https://earth.google.com/web/@49.277847,-123.108840,8.8a,1693d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'rogers-centre': {file: 'rogers-centre.webp', earth: 'https://earth.google.com/web/@43.641611,-79.389182,87.6a,1829d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc. NOAA", year: YEAR},
  'rogers-place': {file: 'rogers-place.webp', earth: 'https://earth.google.com/web/@53.546811,-113.497674,663.6a,1583d,10y,225h,55t,0r', credit: "Google", year: YEAR},
  'saddledome': {file: 'saddledome.webp', earth: 'https://earth.google.com/web/@51.037389,-114.051996,1054.9a,1057d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'sasktel-centre': {file: 'sasktel-centre.webp', earth: 'https://earth.google.com/web/@52.189197,-106.679126,507.2a,935d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'scotiabank-arena': {file: 'scotiabank-arena.webp', earth: 'https://earth.google.com/web/@43.643463,-79.379168,80.0a,1215d,10y,135h,55t,0r', credit: "Google, Vexcel Imaging US, Inc. NOAA", year: YEAR},
  'scotiabank-centre': {file: 'scotiabank-centre.webp', earth: 'https://earth.google.com/web/@44.648205,-63.576725,43.1a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'sleeman-centre': {file: 'sleeman-centre.webp', earth: 'https://earth.google.com/web/@43.546755,-80.246654,328.7a,914d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'stade-boreale': {file: 'stade-boreale.webp', earth: 'https://earth.google.com/web/@45.575172,-73.703125,31.0a,931d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'stade-saputo': {file: 'stade-saputo.webp', earth: 'https://earth.google.com/web/@45.563047,-73.552610,39.4a,1543d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'starlight-stadium': {file: 'starlight-stadium.webp', earth: 'https://earth.google.com/web/@48.443103,-123.523675,70.0a,1232d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'swangard-stadium': {file: 'swangard-stadium.webp', earth: 'https://earth.google.com/web/@49.230838,-123.021674,123.0a,1499d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'td-coliseum': {file: 'td-coliseum.webp', earth: 'https://earth.google.com/web/@43.259107,-79.872174,99.0a,1188d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'td-place-arena': {file: 'td-place-stadium.webp', earth: 'https://earth.google.com/web/@45.398358,-75.683578,71.8a,1518d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'td-place-stadium': {file: 'td-place-stadium.webp', earth: 'https://earth.google.com/web/@45.398358,-75.683578,71.8a,1518d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'toronto-pan-am-sports-centre': {file: 'toronto-pan-am-sports-centre.webp', earth: 'https://earth.google.com/web/@43.790630,-79.193604,139.3a,1236d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'tribute-communities-centre': {file: 'tribute-communities-centre.webp', earth: 'https://earth.google.com/web/@43.897009,-78.859134,105.0a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'verdun-auditorium': {file: 'verdun-auditorium.webp', earth: 'https://earth.google.com/web/@45.462538,-73.561735,17.0a,914d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'wanderers-grounds': {file: 'wanderers-grounds.webp', earth: 'https://earth.google.com/web/@44.644700,-63.583360,42.1a,1829d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'willoughby-stadium': {file: 'willoughby-stadium.webp', earth: 'https://earth.google.com/web/@49.143851,-122.665664,78.0a,963d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'winsport-event-centre': {file: 'winsport-event-centre.webp', earth: 'https://earth.google.com/web/@51.084604,-114.221071,1120.4a,1717d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'york-lions-stadium': {file: 'york-lions-stadium.webp', earth: 'https://earth.google.com/web/@43.775131,-79.506577,201.6a,1232d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
};

/** Venues without an illustration: OpenStreetMap only knows what stands today. */
export const NO_ISOMETRIC: Record<string, string> = {
  'barton-street-arena': 'Demolished',
  'deys-arena': 'Demolished',
  'empire-stadium': 'Demolished in 1993',
  'exhibition-stadium': 'Demolished in 1999',
  'ivor-wynne-stadium': 'Demolished in 2012; Hamilton Stadium stands on its site',
  'mutual-street-arena': 'Demolished in 1989',
  'ottawa-auditorium': 'Demolished in 1967',
  'quebec-arena': 'Destroyed by fire in 1942',
  'stampede-corral': 'Demolished',
  'taylor-field': 'Demolished in 2017',
  'westmount-arena': 'Destroyed by fire in 1918',
  'winnipeg-arena': 'Demolished in 2006',
  'winnipeg-stadium': 'Demolished in 2013',
};

export const isometricUrl = (art: IsometricArt) => `${import.meta.env.BASE_URL}isometric/${art.file}`;
