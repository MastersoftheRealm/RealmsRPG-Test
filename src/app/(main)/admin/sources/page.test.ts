import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { iconButtonVariants } from '@/components/ui/icon-button';
import { adminSourcesRowDetailLine } from './admin-sources-copy';

const REMOVE_BUTTON_PHONE_CLASS = 'max-sm:h-11 max-sm:w-11';

describe('Admin Sources page', () => {
  it('keeps row remove at the dense desktop box and 44px below sm', () => {
    const page = readFileSync(join(process.cwd(), 'src/app/(main)/admin/sources/page.tsx'), 'utf8');
    const removeButton = page.match(
      /<IconButton\s+type="button"\s+variant="ghost"\s+size="sm"\s+className="([^"]+)"\s+label=\{adminSourcesRemoveButtonLabel\(itemName, selectedSource\)\}/,
    );
    expect(removeButton?.[1]).toBe(REMOVE_BUTTON_PHONE_CLASS);

    const classes = iconButtonVariants({
      variant: 'ghost',
      size: 'sm',
      className: removeButton?.[1],
    }).split(/\s+/);
    expect(classes).toContain('h-7');
    expect(classes).toContain('w-7');
    expect(classes).toContain('max-sm:h-11');
    expect(classes).toContain('max-sm:w-11');
    expect(classes).not.toContain('h-8');
    expect(classes).not.toContain('w-8');
    expect(classes).not.toContain('h-11');
    expect(classes).not.toContain('w-11');
  });

  it('formats row detail copy with the stored field name', () => {
    expect(adminSourcesRowDetailLine('feat_lvl', '3')).toBe('feat_lvl 3');
  });
});
