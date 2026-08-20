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
  return (
    <div className="flex flex-col gap-1 border-b border-border-subtle py-2 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <label className="shrink-0 text-sm font-medium text-text-secondary sm:w-64">{label}</label>
      <div className="flex-1">{children}</div>
      {hint && <span className="ml-2 shrink-0 text-xs text-text-muted">{hint}</span>}
    </div>
  );
}

export function NumInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-28 rounded-lg border border-border-light bg-surface px-3 py-1.5 text-sm focus:border-primary-outline-border focus:ring-1 focus:ring-primary-outline-border"
    />
  );
}

export function TextInput({
  value,
  onChange,
  wide,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  wide?: boolean | undefined;
  placeholder?: string | undefined;
}) {
  return (
    <input
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
    <h3 className="mt-4 mb-2 border-b border-border pb-1 text-base font-semibold text-text-primary">
      {children}
    </h3>
  );
}
