/**
 * One in-flight guest migration.
 * The slot is claimed before `run` starts, so another sign-in listener that
 * arrives in the same turn shares this promise instead of starting a second upload.
 */

export function beginSingleFlight<T>(
  slot: { current: Promise<T> | null },
  run: () => Promise<T>,
): Promise<T> {
  if (slot.current) return slot.current;

  let settle!: (next: Promise<T>) => void;
  const current = new Promise<T>((resolve, reject) => {
    settle = (next) => {
      next.then(resolve, reject);
    };
  });
  slot.current = current;
  settle(
    run().finally(() => {
      if (slot.current === current) slot.current = null;
    }),
  );
  return current;
}
