'use client';

import { Input } from '@/components/ui';
import { ABILITY_OPTIONS } from './admin-archetype-path-form';
import type { AdminArchetypeEditorProps } from './admin-archetype-editor-config';

export type AdminArchetypeEditorMetaProps = Pick<
  AdminArchetypeEditorProps,
  'form' | 'setForm' | 'copySourceName'
>;

export function AdminArchetypeEditorMeta({ form, setForm, copySourceName }: AdminArchetypeEditorMetaProps) {
  return (
    <>
      {copySourceName && (
        <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
          Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new archetype.
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Archetype name" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
        <select
          value={form.type}
          onChange={(e) => {
            const nextType = e.target.value as 'power' | 'powered-martial' | 'martial';
            setForm((f) => ({
              ...f,
              type: nextType,
              level1Path:
                nextType === 'martial'
                  ? { ...f.level1Path, innatePowers: [] }
                  : f.level1Path,
            }));
          }}
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
          aria-label="Archetype type"
        >
          <option value="power">Power</option>
          <option value="powered-martial">Powered-Martial</option>
          <option value="martial">Martial</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Primary Ability</label>
          <select
            value={form.archetypeAbility}
            onChange={(e) => setForm((f) => ({ ...f, archetypeAbility: e.target.value }))}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
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
          <label className="block text-sm font-medium text-text-secondary mb-1">Secondary Ability</label>
          <select
            value={form.secondaryAbility}
            onChange={(e) => setForm((f) => ({ ...f, secondaryAbility: e.target.value }))}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv1)</label>
          <Input
            type="number"
            value={String(form.powerProfStart)}
            onChange={(e) => setForm((f) => ({ ...f, powerProfStart: Number(e.target.value || 0) }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv1)</label>
          <Input
            type="number"
            value={String(form.martialProfStart)}
            onChange={(e) => setForm((f) => ({ ...f, martialProfStart: Number(e.target.value || 0) }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv5)</label>
          <Input
            type="number"
            value={String(form.powerProfLevel5)}
            onChange={(e) => setForm((f) => ({ ...f, powerProfLevel5: Number(e.target.value || 0) }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv5)</label>
          <Input
            type="number"
            value={String(form.martialProfLevel5)}
            onChange={(e) => setForm((f) => ({ ...f, martialProfLevel5: Number(e.target.value || 0) }))}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Archetype description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
      </div>
    </>
  );
}
