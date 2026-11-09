import type {ReactNode, SVGProps} from 'react';
import {Selector} from '@astryxdesign/core/Selector';
import {DropdownMenu} from '@astryxdesign/core/DropdownMenu';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {useToast} from '@astryxdesign/core/Toast';
import {LEAGUES, LEAGUE_ORDER, type LeagueFilter, type LeagueId} from '../data';
import {VStack} from '@astryxdesign/core/VStack';
import {InfoIcon, MapleLeafIcon, MonitorIcon, MoonIcon, ShareIcon, SunIcon, UserIcon} from './icons';
import {LeagueLogo} from '../visuals/Logos';

export type Appearance = 'light' | 'dark' | 'system';

const AllIcon = (p: SVGProps<SVGSVGElement>) => <MapleLeafIcon {...p} style={{color: 'var(--maple)'}} />;

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
        ...LEAGUE_ORDER.map((l) => ({value: l, label: l, description: LEAGUES[l].name})),
      ]}
      renderOption={(o) => <LeagueOptionRow value={o.value} label={o.label} description={o.description} />}
      renderValue={(o) => <LeagueOptionRow value={o.value} label={o.label} isCompact />}
    />
  );
}

function LeagueOptionRow({value, label, description, isCompact}: {value?: string; label: ReactNode; description?: ReactNode; isCompact?: boolean}) {
  const isLeague = !!value && (LEAGUE_ORDER as string[]).includes(value);
  return (
    <HStack gap={2} vAlign="center">
      {isLeague ? <LeagueLogo league={value as LeagueId} size={isCompact ? 18 : 24} isDecorative /> : <Icon icon={MapleLeafIcon} color="red" size={isCompact ? 'sm' : 'md'} />}
      <VStack gap={0}>
        <Text>{label}</Text>
        {description && !isCompact ? <Text type="supporting">{description}</Text> : null}
      </VStack>
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
