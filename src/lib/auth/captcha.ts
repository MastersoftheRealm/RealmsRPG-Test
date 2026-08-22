/** Cloudflare Turnstile + Supabase Auth CAPTCHA helpers (TASK-899). */

export const AUTH_CAPTCHA_BLOCK_MESSAGE = 'Complete the security check, then try again.';

export function getTurnstileSiteKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || undefined;
}

/** True when the public site key is set — widget renders and signup/login require a token. */
export function isAuthCaptchaRequired(): boolean {
  return Boolean(getTurnstileSiteKey());
}

export function buildAuthCaptchaOptions(captchaToken: string | null): { captchaToken?: string } {
  if (!isAuthCaptchaRequired() || !captchaToken) return {};
  return { captchaToken };
}
