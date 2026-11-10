import type {ReactNode} from 'react';
import {Token} from '@astryxdesign/core/Token';
import {Badge} from '@astryxdesign/core/Badge';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {LEAGUES, type LeagueId, type Team, type TeamStatus} from '../data';

type TokenColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'cyan' | 'blue' | 'purple' | 'pink' | 'gray';

export const LEAGUE_TOKEN_COLOR: Record<LeagueId, TokenColor> = {
  NHL: 'gray',
  NBA: 'orange',
  MLB: 'blue',
  MLS: 'teal',
  CFL: 'red',
  CPL: 'purple',
  NLL: 'yellow',
  CEBL: 'pink',
  PWHL: 'purple',
  WNBA: 'orange',
  NSL: 'cyan',
  CDL: 'gray',
};

export function LeagueDot({league, size = 10}: {league: LeagueId; size?: number}) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{width: size, height: size, background: LEAGUES[league].color, boxShadow: '0 0 0 2px var(--color-background-surface)'}}
    />
  );
}

export function LeagueToken({league, size = 'sm'}: {league: LeagueId; size?: 'sm' | 'md'}) {
  return <Token label={league} size={size} color={LEAGUE_TOKEN_COLOR[league]} description={LEAGUES[league].name} />;
}

export function StatusBadge({status}: {status: TeamStatus}) {
  if (status === 'current') return <Badge variant="success" label="Active" />;
  if (status === 'relocated') return <Badge variant="warning" label="Relocated" />;
  return <Badge variant="neutral" label="Defunct" />;
}

export function SectionTitle({children, endContent}: {children: ReactNode; endContent?: ReactNode}) {
  return (
    <HStack gap={2} hAlign="between" vAlign="center" paddingBlockStart={2}>
      <Heading level={3} color="secondary" className="text-xs uppercase tracking-wider">
        {children}
      </Heading>
      {endContent}
    </HStack>
  );
}

export function championshipLabel(team: Team): string {
  const n = team.championships.length;
  const plural = n === 1 ? '' : 's';
  if (team.league === 'MLB') return n ? `${n} World Series title${plural}` : 'No World Series titles';
  if (team.league === 'NBA') return n ? `${n} NBA championship${plural}` : 'No NBA championships';
  const trophy = LEAGUES[team.league].trophy;
  return n ? `${n} ${trophy}${plural}` : `No ${trophy}s`;
}
