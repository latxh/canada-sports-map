import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {VStack} from '@astryxdesign/core/VStack';
import {Text} from '@astryxdesign/core/Text';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {DATA_AS_OF, LEAGUES, TEAM_BY_ID, type LeagueId} from '../data';
import {LOGOS} from '../data/logos';
import {SectionTitle} from './bits';

const SOURCES = [
  {
    name: 'Wikipedia',
    href: 'https://en.wikipedia.org/',
    note: 'Team, venue and championship facts are compiled and paraphrased from Wikipedia articles (CC BY-SA 4.0). Every team and venue links to its article.',
  },
  {
    name: 'SportsLogos.net',
    href: 'https://www.sportslogos.net/',
    note: 'Reference for logo and uniform eras. We link to the league archives there and do not copy their images. Logos and uniforms are trademarks of their teams and leagues.',
  },
  {
    name: 'Wikipedia & Wikimedia Commons logos',
    href: 'https://commons.wikimedia.org/',
    note: 'Current team and league logos are the files used on each Wikipedia article (listed below with their licences). Most are non-free trademarks shown only to identify the team or league.',
  },
  {
    name: 'Natural Earth',
    href: 'https://www.naturalearthdata.com/',
    note: 'Province, coastline and lake boundaries (public domain), simplified for the web.',
  },
  {
    name: 'OpenStreetMap',
    href: 'https://www.openstreetmap.org/copyright',
    note: 'Venue footprints, stand layouts and dimensions, used as references for the 3D models. © OpenStreetMap contributors (ODbL).',
  },
];

const TOOLS = [
  {name: 'Astryx design system', href: 'https://github.com/facebook/astryx', note: 'UI components and theme (MIT).'},
  {name: 'three.js / React Three Fiber', href: 'https://threejs.org/', note: 'Low-poly 3D stadium models (MIT).'},
  {name: 'd3-geo, d3-zoom & TopoJSON', href: 'https://d3js.org/', note: 'Map projection and pan/zoom (ISC).'},
];

const LOGO_CREDITS = Object.entries(LOGOS)
  .map(([key, l]) => ({
    key,
    label: key.startsWith('league-') ? LEAGUES[key.slice(7) as LeagueId].name : (TEAM_BY_ID[key]?.name ?? key),
    page: l.page,
    license: l.license,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function CreditsDialog({isOpen, onOpenChange}: {isOpen: boolean; onOpenChange: (open: boolean) => void}) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={560} maxHeight="85dvh">
      <DialogHeader title="Credits & sources" subtitle={`Data reviewed ${DATA_AS_OF}`} onOpenChange={onOpenChange} />
      <VStack gap={4} paddingBlockStart={3}>
        <Text>
          Canada Sports Atlas is an unofficial fan project. It is not affiliated with or endorsed by any league or team shown.
        </Text>
        <VStack gap={1}>
          <SectionTitle>Sources</SectionTitle>
          <List hasDividers edge="flush">
            {SOURCES.map((s) => (
              <ListItem
                key={s.name}
                align="start"
                label={
                  <Link href={s.href} isExternalLink>
                    {s.name}
                  </Link>
                }
                description={s.note}
              />
            ))}
          </List>
        </VStack>
        <VStack gap={1}>
          <SectionTitle>Built with</SectionTitle>
          <List hasDividers edge="flush" density="compact">
            {TOOLS.map((s) => (
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
        </VStack>
        <Collapsible trigger={<Text weight="semibold">Logo files ({LOGO_CREDITS.length})</Text>} defaultIsOpen={false}>
          <List density="compact" edge="flush">
            {LOGO_CREDITS.map((c) => (
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
        <VStack gap={1}>
          <SectionTitle>About the visuals</SectionTitle>
          <Text type="supporting">
            Current logos are the official marks of their teams and leagues. Trophies, badges for earlier eras, uniforms and playing
            surfaces are original illustrations, not reproductions of official artwork. The 3D models of the 24 venues current
            NHL, NBA, MLB, MLS, CFL and CPL teams play in are hand-built, low-poly approximations drawn to scale from OpenStreetMap footprints, with Wikimedia Commons photos
            used only as visual references. Former venues are not modelled, and venues used only by the newer leagues are not modelled yet.
          </Text>
          <Text type="supporting">
            Capacities are approximate. The 2026 NSL final (November 14), the 113th Grey Cup (November 15) and the 2026 CPL Final had not been played when the
            data was last reviewed. Spot a mistake? Open an issue on GitHub.
          </Text>
        </VStack>
      </VStack>
    </Dialog>
  );
}
