/**
 * Venues that have a hand-built 3D model: the 24 homes of current teams.
 * Kept free of three.js so the UI can check it without loading the 3D chunk;
 * src/three/models/index.ts holds the models themselves (a test keeps the two
 * in sync with the dataset).
 */
export const STADIUM_MODEL_IDS = [
  'rogers-centre',
  'scotiabank-arena',
  'bmo-field',
  'york-lions-stadium',
  'bell-centre',
  'stade-saputo',
  'molson-stadium',
  'stade-boreale',
  'canadian-tire-centre',
  'td-place-stadium',
  'hamilton-stadium',
  'bc-place',
  'rogers-arena',
  'starlight-stadium',
  'willoughby-stadium',
  'saddledome',
  'mcmahon-stadium',
  'atco-field',
  'rogers-place',
  'commonwealth-stadium',
  'mosaic-stadium',
  'canada-life-centre',
  'princess-auto-stadium',
  'wanderers-grounds',
] as const;

const IDS = new Set<string>(STADIUM_MODEL_IDS);

export function hasStadiumModel(venueId: string): boolean {
  return IDS.has(venueId);
}
