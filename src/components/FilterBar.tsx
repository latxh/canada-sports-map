import {ToggleButtonGroup, ToggleButton} from '@astryxdesign/core/ToggleButton';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {LEAGUES, LEAGUE_ORDER, type EraFilter, type LeagueId} from '../data';
import {LeagueDot} from './bits';

interface Props {
  leagues: ReadonlySet<LeagueId>;
  onLeaguesChange: (next: Set<LeagueId>) => void;
  era: EraFilter;
  onEraChange: (era: EraFilter) => void;
  isCompact: boolean;
}

export function FilterBar({leagues, onLeaguesChange, era, onEraChange, isCompact}: Props) {
  const leagueToggles = (
    <ToggleButtonGroup
      label="Leagues"
      type="multiple"
      size="sm"
      value={[...leagues]}
      onChange={(v) => onLeaguesChange(new Set((v as string[] | null) ?? []) as Set<LeagueId>)}>
      {LEAGUE_ORDER.map((l) => (
        <ToggleButton key={l} value={l} label={l} tooltip={LEAGUES[l].name} icon={<LeagueDot league={l} size={9} />}>
          {l}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
  const eraControl = (
    <SegmentedControl label="Era" size="sm" value={era} onChange={(v) => onEraChange(v as EraFilter)} layout={isCompact ? 'fill' : 'hug'}>
      <SegmentedControlItem value="all" label={isCompact ? 'All' : 'All teams'} />
      <SegmentedControlItem value="current" label="Active" />
      <SegmentedControlItem value="defunct" label="Former" />
    </SegmentedControl>
  );

  if (isCompact) {
    return (
      <section aria-label="Filters" className="flex flex-col gap-2 border-b border-border bg-surface py-2">
        <div className="scrollbar-none overflow-x-auto px-3">{leagueToggles}</div>
        <div className="px-3">{eraControl}</div>
      </section>
    );
  }
  return (
    <section aria-label="Filters" className="flex items-center gap-3 border-b border-border bg-surface px-3 py-2">
      {leagueToggles}
      <div className="ms-auto shrink-0">{eraControl}</div>
    </section>
  );
}
