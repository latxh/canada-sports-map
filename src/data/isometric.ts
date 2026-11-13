/**
 * Isometric pixel-art illustrations of every venue that still stands, in public/isometric/.
 * Painted on a Mac with isometric-cities (github.com/Statecraft-Labs/isometric-cities): a block
 * model of OpenStreetMap buildings around the venue, repainted by FLUX.2 [klein] 9B with the Pixel
 * Art Redmond style. scripts/isometric/ rebuilds them; data.test.ts checks every venue is covered.
 */
export interface IsometricArt {
  file: string;
  /** The venue's OpenStreetMap element, e.g. 'way/123', linked from the lightbox. */
  osm?: string;
}

export const ISOMETRIC_VENUES: Record<string, IsometricArt> = {
  'atco-field': {file: 'atco-field.webp', osm: 'way/1321608883'},
  'bc-place': {file: 'bc-place.webp', osm: 'way/24705904'},
  'bell-centre': {file: 'bell-centre.webp', osm: 'way/19911284'},
  'bmo-field': {file: 'bmo-field.webp', osm: 'way/663457707'},
  'caa-centre': {file: 'caa-centre.webp', osm: 'way/225955971'},
  'canada-life-centre': {file: 'canada-life-centre.webp', osm: 'way/14869890'},
  'canadian-tire-centre': {file: 'canadian-tire-centre.webp', osm: 'way/449048777'},
  'clarke-stadium': {file: 'clarke-stadium.webp', osm: 'way/25508981'},
  'coca-cola-coliseum': {file: 'coca-cola-coliseum.webp', osm: 'way/227711310'},
  'commonwealth-stadium': {file: 'commonwealth-stadium.webp', osm: 'way/1351822252'},
  'edmonton-expo-centre': {file: 'edmonton-expo-centre.webp', osm: 'way/123810537'},
  'hamilton-stadium': {file: 'hamilton-stadium.webp', osm: 'way/149025706'},
  'jarry-park': {file: 'jarry-park.webp', osm: 'relation/2676968'},
  'langley-events-centre': {file: 'langley-events-centre.webp', osm: 'way/144683497'},
  'le-colisee': {file: 'le-colisee.webp', osm: 'way/41167716'},
  'maple-leaf-gardens': {file: 'maple-leaf-gardens.webp', osm: 'way/20060888'},
  'mcmahon-stadium': {file: 'mcmahon-stadium.webp', osm: 'way/427304042'},
  'meridian-centre': {file: 'meridian-centre.webp', osm: 'way/466960620'},
  'molson-stadium': {file: 'molson-stadium.webp', osm: 'way/165265805'},
  'montreal-forum': {file: 'montreal-forum.webp', osm: 'way/20177664'},
  'mosaic-stadium': {file: 'mosaic-stadium.webp', osm: 'relation/7185210'},
  'northlands-coliseum': {file: 'northlands-coliseum.webp', osm: 'way/25508530'},
  'olympic-stadium': {file: 'olympic-stadium.webp', osm: 'way/108505523'},
  'pacific-coliseum': {file: 'pacific-coliseum.webp', osm: 'way/49796369'},
  'place-bell': {file: 'place-bell.webp', osm: 'way/484506152'},
  'princess-auto-stadium': {file: 'princess-auto-stadium.webp', osm: 'way/310551169'},
  'ralph-cantafio-soccer-complex': {file: 'ralph-cantafio-soccer-complex.webp', osm: 'way/106287944'},
  'rogers-arena': {file: 'rogers-arena.webp', osm: 'way/24705911'},
  'rogers-centre': {file: 'rogers-centre.webp', osm: 'way/7969701'},
  'rogers-place': {file: 'rogers-place.webp', osm: 'way/448626254'},
  'saddledome': {file: 'saddledome.webp', osm: 'way/4397328'},
  'sasktel-centre': {file: 'sasktel-centre.webp', osm: 'way/615967460'},
  'scotiabank-arena': {file: 'scotiabank-arena.webp', osm: 'way/19882585'},
  'scotiabank-centre': {file: 'scotiabank-centre.webp', osm: 'way/553574575'},
  'sleeman-centre': {file: 'sleeman-centre.webp', osm: 'way/123261020'},
  'stade-boreale': {file: 'stade-boreale.webp', osm: 'way/1526431423'},
  'stade-saputo': {file: 'stade-saputo.webp', osm: 'way/95436479'},
  'starlight-stadium': {file: 'starlight-stadium.webp', osm: 'way/766569268'},
  'swangard-stadium': {file: 'swangard-stadium.webp', osm: 'way/426857458'},
  'td-coliseum': {file: 'td-coliseum.webp', osm: 'way/166293307'},
  'td-place-arena': {file: 'td-place-stadium.webp', osm: 'way/163034504'},
  'td-place-stadium': {file: 'td-place-stadium.webp', osm: 'way/163034504'},
  'toronto-pan-am-sports-centre': {file: 'toronto-pan-am-sports-centre.webp', osm: 'way/185369754'},
  'tribute-communities-centre': {file: 'tribute-communities-centre.webp', osm: 'way/178905495'},
  'verdun-auditorium': {file: 'verdun-auditorium.webp', osm: 'way/47175662'},
  'wanderers-grounds': {file: 'wanderers-grounds.webp', osm: 'way/704070046'},
  'willoughby-stadium': {file: 'willoughby-stadium.webp', osm: 'way/1082774184'},
  'winsport-event-centre': {file: 'winsport-event-centre.webp', osm: 'way/157300252'},
  'york-lions-stadium': {file: 'york-lions-stadium.webp', osm: 'way/236026523'},
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

export const osmUrl = (art: IsometricArt) => (art.osm ? `https://www.openstreetmap.org/${art.osm}` : 'https://www.openstreetmap.org/copyright');
