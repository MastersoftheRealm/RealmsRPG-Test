import { describe, expect, it } from 'vitest';
import { resolveCodexFormDraft } from './use-admin-codex-form-state';
import { EMPTY_TRAIT_FORM, traitFormToSavePayload } from './admin-trait-form';

describe('resolveCodexFormDraft', () => {
  it('applies functional updates the same way useState would', () => {
    const prev = { ...EMPTY_TRAIT_FORM, description: 'dont' };
    const next = resolveCodexFormDraft(prev, (f) => ({ ...f, description: "don't" }));
    expect(next.description).toBe("don't");
  });

  it('lets Save read the last keystroke before re-render (ref sync contract)', () => {
    let ref = { ...EMPTY_TRAIT_FORM, name: 'Adorable', description: 'dont' };
    const setForm = (action: typeof ref | ((p: typeof ref) => typeof ref)) => {
      ref = resolveCodexFormDraft(ref, action);
    };
    setForm((f) => ({ ...f, description: "don't" }));
    const payload = traitFormToSavePayload(ref);
    expect(payload.description).toBe("don't");
  });
});
