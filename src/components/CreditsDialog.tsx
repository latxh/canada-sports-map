import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Layout, LayoutContent, HStack} from '@astryxdesign/core/Layout';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {VStack} from '@astryxdesign/core/VStack';
import {Text} from '@astryxdesign/core/Text';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {DATA_AS_OF, LEAGUES, TEAM_BY_ID, type LeagueId} from '../data';
import {LOGOS} from '../data/logos';
import {HISTORICAL_LOGOS, TEAM_PHOTOS, VENUE_PHOTOS} from '../data/media';
import {ExternalIcon} from './icons';
import {SectionTitle} from './bits';

const REPO = 'https://github.com/latxh/canada-sports-map';

const TOOLS = [
  {name: 'Astryx', href: 'https://github.com/facebook/astryx', note: 'UI components and theme'},
  {name: 'three.js & React Three Fiber', href: 'https://threejs.org/', note: '3D stadium models'},
  {name: 'd3 & TopoJSON', href: 'https://d3js.org/', note: 'Map projection and pan and zoom'},
];

const SOURCES = [
  {name: 'Wikipedia', href: 'https://en.wikipedia.org/', note: 'Team, venue and championship facts (CC BY-SA 4.0)'},
  {name: 'SportsLogos.net', href: 'https://www.sportslogos.net/', note: 'Logo, uniform and playing-surface history, used with permission'},
  {name: 'Wikimedia Commons', href: 'https://commons.wikimedia.org/', note: 'Logo files and photos, listed below with their licences'},
  {name: 'Statistics Canada', href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810000301', note: '2021 Census population'},
  {name: 'Natural Earth', href: 'https://www.naturalearthdata.com/', note: 'Map data (public domain)'},
  {name: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright', note: 'Venue footprints for the 3D models (ODbL)'},
];

interface FileCredit {
  key: string;
  label: string;
  page: string;
  license: string;
}

const LOGO_CREDITS: FileCredit[] = Object.entries(LOGOS)
  .map(([key, l]) => ({
    key,
    label: key.startsWith('league-') ? LEAGUES[key.slice(7) as LeagueId].name : (TEAM_BY_ID[key]?.name ?? key),
    page: l.page,
    license: l.license,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const HISTORICAL_CREDITS: FileCredit[] = Object.entries(HISTORICAL_LOGOS)
  .flatMap(([id, list]) => list.map((l) => ({key: l.file, label: `${TEAM_BY_ID[id]?.name ?? id}, ${l.from}${l.to ? `–${l.to}` : '–'}`, page: l.page, license: l.license})))
  .sort((a, b) => a.label.localeCompare(b.label));

const PHOTO_CREDITS: FileCredit[] = [...Object.values(TEAM_PHOTOS).flat(), ...Object.values(VENUE_PHOTOS)]
  .filter((p, i, all) => all.findIndex((q) => q.page === p.page) === i)
  .map((p) => ({key: p.file, label: p.caption, page: p.page, license: [p.artist, p.license].filter(Boolean).join(' · ')}));

/** Name (linked) and a short note per line. */
function LinkList({items}: {items: {name: string; href: string; note: string}[]}) {
  return (
    <List density="compact" edge="flush">
      {items.map((s) => (
        <ListItem
          key={s.name}
          label={
            <Link href={s.href} isExternalLink>
              {s.name}
            </Link>
          }
          description={s.note}
        />
      ))}
    </List>
  );
}

/** One file list, collapsed behind a full-width, rounded header. */
function FileList({title, items}: {title: string; items: FileCredit[]}) {
  if (items.length === 0) return null;
  return (
    <Collapsible
      className="credit-files"
      defaultIsOpen={false}
      trigger={
        <HStack gap={2} vAlign="center" hAlign="between" className="w-full">
          <Text weight="semibold">{title}</Text>
          <Text type="supporting" hasTabularNumbers>
            {items.length}
          </Text>
        </HStack>
      }>
      <List density="compact" edge="flush">
        {items.map((c) => (
          <ListItem
            key={c.key}
            label={
              <Link href={c.page} isExternalLink>
                {c.label}
              </Link>
            }
            description={c.license || 'See file page'}
          />
        ))}
      </List>
    </Collapsible>
  );
}

export function CreditsDialog({isOpen, onOpenChange}: {isOpen: boolean; onOpenChange: (open: boolean) => void}) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={520} maxHeight="85dvh">
      {/* The header sticks to the top of the scrolling content, frosted like the side panel's. */}
      <Layout
        content={
          <LayoutContent>
            <VStack className="glass-panel-header credits-header sticky z-10 -mx-4">
              <DialogHeader title="Credits" onOpenChange={onOpenChange} hasDivider={false} />
            </VStack>
            <VStack gap={5}>
              <VStack gap={3}>
                <Text>
                  An unofficial fan project by{' '}
                  {/* Kept with its comma so the comma never wraps onto a line of its own. */}
                  <span className="whitespace-nowrap">
                    <Link href="https://latchman.ca" isExternalLink>
                      Brian Latchman
                    </Link>
                    ,
                  </span>{' '}
                  not affiliated with or endorsed by any league or team.
                </Text>
                <HStack gap={2} wrap="wrap">
                  <Button href={REPO} target="_blank" variant="secondary" size="sm" label="GitHub" icon={<Icon icon={ExternalIcon} />} />
                </HStack>
              </VStack>

              <VStack gap={1}>
                <SectionTitle>Built with</SectionTitle>
                <LinkList items={TOOLS} />
              </VStack>

              <VStack gap={1}>
                <SectionTitle>Sources</SectionTitle>
                <LinkList items={SOURCES} />
              </VStack>

              <VStack gap={2}>
                <SectionTitle>Files</SectionTitle>
                <FileList title="Logos" items={LOGO_CREDITS} />
                <FileList title="Historical logos" items={HISTORICAL_CREDITS} />
                <FileList title="Photos" items={PHOTO_CREDITS} />
              </VStack>

              <VStack gap={1}>
                <SectionTitle>About the visuals</SectionTitle>
                <Text type="supporting">
                  Trophies, and badges, uniforms and surfaces without a source image, are original illustrations. The 3D venues are hand-built,
                  low-poly models drawn to scale. Data is current to {DATA_AS_OF}.
                </Text>
              </VStack>

              <VStack gap={1}>
                <SectionTitle>Privacy</SectionTitle>
                <Text type="supporting">
                  Google Analytics counts visits and which views people use, with no advertising features. Analytics cookies are off in the EU,
                  the UK, Switzerland and Quebec.
                </Text>
              </VStack>

              {/* Same full-width style as the link buttons at the bottom of the panels. */}
              <Button
                href={`${REPO}/issues`}
                target="_blank"
                width="100%"
                variant="ghost"
                className="link-button"
                label="Report a mistake"
                icon={<Icon icon={ExternalIcon} />}
              />
            </VStack>
          </LayoutContent>
        }
      />
    </Dialog>
  );
}
