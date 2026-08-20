import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAdminCodexSaveTargetId } from './admin-codex-save-target';

const dir = import.meta.dirname;

const TAB_FILES = [
  'AdminFeatsTab.tsx',
  'AdminSkillsTab.tsx',
  'AdminSpeciesTab.tsx',
  'AdminTraitsTab.tsx',
  'AdminPartsTab.tsx',
  'AdminPropertiesTab.tsx',
  'AdminEquipmentTab.tsx',
  'AdminCreatureFeatsTab.tsx',
  'AdminArchetypesTab.tsx',
] as const;

const EDIT_MODALS = [
  'admin-feat-edit-modal.tsx',
  'admin-species-edit-modal.tsx',
  'admin-trait-edit-modal.tsx',
  'admin-part-edit-modal.tsx',
  'admin-property-edit-modal.tsx',
  'admin-skill-edit-modal.tsx',
  'admin-equipment-edit-modal.tsx',
  'admin-creature-feat-edit-modal.tsx',
] as const;

const FORM_FILES = [
  'admin-feat-form.ts',
  'admin-trait-form.ts',
  'admin-species-form.ts',
  'admin-part-form.ts',
  'admin-property-form.ts',
  'admin-archetype-path-form.ts',
] as const;

const EXTRACTED_MODAL_TABS = [
  ['AdminSkillsTab.tsx', 'AdminSkillEditModal'],
  ['AdminEquipmentTab.tsx', 'AdminEquipmentEditModal'],
  ['AdminCreatureFeatsTab.tsx', 'AdminCreatureFeatEditModal'],
] as const;

function readAdmin(name: string): string {
  return readFileSync(path.join(dir, name), 'utf8');
}

describe('resolveAdminCodexSaveTargetId (TASK-842)', () => {
  it('uses the editing id when editId is omitted', () => {
    expect(resolveAdminCodexSaveTargetId(undefined, 'feat-1')).toBe('feat-1');
    expect(resolveAdminCodexSaveTargetId(undefined, undefined)).toBeNull();
  });

  it('treats explicit null as create even if an edit session is open', () => {
    expect(resolveAdminCodexSaveTargetId(null, 'feat-1')).toBeNull();
  });

  it('prefers an explicit edit id', () => {
    expect(resolveAdminCodexSaveTargetId('feat-2', 'feat-1')).toBe('feat-2');
  });
});

