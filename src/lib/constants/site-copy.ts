/**
 * Site-wide copy barrel (backward compatible).
 * ==========================================
 * **Edit page copy in `src/lib/constants/copy/`** — one file per page/area:
 *
 * | Page / area        | File                          |
 * |--------------------|-------------------------------|
 * | Shared (motto, URL)| `copy/shared-copy.ts`         |
 * | Landing `/`        | `copy/landing-copy.ts`        |
 * | Auth login/register| `copy/auth-copy.ts`           |
 * | About `/about`     | `copy/about-copy.ts`          |
 * | Footer, nav, etc.  | TASK-390 (not migrated yet)   |
 * | Tooltips           | `public/tooltip-text.tsx`     |
 *
 * Game mechanics (not prose): `skills.ts`, `GAME_RULES.md`
 * Vision doc (not live UI): `REALMS_PRODUCT_OVERVIEW.md`
 */

export {
  REALMS_MOTTO,
  DISCORD_URL,
  LANDING_COPY,
  AUTH_COPY,
  ABOUT_COPY,
} from './copy';
