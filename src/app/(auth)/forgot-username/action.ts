/**
 * Forgot Username Server Action
 * =============================
 * Email delivery is not implemented. The page directs users to contact support.
 */

'use server';

export async function submitForgotUsernameAction(_email: string): Promise<{ supported: false }> {
  return { supported: false };
}
