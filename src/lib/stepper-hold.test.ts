import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStepperHold, stepperPointerIsOutside } from './stepper-hold';

const stepperSource = readFileSync(
  new URL('../components/patterns/select/value-stepper.tsx', import.meta.url),
  'utf8',
);

describe('stepper hold stops outside the button (86e3jw5p7)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats a point on the button as inside and a point past the edge as outside', () => {
    const bounds = { left: 10, top: 20, right: 30, bottom: 40 };
    expect(stepperPointerIsOutside(bounds, 10, 20)).toBe(false);
    expect(stepperPointerIsOutside(bounds, 30, 40)).toBe(false);
    expect(stepperPointerIsOutside(bounds, 9, 30)).toBe(true);
    expect(stepperPointerIsOutside(bounds, 31, 30)).toBe(true);
    expect(stepperPointerIsOutside(bounds, 20, 19)).toBe(true);
    expect(stepperPointerIsOutside(bounds, 20, 41)).toBe(true);
  });

  it('stops repeating after the pointer leaves and does not step again on release', () => {
    vi.useFakeTimers();
    const steps: number[] = [];
    const hold = createStepperHold(() => steps.push(steps.length + 1));
    hold.start();
    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(220);
    expect(steps).toEqual([1, 2]);
    hold.stopRepeat();
    vi.advanceTimersByTime(5000);
    hold.stop();
    expect(steps).toEqual([1, 2]);
  });

  it('keeps a quick press as one step when the pointer leaves before the repeat starts', () => {
    vi.useFakeTimers();
    const steps: number[] = [];
    const hold = createStepperHold(() => steps.push(1));
    hold.start();
    vi.advanceTimersByTime(200);
    hold.stopRepeat();
    vi.advanceTimersByTime(5000);
    expect(steps).toEqual([]);
    hold.stop();
    expect(steps).toEqual([1]);
  });

  it('still steps once when a short press is released on the button', () => {
    vi.useFakeTimers();
    const steps: number[] = [];
    const hold = createStepperHold(() => steps.push(1));
    hold.start();
    vi.advanceTimersByTime(100);
    hold.stop();
    vi.advanceTimersByTime(5000);
    expect(steps).toEqual([1]);
  });

  it('wires the button to stop the repeat when the pointer is outside', () => {
    expect(stepperSource).toContain('stepperPointerIsOutside');
    expect(stepperSource).toContain('hold.stopRepeat()');
    expect(stepperSource).toContain(
      'onPointerLeave={enableHoldRepeat ? () => hold.stopRepeat() : undefined}',
    );
  });
});
