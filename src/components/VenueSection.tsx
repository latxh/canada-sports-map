import {useEffect, useState} from 'react';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {useLightbox} from '@astryxdesign/core/Lightbox';
import {Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {Selector} from '@astryxdesign/core/Selector';
import {VStack} from '@astryxdesign/core/VStack';
import type {Sport, Venue} from '../data';
import {VENUE_PHOTOS} from '../data/media';
import {ISOMETRIC_VENUES, isometricUrl, type IsometricArt} from '../data/isometric';
import {ExpandIcon} from './icons';
import {SectionTitle} from './bits';
import {sourceCaption, ZoomablePhoto} from './Media';

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
 * A venue's pixel-art illustration, repainted from a Google Earth 3D view; it opens in the
 * lightbox, which links that view in Google Earth.
 */
function IsometricFigure({venue, art}: {venue: Venue; art: IsometricArt}) {
  const src = isometricUrl(art);
  const alt = `${venue.name}, isometric illustration`;
  const caption = sourceCaption(venue.name, {href: art.earth, label: 'Google Earth'});
  const lightbox = useLightbox({media: {src, alt, caption}, hasZoom: true});
  return (
    <section className="card-radius venue-art relative overflow-hidden border border-border">
      <span {...lightbox.triggerProps} aria-label={`View larger: ${alt}`} className="lightbox-trigger block h-full w-full">
        <img src={src} alt={alt} className="venue-art-image" decoding="async" loading="lazy" width={1024} height={640} />
      </span>
      <span className="glass absolute right-2 bottom-2 flex items-center gap-1 rounded-full p-1">
        <IconButton size="sm" variant="ghost" className="rounded-full" label={`Open ${venue.name} full screen`} tooltip="Full screen" icon={<Icon icon={ExpandIcon} />} onClick={lightbox.triggerProps.onClick} />
      </span>
      {lightbox.isOpen && lightbox.element}
    </section>
  );
}

/**
 * A place's venues: pick one from the dropdown, see its isometric illustration (or, for a venue
 * that no longer stands, its photo), and read the four numbers that matter.
 */
export function VenueSection({entries, title = 'Venues'}: {entries: VenueEntry[]; title?: string}) {
  const [selectedId, setSelectedId] = useState(entries[0]?.venue.id);
  useEffect(() => setSelectedId(entries[0]?.venue.id), [entries]);
  const selected = entries.find((e) => e.venue.id === selectedId) ?? entries[0];
  if (!selected) return null;
  const v = selected.venue;
  const art = ISOMETRIC_VENUES[v.id];
  const photo = VENUE_PHOTOS[v.id];

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
      {art ? <IsometricFigure key={v.id} venue={v} art={art} /> : photo ? <ZoomablePhoto photo={photo} height={200} /> : null}
      <Grid columns={2} gap={2}>
        <Stat label={v.closed ? 'Years' : 'Opened'} value={v.closed ? venueYears(v) : v.opened ? String(v.opened) : '—'} />
        <Stat label="Capacity" value={v.capacity ? v.capacity.toLocaleString('en-CA') : '—'} />
        <Stat label="Surface" value={SURFACE_LABEL[v.surface]} />
        <Stat label="Roof" value={ROOF_LABEL[v.roof]} />
      </Grid>

    </VStack>
  );
}
