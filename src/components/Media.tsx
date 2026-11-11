import type {ReactNode} from 'react';
import {Card} from '@astryxdesign/core/Card';
import {Carousel} from '@astryxdesign/core/Carousel';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import type {MediaPhoto} from '../data/media';

export const mediaAsset = (file: string) => `${import.meta.env.BASE_URL}media/${file}`;

/** A Commons photo with its credit underneath. */
export function PhotoFigure({photo, height = 180, width}: {photo: MediaPhoto; height?: number; width?: number}) {
  return (
    <VStack gap={1}>
      <img
        src={mediaAsset(photo.file)}
        alt={photo.caption}
        loading="lazy"
        decoding="async"
        className="card-radius block w-full object-cover"
        style={{height, width}}
      />
      <Text type="supporting" size="xsm" maxLines={1}>
        <Link href={photo.page} isExternalLink>
          {photo.artist || 'Wikimedia Commons'}
        </Link>
        {photo.license ? ` · ${photo.license}` : ''}
      </Text>
    </VStack>
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
    <Card variant="muted" padding={3} width={width} className="shrink-0">
      <VStack gap={2} hAlign="center">
        {children}
        <VStack gap={0.5} hAlign="center">
          <Text size="sm" weight="semibold" hasTabularNumbers justify="center">
            {caption}
          </Text>
          {credit}
        </VStack>
      </VStack>
    </Card>
  );
}

/** "SportsLogos.net" under an image from there, linking to its page. */
export function SportsLogosCredit({page}: {page: string}) {
  return (
    <Text size="sm" color="secondary">
      <Link href={page} target="_blank" label="SportsLogos.net (opens in new tab)">
        SportsLogos.net
      </Link>
    </Text>
  );
}
