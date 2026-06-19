/**
 * Admin Role Policies Page
 * ========================
 * Manage role-based quotas and permissions.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Input, PageContainer, PageHeader, Spinner } from '@/components/ui';
import { ErrorDisplay } from '@/components/shared';
import { apiFetch } from '@/lib/api-client';

type UserRole = 'new_player' | 'playtester' | 'developer' | 'admin';

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
  updated_at: string | null;
  updated_by: string | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  new_player: 'New Player',
  playtester: 'Playtester',
  developer: 'Developer',
  admin: 'Admin',
};

export default function AdminRolesPage() {
  const [rows, setRows] = useState<RolePolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<UserRole | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<RolePolicyRow[]>('/api/admin/role-policies')
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load role policies');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const onNumberChange = (role: UserRole, key: keyof RolePolicyRow, rawValue: string) => {
    const value = Math.max(0, Math.floor(Number(rawValue) || 0));
    setRows((prev) => prev.map((r) => (r.role === role ? { ...r, [key]: value } : r)));
  };

  const onCanUploadChange = (role: UserRole, checked: boolean) => {
    setRows((prev) =>
      prev.map((r) =>
        r.role === role
          ? {
              ...r,
              permissions: {
                ...(r.permissions ?? {}),
                can_upload_profile_picture: checked,
              },
            }
          : r
      )
    );
  };

  const saveRole = async (row: RolePolicyRow) => {
    setSavingRole(row.role);
    setMessage(null);
    try {
      const data = await apiFetch<RolePolicyRow>('/api/admin/role-policies', {
        method: 'PATCH',
        body: JSON.stringify({
          role: row.role,
          maxCampaigns: row.max_campaigns,
          maxPlayersPerCampaign: row.max_players_per_campaign,
          maxCharacters: row.max_characters,
          maxCustomPowers: row.max_custom_powers,
          maxCustomTechniques: row.max_custom_techniques,
          maxCustomArmaments: row.max_custom_armaments,
          maxCustomCreatures: row.max_custom_creatures,
          permissions: row.permissions ?? {},
        }),
      });
      setRows((prev) => prev.map((r) => (r.role === row.role ? data : r)));
      setMessage({ type: 'success', text: `${ROLE_LABELS[row.role]} policy saved.` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save role policy',
      });
    } finally {
      setSavingRole(null);
    }
  };

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Role Policies"
        description="Manage per-role permissions and quotas for campaigns, characters, and custom library content."
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
        <ErrorDisplay message={error} onRetry={() => setReloadToken((token) => token + 1)} />
      ) : rows.length === 0 ? (
        <p className="text-text-muted dark:text-text-secondary italic">No role policies found.</p>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => {
            const canUpload = Boolean(row.permissions?.can_upload_profile_picture);
            return (
              <section key={row.role} className="rounded-lg border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold text-text-primary mb-4">{ROLE_LABELS[row.role]}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LabeledNumberInput
                    label="Max Campaigns"
                    value={row.max_campaigns}
                    onChange={(value) => onNumberChange(row.role, 'max_campaigns', value)}
                  />
                  <LabeledNumberInput
                    label="Max Players Per Campaign"
                    value={row.max_players_per_campaign}
                    onChange={(value) => onNumberChange(row.role, 'max_players_per_campaign', value)}
                  />
                  <LabeledNumberInput
                    label="Max Characters"
                    value={row.max_characters}
                    onChange={(value) => onNumberChange(row.role, 'max_characters', value)}
                  />
                  <LabeledNumberInput
                    label="Max Custom Powers"
                    value={row.max_custom_powers}
                    onChange={(value) => onNumberChange(row.role, 'max_custom_powers', value)}
                  />
                  <LabeledNumberInput
                    label="Max Custom Techniques"
                    value={row.max_custom_techniques}
                    onChange={(value) => onNumberChange(row.role, 'max_custom_techniques', value)}
                  />
                  <LabeledNumberInput
                    label="Max Custom Armaments"
                    value={row.max_custom_armaments}
                    onChange={(value) => onNumberChange(row.role, 'max_custom_armaments', value)}
                  />
                  <LabeledNumberInput
                    label="Max Custom Creatures"
                    value={row.max_custom_creatures}
                    onChange={(value) => onNumberChange(row.role, 'max_custom_creatures', value)}
                  />
                </div>

                <label className="inline-flex items-center gap-3 mt-4 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={canUpload}
                    onChange={(event) => onCanUploadChange(row.role, event.target.checked)}
                    aria-label={`Allow profile picture uploads for ${ROLE_LABELS[row.role]}`}
                  />
                  <span className="text-text-primary">Allow profile picture uploads</span>
                </label>

                <div className="mt-4">
                  <Button
                    onClick={() => saveRole(row)}
                    disabled={savingRole === row.role}
                    className="min-h-[44px]"
                  >
                    {savingRole === row.role ? 'Saving...' : `Save ${ROLE_LABELS[row.role]}`}
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function LabeledNumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-text-secondary mb-1">{label}</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px]"
      />
    </label>
  );
}
