import type {ReactNode} from 'react';
import {Selector} from '@astryxdesign/core/Selector';
import {DropdownMenu} from '@astryxdesign/core/DropdownMenu';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {useToast} from '@astryxdesign/core/Toast';
import {LEAGUES, LEAGUE_ORDER, type LeagueFilter, type LeagueId} from '../data';
import {InfoIcon, MonitorIcon, MoonIcon, ShareIcon, SunIcon, UserIcon} from './icons';
import {LeagueLogo} from '../visuals/Logos';

export type Appearance = 'light' | 'dark' | 'system';

/** What the map shows on top of the sports cities. */
export type MapView = 'teams' | 'population' | 'titles';
export const MAP_VIEWS: MapView[] = ['teams', 'population', 'titles'];



export function LeagueSelect({value, onChange, isCompact}: {value: LeagueFilter; onChange: (v: LeagueFilter) => void; isCompact: boolean}) {
  return (
    <Selector
      label="League"
      isLabelHidden
      size="md"
      variant="ghost"
      width={isCompact ? 116 : 152}
      containerClassName="league-select"
      controlClassName="rounded-full"
      value={value}
      onChange={(v) => onChange((v ?? 'all') as LeagueFilter)}
      options={[
        {value: 'all', label: isCompact ? 'All' : 'All cities'},
        {type: 'divider'},
        ...LEAGUE_ORDER.map((l) => ({value: l, label: l, description: LEAGUES[l].name})),
      ]}
      renderOption={(o) => <LeagueOptionRow value={o.value} label={o.label} />}
      renderValue={(o) => <LeagueOptionRow value={o.value} label={o.label} isCompact />}
    />
  );
}

/** League names stay in each option's accessible description; the row itself is just the logo and the short name. */
function LeagueOptionRow({value, label, isCompact}: {value?: string; label: ReactNode; isCompact?: boolean}) {
  const isLeague = !!value && (LEAGUE_ORDER as string[]).includes(value);
  return (
    <HStack gap={2} vAlign="center">
      {isLeague ? (
        <LeagueLogo league={value as LeagueId} size={isCompact ? 20 : 26} isDecorative />
      ) : (
        <span role="img" aria-label="Canada" className="flag-emoji" style={{fontSize: isCompact ? 18 : 22}}>
          🇨🇦
        </span>
      )}
      <Text weight={isCompact ? 'medium' : 'normal'}>{label}</Text>
    </HStack>
  );
}

interface SiteMenuProps {
  appearance: Appearance;
  onAppearanceChange: (a: Appearance) => void;
  onOpenCredits: () => void;
}

export function SiteMenu({appearance, onAppearanceChange, onOpenCredits}: SiteMenuProps) {
  const showToast = useToast();

  const share = async () => {
    const url = window.location.href;
    const data = {title: 'Canada Sports Atlas', text: 'Canadian pro sports, mapped', url};
    const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    // Phones and tablets get the native share sheet. It can be refused (an embedding page
    // without the web-share permission, an unsupported browser), so fall back to copying.
    if (isTouch && typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast({body: 'Link copied to clipboard', uniqueID: 'share'});
    } catch {
      showToast({body: `Copy this link: ${url}`, uniqueID: 'share', isAutoHide: false});
    }
  };

  return (
    <DropdownMenu
      hasChevron={false}
      alignment="end"
      menuWidth={228}
      renderTrigger={(props) => (
        <IconButton {...props} variant="ghost" className="rounded-full" label="More options" tooltip="More" icon={<Icon icon="moreHorizontal" />} />
      )}
      header={
        <HStack hAlign="between" vAlign="center" gap={3} paddingInline={3} paddingBlock={2} className="border-b border-border">
          <Text>Appearance</Text>
          <SegmentedControl label="Appearance" size="sm" value={appearance} onChange={(v) => onAppearanceChange(v as Appearance)}>
            <SegmentedControlItem value="light" label="Light" isLabelHidden icon={<Icon icon={SunIcon} size="sm" />} />
            <SegmentedControlItem value="dark" label="Dark" isLabelHidden icon={<Icon icon={MoonIcon} size="sm" />} />
            <SegmentedControlItem value="system" label="System" isLabelHidden icon={<Icon icon={MonitorIcon} size="sm" />} />
          </SegmentedControl>
        </HStack>
      }
      items={[
        {id: 'share', label: 'Share', icon: ShareIcon, onClick: () => void share()},
        {id: 'credits', label: 'Credits', icon: InfoIcon, onClick: onOpenCredits},
        {type: 'divider'},
        {id: 'author', label: 'Made by Brian Latchman', icon: UserIcon, href: 'https://latchman.ca', target: '_blank'},
      ]}
    />
  );
}
