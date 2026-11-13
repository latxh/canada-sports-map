import {useCallback, useMemo, useState, type KeyboardEvent, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Card} from '@astryxdesign/core/Card';
import {Carousel} from '@astryxdesign/core/Carousel';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Lightbox} from '@astryxdesign/core/Lightbox';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import type {MediaPhoto} from '../data/media';
import {DESKTOP_QUERY, useMediaQuery} from '../hooks/useMediaQuery';
import {ExternalIcon} from './icons';

export const mediaAsset = (file: string) => `${import.meta.env.BASE_URL}media/${file}`;

/** Props from useViewer's getTriggerProps: makes an element open the lightbox. */
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

/** Where an image came from, linked from the lightbox's top-right corner. */
export interface ImageSource {
  href: string;
  label: string;
}

/** One image for the lightbox: a plain-text caption, and where it came from. */
export interface ViewerItem {
  src: string;
  alt: string;
  caption?: string;
  source?: ImageSource;
}

/**
 * Astryx's Lightbox, with its top-right corner replaced by our own controls: a link to the
 * image's source and a close button, both with tooltips. They are portalled into the lightbox's
 * dialog (which sits in the top layer); its own close button is hidden by CSS (.viewer).
 * Same shape as useLightbox: triggers to open it, and the element to render while open.
 */
export function useViewer(media: ViewerItem | ViewerItem[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const open = useCallback((i = 0) => {
    setIndex(i);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const getTriggerProps = useCallback(
    (i: number): LightboxTrigger => ({
      role: 'button',
      tabIndex: 0,
      'aria-haspopup': 'dialog',
      onClick: () => open(i),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(i);
        }
      },
    }),
    [open],
  );
  const list = Array.isArray(media) ? media : [media];
  const lightboxMedia = useMemo(() => {
    const items = list.map(({src, alt, caption}) => ({src, alt, caption}));
    return Array.isArray(media) ? items : items[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);
  const source = list[index]?.source;
  const element = isOpen ? (
    <>
      <Lightbox ref={setDialog} className="viewer" isOpen onOpenChange={(o) => !o && close()} media={lightboxMedia} index={index} onIndexChange={setIndex} hasZoom />
      {dialog &&
        createPortal(
          <div className="viewer-actions">
            {source && (
              <IconButton
                variant="ghost"
                className="viewer-action"
                href={source.href}
                target="_blank"
                label={`Source: ${source.label} (opens in new tab)`}
                tooltip={`Source: ${source.label}`}
                icon={<Icon icon={ExternalIcon} size="sm" color="inherit" />}
              />
            )}
            <IconButton variant="ghost" className="viewer-action" label="Close" tooltip="Close" icon={<Icon icon="close" size="sm" color="inherit" />} onClick={close} />
          </div>,
          dialog,
        )}
    </>
  ) : null;
  return {isOpen, open, close, element, triggerProps: getTriggerProps(0), getTriggerProps};
}

const photoItem = (photo: MediaPhoto): ViewerItem => ({
  src: mediaAsset(photo.file),
  alt: photo.caption,
  caption: `${photo.caption} · Photo: ${photo.artist || 'unknown'}${photo.license ? `, ${photo.license}` : ''}`,
  source: {href: photo.page, label: 'Wikimedia Commons'},
});

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
  const lightbox = useViewer(photoItem(photo));
  return (
    <>
      <PhotoFigure photo={photo} height={height} trigger={lightbox.triggerProps} />
      {lightbox.isOpen && lightbox.element}
    </>
  );
}

/** Photos in a carousel; each opens in the lightbox, which steps through the rest. */
export function PhotoCarousel({photos, label = 'Photos'}: {photos: MediaPhoto[]; label?: string}) {
  const lightbox = useViewer(useMemo(() => photos.map(photoItem), [photos]));
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
  const lightbox = useViewer(useMemo(() => zoomable.map((it) => it.full!), [zoomable]));
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
