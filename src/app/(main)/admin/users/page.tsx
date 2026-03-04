/**
 * Admin User Management
 * =====================
 * List users by username and change role.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageContainer, PageHeader, Button, Spinner, Alert, Input } from '@/components/ui';

type UserRole = 'new_player' | 'playtester' | 'developer' | 'admin';

interface UserRow {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  new_player: 'New Player',
  playtester: 'Playtester',
  developer: 'Developer',
  admin: 'Admin',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/admin/users')
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? 'Forbidden' : 'Failed to load users');
        return res.json();
      })
      .then((data: UserRow[]) => {
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const roleLabel = ROLE_LABELS[u.role].toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        roleLabel.includes(q)
      );
    });
  }, [users, searchQuery]);

  const handleRoleChange = async (username: string, newRole: UserRole) => {
    setUpdating(username);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users/update-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update');
      setUsers((prev) =>
        prev.map((u) => (u.username === username ? { ...u, role: newRole } : u))
      );
      setMessage({ type: 'success', text: `Updated ${username} to ${ROLE_LABELS[newRole]}` });
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
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredUsers.length === 0 ? (
        <p className="text-text-muted dark:text-text-secondary italic">No users found.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Display Name</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Change role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-border-light last:border-0">
                  <td className="py-3 px-4 font-medium text-text-primary">{u.username || '(none)'}</td>
                  <td className="py-3 px-4 text-text-secondary">{u.displayName || '—'}</td>
                  <td className="py-3 px-4 text-text-secondary">{u.email || '—'}</td>
                  <td className="py-3 px-4 text-text-secondary">{ROLE_LABELS[u.role]}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.username, e.target.value as UserRole)}
                      disabled={updating === u.username}
                      className="rounded border border-border bg-background px-2 py-1 text-sm"
                      aria-label={`Role for ${u.username || 'user'}`}
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
        </div>
      )}
    </PageContainer>
  );
}
