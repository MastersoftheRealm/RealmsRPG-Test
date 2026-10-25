import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const modal = readFileSync(new URL('../ui/modal.tsx', import.meta.url), 'utf8');
const loadModal = readFileSync(new URL('./LoadFromLibraryModal.tsx', import.meta.url), 'utf8');
const footer = readFileSync(
  new URL('../patterns/select/unified-selection-modal-footer.tsx', import.meta.url),
  'utf8',
);
const toast = readFileSync(new URL('../ui/toast.tsx', import.meta.url), 'utf8');
const globals = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8');
const infoTippy = readFileSync(new URL('../patterns/help/info-tippy.tsx', import.meta.url), 'utf8');

describe('creator modal batch 9 (86e3jym93 / 86e3jyh5p)', () => {
  it('places the mobile full-screen close control below the site header', () => {
    expect(modal).toContain("useFullScreenMobile ? 'top-[calc(5rem+0.25rem)]'");
  });

  it('wraps creator load modal footer actions and shows the selection count on narrow viewports', () => {
    expect(loadModal).toContain('wrapFooterActions');
    expect(footer).toContain("!wrapFooterActions && 'max-sm:sr-only'");
    expect(footer).toContain("wrapFooterActions ? 'flex-col'");
  });

  it('keeps toasts off modal chrome and away from the page title on phones', () => {
    expect(globals).toContain("[aria-label='Notifications']");
    expect(toast).toContain('sm:top-20');
    expect(toast).toContain('bottom-[max(1rem,env(safe-area-inset-bottom,0px))]');
  });
});

describe('power creator help popover (86e3jwt6b)', () => {
  it('blurs the trigger when the popover closes so it can reopen after Escape', () => {
    expect(infoTippy).toContain('referenceElRef.current?.blur()');
  });
});
