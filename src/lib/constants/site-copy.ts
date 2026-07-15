/**
 * Site-wide copy barrel (backward compatible).
 * ==========================================
 * **Edit page copy in `src/lib/constants/copy/`** — one file per page/area:
 *
 * | Page / area        | File                          |
 * |--------------------|-------------------------------|
 * | Shared (motto, URL, email) | `copy/shared-copy.ts` |
 * | Landing `/`        | `copy/landing-copy.ts`        |
 * | Auth login/register| `copy/auth-copy.ts`           |
 * | About `/about`     | `copy/about-copy.ts`          |
 * | Nav header         | `copy/nav-copy.ts`            |
 * | Rules `/rules`     | `copy/rules-copy.ts`          |
 * | Resources          | `copy/resources-copy.ts`      |
 * | Privacy `/privacy` | `copy/privacy-copy.ts`        |
 * | Terms `/terms`     | `copy/terms-copy.ts`          |
 * | Character creator chooser + guided flow | `copy/guided-creator-copy.ts` |
 * | Footer             | `copy/footer-copy.ts`         |
 * | Tooltips           | `public/tooltip-text.tsx`     |
 *
 * Game mechanics (not prose): `skills.ts`, `GAME_RULES.md`
 * Vision doc (not live UI): `REALMS_PRODUCT_OVERVIEW.md`
 */

export {
  REALMS_MOTTO,
  DISCORD_URL,
  SITE_CONTACT_EMAIL,
  ROOT_META_DESCRIPTION,
  SITE_URL,
  LANDING_COPY,
  AUTH_COPY,
  ABOUT_COPY,
  ABOUT_CAROUSEL_SLIDES,
  ABOUT_DICE_ASSETS,
  ABOUT_CAROUSEL_CENTER_INDEX,
  GUIDED_CREATOR_COPY,
  FOOTER_COPY,
  NAV_COPY,
  RULES_COPY,
  RESOURCES_COPY,
  PRIVACY_COPY,
  TERMS_COPY,
} from './copy';

export type { NavLink } from './copy';
