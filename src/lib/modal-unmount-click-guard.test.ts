import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MODAL_CLOSE_CLICK_CAPTURE_MS } from './modal-close-click';
import { armModalUnmountClickGuard, modalUnmountShouldArmGuard } from './modal-unmount-click-guard';

const sheetModals = readFileSync(
  new URL('../app/(detail)/characters/[id]/CharacterSheetModals.tsx', import.meta.url),
  'utf8',
);
const notesTab = readFileSync(
  new URL('../components/character-sheet/notes-tab.tsx', import.meta.url),
  'utf8',
);
const archetypeSection = readFileSync(
  new URL('../components/character-sheet/archetype-section.tsx', import.meta.url),
  'utf8',
);

describe('sheet modal unmount click-through (86e3jw5g6)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('arms only when a modal closes', () => {
    expect(modalUnmountShouldArmGuard(true, false)).toBe(true);
    expect(modalUnmountShouldArmGuard(false, true)).toBe(false);
    expect(modalUnmountShouldArmGuard(true, true)).toBe(false);
    expect(modalUnmountShouldArmGuard(false, false)).toBe(false);
  });

  it('stops the click about 90ms after close, before it can reach Archetype & Attacks', () => {
    vi.useFakeTimers();
    const target = new EventTarget();
    const release = armModalUnmountClickGuard(target);

    vi.advanceTimersByTime(90);
    const followUp = new Event('click', { bubbles: true, cancelable: true });
    target.dispatchEvent(followUp);
    expect(followUp.defaultPrevented).toBe(true);
    release();
    expect(archetypeSection).toContain('Archetype & Attacks');
  });

  it('lets a click through after the guard window', () => {
    vi.useFakeTimers();
    const target = new EventTarget();
    const release = armModalUnmountClickGuard(target);
    vi.advanceTimersByTime(MODAL_CLOSE_CLICK_CAPTURE_MS);
    const later = new Event('click', { bubbles: true, cancelable: true });
    target.dispatchEvent(later);
    expect(later.defaultPrevented).toBe(false);
    release();
  });

  it('keeps Level Up and the other sheet modals guarded after they unmount', () => {
    expect(sheetModals).toContain('useModalUnmountClickGuard(showLevelUpModal)');
    expect(sheetModals).toContain('useModalUnmountClickGuard(showEditArchetypeModal)');
    expect(sheetModals).toContain('useModalUnmountClickGuard(addModalType != null)');
    expect(sheetModals).toContain('useModalUnmountClickGuard(featToRemove != null)');
    expect(sheetModals).toContain('useModalUnmountClickGuard(featModalType != null)');
    expect(sheetModals).toContain("useModalUnmountClickGuard(skillModalType === 'subskill')");
    expect(sheetModals).toContain('{showLevelUpModal && (');
    expect(notesTab).toContain('useModalUnmountClickGuard(notePendingDelete != null)');
  });
});
