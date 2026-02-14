/**
 * useProfile Hook
 * ===============
 * Fetches current user's profile (username, photoUrl) for display.
 * Used by Header etc. — never exposes email/displayName to other users.
 */

'use client';

import { useEffect, useState } from 'react';
import { getUserProfileAction } from '@/app/(auth)/actions';
import { useAuth } from './use-auth';

export interface ProfileDisplay {
  username: string | null;
  photoUrl: string | null;
}

export function useProfile(): { profile: ProfileDisplay | null; loading: boolean } {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDisplay | null>(null);
  const [loading, setLoading] = useState(!!user);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getUserProfileAction()
      .then(({ profile: p }) => {
        if (cancelled || !p) return;
        setProfile({
          username: p.username ?? null,
          photoUrl: p.photoUrl ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  return { profile, loading };
}
