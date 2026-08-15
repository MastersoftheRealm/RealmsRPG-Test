'use client';

import { Input } from '@/components/ui';
import { ABILITY_OPTIONS } from './admin-archetype-path-form';
import type { AdminArchetypeEditorProps } from './admin-archetype-editor-config';

export type AdminArchetypeEditorMetaProps = Pick<
  AdminArchetypeEditorProps,
  'form' | 'setForm' | 'copySourceName'
>;

export function AdminArchetypeEditorMeta({
  form,
  setForm,
  copySourceName,
}: AdminArchetypeEditorMetaProps) {
  return (
    <>
      {copySourceName && (
        <p className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-sm text-text-secondary">
          Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change
          the name and details as needed, then save to add the new archetype.
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Archetype name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Type</label>
        <select
          value={form.type}
          onChange={(e) => {
            const nextType = e.target.value as 'power' | 'powered-martial' | 'martial';
            setForm((f) => ({
              ...f,
              type: nextType,
              level1Path:
                nextType === 'martial' ? { ...f.level1Path, innatePowers: [] } : f.level1Path,
            }));
          }}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
          aria-label="Archetype type"
        >
          <option value="power">Power</option>
          <option value="powered-martial">Powered-Martial</option>
          <option value="martial">Martial</option>
        </select>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Primary Ability
          </label>
          <select
            value={form.archetypeAbility}
            onChange={(e) => setForm((f) => ({ ...f, archetypeAbility: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
            aria-label="Primary archetype ability"
          >
            <option value="">Not set</option>
            {ABILITY_OPTIONS.map((ability) => (
              <option key={ability} value={ability}>
                {ability.charAt(0).toUpperCase() + ability.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Secondary Ability
          </label>
          <select
            value={form.secondaryAbility}
            onChange={(e) => setForm((f) => ({ ...f, secondaryAbility: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
            aria-label="Secondary archetype ability"
          >
            <option value="">Not set</option>
            {ABILITY_OPTIONS.map((ability) => (
              <option key={ability} value={ability}>
                {ability.charAt(0).toUpperCase() + ability.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Power Prof (Lv1)
          </label>
          <Input
            type="number"
            value={String(form.powerProfStart)}
            onChange={(e) =>
              setForm((f) => ({ ...f, powerProfStart: Number(e.target.value || 0) }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Martial Prof (Lv1)
          </label>
          <Input
            type="number"
            value={String(form.martialProfStart)}
            onChange={(e) =>
              setForm((f) => ({ ...f, martialProfStart: Number(e.target.value || 0) }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Power Prof (Lv5)
          </label>
          <Input
            type="number"
            value={String(form.powerProfLevel5)}
            onChange={(e) =>
              setForm((f) => ({ ...f, powerProfLevel5: Number(e.target.value || 0) }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Martial Prof (Lv5)
          </label>
          <Input
            type="number"
            value={String(form.martialProfLevel5)}
            onChange={(e) =>
              setForm((f) => ({ ...f, martialProfLevel5: Number(e.target.value || 0) }))
            }
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Archetype description"
          className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
          rows={3}
        />
      </div>
    </>
  );
}
