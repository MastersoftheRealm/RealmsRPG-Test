import { formatGroupedInteger } from '@/lib/utils/number';

/** QA repro (99999999999) after grouped formatting on blur. */
export const SHEET_CURRENCY_REPRO_FORMATTED = formatGroupedInteger(99_999_999_999);

/**
 * Border-box `max-w-[Nch]` must include `px-2` and 1px borders so the text
 * (sized with `size` / `ch`) is not clipped.
 */
export const SHEET_CURRENCY_INPUT_MAX_CHROME_CH = 4;

export const SHEET_CURRENCY_INPUT_MAX_CH =
  SHEET_CURRENCY_REPRO_FORMATTED.length + SHEET_CURRENCY_INPUT_MAX_CHROME_CH;

export const sheetCurrencyInputMaxWidthClass = `max-w-[${SHEET_CURRENCY_INPUT_MAX_CH}ch]`;
