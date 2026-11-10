import {LEAGUES, type LeagueId, type Team} from '../data';
import {LOGOS} from '../data/logos';
import {latestEra} from '../lib/venues';
import {TeamBadge} from './TeamBadge';

export const logoAsset = (file: string) => `${import.meta.env.BASE_URL}logos/${file}`;
const asset = logoAsset;

export type LogoPlate = 'auto' | 'subtle' | 'none';

/** A logo image by file name in public/logos, or by full `src` (e.g. a historical logo in public/media). */
export function LogoImage({file, src, alt, size, plate = 'auto', kind}: {file?: string; src?: string; alt: string; size: number; plate?: LogoPlate; kind?: 'league'}) {
  // alt='' marks a decorative logo next to visible text.
  return (
    <span
      data-plate={plate}
      data-kind={kind}
      className={`logo-chip inline-flex shrink-0 items-center justify-center ${size >= 64 ? 'rounded-2xl' : 'rounded-lg'}`}
      style={{width: size, height: size}}>
      <img src={src ?? asset(file ?? '')} alt={alt} width={size} height={size} loading="lazy" decoding="async" className="size-full object-contain" />
    </span>
  );
}

/** The team's official logo (from Wikipedia) when we have it, otherwise our illustrated badge. */
export function TeamLogo({team, size = 40, plate}: {team: Team; size?: number; plate?: LogoPlate}) {
  const logo = LOGOS[team.id];
  if (!logo) return <TeamBadge era={latestEra(team)} size={size} title={`${team.name} badge illustration`} />;
  return <LogoImage file={logo.file} alt={`${team.name} logo`} size={size} plate={plate} kind="league" />;
}

/** Logo for one identity era: the official mark for the era it belongs to, an illustration otherwise. */
export function EraLogo({team, index, size = 56}: {team: Team; index: number; size?: number}) {
  const logo = LOGOS[team.id];
  const eraIndex = logo?.eraIndex ?? team.identity.length - 1;
  if (logo && index === eraIndex) return <LogoImage file={logo.file} alt={`${team.name} logo, ${team.identity[index].from}`} size={size} />;
  return <TeamBadge era={team.identity[index]} size={size} />;
}

export function hasOfficialLogo(team: Team, index: number) {
  const logo = LOGOS[team.id];
  return !!logo && index === (logo.eraIndex ?? team.identity.length - 1);
}

export function LeagueLogo({
  league,
  size = 20,
  isDecorative = false,
  plate = 'none',
}: {
  league: LeagueId;
  size?: number;
  isDecorative?: boolean;
  plate?: LogoPlate;
}) {
  const logo = LOGOS[`league-${league}`];
  if (!logo) return null;
  return <LogoImage file={logo.file} alt={isDecorative ? '' : `${LEAGUES[league].name} logo`} size={size} plate={plate} />;
}
