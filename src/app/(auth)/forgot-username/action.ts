/**
 * Forgot Username Server Action
 * =============================
 * Looks up user by email in Prisma. For security, always returns success.
 * In production, would trigger email with username (not implemented).
 */

'use server';

import { prisma } from '@/lib/prisma';

export async function submitForgotUsernameAction(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return;

  const profile = await prisma.userProfile.findFirst({
    where: { email: normalized },
    select: { username: true },
  });

  // TODO: If profile exists, send email with username via Resend/SendGrid/etc.
  // For now we always succeed for security (don't reveal if email exists)
  void profile;
}
