import type * as THREE from 'three';
import type {Sport} from '../../data';
import type {Layer, LayerSpec} from '../kit/core';
import type {Path} from '../kit/paths';
import type {FieldKind, FieldSpec, Placement} from '../kit/surfaces';

/** What a venue model receives. Distances are metres; +y is up. */
export interface ModelContext {
  /** Static geometry. */
  base: Layer;
  /** Fixed roof (hidden by the viewer's Roof switch). */
  roof: Layer;
  /** Extra named layer, e.g. a retractable roof panel. */
  layer(name: string, spec?: LayerSpec): Layer;
  /** Sport of the team the model is shown for (picks the field markings). */
  sport: Sport;
  /** The team's colours, for venues whose seats follow the home team. */
  team: {seat: string; accent: string};
  /** Field kind for the current sport at a venue that hosts several. */
  kindFor(options: Partial<Record<Sport, FieldKind>>, fallback: FieldKind): FieldKind;
  /** Ground under the model, fading out at radius r. `hole` leaves a sunken bowl open. */
  ground(r: number, color: string, o?: {hole?: Path; y?: number}): void;
  /** Lay the playing surface (one per model). */
  field(spec: Omit<FieldSpec, 'accent'> & {accent?: string}, at?: Placement): void;
}

export interface ModelResult {
  /** Radius of the main structure in metres, used to frame the camera. */
  radius: number;
  /** Camera direction in degrees: azimuth measured from +x toward +z, elevation above the horizon. */
  view?: {azimuth?: number; elevation?: number; distance?: number};
  /** Height of the point the camera looks at. */
  target?: number;
  /** Retractable roofs: pose the moving layers for open fraction t (0 closed, 1 open). */
  animateRoof?: (layers: Record<string, THREE.Group>, t: number) => void;
}

export type StadiumModelFn = (ctx: ModelContext) => ModelResult;
