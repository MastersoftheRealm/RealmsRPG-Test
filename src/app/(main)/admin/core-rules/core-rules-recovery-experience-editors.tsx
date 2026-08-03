'use client';

import { FieldRow, SectionTitle, TextInput } from './core-rules-field-editors';

export function RecoveryEditor({
  data,
  set,
  setNested,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
  setNested: (parent: string, key: string, value: unknown) => void;
}) {
  const partial = (data.partial || {}) as Record<string, string>;
  const full = (data.full || {}) as Record<string, string>;

  return (
    <>
      <SectionTitle>Partial Recovery</SectionTitle>
      <FieldRow label="Duration"><TextInput wide value={partial.duration ?? ''} onChange={v => setNested('partial', 'duration', v)} /></FieldRow>
      <FieldRow label="Effect"><TextInput wide value={partial.effect ?? ''} onChange={v => setNested('partial', 'effect', v)} /></FieldRow>
      <FieldRow label="Interruption Grace"><TextInput wide value={partial.interruptionGrace ?? ''} onChange={v => setNested('partial', 'interruptionGrace', v)} /></FieldRow>
      <SectionTitle>Full Recovery</SectionTitle>
      <FieldRow label="Duration"><TextInput wide value={full.duration ?? ''} onChange={v => setNested('full', 'duration', v)} /></FieldRow>
      <FieldRow label="Effect"><TextInput wide value={full.effect ?? ''} onChange={v => setNested('full', 'effect', v)} /></FieldRow>
      <FieldRow label="Requirements"><TextInput wide value={data.requirements as string ?? ''} onChange={v => set('requirements', v)} /></FieldRow>
      <FieldRow label="Without Full Recovery"><TextInput wide value={data.withoutFullRecovery as string ?? ''} onChange={v => set('withoutFullRecovery', v)} /></FieldRow>
    </>
  );
}

export function ExperienceEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  return (
    <>
      <SectionTitle>Experience Rules</SectionTitle>
      <FieldRow label="XP to Level Up"><TextInput wide value={data.xpToLevelUp as string ?? ''} onChange={v => set('xpToLevelUp', v)} /></FieldRow>
      <FieldRow label="Combat XP"><TextInput wide value={data.combatXp as string ?? ''} onChange={v => set('combatXp', v)} /></FieldRow>
      <FieldRow label="Skill Encounter XP"><TextInput wide value={data.skillEncounterXp as string ?? ''} onChange={v => set('skillEncounterXp', v)} /></FieldRow>
      <FieldRow label="Skill Encounter DS"><TextInput wide value={data.skillEncounterDS as string ?? ''} onChange={v => set('skillEncounterDS', v)} /></FieldRow>
      <FieldRow label="Skill Encounter Successes"><TextInput wide value={data.skillEncounterSuccesses as string ?? ''} onChange={v => set('skillEncounterSuccesses', v)} /></FieldRow>
      <FieldRow label="Divide XP"><TextInput wide value={data.divideXp as string ?? ''} onChange={v => set('divideXp', v)} /></FieldRow>
    </>
  );
}
