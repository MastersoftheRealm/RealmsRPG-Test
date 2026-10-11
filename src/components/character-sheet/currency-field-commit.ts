/**
 * Sheet Currency field commit (86e3juw07).
 * Focusing the field is not an edit. Blur or Enter saves only a typed draft,
 * so a stale unedited value cannot overwrite a newer Currency from another tab.
 */

export type CurrencyFieldCommit = {
  /** Value to save. Null when the field was not edited, or the typed value matches Currency. */
  save: number | null;
  /** Text the field should show after this gesture. */
  display: string;
};

/** Blur uses the same absolute parse as before: `parseInt` or 0, including a negative draft. */
function absoluteCurrency(raw: string): number {
  return parseInt(raw, 10) || 0;
}

/** Enter keeps +N / -N against the current Currency, and does not go below 0. */
function enteredCurrency(raw: string, currency: number): number {
  const trimmed = raw.trim();
  let next = currency;
  if (trimmed.startsWith('+')) next = currency + (parseInt(trimmed.substring(1), 10) || 0);
  else if (trimmed.startsWith('-')) next = currency - (parseInt(trimmed.substring(1), 10) || 0);
  else next = parseInt(trimmed, 10) || 0;
  return Math.max(0, next);
}

function commit(value: number, currency: number): CurrencyFieldCommit {
  return {
    save: value !== currency ? value : null,
    display: String(value),
  };
}

export function currencyDraftOnBlur(input: {
  draft: string;
  currency: number;
  edited: boolean;
}): CurrencyFieldCommit {
  if (!input.edited) {
    return { save: null, display: String(input.currency) };
  }
  return commit(absoluteCurrency(input.draft), input.currency);
}

export function currencyDraftOnEnter(input: {
  draft: string;
  currency: number;
  edited: boolean;
}): CurrencyFieldCommit {
  if (!input.edited) {
    return { save: null, display: String(input.currency) };
  }
  return commit(enteredCurrency(input.draft, input.currency), input.currency);
}
