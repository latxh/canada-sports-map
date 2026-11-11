import {lazy, Suspense, useEffect, useState} from 'react';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {Selector} from '@astryxdesign/core/Selector';
import {VStack} from '@astryxdesign/core/VStack';
import {CITY_BY_ID, type Sport, type Venue} from '../data';
import {VENUE_PHOTOS} from '../data/media';
import {hasStadiumModel} from '../three/modelIds';
import {ExpandIcon} from './icons';
import {SectionTitle} from './bits';
import {ZoomablePhoto} from './Media';

const StadiumViewer = lazy(() => import('../three/StadiumViewer'));

export interface VenueEntry {
  venue: Venue;
  /** e.g. "Maple Leafs 1999–present" */
  note: string;
  sport: Sport;
  seatColor: string;
  accentColor: string;
}

const SURFACE_LABEL: Record<Venue['surface'], string> = {
  ice: 'Ice',
  hardwood: 'Hardwood',
  grass: 'Grass',
  turf: 'Turf',
  hybrid: 'Hybrid grass',
};

const ROOF_LABEL: Record<Venue['roof'], string> = {
  indoor: 'Roofed',
  'fixed-dome': 'Roofed',
  retractable: 'Retractable roof',
  open: 'Open-air',
  canopy: 'Open-air',
};

export function formatCapacity(c: number | null) {
  return c == null ? 'Capacity n/a' : `≈${c.toLocaleString('en-CA')} seats`;
}

export function venueYears(v: Venue) {
  if (v.opened == null) return v.closed ? `until ${v.closed}` : 'In use';
  return v.closed ? `${v.opened}–${v.closed}` : `Opened ${v.opened}`;
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <Card variant="muted" padding={3}>
      <VStack gap={0.5}>
        <Text type="supporting" size="xsm">
          {label}
        </Text>
        <Text weight="semibold" size="lg" hasTabularNumbers>
          {value}
        </Text>
      </VStack>
    </Card>
  );
}

/**
 * A place's venues: pick one from the dropdown, turn its 3D model (or see its photo),
 * and read the four numbers that matter.
 */
export function VenueSection({entries, title = 'Venues'}: {entries: VenueEntry[]; title?: string}) {
  const [selectedId, setSelectedId] = useState(entries[0]?.venue.id);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => setSelectedId(entries[0]?.venue.id), [entries]);
  const selected = entries.find((e) => e.venue.id === selectedId) ?? entries[0];
  if (!selected) return null;
  const v = selected.venue;
  const hasModel = hasStadiumModel(v.id);
  const photo = VENUE_PHOTOS[v.id];

  const viewer = (height: number | string, isFullscreen = false) => (
    <Suspense fallback={<Skeleton width="100%" height={typeof height === 'number' ? height : 320} />}>
      <StadiumViewer
        venue={v}
        sport={selected.sport}
        seatColor={selected.seatColor}
        accentColor={selected.accentColor}
        height={height}
        isFullscreen={isFullscreen}
        endControls={
          isFullscreen ? undefined : (
            <IconButton
              size="sm"
              variant="ghost"
              className="rounded-full"
              label={`Open ${v.name} 3D model full screen`}
              tooltip="Full screen"
              icon={<Icon icon={ExpandIcon} />}
              onClick={() => setIsExpanded(true)}
            />
          )
        }
      />
    </Suspense>
  );

  return (
    <VStack gap={2}>
      <SectionTitle>{title}</SectionTitle>
      {entries.length > 1 ? (
        <Selector
          label="Venue"
          isLabelHidden
          variant="secondary"
          width="100%"
          value={selected.venue.id}
          onChange={(id) => id && setSelectedId(id)}
          options={entries.map((e) => ({value: e.venue.id, label: e.venue.name, description: e.note}))}
        />
      ) : (
        <Text weight="semibold" size="lg">
          {v.name}
        </Text>
      )}
      {hasModel ? isExpanded ? <Skeleton width="100%" height={260} /> : viewer(260) : photo ? <ZoomablePhoto photo={photo} height={200} /> : null}
      <Grid columns={2} gap={2}>
        <Stat label={v.closed ? 'Years' : 'Opened'} value={v.closed ? venueYears(v) : v.opened ? String(v.opened) : '—'} />
        <Stat label="Capacity" value={v.capacity ? v.capacity.toLocaleString('en-CA') : '—'} />
        <Stat label="Surface" value={SURFACE_LABEL[v.surface]} />
        <Stat label="Roof" value={ROOF_LABEL[v.roof]} />
      </Grid>

      {/* A lightbox, like enlarged images: the app stays visible behind it. */}
      <Dialog isOpen={isExpanded} onOpenChange={setIsExpanded} width="min(1180px, 94vw)" maxHeight="94dvh" padding={4}>
        <DialogHeader title={v.name} subtitle={`${CITY_BY_ID[v.cityId]?.name ?? ''} · ${venueYears(v)} · ${formatCapacity(v.capacity)}`} onOpenChange={setIsExpanded} />
        <div className="arena-lightbox pt-3">{isExpanded && hasModel && viewer('min(74dvh, 820px)', true)}</div>
      </Dialog>
    </VStack>
  );
}
