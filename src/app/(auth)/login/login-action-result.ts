import type { AuthActionFailureReason } from '@/lib/auth-errors';

export type LoginActionFailure = {
  success: false;
  error: string;
  reason?: AuthActionFailureReason | undefined;
  rateLimited?: boolean | undefined;
};

/** Present a login action failure without re-mapping server copy on the client. */
export function presentLoginActionFailure(result: LoginActionFailure): {
  error: string;
  showResendConfirmation: boolean;
} {
  return {
    error: result.error,
    showResendConfirmation: result.reason === 'email_not_confirmed',
  };
}
