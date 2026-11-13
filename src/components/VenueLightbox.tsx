import {Lightbox} from '@astryxdesign/core/Lightbox';
import {VENUE_BY_ID} from '../data';
import {isometricUrl, type IsometricArt} from '../data/isometric';
import {sourceCaption} from './Media';

/** The lightbox caption for a venue's illustration: its name, and a link to its Google Earth view. */
export function venueArtCaption(name: string, art: IsometricArt) {
  return sourceCaption(name, {href: art.earth, label: 'Google Earth'});
}

/**
 * The venue illustrations the map shows when zoomed in close, opened large; prev/next steps
 * through the other venues in view. Loaded only when one is opened.
 */
export default function VenueLightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: {venueId: string; art: IsometricArt}[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const media = items.map(({venueId, art}) => {
    const name = VENUE_BY_ID[venueId]?.name ?? venueId;
    return {src: isometricUrl(art), alt: `${name}, pixel-art illustration`, caption: venueArtCaption(name, art)};
  });
  return (
    <Lightbox
      isOpen
      onOpenChange={(open) => !open && onClose()}
      media={media.length === 1 ? media[0] : media}
      index={index}
      onIndexChange={onIndexChange}
      hasZoom
    />
  );
}
