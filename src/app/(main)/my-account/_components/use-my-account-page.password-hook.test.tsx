/** @vitest-environment happy-dom */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/stores', () => ({
  useAuthStore: () => ({
    user: { email: 'hero@example.com', app_metadata: { provider: 'email', providers: ['email'] } },
  }),
}));

vi.mock('@/hooks', () => ({
  useAdmin: () => ({ isAdmin: false }),
  useAccountProfile: () => ({
    profile: null,
    loading: false,
    loadError: null,
    retrying: false,
    refetch: vi.fn(),
    patchProfile: vi.fn(),
  }),
}));

vi.mock('@/app/(auth)/actions', () => ({
  changeAccountPasswordAction: vi.fn(),
  changeAccountEmailAction: vi.fn(),
  changeUsernameAction: vi.fn(),
  deleteAccountAction: vi.fn(),
  beginGoogleDeleteReauthAction: vi.fn(),
  setProfilePhotoFromLibraryAction: vi.fn(),
}));

import { changeAccountPasswordAction } from '@/app/(auth)/actions';
import { useMyAccountPage } from './use-my-account-page';
import { PASSWORD_MIN_LENGTH } from '@/lib/password-policy';

const mockChangeAccountPasswordAction = vi.mocked(changeAccountPasswordAction);

describe('useMyAccountPage handlePasswordChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call changeAccountPasswordAction when the new password is too short', async () => {
    const { result } = renderHook(() => useMyAccountPage());
    const tooShort = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);

    act(() => {
      result.current.setCurrentPassword('current');
      result.current.setNewPassword(tooShort);
      result.current.setConfirmPassword(tooShort);
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
    await act(async () => {
      await result.current.handlePasswordChange(fakeEvent);
    });

    expect(mockChangeAccountPasswordAction).not.toHaveBeenCalled();
    expect(result.current.passwordMessage?.type).toBe('error');
  });
});
