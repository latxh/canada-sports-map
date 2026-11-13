/**
 * Pixel-art illustrations of every venue that still stands, in public/isometric/. Each is a
 * Google Earth 3D view of the venue, framed from OpenStreetMap, repainted on a Mac with
 * isometric-cities (github.com/Statecraft-Labs/isometric-cities): FLUX.2 [klein] 9B with the Pixel
 * Art Redmond style. scripts/isometric/ rebuilds them; data.test.ts checks every venue is covered.
 */
const YEAR = 2026;

export interface IsometricArt {
  /** In public/isometric/, with a 240×150 copy of the same name in public/isometric/thumbs/. */
  file: string;
  /** Where the venue is: the map shows its thumbnail here when zoomed in close. */
  lat: number;
  lon: number;
  /** The Google Earth view it was painted from, linked from the lightbox. */
  earth: string;
  /** Google Earth's imagery attribution for that view. */
  credit: string;
  year: number;
}

export const ISOMETRIC_VENUES: Record<string, IsometricArt> = {
  'atco-field': {file: 'atco-field.webp', lat: 50.88399, lon: -114.09865, earth: 'https://earth.google.com/web/@50.883994,-114.098645,1093.9a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'bc-place': {file: 'bc-place.webp', lat: 49.27670, lon: -123.11201, earth: 'https://earth.google.com/web/@49.276698,-123.112007,10.0a,1663d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'bell-centre': {file: 'bell-centre.webp', lat: 45.49606, lon: -73.56928, earth: 'https://earth.google.com/web/@45.496058,-73.569279,30.0a,965d,10y,315h,35t,0r', credit: "Google", year: YEAR},
  'bmo-field': {file: 'bmo-field.webp', lat: 43.63321, lon: -79.41855, earth: 'https://earth.google.com/web/@43.633213,-79.418550,85.4a,1663d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'caa-centre': {file: 'caa-centre.webp', lat: 43.66730, lon: -79.70851, earth: 'https://earth.google.com/web/@43.667302,-79.708509,200.0a,989d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'canada-life-centre': {file: 'canada-life-centre.webp', lat: 49.89264, lon: -97.14375, earth: 'https://earth.google.com/web/@49.892638,-97.143752,226.0a,1112d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'canadian-tire-centre': {file: 'canadian-tire-centre.webp', lat: 45.29693, lon: -75.92694, earth: 'https://earth.google.com/web/@45.296934,-75.926940,119.6a,1191d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'clarke-stadium': {file: 'clarke-stadium.webp', lat: 53.55721, lon: -113.47824, earth: 'https://earth.google.com/web/@53.557209,-113.478240,668.2a,1030d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'coca-cola-coliseum': {file: 'coca-cola-coliseum.webp', lat: 43.63567, lon: -79.41484, earth: 'https://earth.google.com/web/@43.635671,-79.414839,88.4a,1604d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'commonwealth-stadium': {file: 'commonwealth-stadium.webp', lat: 53.55969, lon: -113.47634, earth: 'https://earth.google.com/web/@53.559691,-113.476344,652.6a,1829d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'edmonton-expo-centre': {file: 'edmonton-expo-centre.webp', lat: 53.56892, lon: -113.45752, earth: 'https://earth.google.com/web/@53.568917,-113.457524,662.1a,2032d,10y,225h,55t,0r', credit: "Google", year: YEAR},
  'hamilton-stadium': {file: 'hamilton-stadium.webp', lat: 43.25208, lon: -79.83012, earth: 'https://earth.google.com/web/@43.252076,-79.830124,84.7a,1829d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'jarry-park': {file: 'jarry-park.webp', lat: 45.53300, lon: -73.62716, earth: 'https://earth.google.com/web/@45.532998,-73.627161,54.4a,963d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'langley-events-centre': {file: 'langley-events-centre.webp', lat: 49.14599, lon: -122.66630, earth: 'https://earth.google.com/web/@49.145992,-122.666299,77.0a,1266d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'le-colisee': {file: 'le-colisee.webp', lat: 46.83082, lon: -71.24634, earth: 'https://earth.google.com/web/@46.830823,-71.246337,19.8a,935d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'maple-leaf-gardens': {file: 'maple-leaf-gardens.webp', lat: 43.66220, lon: -79.38030, earth: 'https://earth.google.com/web/@43.662201,-79.380302,100.0a,1022d,10y,315h,40t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'mcmahon-stadium': {file: 'mcmahon-stadium.webp', lat: 51.07043, lon: -114.12155, earth: 'https://earth.google.com/web/@51.070426,-114.121550,1096.4a,1626d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'meridian-centre': {file: 'meridian-centre.webp', lat: 43.15629, lon: -79.24406, earth: 'https://earth.google.com/web/@43.156289,-79.244061,94.0a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'molson-stadium': {file: 'molson-stadium.webp', lat: 45.51016, lon: -73.58085, earth: 'https://earth.google.com/web/@45.510159,-73.580853,70.0a,1463d,10y,225h,55t,0r', credit: "Google", year: YEAR},
  'montreal-forum': {file: 'montreal-forum.webp', lat: 45.49013, lon: -73.58468, earth: 'https://earth.google.com/web/@45.490131,-73.584679,50.0a,914d,10y,135h,40t,0r', credit: "Google", year: YEAR},
  'mosaic-stadium': {file: 'mosaic-stadium.webp', lat: 50.45055, lon: -104.63305, earth: 'https://earth.google.com/web/@50.450549,-104.633045,577.9a,1820d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'northlands-coliseum': {file: 'northlands-coliseum.webp', lat: 53.57129, lon: -113.45597, earth: 'https://earth.google.com/web/@53.571289,-113.455974,679.4a,963d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'olympic-stadium': {file: 'olympic-stadium.webp', lat: 45.55780, lon: -73.55164, earth: 'https://earth.google.com/web/@45.557803,-73.551640,29.9a,2709d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'pacific-coliseum': {file: 'pacific-coliseum.webp', lat: 49.28578, lon: -123.04278, earth: 'https://earth.google.com/web/@49.285780,-123.042776,39.4a,1019d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'place-bell': {file: 'place-bell.webp', lat: 45.55588, lon: -73.72165, earth: 'https://earth.google.com/web/@45.555885,-73.721653,32.0a,1335d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'princess-auto-stadium': {file: 'princess-auto-stadium.webp', lat: 49.80784, lon: -97.14291, earth: 'https://earth.google.com/web/@49.807840,-97.142905,228.0a,1829d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'ralph-cantafio-soccer-complex': {file: 'ralph-cantafio-soccer-complex.webp', lat: 49.84292, lon: -97.17675, earth: 'https://earth.google.com/web/@49.842919,-97.176745,228.0a,914d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'rogers-arena': {file: 'rogers-arena.webp', lat: 49.27785, lon: -123.10884, earth: 'https://earth.google.com/web/@49.277847,-123.108840,8.8a,1693d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'rogers-centre': {file: 'rogers-centre.webp', lat: 43.64161, lon: -79.38918, earth: 'https://earth.google.com/web/@43.641611,-79.389182,87.6a,1829d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc. NOAA", year: YEAR},
  'rogers-place': {file: 'rogers-place.webp', lat: 53.54681, lon: -113.49767, earth: 'https://earth.google.com/web/@53.546811,-113.497674,663.6a,1583d,10y,225h,55t,0r', credit: "Google", year: YEAR},
  'saddledome': {file: 'saddledome.webp', lat: 51.03739, lon: -114.05200, earth: 'https://earth.google.com/web/@51.037389,-114.051996,1054.9a,1057d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'sasktel-centre': {file: 'sasktel-centre.webp', lat: 52.18920, lon: -106.67913, earth: 'https://earth.google.com/web/@52.189197,-106.679126,507.2a,935d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'scotiabank-arena': {file: 'scotiabank-arena.webp', lat: 43.64346, lon: -79.37917, earth: 'https://earth.google.com/web/@43.643463,-79.379168,80.0a,1215d,10y,135h,55t,0r', credit: "Google, Vexcel Imaging US, Inc. NOAA", year: YEAR},
  'scotiabank-centre': {file: 'scotiabank-centre.webp', lat: 44.64820, lon: -63.57673, earth: 'https://earth.google.com/web/@44.648205,-63.576725,43.1a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'sleeman-centre': {file: 'sleeman-centre.webp', lat: 43.54675, lon: -80.24665, earth: 'https://earth.google.com/web/@43.546755,-80.246654,328.7a,914d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'stade-boreale': {file: 'stade-boreale.webp', lat: 45.57517, lon: -73.70312, earth: 'https://earth.google.com/web/@45.575172,-73.703125,31.0a,931d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'stade-saputo': {file: 'stade-saputo.webp', lat: 45.56305, lon: -73.55261, earth: 'https://earth.google.com/web/@45.563047,-73.552610,39.4a,1543d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'starlight-stadium': {file: 'starlight-stadium.webp', lat: 48.44310, lon: -123.52367, earth: 'https://earth.google.com/web/@48.443103,-123.523675,70.0a,1232d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'swangard-stadium': {file: 'swangard-stadium.webp', lat: 49.23084, lon: -123.02167, earth: 'https://earth.google.com/web/@49.230838,-123.021674,123.0a,1499d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'td-coliseum': {file: 'td-coliseum.webp', lat: 43.25911, lon: -79.87217, earth: 'https://earth.google.com/web/@43.259107,-79.872174,99.0a,1188d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'td-place-arena': {file: 'td-place-stadium.webp', lat: 45.39836, lon: -75.68358, earth: 'https://earth.google.com/web/@45.398358,-75.683578,71.8a,1518d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'td-place-stadium': {file: 'td-place-stadium.webp', lat: 45.39836, lon: -75.68358, earth: 'https://earth.google.com/web/@45.398358,-75.683578,71.8a,1518d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'toronto-pan-am-sports-centre': {file: 'toronto-pan-am-sports-centre.webp', lat: 43.79063, lon: -79.19360, earth: 'https://earth.google.com/web/@43.790630,-79.193604,139.3a,1236d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'tribute-communities-centre': {file: 'tribute-communities-centre.webp', lat: 43.89701, lon: -78.85913, earth: 'https://earth.google.com/web/@43.897009,-78.859134,105.0a,914d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'verdun-auditorium': {file: 'verdun-auditorium.webp', lat: 45.46254, lon: -73.56173, earth: 'https://earth.google.com/web/@45.462538,-73.561735,17.0a,914d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'wanderers-grounds': {file: 'wanderers-grounds.webp', lat: 44.64470, lon: -63.58336, earth: 'https://earth.google.com/web/@44.644700,-63.583360,42.1a,1829d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'willoughby-stadium': {file: 'willoughby-stadium.webp', lat: 49.14385, lon: -122.66566, earth: 'https://earth.google.com/web/@49.143851,-122.665664,78.0a,963d,10y,225h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
  'winsport-event-centre': {file: 'winsport-event-centre.webp', lat: 51.08460, lon: -114.22107, earth: 'https://earth.google.com/web/@51.084604,-114.221071,1120.4a,1717d,10y,315h,55t,0r', credit: "Google", year: YEAR},
  'york-lions-stadium': {file: 'york-lions-stadium.webp', lat: 43.77513, lon: -79.50658, earth: 'https://earth.google.com/web/@43.775131,-79.506577,201.6a,1232d,10y,315h,55t,0r', credit: "Google, Vexcel Imaging US, Inc.", year: YEAR},
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

export const isometricThumbUrl = (art: IsometricArt) => `${import.meta.env.BASE_URL}isometric/thumbs/${art.file}`;
