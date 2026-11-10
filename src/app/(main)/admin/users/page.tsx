/**
 * Admin User Management
 * =====================
 * List users by username and change role.
 * Card rows keep Effective limits and Change role on screen at 768 and 1024
 * (ClickUp 86e3jzu53). A six-column table was clipped by page overflow.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  PageContainer,
  PageHeader,
  Button,
  LoadingState,
  EmptyState,
  Alert,
  SearchInput,
  Select,
} from '@/components/ui';
import { ConfirmActionModal, ErrorDisplay } from '@/components/patterns';
import { apiFetch } from '@/lib/api-client';
import { formatRolePolicyLimit } from '@/lib/role-limits';
import { ROLE_LABELS } from '@/lib/role-quota-messages';
import {
  adminUsersDirectoryReducer,
  createEmptyAdminUsersDirectorySlice,
  type AdminUsersDirectorySlice,
} from './admin-users-directory-state';
import { shouldApplyAdminUsersSearchChange } from './admin-users-search-applied';
import { useAdminUsersLoadMore } from './use-admin-users-load-more';

type UserRole = 'new_player' | 'playtester' | 'developer' | 'admin';

interface UserRow {
  id: string;
  username: string;
  usernameDisplay: string;
  email: string;
  displayName: string;
  role: UserRole;
}

type AdminUsersPage = {
  users: UserRow[];
  offset: number;
  limit: number;
  hasMore: boolean;
};

interface RolePolicyRow {
  role: UserRole;
  max_campaigns: number;
  max_players_per_campaign: number;
  max_characters: number;
  max_custom_powers: number;
  max_custom_techniques: number;
  max_custom_armaments: number;
  max_custom_creatures: number;
  permissions: Record<string, unknown> | null;
}

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export default function AdminUsersPage() {
  const [directory, setDirectory] = useState<AdminUsersDirectorySlice<UserRow>>(() =>
    createEmptyAdminUsersDirectorySlice(),
  );
  const [rolePolicies, setRolePolicies] = useState<Record<UserRole, RolePolicyRow> | null>(null);
  const [syncedAt, setSyncedAt] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [listEpoch, setListEpoch] = useState(0);
  const listEpochRef = useRef(0);
  const searchAppliedRef = useRef(searchApplied);
  useEffect(() => {
    searchAppliedRef.current = searchApplied;
  });
  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    label: string;
    oldRole: UserRole;
    newRole: UserRole;
  } | null>(null);

  const fetchUsersPage = useCallback(async (offset: number, q: string) => {
    const params = new URLSearchParams({ limit: '100', offset: String(offset) });
    if (q.trim()) params.set('q', q.trim());
    return apiFetch<AdminUsersPage>(`/api/admin/users?${params.toString()}`);
  }, []);

  const {
    data: adminData,
    isLoading: loading,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['admin', 'users-page', searchApplied],
    queryFn: async () => {
      const [userData, policyData] = await Promise.all([
        fetchUsersPage(0, searchApplied),
        apiFetch<RolePolicyRow[]>('/api/admin/role-policies'),
      ]);
      const map = (Array.isArray(policyData) ? policyData : []).reduce(
        (acc, row) => {
          acc[row.role] = row;
          return acc;
        },
        {} as Record<UserRole, RolePolicyRow>,
      );
      return {
        users: userData.users ?? [],
        hasMore: Boolean(userData.hasMore),
        offset: userData.offset ?? 0,
        limit: userData.limit ?? 100,
        rolePolicies: map,
      };
    },
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!shouldApplyAdminUsersSearchChange(searchAppliedRef.current, searchQuery)) return;
      listEpochRef.current += 1;
      const owner = { generation: listEpochRef.current, q: searchQuery };
      flushSync(() => {
        setSearchApplied(searchQuery);
        setListEpoch(listEpochRef.current);
        setSyncedAt(0);
        setDirectory((prev) => adminUsersDirectoryReducer(prev, { type: 'query_switch', owner }));
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load admin data'
    : null;

  const listOwner = useMemo(
    () => ({ generation: listEpoch, q: searchApplied }),
    [listEpoch, searchApplied],
  );

  if (adminData && dataUpdatedAt !== syncedAt) {
    setDirectory((prev) =>
      adminUsersDirectoryReducer(prev, {
        type: 'initial_page',
        owner: listOwner,
        users: adminData.users,
        hasMore: adminData.hasMore,
      }),
    );
    setRolePolicies(adminData.rolePolicies);
    setSyncedAt(dataUpdatedAt);
  }

  const { loadingMore, loadMoreUsers } = useAdminUsersLoadMore({
    directory,
    setDirectory,
    fetchPage: fetchUsersPage,
  });

  const displayedUsers = useMemo(() => directory.users, [directory.users]);
  const hasMore = directory.hasMore;

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    setMessage(null);
    try {
      await apiFetch('/api/admin/users/update-role', {
        method: 'PATCH',
        body: JSON.stringify({ userId, role: newRole }),
      });
      setDirectory((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      }));
      const changed = directory.users.find((u) => u.id === userId);
      const label = changed?.usernameDisplay || changed?.username || 'user';
      setMessage({ type: 'success', text: `Updated ${label} to ${ROLE_LABELS[newRole]}` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update role',
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <PageContainer size="xl">
      <PageHeader title="User Management" description="Change user roles by username." />
      <div className="mb-4">
        <Button variant="secondary" asChild>
          <Link href="/admin">← Back to Admin</Link>
        </Button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search username, display name, email, user id, or role"
          aria-label="Search users"
        />
      </div>

      {(message || directory.continuationError) && (
        <Alert variant={message?.type === 'success' ? 'success' : 'danger'} className="mb-4">
          {message?.text ?? directory.continuationError}
        </Alert>
      )}

      {loading ? (
        <LoadingState size="lg" padding="md" />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={() => void refetch()} />
      ) : displayedUsers.length === 0 ? (
        <EmptyState title="No users found." size="sm" />
      ) : (
        <>
          <p className="mb-3 text-sm text-text-secondary">
            Showing {displayedUsers.length} user{displayedUsers.length === 1 ? '' : 's'}
            {searchApplied.trim() ? ` matching “${searchApplied.trim()}”` : ''}
            {hasMore ? ' — more results available.' : '.'}
          </p>
          <ul className="min-w-0 space-y-3">
            {displayedUsers.map((u) => {
              const name = u.usernameDisplay || u.username;
              const label = name || 'user';
              return (
                <li
                  key={u.id}
                  className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,12.5rem)] lg:items-start"
                >
                  <div className="min-w-0 space-y-3">
                    <div className="min-w-0">
                      <p
                        className="truncate font-medium text-text-primary"
                        title={name || undefined}
                      >
                        {name || '(none)'}
                      </p>
                      <p
                        className="truncate text-sm text-text-secondary"
                        title={u.displayName || undefined}
                      >
                        Display name:{' '}
                        <span className="text-text-primary">{u.displayName || '—'}</span>
                      </p>
                      <p
                        className="truncate text-sm text-text-secondary"
                        title={u.email || undefined}
                      >
                        Email: <span className="text-text-primary">{u.email || '—'}</span>
                      </p>
                      <p className="text-sm text-text-secondary">
                        Role:{' '}
                        <span className="text-text-primary">
                          {ROLE_LABELS[u.role].replace(/ /g, '\u00a0')}
                        </span>
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-sm font-medium text-text-primary">Effective limits</p>
                      <RoleLimits role={u.role} rolePolicies={rolePolicies} />
                    </div>
                  </div>
                  <Select
                    label="Change role"
                    aria-label={`Change role for ${label}`}
                    value={u.role}
                    options={ROLE_OPTIONS}
                    disabled={updating === u.id}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      if (newRole === u.role) return;
                      setPendingChange({
                        userId: u.id,
                        label,
                        oldRole: u.role,
                        newRole,
                      });
                    }}
                  />
                </li>
              );
            })}
          </ul>
          {hasMore ? (
            <div className="mt-4">
              <Button
                variant="secondary"
                disabled={loadingMore}
                onClick={() => void loadMoreUsers()}
              >
                {loadingMore ? 'Loading…' : 'Load more users'}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <ConfirmActionModal
        isOpen={!!pendingChange}
        onClose={() => setPendingChange(null)}
        onConfirm={async () => {
          if (!pendingChange) return;
          const { userId, newRole } = pendingChange;
          await handleRoleChange(userId, newRole);
          setPendingChange(null);
        }}
        title={
          pendingChange?.newRole === 'admin'
            ? 'Grant admin access?'
            : pendingChange?.oldRole === 'admin'
              ? 'Revoke admin access?'
              : 'Change user role?'
        }
        description={
          pendingChange
            ? `Change ${pendingChange.label} from ${ROLE_LABELS[pendingChange.oldRole]} to ${ROLE_LABELS[pendingChange.newRole]}?` +
              (pendingChange.newRole === 'admin'
                ? ' Admins have full access to user management and all content.'
                : pendingChange.oldRole === 'admin'
                  ? ' They will lose access to the admin tools.'
                  : '')
            : ''
        }
        confirmLabel={
          pendingChange?.newRole === 'admin'
            ? 'Grant admin'
            : pendingChange?.oldRole === 'admin'
              ? 'Revoke admin'
              : 'Change role'
        }
        confirmVariant={
          pendingChange && (pendingChange.newRole === 'admin' || pendingChange.oldRole === 'admin')
            ? 'danger'
            : 'primary'
        }
        isLoading={!!pendingChange && updating === pendingChange.userId}
        loadingLabel="Updating..."
      />
    </PageContainer>
  );
}

function RoleLimits({
  role,
  rolePolicies,
}: {
  role: UserRole;
  rolePolicies: Record<UserRole, RolePolicyRow> | null;
}) {
  const p = rolePolicies?.[role];
  if (!p) return <p className="text-sm text-text-muted">—</p>;

  const canUpload = Boolean(p.permissions?.can_upload_profile_picture);
  const items = [
    ['Campaigns', formatRolePolicyLimit(p.max_campaigns)],
    ['Players/campaign', formatRolePolicyLimit(p.max_players_per_campaign)],
    ['Characters', formatRolePolicyLimit(p.max_characters)],
    ['Powers', formatRolePolicyLimit(p.max_custom_powers)],
    ['Techniques', formatRolePolicyLimit(p.max_custom_techniques)],
    ['Armaments', formatRolePolicyLimit(p.max_custom_armaments)],
    ['Creatures', formatRolePolicyLimit(p.max_custom_creatures)],
    ['Profile pic', canUpload ? 'Yes' : 'No'],
  ] as const;

  return (
    <ul className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm">
      {items.map(([name, value]) => (
        <li key={name} className="min-w-0">
          <span className="text-text-secondary">{name}: </span>
          <span className="text-text-primary">{value}</span>
        </li>
      ))}
    </ul>
  );
}
