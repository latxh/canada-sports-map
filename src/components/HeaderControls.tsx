import type {SVGProps} from 'react';
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

export type Appearance = 'light' | 'dark' | 'system';

function dotIcon(color: string) {
  const DotIcon = (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" aria-hidden {...p}>
      <circle cx="8" cy="8" r="5" fill={color} />
    </svg>
  );
  return DotIcon;
}

const LEAGUE_ICONS = Object.fromEntries(LEAGUE_ORDER.map((l) => [l, dotIcon(LEAGUES[l].color)])) as Record<LeagueId, ReturnType<typeof dotIcon>>;

const AllIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    {LEAGUE_ORDER.map((l, i) => {
      const a = (i / LEAGUE_ORDER.length) * Math.PI * 2 - Math.PI / 2;
      return <circle key={l} cx={8 + Math.cos(a) * 5} cy={8 + Math.sin(a) * 5} r="2.2" fill={LEAGUES[l].color} />;
    })}
  </svg>
);

export function LeagueSelect({value, onChange, isCompact}: {value: LeagueFilter; onChange: (v: LeagueFilter) => void; isCompact: boolean}) {
  return (
    <Selector
      label="League"
      isLabelHidden
      size="sm"
      variant="secondary"
      value={value}
      onChange={(v) => onChange((v ?? 'all') as LeagueFilter)}
      options={[
        {value: 'all', label: isCompact ? 'All' : 'All leagues', icon: AllIcon},
        {type: 'divider'},
        ...LEAGUE_ORDER.map((l) => ({value: l, label: l, description: LEAGUES[l].name, icon: LEAGUE_ICONS[l]})),
      ]}
    />
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
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast({body: 'Link copied to clipboard', uniqueID: 'share'});
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      showToast({body: `Copy this link: ${url}`, uniqueID: 'share', isAutoHide: false});
    }
  };

  return (
    <DropdownMenu
      hasChevron={false}
      alignment="end"
      menuWidth={300}
      renderTrigger={(props) => <IconButton {...props} size="sm" variant="ghost" label="More options" tooltip="More" icon={<Icon icon="moreHorizontal" />} />}
      header={
        <HStack hAlign="between" vAlign="center" gap={3} paddingInline={3} paddingBlock={2}>
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
