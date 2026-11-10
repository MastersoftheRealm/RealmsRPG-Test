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
  it('keeps the full-screen close control in the title row under the site header', () => {
    expect(modal).toContain(
      "useFullScreenMobile\n          ? 'top-20 right-0 bottom-0 left-0 items-stretch'",
    );
    expect(modal).toContain("useFullScreenMobile ? 'top-20 right-0 bottom-0 left-0'");
    expect(modal).toContain("useFullScreenMobile ? 'bg-background'");
    expect(modal).toContain("useFullScreenMobile ? 'mx-4 mt-2 mb-0 px-4 py-1.5'");
    expect(modal).toContain("showCloseButton && 'pr-12'");
    expect(modal).toContain("useFullScreenMobile ? 'top-2' : 'top-4'");
    expect(modal).not.toContain('top-[calc(5rem+0.25rem)]');
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

describe('error toasts above open dialogs (1dfe8wf3pa3)', () => {
  it('hides only non-error toasts while aria-modal is open', () => {
    expect(toast).toContain('data-toast-type={toast.type}');
    expect(globals).toContain("[data-toast-type]:not([data-toast-type='error'])");
    expect(globals).not.toContain(
      "body:has([aria-modal='true']) [aria-label='Notifications'] {\n    visibility: hidden;",
    );
  });

  it('lets clicks reach the dialog through a hidden non-error toast stack', () => {
    expect(globals).toContain(
      "body:has([aria-modal='true']) [aria-label='Notifications'] {\n    pointer-events: none;",
    );
    expect(globals).toContain(
      "body:has([aria-modal='true']) [aria-label='Notifications'] [data-toast-type='error'] {\n    pointer-events: auto;",
    );
  });
});

describe('power creator help popover (86e3jwt6b)', () => {
  it('blurs the trigger when the popover closes so it can reopen after Escape', () => {
    expect(infoTippy).toContain('referenceElRef.current?.blur()');
  });
});