describe('Admin Codex CRUD chrome (TASK-842 / TASK-845)', () => {
  it('drops two-click delete, inline Remove?, and requestDelete', () => {
    const names = [
      ...TAB_FILES,
      ...EDIT_MODALS,
      'use-admin-codex-delete.tsx',
      'use-admin-codex-entity.tsx',
      'use-admin-archetype-workspace.ts',
      'admin-codex-row-actions.tsx',
      'admin-codex-edit-modal-footer.tsx',
    ];
    const joined = names.map(readAdmin).join('\n');
    expect(joined).not.toContain('requestDelete');
    expect(joined).not.toContain('Click again to confirm delete');
    expect(joined).not.toContain('Remove?');
    expect(joined).not.toContain('pendingDeleteId');
  });

  it('wires every entity tab onto the co-located CRUD helpers', () => {
    for (const name of TAB_FILES) {
      const src = readAdmin(name);
      expect(src, name).toContain('AdminCodexRowActions');
      expect(src, name).toContain('askDelete');
      expect(src, name).toContain('deleteModals');
    }
    expect(readAdmin('use-admin-archetype-workspace.ts')).toContain('useAdminCodexEntity');
    expect(readAdmin('use-admin-codex-delete.tsx')).toContain('AdminCodexDeleteModals');
    expect(readAdmin('use-admin-codex-delete.tsx')).toContain('deleteContext="Codex"');
    expect(readAdmin('use-admin-codex-delete.tsx')).not.toContain(
      'export function AdminCodexDeleteConfirmModal',
    );
    expect(readAdmin('use-admin-codex-entity.tsx')).not.toContain('codexQueryKeysToRefresh');
    expect(readAdmin('use-admin-codex-entity.tsx')).not.toContain('refreshCodexQueries');
    expect(readAdmin('use-admin-codex-entity.tsx')).not.toContain('codexDelete:');
  });

  it('keeps CRUD files under admin/codex, not patterns or ui', () => {
    const files = readdirSync(dir);
    expect(files).toContain('use-admin-codex-entity.tsx');
    expect(files).toContain('admin-codex-row-actions.tsx');
    expect(files).toContain('admin-codex-edit-modal-footer.tsx');
    const helpers = [
      readAdmin('use-admin-codex-entity.tsx'),
      readAdmin('admin-codex-row-actions.tsx'),
      readAdmin('admin-codex-edit-modal-footer.tsx'),
    ].join('\n');
    expect(helpers).toContain('TASK-842');
    expect(helpers).not.toMatch(/from '@\/components\/(shared|patterns)\/official/);
  });
});

describe('Admin Codex copy suffix + leftover edit modals (TASK-849)', () => {
  it('uses one COPY_NAME_SUFFIX for the nine entity tabs', () => {
    const src = readAdmin('admin-codex-copy-suffix.ts');
    expect(src).toContain("export const COPY_NAME_SUFFIX = ' copy'");
    expect(src).not.toMatch(/from '@\/components\/(shared|ui)/);

    for (const name of FORM_FILES) {
      const form = readAdmin(name);
      expect(form, name).not.toContain('COPY_NAME_SUFFIX');
    }

    const consumers = [
      'AdminFeatsTab.tsx',
      'AdminSkillsTab.tsx',
      'AdminSpeciesTab.tsx',
      'AdminTraitsTab.tsx',
      'AdminPartsTab.tsx',
      'AdminPropertiesTab.tsx',
      'AdminEquipmentTab.tsx',
      'AdminCreatureFeatsTab.tsx',
      'admin-archetype-workspace-open.ts',
    ];
    for (const name of consumers) {
      expect(readAdmin(name), name).toContain("from './admin-codex-copy-suffix'");
    }

    const spreadsheet = readAdmin('use-codex-spreadsheet.ts');
    expect(spreadsheet).toContain("const COPY_NAME_SUFFIX = ' copy'");
    expect(spreadsheet).not.toContain("from './admin-codex-copy-suffix'");
  });

  it('extracts Skills, Equipment, and Creature Feat edit chrome', () => {
    for (const [tab, modal] of EXTRACTED_MODAL_TABS) {
      const src = readAdmin(tab);
      expect(src, tab).toContain(modal);
      expect(src, tab).not.toContain('<Modal');
      expect(src, tab).not.toContain('AdminCodexEditModalFooter');
    }
    for (const name of [
      'admin-skill-edit-modal.tsx',
      'admin-equipment-edit-modal.tsx',
      'admin-creature-feat-edit-modal.tsx',
    ]) {
      const src = readAdmin(name);
      expect(src, name).toContain('AdminCodexEditModalFooter');
      expect(src, name).toContain('fullScreenOnMobile');
    }
    for (const name of [
      'admin-skill-edit-modal.tsx',
      'admin-equipment-edit-modal.tsx',
      'admin-creature-feat-edit-modal.tsx',
    ]) {
      expect(readAdmin(name), name).not.toContain('export type Admin');
      expect(readAdmin(name), name).toContain('EMPTY_');
    }
  });
});

describe('Admin Codex copy-source banner (TASK-852)', () => {
  const BANNER_CONSUMERS = [
    ['admin-feat-edit-modal.tsx', 'feat'],
    ['admin-species-edit-modal.tsx', 'species'],
    ['admin-trait-edit-modal.tsx', 'trait'],
    ['admin-part-edit-modal.tsx', 'part'],
    ['admin-property-edit-modal.tsx', 'property'],
    ['admin-skill-edit-modal.tsx', 'skill'],
    ['admin-equipment-edit-modal.tsx', 'equipment'],
    ['admin-creature-feat-edit-modal.tsx', 'creature feat'],
    ['admin-archetype-editor-meta.tsx', 'archetype'],
  ] as const;

  it('keeps one co-located banner under admin/codex', () => {
    const src = readAdmin('admin-codex-copy-source-banner.tsx');
    expect(src).toContain('export function AdminCodexCopySourceBanner');
    expect(src).toContain('entityLabel');
    expect(src).toContain('Creating a copy of');
    expect(src).toContain('save to add the new');
    expect(src).not.toMatch(/from '@\/components\/(shared|ui)/);
  });

  it('wires the nine Duplicate callouts onto the banner', () => {
    for (const [name, label] of BANNER_CONSUMERS) {
      const src = readAdmin(name);
      expect(src, name).toContain("from './admin-codex-copy-source-banner'");
      expect(src, name).toContain(`entityLabel="${label}"`);
      expect(src, name).not.toContain('Creating a copy of');
    }
  });
});
