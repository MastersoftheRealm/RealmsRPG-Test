'use client';

import { useCallback, useState } from 'react';
import {
  AUTH_CAPTCHA_BLOCK_MESSAGE,
  buildAuthCaptchaOptions,
  isAuthCaptchaRequired,
} from '@/lib/auth/captcha';

export function useAuthCaptcha() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
  }, []);

  const captchaRequired = isAuthCaptchaRequired();
  const captchaReady = !captchaRequired || Boolean(captchaToken);

  return {
    captchaReady,
    captchaBlockMessage: captchaReady ? null : AUTH_CAPTCHA_BLOCK_MESSAGE,
    captchaOptions: buildAuthCaptchaOptions(captchaToken),
    captchaResetKey,
    setCaptchaToken,
    resetCaptcha,
  };
}
