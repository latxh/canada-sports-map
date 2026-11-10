import {useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {Slider} from '@astryxdesign/core/Slider';
import {Text} from '@astryxdesign/core/Text';
import {TEAMS} from '../data';
import {PauseIcon, PlayIcon} from './icons';

/** The first season of the oldest team on the map, and the season the data runs to. */
export const TIMELINE_MIN = Math.min(...TEAMS.map((t) => t.from));
export const TIMELINE_MAX = 2026;

const STEP_MS = 140;

/**
 * Scrub or play the map through history: the map shows only the teams playing in the
 * chosen year. Play stops at the present; with reduced motion it jumps a decade at a time.
 */
export function TimelineBar({
  year,
  onYearChange,
  teamCount,
  isCompact,
  style,
}: {
  year: number;
  onYearChange: (year: number) => void;
  teamCount: number;
  isCompact: boolean;
  style?: CSSProperties;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const yearRef = useRef(year);
  yearRef.current = year;
  const reducedMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    if (!isPlaying) return;
    const step = reducedMotion ? 10 : 1;
    const id = window.setInterval(
      () => {
        const next = Math.min(TIMELINE_MAX, yearRef.current + step);
        onYearChange(next);
        if (next >= TIMELINE_MAX) setIsPlaying(false);
      },
      reducedMotion ? 900 : STEP_MS,
    );
    return () => window.clearInterval(id);
  }, [isPlaying, onYearChange, reducedMotion]);

  const togglePlay = () => {
    if (!isPlaying && year >= TIMELINE_MAX) onYearChange(TIMELINE_MIN);
    setIsPlaying((p) => !p);
  };

  const marks = [1900, 1950, 2000].map((v) => ({value: v, label: String(v)}));

  return (
    <div className="pointer-events-none absolute flex justify-center" style={{...style, transition: 'bottom 200ms ease, right 200ms ease'}}>
      <div
        role="group"
        aria-label="Timeline"
        className="glass pointer-events-auto flex w-full items-center gap-3 rounded-full py-1.5 ps-1.5 pe-5"
        style={{maxWidth: isCompact ? 360 : 560}}>
        <IconButton
          variant="secondary"
          className="rounded-full"
          label={isPlaying ? 'Pause timeline' : 'Play timeline'}
          tooltip={isPlaying ? 'Pause' : 'Play'}
          icon={<Icon icon={isPlaying ? PauseIcon : PlayIcon} />}
          onClick={togglePlay}
        />
        <div className="flex shrink-0 flex-col leading-none" aria-live="polite" aria-atomic="true">
          <Text weight="bold" size="lg" hasTabularNumbers>
            {year}
          </Text>
          <Text type="supporting" size="xsm" hasTabularNumbers>
            {teamCount} team{teamCount === 1 ? '' : 's'}
          </Text>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <Slider
            label="Year"
            isLabelHidden
            min={TIMELINE_MIN}
            max={TIMELINE_MAX}
            value={year}
            valueDisplay="none"
            marks={isCompact ? undefined : marks}
            onChange={(v: number | [number, number]) => {
              setIsPlaying(false);
              onYearChange(Array.isArray(v) ? v[0] : v);
            }}
            width="100%"
          />
        </div>
      </div>
    </div>
  );
}
