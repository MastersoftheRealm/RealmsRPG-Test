/**
 * Admin User Management
 * =====================
 * List users by username and change role.
 * Card rows keep Effective limits and Change role on screen at 768 and 1024
 * (ClickUp 86e3jzu53). A six-column table was clipped by page overflow.
 */

'use client';

import { useMemo, useState } from 'react';
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

type UserRole = 'new_player' | 'playtester' | 'developer' | 'admin';

interface UserRow {
  id: string;
  username: string;
  usernameDisplay: string;
  email: string;
  displayName: string;
  role: UserRole;
}

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

const ROLE_LABELS: Record<UserRole, string> = {
  new_player: 'New Player',
  playtester: 'Playtester',
  developer: 'Developer',
  admin: 'Admin',
};

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rolePolicies, setRolePolicies] = useState<Record<UserRole, RolePolicyRow> | null>(null);
  const [syncedAt, setSyncedAt] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    label: string;
    oldRole: UserRole;
    newRole: UserRole;
  } | null>(null);

  const {
    data: adminData,
    isLoading: loading,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['admin', 'users-page'],
    queryFn: async () => {
      const [userData, policyData] = await Promise.all([
        apiFetch<UserRow[]>('/api/admin/users'),
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
        users: Array.isArray(userData) ? userData : [],
        rolePolicies: map,
      };
    },
  });
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load admin data'
    : null;

  if (adminData && dataUpdatedAt !== syncedAt) {
    setUsers(adminData.users);
    setRolePolicies(adminData.rolePolicies);
    setSyncedAt(dataUpdatedAt);
  }

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const roleLabel = ROLE_LABELS[u.role].toLowerCase();
      return (
        u.usernameDisplay.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        roleLabel.includes(q)
      );
    });
  }, [users, searchQuery]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    setMessage(null);
    try {
      await apiFetch('/api/admin/users/update-role', {
        method: 'PATCH',
        body: JSON.stringify({ userId, role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      const changed = users.find((u) => u.id === userId);
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
          placeholder="Search username, display name, email, or role"
          aria-label="Search users"
        />
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
          {message.text}
        </Alert>
      )}

      {loading ? (
        <LoadingState size="lg" padding="md" />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={() => void refetch()} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState title="No users found." size="sm" />
      ) : (
        <ul className="min-w-0 space-y-3">
          {filteredUsers.map((u) => {
            const name = u.usernameDisplay || u.username;
            const label = name || 'user';
            return (
              <li
                key={u.id}
                className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,12.5rem)] lg:items-start"
              >
                <div className="min-w-0 space-y-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary" title={name || undefined}>
                      {name || '(none)'}
                    </p>
                    <p
                      className="truncate text-sm text-text-secondary"
                      title={u.displayName || undefined}
                    >
                      {u.displayName || '(none)'}
                    </p>
                    <p
                      className="truncate text-sm text-text-secondary"
                      title={u.email || undefined}
                    >
                      {u.email || '(none)'}
                    </p>
                    <p className="text-sm text-text-secondary">Role: {ROLE_LABELS[u.role]}</p>
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
    ['Campaigns', String(p.max_campaigns)],
    ['Players/campaign', String(p.max_players_per_campaign)],
    ['Characters', String(p.max_characters)],
    ['Powers', String(p.max_custom_powers)],
    ['Techniques', String(p.max_custom_techniques)],
    ['Armaments', String(p.max_custom_armaments)],
    ['Creatures', String(p.max_custom_creatures)],
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
