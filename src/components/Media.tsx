import type {ReactNode} from 'react';
import {Card} from '@astryxdesign/core/Card';
import {Carousel} from '@astryxdesign/core/Carousel';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import type {MediaPhoto} from '../data/media';
import {ExternalIcon} from './icons';

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
