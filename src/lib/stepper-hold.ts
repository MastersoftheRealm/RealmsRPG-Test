/**
 * Hold-to-repeat for stepper buttons.
 * A quick press steps once on release. A hold repeats after a delay, then faster.
 * Moving the pointer off the button stops the repeat. Releasing still applies the
 * single step when the hold never started repeating.
 */

export type StepperPointerBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function stepperPointerIsOutside(
  bounds: StepperPointerBounds,
  x: number,
  y: number,
): boolean {
  return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
}

type StepperHoldOptions = {
  minDelay?: number;
  maxDelay?: number;
  initialDelay?: number;
};

export function createStepperHold(onStep: () => void, options: StepperHoldOptions = {}) {
  const minDelay = options.minDelay ?? 80;
  const maxDelay = options.maxDelay ?? 220;
  const initialDelay = options.initialDelay ?? 450;

  let step = onStep;
  let holding = false;
  let repeated = false;
  let pendingTap = false;
  let delay = maxDelay;
  let initialTimer: ReturnType<typeof setTimeout> | null = null;
  let repeatTimer: ReturnType<typeof setTimeout> | null = null;

  const setStep = (next: () => void) => {
    step = next;
  };

  const clearRepeat = () => {
    if (repeatTimer) {
      clearTimeout(repeatTimer);
      repeatTimer = null;
    }
  };

  const start = () => {
    if (holding) return;
    holding = true;
    repeated = false;
    pendingTap = false;
    delay = maxDelay;
    if (initialTimer) {
      clearTimeout(initialTimer);
      initialTimer = null;
    }
    clearRepeat();

    initialTimer = setTimeout(() => {
      initialTimer = null;
      if (!holding) return;
      repeated = true;
      pendingTap = false;
      step();
      const repeat = () => {
        if (!holding) return;
        step();
        delay = Math.max(minDelay, delay * 0.88);
        repeatTimer = setTimeout(repeat, delay);
      };
      repeatTimer = setTimeout(repeat, maxDelay);
    }, initialDelay);
  };

  const stopRepeat = () => {
    if (!holding && !initialTimer && !repeatTimer) return;
    const tapStillPending = initialTimer !== null && !repeated;
    holding = false;
    if (initialTimer) {
      clearTimeout(initialTimer);
      initialTimer = null;
    }
    if (tapStillPending) pendingTap = true;
    clearRepeat();
  };

  const stop = () => {
    const shouldTap = (initialTimer !== null && !repeated) || pendingTap;
    if (initialTimer) {
      clearTimeout(initialTimer);
      initialTimer = null;
    }
    pendingTap = false;
    holding = false;
    repeated = false;
    clearRepeat();
    if (shouldTap) step();
  };

  const dispose = () => {
    holding = false;
    pendingTap = false;
    repeated = false;
    if (initialTimer) {
      clearTimeout(initialTimer);
      initialTimer = null;
    }
    clearRepeat();
  };

  return { start, stop, stopRepeat, dispose, setStep };
}
