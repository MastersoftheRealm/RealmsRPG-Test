import { statusPanel } from '@/lib/ui/status-surface-classes';

export type RulebookCalloutKind = 'note' | 'write-down' | 'example' | 'tip';

export function classifyRulebookCallout(text: string): RulebookCalloutKind {
  const value = text.trim();
  if (/^write this down/i.test(value)) return 'write-down';
  if (/^player tip/i.test(value) || /^another way to play/i.test(value)) return 'tip';
  if (/^example\b/i.test(value) || /four adventurers/i.test(value)) return 'example';
  return 'note';
}

export function rulebookCalloutClassName(kind: RulebookCalloutKind): string {
  const base = 'mb-4 rounded-md border-l-4 px-4 py-3 text-sm leading-relaxed text-text-primary';
  switch (kind) {
    case 'write-down':
    case 'tip':
      return `${base} ${statusPanel.warning}`;
    case 'example':
      return `${base} ${statusPanel.neutral}`;
    default:
      return `${base} border-primary-subtle-border bg-primary-subtle-bg`;
  }
}
