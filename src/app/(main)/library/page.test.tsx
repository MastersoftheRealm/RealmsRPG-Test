// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LibraryPage from './page';

const searchParamsSuspend = vi.hoisted(() => new Promise<never>(() => {}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => {
    throw searchParamsSuspend;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/hooks', () => ({
  useAuth: () => ({ user: null, initialized: true }),
  useUserLibraryCounts: () => ({ data: undefined }),
  useOfficialLibraryCounts: () => ({ data: undefined }),
  useDeletePower: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteTechnique: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteEmpoweredTechnique: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteItem: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteCreature: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteEnhancedItem: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useAccountProfile: () => ({ profile: undefined }),
}));

vi.mock('./LibraryPowersTab', () => ({ LibraryPowersTab: () => null }));
vi.mock('./LibraryTechniquesTab', () => ({ LibraryTechniquesTab: () => null }));
vi.mock('./LibraryItemsTab', () => ({ LibraryItemsTab: () => null }));
vi.mock('./LibraryCreaturesTab', () => ({ LibraryCreaturesTab: () => null }));
vi.mock('./LibraryEnhancedTab', () => ({ LibraryEnhancedTab: () => null }));
vi.mock('./LibraryPublicContent', () => ({ LibraryPublicContent: () => null }));

describe('Library page', () => {
  it('shows Suspense LoadingState fallback while useSearchParams suspends (PAGES4-004)', () => {
    render(<LibraryPage />);
    expect(screen.getByRole('status', { name: 'Loading...' })).toBeTruthy();
  });
});
