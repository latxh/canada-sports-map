import type {KeyboardEvent, ReactNode} from 'react';
import {Card} from '@astryxdesign/core/Card';
import {Carousel} from '@astryxdesign/core/Carousel';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {useLightbox} from '@astryxdesign/core/Lightbox';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import type {MediaPhoto} from '../data/media';
import {ExternalIcon} from './icons';

export const mediaAsset = (file: string) => `${import.meta.env.BASE_URL}media/${file}`;

/** Props from useLightbox's getTriggerProps: makes an element open the lightbox. */
export type LightboxTrigger = {role: 'button'; tabIndex: 0; 'aria-haspopup': 'dialog'; onClick: () => void; onKeyDown: (e: KeyboardEvent) => void};

/** Wraps a thumbnail so a click, Enter or Space opens it in the lightbox. */
function Zoomable({trigger, label, children}: {trigger?: LightboxTrigger; label: string; children: ReactNode}) {
  if (!trigger) return <>{children}</>;
  return (
    <span {...trigger} aria-label={`View larger: ${label}`} className="lightbox-trigger">
      {children}
    </span>
  );
}

const photoCaption = (photo: MediaPhoto) => `${photo.caption} · Photo: ${photo.artist || 'Wikimedia Commons'}${photo.license ? `, ${photo.license}` : ''}`;

/** A Commons photo with its credit underneath; with a trigger, the photo opens in the lightbox. */
export function PhotoFigure({photo, height = 180, width, trigger}: {photo: MediaPhoto; height?: number; width?: number; trigger?: LightboxTrigger}) {
  return (
    <VStack gap={1}>
      <Zoomable trigger={trigger} label={photo.caption}>
        <img
          src={mediaAsset(photo.file)}
          alt={photo.caption}
          loading="lazy"
          decoding="async"
          className="card-radius block w-full object-cover"
          style={{height, width}}
        />
      </Zoomable>
      <Text type="supporting" size="xsm" maxLines={1}>
        <Link href={photo.page} isExternalLink>
          {photo.artist || 'Wikimedia Commons'}
        </Link>
        {photo.license ? ` · ${photo.license}` : ''}
      </Text>
    </VStack>
  );
}

/** A single photo that opens in the lightbox (e.g. a venue without a 3D model). */
export function ZoomablePhoto({photo, height}: {photo: MediaPhoto; height?: number}) {
  const lightbox = useLightbox({media: {src: mediaAsset(photo.file), alt: photo.caption, caption: photoCaption(photo)}, hasZoom: true});
  return (
    <>
      <PhotoFigure photo={photo} height={height} trigger={lightbox.triggerProps} />
      {lightbox.element}
    </>
  );
}

/** Photos in a carousel; each opens in the lightbox, which steps through the rest. */
export function PhotoCarousel({photos, label = 'Photos'}: {photos: MediaPhoto[]; label?: string}) {
  const lightbox = useLightbox({media: photos.map((p) => ({src: mediaAsset(p.file), alt: p.caption, caption: photoCaption(p)})), hasZoom: true});
  return (
    <>
      <CardCarousel label={label}>
        {photos.map((p, i) => (
          <span key={p.file} className="w-64 shrink-0">
            <PhotoFigure photo={p} height={170} trigger={lightbox.getTriggerProps(i)} />
          </span>
        ))}
      </CardCarousel>
      {lightbox.element}
    </>
  );
}

export interface GalleryItem {
  key: string;
  caption: string;
  width?: number;
  /** What the card shows. */
  thumb: ReactNode;
  /** The image the lightbox shows; items without one (illustrations) don't open. */
  full?: {src: string; alt: string; caption: string};
  credit?: ReactNode;
}

/** A carousel of captioned cards whose images open in the lightbox, stepping through the set. */
export function GalleryCarousel({label, items}: {label: string; items: GalleryItem[]}) {
  const zoomable = items.filter((it) => it.full);
  const lightbox = useLightbox({media: zoomable.map((it) => it.full!), hasZoom: true});
  return (
    <>
      <CardCarousel label={label}>
        {items.map((it) => {
          const index = it.full ? zoomable.indexOf(it) : -1;
          return (
            <CarouselCard key={it.key} width={it.width} caption={it.caption} credit={it.credit}>
              <Zoomable trigger={index >= 0 ? lightbox.getTriggerProps(index) : undefined} label={it.full?.alt ?? it.caption}>
                {it.thumb}
              </Zoomable>
            </CarouselCard>
          );
        })}
      </CardCarousel>
      {zoomable.length > 0 && lightbox.element}
    </>
  );
}

/** A horizontal carousel of cards with a caption under each. */
export function CardCarousel({label, children}: {label: string; children: ReactNode}) {
  return (
    <Carousel aria-label={label} gap={2} hasSnap>
      {children}
    </Carousel>
  );
}

export function CarouselCard({width = 168, caption, credit, children}: {width?: number; caption: ReactNode; credit?: ReactNode; children: ReactNode}) {
  return (
    <Card variant="muted" padding={3} width={width} className="relative shrink-0">
      <VStack gap={2} hAlign="center">
        {children}
        <Text size="sm" weight="semibold" hasTabularNumbers justify="center">
          {caption}
        </Text>
      </VStack>
      {credit && <span className="absolute top-1 right-1">{credit}</span>}
    </Card>
  );
}

/** A small link-out in the card's corner to the image's page on SportsLogos.net, its source. */
export function SportsLogosCredit({page}: {page: string}) {
  return (
    <IconButton
      href={page}
      target="_blank"
      size="sm"
      variant="ghost"
      label="View source on SportsLogos.net (opens in new tab)"
      tooltip="Source: SportsLogos.net"
      icon={<Icon icon={ExternalIcon} />}
    />
  );
}
