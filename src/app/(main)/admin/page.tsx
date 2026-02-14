/**
 * Admin Dashboard
 * ===============
 * Landing page for admin tools.
 */

import Link from 'next/link';
import { PageContainer, PageHeader, Button } from '@/components/ui';

export default function AdminPage() {
  return (
    <PageContainer size="xl">
      <PageHeader
        title="Admin"
        description="Manage game reference data and content."
      />

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Codex Editor</h2>
          <p className="text-text-secondary mb-4">
            Edit feats, skills, species, traits, parts, properties, equipment, archetypes, and creature feats.
          </p>
          <Button asChild>
            <Link href="/admin/codex">Open Codex Editor</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">User Management</h2>
          <p className="text-text-secondary mb-4">
            Change user roles (New Player, Playtester, Developer) by username. Admin can only be set via environment variables.
          </p>
          <Button asChild>
            <Link href="/admin/users">Open User Management</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Core Rules</h2>
          <p className="text-text-secondary mb-4">
            Edit game rules: progression, combat, archetypes, conditions, sizes, rarities, ability scores, skills, recovery, experience, and damage types.
          </p>
          <Button asChild>
            <Link href="/admin/core-rules">Open Core Rules Editor</Link>
          </Button>
        </section>
      </div>
    </PageContainer>
  );
}
