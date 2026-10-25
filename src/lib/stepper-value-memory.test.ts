import { describe, expect, it } from 'vitest';
import {
  adoptStepperMemory,
  createStepperValueMemory,
  rememberStepperValue,
  stepStepperValue,
  type StepperValueMemory,
} from './stepper-value-memory';

/** Clicks that land before the sheet commits the previous step. */
function rapidClicks(
  start: number,
  deltas: number[],
  bounds: { min?: number; max?: number } = {},
): number[] {
  const min = bounds.min ?? Number.NEGATIVE_INFINITY;
  const max = bounds.max ?? Number.POSITIVE_INFINITY;
  let memory = createStepperValueMemory(start);
  const emitted: number[] = [];
  for (const delta of deltas) {
    memory = rememberStepperValue(memory, start);
    const stepped = stepStepperValue(memory, delta, min, max);
    memory = stepped.memory;
    if (stepped.changed) emitted.push(stepped.value);
  }
  return emitted;
}

describe('rapid HP and AP stepper clicks keep every step (86e3juy89)', () => {
  it('three quick Health minus clicks from 20 emit 19, 18, and 17', () => {
    expect(rapidClicks(20, [-1, -1, -1])).toEqual([19, 18, 17]);
  });

  it('three quick Action Points minus clicks from 10 emit 9, 8, and 7', () => {
    expect(rapidClicks(10, [-1, -1, -1], { min: 0, max: 10 })).toEqual([9, 8, 7]);
  });

  it('does not rewind when a render still has the value from before the burst', () => {
    let memory = createStepperValueMemory(20);
    const emitted: number[] = [];
    for (const delta of [-1, -1, -1]) {
      const stepped = stepStepperValue(
        memory,
        delta,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      );
      memory = stepped.memory;
      if (stepped.changed) emitted.push(stepped.value);
      memory = rememberStepperValue(memory, 20);
    }
    expect(emitted).toEqual([19, 18, 17]);
    expect(memory.local).toBe(17);
  });

  it('keeps the later clicks when the prop has only caught up to the first one', () => {
    let memory = createStepperValueMemory(20);
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = rememberStepperValue(memory, 19);
    expect(memory.local).toBe(17);
    expect(memory.pending).toBe(true);
  });

  it('clears the burst once the prop matches the last click, then steps from there', () => {
    let memory = createStepperValueMemory(20);
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = rememberStepperValue(memory, 17);
    expect(memory).toEqual<StepperValueMemory>({ local: 17, pending: false, burstFrom: 17 });
    const next = stepStepperValue(memory, -1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    expect(next.value).toBe(16);
    expect(next.changed).toBe(true);
  });

  it('adopts an outside edit that is not one of the clicks in progress', () => {
    let memory = createStepperValueMemory(20);
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = rememberStepperValue(memory, 5);
    expect(memory.local).toBe(5);
    expect(memory.pending).toBe(false);
    const next = stepStepperValue(memory, -1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    expect(next.value).toBe(4);
  });

  it('a single click with a commit between clicks still moves one step at a time', () => {
    let memory = createStepperValueMemory(20);
    const first = stepStepperValue(memory, -1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    memory = rememberStepperValue(first.memory, first.value);
    const second = stepStepperValue(memory, -1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    expect([first.value, second.value]).toEqual([19, 18]);
  });

  it('stops at the existing minimum and maximum', () => {
    expect(rapidClicks(1, [-1, -1], { min: 0, max: 10 })).toEqual([0]);
    expect(rapidClicks(9, [1, 1], { min: 0, max: 10 })).toEqual([10]);
  });

  it('starts the next step at the shown value when min changes after a clamped minus', () => {
    const stepped = stepStepperValue(
      createStepperValueMemory(0),
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    expect(stepped.value).toBe(-1);
    const settled = adoptStepperMemory(stepped.memory, 0, true);
    expect(settled).toEqual({ local: 0, pending: false, burstFrom: 0 });
    const plus = stepStepperValue(
      settled,
      1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    expect(plus.value).toBe(1);
  });

  it('does not rewind a burst when the range is unchanged', () => {
    let memory = createStepperValueMemory(20);
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    memory = stepStepperValue(
      memory,
      -1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ).memory;
    expect(adoptStepperMemory(memory, 20, false).local).toBe(18);
  });

  it('hold-repeat keeps stepping while the prop is unchanged', () => {
    expect(rapidClicks(19, Array(13).fill(-1))).toEqual([
      18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6,
    ]);
  });
});
