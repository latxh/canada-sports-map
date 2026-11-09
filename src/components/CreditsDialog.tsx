import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {VStack} from '@astryxdesign/core/VStack';
import {Text} from '@astryxdesign/core/Text';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {DATA_AS_OF} from '../data';
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
    name: 'Natural Earth',
    href: 'https://www.naturalearthdata.com/',
    note: 'Province, coastline and lake boundaries (public domain), simplified for the web.',
  },
];

const TOOLS = [
  {name: 'Astryx design system', href: 'https://github.com/facebook/astryx', note: 'UI components and theme (MIT).'},
  {name: 'three.js / React Three Fiber', href: 'https://threejs.org/', note: 'Procedural 3D stadium models (MIT).'},
  {name: 'd3-geo, d3-zoom & TopoJSON', href: 'https://d3js.org/', note: 'Map projection and pan/zoom (ISC).'},
];

export function CreditsDialog({isOpen, onOpenChange}: {isOpen: boolean; onOpenChange: (open: boolean) => void}) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={560} maxHeight="85dvh">
      <DialogHeader title="Credits & sources" subtitle={`Data reviewed ${DATA_AS_OF}`} onOpenChange={onOpenChange} />
      <VStack gap={4} paddingBlockStart={3}>
        <Text>
          Canada Sports Atlas is an unofficial fan project. It is not affiliated with or endorsed by the NHL, NBA, MLB, MLS, CFL, CPL or
          any team.
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
        <VStack gap={1}>
          <SectionTitle>About the visuals</SectionTitle>
          <Text type="supporting">
            Team badges, uniforms and playing surfaces are original illustrations in each era’s colours. They are not reproductions of
            official artwork. 3D stadiums are generated from a handful of parameters (shape, capacity, roof, signature features), so
            they are approximate.
          </Text>
          <Text type="supporting">
            Capacities are approximate. The 113th Grey Cup (November 15, 2026) and the 2026 CPL Final had not been played when the
            data was last reviewed. Spot a mistake? Open an issue on GitHub.
          </Text>
        </VStack>
      </VStack>
    </Dialog>
  );
}
