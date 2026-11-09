/** @vitest-environment happy-dom */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsersPage from './page';

const users = [
  {
    id: '1',
    username: 'alice',
    usernameDisplay: 'alice',
    displayName: 'Alice',
    role: 'admin' as const,
  },
];

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      users,
      hasMore: false,
      offset: 0,
      limit: 100,
      rolePolicies: {},
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    dataUpdatedAt: 42,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('AdminUsersPage search debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps cached user rows after the debounce window when the applied query is unchanged', async () => {
    render(<AdminUsersPage />);
    expect(screen.getByText('alice')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.queryByText('No users found.')).toBeNull();
  });
});
