/**
 * ValueStepper steps from the last click, not from a prop that has not committed.
 * A heavy character sheet can paint slower than three clicks. Each click used to
 * read the same rendered Health or Action Points and save that same next value.
 */

export type StepperValueMemory = {
  /** Value the next click steps from. */
  local: number;
  /** True after a click until the prop commits that same value. */
  pending: boolean;
  /** Prop value when this burst started. */
  burstFrom: number;
};

export function createStepperValueMemory(value: number): StepperValueMemory {
  return { local: value, pending: false, burstFrom: value };
}

/**
 * Adopt a committed prop. A prop still inside the current burst (the original
 * value, or a step the parent has only partly applied) does not rewind clicks
 * that are already ahead of it. A prop outside that span is an outside edit.
 */
export function rememberStepperValue(
  memory: StepperValueMemory,
  committed: number,
): StepperValueMemory {
  if (!memory.pending || committed === memory.local) {
    return { local: committed, pending: false, burstFrom: committed };
  }
  const low = Math.min(memory.burstFrom, memory.local);
  const high = Math.max(memory.burstFrom, memory.local);
  if (committed >= low && committed <= high) return memory;
  return { local: committed, pending: false, burstFrom: committed };
}

/**
 * Adopt a committed value. A min/max change ends the burst so the next click
 * starts at the value on screen. The minus button stays mounted.
 */
export function adoptStepperMemory(
  memory: StepperValueMemory,
  committed: number,
  boundsChanged: boolean,
): StepperValueMemory {
  if (boundsChanged) return createStepperValueMemory(committed);
  return rememberStepperValue(memory, committed);
}

export function stepStepperValue(
  memory: StepperValueMemory,
  delta: number,
  min: number,
  max: number,
): { memory: StepperValueMemory; value: number; changed: boolean } {
  const next = Math.min(max, Math.max(min, memory.local + delta));
  if (next === memory.local) {
    return { memory, value: memory.local, changed: false };
  }
  return {
    memory: {
      local: next,
      pending: true,
      burstFrom: memory.pending ? memory.burstFrom : memory.local,
    },
    value: next,
    changed: true,
  };
}
