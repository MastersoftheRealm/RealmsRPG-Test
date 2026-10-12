'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';
import { useAccountProfile } from '@/hooks/use-profile';
import { useAuth, useCharacters } from '@/hooks';
import { isGuestCharacterId } from '@/lib/guest-character-storage';
import { cn } from '@/lib/utils';
import { formatRoleQuotaExceededMessage, isAtRoleQuota } from '@/lib/role-quota-messages';

/** Account character count vs role cap. Guest sheets do not count. */
export function useCharacterQuota(): {
  atQuota: boolean;
  message: string | null;
} {
  const { user } = useAuth();
  const { profile } = useAccountProfile(user);
  const { data: characters = [] } = useCharacters({ enabled: !!user });
  const maxAllowed = profile?.rolePolicy?.maxCharacters;
  const currentCount = characters.filter((character) => !isGuestCharacterId(character.id)).length;
  const atQuota = !!user && isAtRoleQuota(currentCount, maxAllowed);
  if (!atQuota || maxAllowed == null) {
    return { atQuota: false, message: null };
  }
  return {
    atQuota: true,
    message: formatRoleQuotaExceededMessage({
      role: profile?.role ?? 'new_player',
      resource: 'characters',
      currentCount,
      maxAllowed,
    }),
  };
}

export function CharacterQuotaAlert({ className }: { className?: string | undefined }) {
  const { message } = useCharacterQuota();
  if (!message) return null;
  return (
    <div className={className}>
      <Alert variant="warning" title="Character limit reached">
        {message}
      </Alert>
    </div>
  );
}

/** Link that stays inert when the account is at its character cap. */
export function CharacterQuotaLink({
  href,
  className,
  ariaLabel,
  children,
}: {
  href: string;
  className?: string | undefined;
  ariaLabel: string;
  children: ReactNode;
}) {
  const { atQuota, message } = useCharacterQuota();
  if (atQuota) {
    return (
      <div
        className={cn(className, 'cursor-not-allowed opacity-60')}
        aria-disabled="true"
        aria-label={ariaLabel}
        title={message ?? undefined}
      >
        {children}
      </div>
    );
  }
  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
