/**
 * Static coverage markers for strict Zod parsing on App Router API input.
 *
 * Handlers that read query strings, route params, or JSON bodies must call
 * `validateQuery`, `validateRouteParams`, or `validateJson` / `parseValidatedJsonBody`.
 * The test in `api-input-validation-routes.test.ts` fails when a handler reads input
 * without one of these markers.
 */

/** Substrings that prove Zod-backed validation ran on this handler. */
export const API_INPUT_VALIDATION_MARKERS = [
  'validateJson(',
  'validateQuery(',
  'validateRouteParams(',
  'parseValidatedJsonBody(',
] as const;

/**
 * Mutating handlers that legitimately skip JSON schema validation (multipart uploads).
 * Format: `relative/path/to/route.ts (METHOD)`.
 */
export const API_INPUT_VALIDATION_JSON_EXEMPT_HANDLERS = [
  'images/route.ts (POST)',
  'images/[id]/replace/route.ts (POST)',
  'upload/portrait/route.ts (POST)',
  'upload/profile-picture/route.ts (POST)',
] as const;

/** GET handlers with no query or route-param reads (auth-only). Bodyless mutations with no query/params too. */
export const API_INPUT_VALIDATION_NO_INPUT_HANDLERS = [
  'admin/check/route.ts (GET)',
  'crafting/route.ts (GET)',
  'crafting/[id]/route.ts (GET)',
  'encounters/route.ts (GET)',
  'encounters/[id]/route.ts (GET)',
  'official/counts/route.ts (GET)',
  'official/enhanced-items/route.ts (GET)',
  'user/enhanced-items/route.ts (GET)',
  'user/library/counts/route.ts (GET)',
  'admin/users/route.ts (GET)',
  'upload/profile-picture/route.ts (DELETE)',
] as const;

export type ApiInputValidationExemptHandler =
  (typeof API_INPUT_VALIDATION_JSON_EXEMPT_HANDLERS)[number];

export type ApiInputValidationNoInputHandler =
  (typeof API_INPUT_VALIDATION_NO_INPUT_HANDLERS)[number];
