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
      <PageHeader title="Admin" description="Manage game reference data and content." />

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Codex Editor</h2>
          <p className="mb-4 text-text-secondary">
            Edit feats, skills, species, traits, parts, properties, equipment, archetypes, and
            creature feats.
          </p>
          <Button asChild>
            <Link href="/admin/codex">Open Codex Editor</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Realms Library Editor</h2>
          <p className="mb-4 text-text-secondary">
            Edit published Realms Library items: powers, techniques, armaments, and creatures. Same
            list + modal format as the Codex editor. Changes are visible to all users on the Library
            page (Realms Library).
          </p>
          <Button asChild>
            <Link href="/admin/public-library">Open Official Library Editor</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">User Management</h2>
          <p className="mb-4 text-text-secondary">
            Change user roles (New Player, Playtester, Developer, Admin) by username.
          </p>
          <Button asChild>
            <Link href="/admin/users">Open User Management</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Role Policies</h2>
          <p className="mb-4 text-text-secondary">
            Configure per-role permissions and quotas for campaigns, characters, and custom library
            items.
          </p>
          <Button asChild>
            <Link href="/admin/roles">Open Role Policies</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Core Rules</h2>
          <p className="mb-4 text-text-secondary">
            Edit game rules: progression, combat, archetypes, conditions, sizes, rarities,
            abilities, skills, recovery, experience, and damage types.
          </p>
          <Button asChild>
            <Link href="/admin/core-rules">Open Core Rules Editor</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Realms Image Library</h2>
          <p className="mb-4 text-text-secondary">
            Upload, rename, tag, replace, and delete shared card art. Images can have multiple
            category tags and are referenced by species, creatures, armaments, powers, and
            techniques across the site.
          </p>
          <Button asChild>
            <Link href="/admin/images">Open Image Library</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Changelogs</h2>
          <p className="mb-4 text-text-secondary">
            Review the latest codex and core-rules edits by category, including timestamp, actor,
            and before/after details.
          </p>
          <Button asChild>
            <Link href="/admin/changelogs">Open Changelogs</Link>
          </Button>
        </section>
      </div>
    </PageContainer>
  );
}
