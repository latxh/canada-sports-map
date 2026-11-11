import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Text} from '@astryxdesign/core/Text';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {LocateIcon, PeopleIcon, PinIcon, TerritoryIcon, TrophyIcon} from './icons';
import type {MapView} from './HeaderControls';

export interface LatLon {
  lat: number;
  lon: number;
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLon, b: LatLon) {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Green (near) → yellow → red (far), for t in [0, 1]. */
export function distanceColor(t: number) {
  const hue = 135 * (1 - Math.max(0, Math.min(1, t)));
  return `hsl(${hue.toFixed(0)} 78% 46%)`;
}

export function formatKm(km: number) {
  return `${Math.round(km).toLocaleString('en-CA')} km`;
}

/**
 * Map toggles in the top pill. Population, Championships and Closest team are layers (one
 * at a time); the pin works with any of them.
 */
export function MapToolToggles({
  view,
  onViewChange,
  isPinMode,
  onPinModeChange,
  showClosest,
  onShowClosestChange,
}: {
  view: MapView;
  onViewChange: (v: MapView) => void;
  isPinMode: boolean;
  onPinModeChange: (on: boolean) => void;
  showClosest: boolean;
  onShowClosestChange: (on: boolean) => void;
}) {
  return (
    <>
      <ToggleButton
        className="rounded-full"
        label="Population"
        isIconOnly
        tooltip="Population"
        icon={<Icon icon={PeopleIcon} />}
        isPressed={view === 'population'}
        onPressedChange={(on) => onViewChange(on ? 'population' : 'teams')}
      />
      <ToggleButton
        className="rounded-full"
        label="Championships"
        isIconOnly
        tooltip="Championships"
        icon={<Icon icon={TrophyIcon} />}
        isPressed={view === 'titles'}
        onPressedChange={(on) => onViewChange(on ? 'titles' : 'teams')}
      />
      <ToggleButton
        className="rounded-full"
        label="Closest team"
        isIconOnly
        tooltip="Closest team everywhere"
        icon={<Icon icon={TerritoryIcon} />}
        isPressed={showClosest}
        onPressedChange={onShowClosestChange}
      />
      <ToggleButton
        className="rounded-full"
        label="Drop a pin"
        isIconOnly
        tooltip="Drop a pin: distances to every city"
        icon={<Icon icon={PinIcon} />}
        isPressed={isPinMode}
        onPressedChange={onPinModeChange}
      />
    </>
  );
}

export interface PinDistance {
  id: string;
  name: string;
  km: number;
  color: string;
}

/** The pin card: a hint before the first pin, then the nearest cities and the farthest one. */
export function PinCard({
  distances,
  hasPin,
  onLocate,
  locateError,
  onClear,
  onOpenCity,
  isCompact = false,
}: {
  /** Phones: the card fills the space beside the map controls instead of a fixed width. */
  isCompact?: boolean;
  distances: PinDistance[];
  hasPin: boolean;
  onLocate: () => void;
  locateError: boolean;
  onClear: () => void;
  onOpenCity: (id: string) => void;
}) {
  if (!hasPin) {
    return (
      <div className={`glass glass-strong card-radius pointer-events-auto p-3 ${isCompact ? 'w-full' : 'w-64'}`}>
        <VStack gap={2}>
          <Text weight="semibold">Drop a pin</Text>
          <Text type="supporting" size="sm">
            Tap anywhere on the map to see how far every city is.
          </Text>
          <Button size="sm" variant="secondary" label="Use my location" icon={<Icon icon={LocateIcon} />} onClick={onLocate} />
          {locateError && (
            <Text type="supporting" size="xsm">
              Your location isn’t available here. Tap the map instead.
            </Text>
          )}
        </VStack>
      </div>
    );
  }
  const near = distances.slice(0, 5);
  const far = distances.length > 5 ? distances[distances.length - 1] : null;
  return (
    <div className={`glass glass-strong card-radius pointer-events-auto py-2 ps-3 pe-2 ${isCompact ? 'w-full' : 'w-64'}`}>
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Nearest cities</Text>
        <IconButton size="sm" variant="ghost" className="rounded-full" label="Remove pin" tooltip="Remove pin" icon={<Icon icon="close" />} onClick={onClear} />
      </HStack>
      <ol className="flex flex-col">
        {near.map((d) => (
          <DistanceRow key={d.id} d={d} onOpenCity={onOpenCity} />
        ))}
      </ol>
      {far && (
        <>
          <Text type="supporting" size="xsm" className="mt-1 block">
            Farthest
          </Text>
          <ol className="flex flex-col">
            <DistanceRow d={far} onOpenCity={onOpenCity} />
          </ol>
        </>
      )}
    </div>
  );
}

function DistanceRow({d, onOpenCity}: {d: PinDistance; onOpenCity: (id: string) => void}) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-start hover:bg-[var(--color-background-muted)]"
        onClick={() => onOpenCity(d.id)}>
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{background: d.color}} />
        <Text size="sm" className="min-w-0 flex-1" maxLines={1}>
          {d.name}
        </Text>
        <Text size="sm" type="supporting" hasTabularNumbers>
          {formatKm(d.km)}
        </Text>
      </button>
    </li>
  );
}
