/**
 * Admin User Management
 * =====================
 * List users by username and change role.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageContainer, PageHeader, Button, LoadingState, EmptyState, Alert, Input, TableScroll } from '@/components/ui';
import { ConfirmActionModal, ErrorDisplay } from '@/components/shared';
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rolePolicies, setRolePolicies] = useState<Record<UserRole, RolePolicyRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingChange, setPendingChange] = useState<
    { userId: string; label: string; oldRole: UserRole; newRole: UserRole } | null
  >(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch<UserRow[]>('/api/admin/users'),
      apiFetch<RolePolicyRow[]>('/api/admin/role-policies'),
    ])
      .then(([userData, policyData]) => {
        if (cancelled) return;
        setUsers(Array.isArray(userData) ? userData : []);
        const map = (Array.isArray(policyData) ? policyData : []).reduce(
          (acc, row) => {
            acc[row.role] = row;
            return acc;
          },
          {} as Record<UserRole, RolePolicyRow>
        );
        setRolePolicies(map);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load admin data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadToken]);

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
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
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
      <PageHeader
        title="User Management"
        description="Change user roles by username."
      />
      <div className="mb-4">
        <Button variant="secondary" asChild>
          <Link href="/admin">← Back to Admin</Link>
        </Button>
      </div>

      <div className="mb-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        <ErrorDisplay message={error} onRetry={() => setReloadToken((token) => token + 1)} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState title="No users found." size="sm" />
      ) : (
        <TableScroll className="rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Display Name</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Effective limits</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Change role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-border-light last:border-0">
                  <td className="py-3 px-4 font-medium text-text-primary">{u.usernameDisplay || u.username || '(none)'}</td>
                  <td className="py-3 px-4 text-text-secondary">{u.displayName || '(none)'}</td>
                  <td className="py-3 px-4 text-text-secondary">{u.email || '(none)'}</td>
                  <td className="py-3 px-4 text-text-secondary">{ROLE_LABELS[u.role]}</td>
                  <td className="py-3 px-4 text-text-secondary">
                    <RoleLimitsCell role={u.role} rolePolicies={rolePolicies} />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        if (newRole === u.role) return;
                        setPendingChange({
                          userId: u.id,
                          label: u.usernameDisplay || u.username || 'user',
                          oldRole: u.role,
                          newRole,
                        });
                      }}
                      disabled={updating === u.id}
                      className="rounded border border-border bg-background px-2 py-1 text-sm"
                      aria-label={`Role for ${u.usernameDisplay || u.username || 'user'}`}
                    >
                      <option value="new_player">New Player</option>
                      <option value="playtester">Playtester</option>
                      <option value="developer">Developer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
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

function RoleLimitsCell({
  role,
  rolePolicies,
}: {
  role: UserRole;
  rolePolicies: Record<UserRole, RolePolicyRow> | null;
}) {
  const p = rolePolicies?.[role];
  if (!p) return <span className="text-text-muted dark:text-text-secondary">—</span>;

  const canUpload = Boolean(p.permissions?.can_upload_profile_picture);
  const parts = [
    `Campaigns: ${p.max_campaigns}`,
    `Players/campaign: ${p.max_players_per_campaign}`,
    `Characters: ${p.max_characters}`,
    `Powers: ${p.max_custom_powers}`,
    `Techniques: ${p.max_custom_techniques}`,
    `Armaments: ${p.max_custom_armaments}`,
    `Creatures: ${p.max_custom_creatures}`,
    `Profile pic: ${canUpload ? 'Yes' : 'No'}`,
  ];

  return (
    <div className="space-y-1">
      <div className="text-text-primary">{`Campaigns: ${p.max_campaigns} · Players/campaign: ${p.max_players_per_campaign} · Characters: ${p.max_characters}`}</div>
      <div className="text-xs text-text-muted dark:text-text-secondary">
        {`Powers ${p.max_custom_powers} · Techniques ${p.max_custom_techniques} · Armaments ${p.max_custom_armaments} · Creatures ${p.max_custom_creatures} · Profile pic ${canUpload ? 'Yes' : 'No'}`}
      </div>
      <span className="sr-only">{parts.join(', ')}</span>
    </div>
  );
}
