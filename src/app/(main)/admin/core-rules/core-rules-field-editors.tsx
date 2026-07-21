export function FieldRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-border-subtle last:border-0">
      <label className="sm:w-64 text-sm font-medium text-text-secondary shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
      {hint && <span className="text-xs text-text-muted dark:text-text-secondary ml-2 shrink-0">{hint}</span>}
    </div>
  );
}

export function NumInput({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-28 px-3 py-1.5 rounded-lg border border-border-light bg-surface text-sm focus:border-primary-outline-border focus:ring-1 focus:ring-primary-outline-border"
    />
  );
}

export function TextInput({ value, onChange, wide, placeholder }: { value: string; onChange: (v: string) => void; wide?: boolean; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${wide ? 'w-full' : 'w-64'} px-3 py-1.5 rounded-lg border border-border-light bg-surface text-sm focus:border-primary-outline-border focus:ring-1 focus:ring-primary-outline-border`}
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-text-primary mt-4 mb-2 border-b border-border pb-1">{children}</h3>;
}
