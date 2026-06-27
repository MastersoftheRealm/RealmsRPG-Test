/**
 * Shared targets for the visual + a11y safety net.
 */

export const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

export const THEMES = ['light', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];

/**
 * Deterministic, data-free routes that are safe to pixel-baseline. These render
 * identically every run (no Supabase data), so a screenshot diff is always a
 * real style/layout change. The styleguide is the most important: it exercises
 * every primitive + token.
 */
export const SCREENSHOT_PAGES = [
  { name: 'styleguide', path: '/dev/styleguide' },
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'resources', path: '/resources' },
  { name: 'terms', path: '/terms' },
  { name: 'privacy', path: '/privacy' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'forgot-password', path: '/forgot-password' },
] as const;

/**
 * Broader set for a11y scans. Includes guest-soft, data-driven routes — axe does
 * not need determinism, so empty/error states are still worth scanning. Auth-only
 * routes (/my-account, /campaigns/[id], character sheet) are omitted until a test
 * session is available (see DEVELOPER_TASK_QUEUE).
 *
 * Set `A11Y_DETERMINISTIC_ONLY=1` (CI) to scan only the data-free routes, so the
 * gate doesn't depend on Supabase data/secrets being present in the CI runner.
 */
const DATA_PAGES = ['/characters', '/library', '/codex', '/power-creator', '/encounters', '/campaigns'];

export const A11Y_PAGES: string[] = [
  ...SCREENSHOT_PAGES.map((p) => p.path),
  ...(process.env.A11Y_DETERMINISTIC_ONLY ? [] : DATA_PAGES),
];

/** Init script: force the next-themes class/storage before app scripts run. */
export function themeInit(theme: ThemeName): (t: string) => void {
  void theme;
  return (t: string) => {
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* ignore */
    }
    const el = document.documentElement;
    if (t === 'dark') el.classList.add('dark');
    else el.classList.remove('dark');
  };
}
