import type { DurationConfig } from '@/lib/calculators';

/** Instant or exactly 1 round — duration modifier flags are cleared (power + empowered configs). */
export function isShortPowerDuration(duration: Pick<DurationConfig, 'type' | 'value'>): boolean {
  return duration.type === 'instant' || (duration.type === 'rounds' && duration.value === 1);
}

export function clearedShortDurationModifiers(): Pick<
  DurationConfig,
  'focus' | 'noHarm' | 'endsOnActivation' | 'sustain'
> {
  return {
    focus: false,
    noHarm: false,
    endsOnActivation: false,
    sustain: 0,
  };
}

export function applyShortDurationClear<T extends DurationConfig>(duration: T): T {
  if (!isShortPowerDuration(duration)) return duration;
  return {
    ...duration,
    ...clearedShortDurationModifiers(),
    applyDuration: false,
  };
}
