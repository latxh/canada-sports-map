import type {KeyboardEvent, ReactNode} from 'react';
import {Card} from '@astryxdesign/core/Card';
import {Carousel} from '@astryxdesign/core/Carousel';
import {useLightbox} from '@astryxdesign/core/Lightbox';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import type {MediaPhoto} from '../data/media';
import {DESKTOP_QUERY, useMediaQuery} from '../hooks/useMediaQuery';

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

/** Where an image came from, linked at the end of its lightbox caption. */
export interface ImageSource {
  href: string;
  label: string;
}

/** A lightbox caption: the text, then a link to the image's source page. */
export function sourceCaption(text: string, source?: ImageSource): ReactNode {
  if (!source) return text;
  return (
    <>
      {text} ·{' '}
      <Link href={source.href} isExternalLink className="lightbox-source">
        {`Source: ${source.label}`}
      </Link>
    </>
  );
}

const photoCaption = (photo: MediaPhoto) =>
  sourceCaption(`${photo.caption} · Photo: ${photo.artist || 'unknown'}${photo.license ? `, ${photo.license}` : ''}`, {href: photo.page, label: 'Wikimedia Commons'});

/** A Commons photo; with a trigger, it opens in the lightbox (which credits it and links its source). */
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
    </VStack>
  );
}

/** A single photo that opens in the lightbox (e.g. a venue that no longer stands). */
export function ZoomablePhoto({photo, height}: {photo: MediaPhoto; height?: number}) {
  const lightbox = useLightbox({media: {src: mediaAsset(photo.file), alt: photo.caption, caption: photoCaption(photo)}, hasZoom: true});
  return (
    <>
      <PhotoFigure photo={photo} height={height} trigger={lightbox.triggerProps} />
      {lightbox.isOpen && lightbox.element}
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
      {lightbox.isOpen && lightbox.element}
    </>
  );
}

export interface GalleryItem {
  key: string;
  caption: string;
  width?: number;
  /** What the card shows. */
  thumb: ReactNode;
  /** The image the lightbox shows, with its source; items without one (illustrations) don't open. */
  full?: {src: string; alt: string; caption: string; source?: ImageSource};
}

/** A carousel of captioned cards whose images open in the lightbox, stepping through the set. */
export function GalleryCarousel({label, items}: {label: string; items: GalleryItem[]}) {
  const zoomable = items.filter((it) => it.full);
  const lightbox = useLightbox({
    media: zoomable.map((it) => ({src: it.full!.src, alt: it.full!.alt, caption: sourceCaption(it.full!.caption, it.full!.source)})),
    hasZoom: true,
  });
  return (
    <>
      <CardCarousel label={label}>
        {items.map((it) => {
          const index = it.full ? zoomable.indexOf(it) : -1;
          return (
            <CarouselCard key={it.key} width={it.width} caption={it.caption}>
              <Zoomable trigger={index >= 0 ? lightbox.getTriggerProps(index) : undefined} label={it.full?.alt ?? it.caption}>
                {it.thumb}
              </Zoomable>
            </CarouselCard>
          );
        })}
      </CardCarousel>
      {zoomable.length > 0 && lightbox.isOpen && lightbox.element}
    </>
  );
}

/**
 * A horizontal carousel of cards with a caption under each. On phones it is swipe-only and runs
 * the full width of the drawer (its inline padding keeps the first card in line with the content).
 */
export function CardCarousel({label, children}: {label: string; children: ReactNode}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (!isDesktop) {
    return (
      <Carousel
        aria-label={label}
        gap={2}
        hasSnap
        hasButtons={false}
        hasEdgeFade={false}
        padding={4}
        // Out to both edges of the drawer, past its 16px content padding.
        style={{marginInline: -16, width: 'calc(100% + 32px)', maxWidth: 'none'}}>
        {children}
      </Carousel>
    );
  }
  return (
    <Carousel aria-label={label} gap={2} hasSnap>
      {children}
    </Carousel>
  );
}

export function CarouselCard({width = 168, caption, children}: {width?: number; caption: ReactNode; children: ReactNode}) {
  return (
    <Card variant="muted" padding={3} width={width} className="shrink-0">
      <VStack gap={2} hAlign="center">
        {children}
        <Text size="sm" weight="semibold" hasTabularNumbers justify="center">
          {caption}
        </Text>
      </VStack>
    </Card>
  );
}
