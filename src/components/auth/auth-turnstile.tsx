'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { getTurnstileSiteKey } from '@/lib/auth/captcha';

type AuthTurnstileProps = {
  resetKey: number;
  onToken: (token: string | null) => void;
};

/** Renders Cloudflare Turnstile when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. */
export function AuthTurnstile({ resetKey, onToken }: AuthTurnstileProps) {
  const siteKey = getTurnstileSiteKey();
  if (!siteKey) return null;

  return (
    <div className="flex justify-center" key={resetKey}>
      <Turnstile
        siteKey={siteKey}
        options={{ theme: 'auto', size: 'normal' }}
        onSuccess={onToken}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </div>
  );
}
