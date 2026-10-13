import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  CORE_RULES_NUMBER_ERROR_ATTR,
  parseCoreRulesNumber,
  type CoreRulesNumberOptions,
} from './core-rules-number';

/** Standard-tier add-row text control — coarse 44, fine compact. Do not shrink with `md:min-h-*`. */
export const CORE_RULES_ADD_ROW_CLASS =
  'mt-2 flex touch-tier-standard items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover';

export function FieldRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string | undefined;
}) {
  const id = React.useId();
  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })
    : children;

  return (
    <div className="flex flex-col gap-1 border-b border-border-subtle py-2 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <label htmlFor={id} className="shrink-0 text-sm font-medium text-text-secondary sm:w-64">
        {label}
      </label>
      <div className="min-w-0 flex-1">{control}</div>
      {hint && <span className="ml-2 shrink-0 text-xs text-text-muted">{hint}</span>}
    </div>
  );
}

export function NumInput({
  id,
  label,
  value,
  onChange,
  onEmpty,
  min,
  max,
  step,
  allowNegative,
  allowEmpty,
  integer = true,
  className,
  placeholder,
}: {
  id?: string | undefined;
  /** Accessible name when this input is not inside FieldRow. */
  label?: string | undefined;
  value: number | null;
  onChange: (v: number) => void;
  /** Blank commits null instead of an error. Used for optional caps such as currency max. */
  onEmpty?: (() => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  allowNegative?: boolean | undefined;
  allowEmpty?: boolean | undefined;
  integer?: boolean | undefined;
  className?: string | undefined;
  placeholder?: string | undefined;
}) {
  const errorId = React.useId();
  const options: CoreRulesNumberOptions = { min, max, allowNegative, integer };
  const [draft, setDraft] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [trackedValue, setTrackedValue] = React.useState(value);

  if (trackedValue !== value) {
    setTrackedValue(value);
    if (draft !== null) {
      const parsed = parseCoreRulesNumber(draft, options);
      if (!parsed.ok || parsed.value !== value) {
        setDraft(null);
        setError(null);
      }
    }
  }

  const shown = draft ?? (value == null ? '' : String(value));
  const floor = min !== undefined ? min : allowNegative ? undefined : 0;

  return (
    <span className="inline-flex flex-col gap-1">
      <input
        id={id}
        type="number"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        value={shown}
        min={floor}
        max={max}
        step={step}
        placeholder={placeholder}
        {...(error ? { [CORE_RULES_NUMBER_ERROR_ATTR]: error } : {})}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw.trim() === '' && allowEmpty) {
            setDraft(null);
            setError(null);
            onEmpty?.();
            return;
          }
          const parsed = parseCoreRulesNumber(raw, options);
          if (!parsed.ok) {
            setDraft(raw);
            setError(parsed.message);
            return;
          }
          setDraft(raw === String(parsed.value) ? null : raw);
          setError(null);
          if (parsed.value !== value) onChange(parsed.value);
        }}
        onBlur={() => {
          if (!error) setDraft(null);
        }}
        className={cn(
          className ??
            'w-28 rounded-lg border border-border-light bg-surface px-3 py-1.5 text-sm focus:border-primary-outline-border focus:ring-1 focus:ring-primary-outline-border',
          error && 'border-danger-border focus:ring-danger-border',
        )}
      />
      {error ? (
        <span id={errorId} role="alert" className="text-xs text-danger-fg">
          {error}
        </span>
      ) : null}
    </span>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  wide,
  placeholder,
}: {
  id?: string | undefined;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean | undefined;
  placeholder?: string | undefined;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${wide ? 'w-full' : 'w-64'} rounded-lg border border-border-light bg-surface px-3 py-1.5 text-sm focus:border-primary-outline-border focus:ring-1 focus:ring-primary-outline-border`}
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 mb-2 border-b border-border pb-1 text-base font-semibold text-text-primary">
      {children}
    </h2>
  );
}
