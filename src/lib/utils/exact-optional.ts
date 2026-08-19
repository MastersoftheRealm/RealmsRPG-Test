/**
 * `exactOptionalPropertyTypes` helpers (TASK-824 / ADR-0024).
 *
 * `foo?: T` means omit or `T` — not `foo: undefined`. In-memory / UI props that
 * are filled from optional chaining need the `| undefined` form. Persistence
 * payloads stay strict (omit the key; see `removeUndefined`).
 */

/** True when `K` is optional on `T`. */
type OptionalKey<T, K extends keyof T> = Partial<Pick<T, K>> extends Pick<T, K> ? K : never;

/**
 * Copy `T`, allowing explicit `undefined` on every optional property.
 * Homomorphic: required keys stay required; `?` is preserved.
 * Reconstruct `| undefined` explicitly so `exactOptionalPropertyTypes` does not
 * collapse `T[K]` (already `U | undefined` from indexing) back to `foo?: U`.
 */
export type AllowUndefinedOptionals<T> = {
  [K in keyof T]: K extends OptionalKey<T, K> ? Exclude<T[K], undefined> | undefined : T[K];
};
