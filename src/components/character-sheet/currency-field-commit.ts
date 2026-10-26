/**
 * Sheet Currency field commit (86e3juw07).
 * Focusing the field is not an edit. Blur or Enter saves only a typed draft,
 * so a stale unedited value cannot overwrite a newer Currency from another tab.
 */

import { clampSavedCurrency } from '@/lib/character-save';
import { formatGroupedInteger } from '@/lib/utils/number';

export type CurrencyFieldCommit = {
  /** Value to save. Null when the field was not edited, or the typed value matches Currency. */
  save: number | null;
  /** Text the field should show after this gesture. */
  display: string;
};

function digitsOnly(raw: string): string {
  return raw.replace(/,/g, '').trim();
}

/** Blur stores an absolute number. A negative draft floors to 0, the value save will keep. */
function absoluteCurrency(raw: string): number {
  const parsed = parseInt(digitsOnly(raw), 10);
  return clampSavedCurrency(Number.isFinite(parsed) ? parsed : 0);
}

/** Enter keeps +N / -N against the current Currency, and does not go below 0. */
function enteredCurrency(raw: string, currency: number): number {
  const trimmed = digitsOnly(raw);
  let next = currency;
  if (trimmed.startsWith('+')) next = currency + (parseInt(trimmed.substring(1), 10) || 0);
  else if (trimmed.startsWith('-')) next = currency - (parseInt(trimmed.substring(1), 10) || 0);
  else next = parseInt(trimmed, 10) || 0;
  return clampSavedCurrency(next);
}

function commit(value: number, currency: number): CurrencyFieldCommit {
  return {
    save: value !== currency ? value : null,
    display: formatGroupedInteger(value),
  };
}

export function currencyDraftOnBlur(input: {
  draft: string;
  currency: number;
  edited: boolean;
}): CurrencyFieldCommit {
  if (!input.edited) {
    return { save: null, display: formatGroupedInteger(input.currency) };
  }
  return commit(absoluteCurrency(input.draft), input.currency);
}

export function currencyDraftOnEnter(input: {
  draft: string;
  currency: number;
  edited: boolean;
}): CurrencyFieldCommit {
  if (!input.edited) {
    return { save: null, display: formatGroupedInteger(input.currency) };
  }
  return commit(enteredCurrency(input.draft, input.currency), input.currency);
}
