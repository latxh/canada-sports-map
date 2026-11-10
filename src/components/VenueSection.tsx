import {lazy, Suspense, useEffect, useState} from 'react';
import {List, ListItem} from '@astryxdesign/core/List';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {Text} from '@astryxdesign/core/Text';
import {Link} from '@astryxdesign/core/Link';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {VStack} from '@astryxdesign/core/VStack';
import {CITY_BY_ID, type Sport, type Venue} from '../data';
import {hasStadiumModel} from '../three/modelIds';
import {ExpandIcon, StadiumIcon} from './icons';
import {SectionTitle} from './bits';

const StadiumViewer = lazy(() => import('../three/StadiumViewer'));

export interface VenueEntry {
  venue: Venue;
  /** e.g. "Maple Leafs 1999–present" */
  note: string;
  sport: Sport;
  seatColor: string;
  accentColor: string;
}

const KIND_LABEL: Record<Venue['kind'], string> = {
  arena: 'Indoor arena',
  ballpark: 'Ballpark',
  football: 'Stadium',
  soccer: 'Soccer stadium',
  dome: 'Domed stadium',
};

const ROOF_LABEL: Record<Venue['roof'], string> = {
  indoor: 'Indoor',
  open: 'Open air',
  canopy: 'Canopy over seats',
  retractable: 'Retractable roof',
  'fixed-dome': 'Fixed roof',
};

const SURFACE_LABEL: Record<Venue['surface'], string> = {
  ice: 'Ice',
  hardwood: 'Hardwood',
  grass: 'Natural grass',
  turf: 'Artificial turf',
  hybrid: 'Hybrid grass',
};

export function formatCapacity(c: number | null) {
  return c == null ? 'Capacity n/a' : `≈${c.toLocaleString('en-CA')} seats`;
}

export function venueYears(v: Venue) {
  if (v.opened == null) return v.closed ? `until ${v.closed}` : 'In use';
  return v.closed ? `${v.opened}–${v.closed}` : `Opened ${v.opened}`;
}

export function VenueSection({entries, title = 'Venues'}: {entries: VenueEntry[]; title?: string}) {
  const [selectedId, setSelectedId] = useState(entries[0]?.venue.id);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => setSelectedId(entries[0]?.venue.id), [entries]);
  const selected = entries.find((e) => e.venue.id === selectedId) ?? entries[0];
  if (!selected) return null;
  const v = selected.venue;

  const hasModel = hasStadiumModel(v.id);
  const viewer = (height: number | string, isFullscreen = false) => (
    <Suspense fallback={<Skeleton width="100%" height={typeof height === 'number' ? height : 320} />}>
      <StadiumViewer
        venue={v}
        sport={selected.sport}
        seatColor={selected.seatColor}
        accentColor={selected.accentColor}
        height={height}
        isFullscreen={isFullscreen}
      />
    </Suspense>
  );

  return (
    <VStack gap={3}>
      <SectionTitle
        endContent={
          hasModel ? (
            <IconButton
              size="sm"
              variant="ghost"
              label={`Open ${v.name} 3D model full screen`}
              tooltip="Full screen"
              icon={<Icon icon={ExpandIcon} />}
              onClick={() => setIsExpanded(true)}
            />
          ) : undefined
        }>
        {title}: {v.name}
      </SectionTitle>
      {hasModel ? (
        isExpanded ? (
          <Skeleton width="100%" height={260} />
        ) : (
          viewer(260)
        )
      ) : (
        <Text type="supporting">{v.closed !== undefined ? '3D models are shown for the venues current teams play in.' : 'No 3D model of this venue yet.'}</Text>
      )}
      <MetadataList columns={2} label={{position: 'top'}}>
        <MetadataListItem label="Type">{KIND_LABEL[v.kind]}</MetadataListItem>
        <MetadataListItem label="Capacity">{formatCapacity(v.capacity)}</MetadataListItem>
        <MetadataListItem label="Years">{venueYears(v)}</MetadataListItem>
        <MetadataListItem label="Roof · Surface">
          {ROOF_LABEL[v.roof]} · {SURFACE_LABEL[v.surface]}
        </MetadataListItem>
      </MetadataList>
      {v.formerNames && v.formerNames.length > 0 && (
        <Text type="supporting">Also known as: {v.formerNames.join('; ')}</Text>
      )}
      <ul className="flex list-disc flex-col gap-1 ps-5">
        {v.facts.map((f) => (
          <li key={f}>
            <Text>{f}</Text>
          </li>
        ))}
      </ul>
      <Link href={v.wikipedia} isExternalLink isStandalone>
        {v.name} on Wikipedia
      </Link>

      {entries.length > 1 && (
        <List density="compact" hasDividers header={<Text type="label">Choose a venue</Text>}>
          {entries.map((e) => (
            <ListItem
              key={e.venue.id}
              label={e.venue.name}
              description={`${e.note} · ${formatCapacity(e.venue.capacity)}`}
              startContent={<Icon icon={StadiumIcon} color={e.venue.id === selected.venue.id ? 'accent' : 'secondary'} />}
              isSelected={e.venue.id === selected.venue.id}
              onClick={() => setSelectedId(e.venue.id)}
            />
          ))}
        </List>
      )}

      <Dialog isOpen={isExpanded} onOpenChange={setIsExpanded} variant="fullscreen" padding={4}>
        <DialogHeader title={v.name} subtitle={`${CITY_BY_ID[v.cityId]?.name ?? ''} · ${venueYears(v)} · ${formatCapacity(v.capacity)}`} onOpenChange={setIsExpanded} />
        <div className="pt-3">{isExpanded && hasModel && viewer('calc(100dvh - 180px)', true)}</div>
      </Dialog>
    </VStack>
  );
}
