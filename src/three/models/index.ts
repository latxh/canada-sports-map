import {atcoField, mcmahonStadium, saddledome} from './calgary';
import {commonwealthStadium, rogersPlace} from './edmonton';
import {wanderersGrounds} from './halifax';
import {hamiltonStadium} from './hamilton';
import {bellCentre, molsonStadium, stadeBoreale, stadeSaputo} from './montreal';
import {canadianTireCentre, tdPlace} from './ottawa';
import {mosaicStadium} from './regina';
import {bmoField, rogersCentre, scotiabankArena, yorkLions} from './toronto';
import type {StadiumModelFn} from './types';
import {bcPlace, rogersArena, starlightStadium, willoughbyStadium} from './vancouver';
import {canadaLifeCentre, princessAutoStadium} from './winnipeg';

/** Hand-built models for the venues current teams play in, keyed by venue id. */
export const STADIUM_MODELS: Record<string, StadiumModelFn> = {
  // Toronto
  'rogers-centre': rogersCentre,
  'scotiabank-arena': scotiabankArena,
  'bmo-field': bmoField,
  'york-lions-stadium': yorkLions,
  // Montréal / Laval
  'bell-centre': bellCentre,
  'stade-saputo': stadeSaputo,
  'molson-stadium': molsonStadium,
  'stade-boreale': stadeBoreale,
  // Ottawa
  'canadian-tire-centre': canadianTireCentre,
  'td-place-stadium': tdPlace,
  // Hamilton
  'hamilton-stadium': hamiltonStadium,
  // Vancouver area
  'bc-place': bcPlace,
  'rogers-arena': rogersArena,
  'starlight-stadium': starlightStadium,
  'willoughby-stadium': willoughbyStadium,
  // Calgary
  saddledome: saddledome,
  'mcmahon-stadium': mcmahonStadium,
  'atco-field': atcoField,
  // Edmonton
  'rogers-place': rogersPlace,
  'commonwealth-stadium': commonwealthStadium,
  // Regina
  'mosaic-stadium': mosaicStadium,
  // Winnipeg
  'canada-life-centre': canadaLifeCentre,
  'princess-auto-stadium': princessAutoStadium,
  // Halifax
  'wanderers-grounds': wanderersGrounds,
};
