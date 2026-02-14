/**
 * Admin User Management
 * =====================
 * List users by username and change role (New Player, Playtester, Developer).
 * Admin role can only be set via ADMIN_UIDS env.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageContainer, PageHeader, Button, Spinner, Alert } from '@/components/ui';

type UserRole = 'new_player' | 'playtester' | 'developer' | 'admin';

interface UserRow {
  id: string;
  username: string;
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

  const handleRoleChange = async (username: string, newRole: UserRole) => {
    if (newRole === 'admin') return;
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
        description="Change user roles by username. Admin can only be set via environment variables."
      />
      <div className="mb-4">
        <Button variant="secondary" asChild>
          <Link href="/admin">← Back to Admin</Link>
        </Button>
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
      ) : users.length === 0 ? (
        <p className="text-text-muted italic">No users found.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Change role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border-light last:border-0">
                  <td className="py-3 px-4 font-medium text-text-primary">{u.username || '(none)'}</td>
                  <td className="py-3 px-4 text-text-secondary">{ROLE_LABELS[u.role]}</td>
                  <td className="py-3 px-4">
                    {u.role === 'admin' ? (
                      <span className="text-text-muted">Admin</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.username, e.target.value as UserRole)}
                        disabled={updating === u.username}
                        className="rounded border border-border bg-background px-2 py-1 text-sm"
                      >
                        <option value="new_player">New Player</option>
                        <option value="playtester">Playtester</option>
                        <option value="developer">Developer</option>
                      </select>
                    )}
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
