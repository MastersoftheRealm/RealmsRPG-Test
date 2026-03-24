export interface AdvancedCalculationRow {
  label: string;
  value: string;
}

interface AdvancedCalculationsPanelProps {
  title?: string;
  rows: AdvancedCalculationRow[];
  ruleText?: string;
}

export function AdvancedCalculationsPanel({
  title = 'Advanced Calculations',
  rows,
  ruleText,
}: AdvancedCalculationsPanelProps) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-2">
      <details className="group rounded-lg border border-border-light bg-surface-alt">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-text-primary">
          {title}
        </summary>
        <div className="space-y-2 border-t border-border-light px-3 py-3 text-xs">
          {rows.map((row, index) => (
            <div key={`${row.label}-${index}`} className="flex items-start justify-between gap-3">
              <span className="text-text-secondary">{row.label}</span>
              <span className="text-right font-mono text-text-primary">{row.value}</span>
            </div>
          ))}
          {ruleText ? <p className="pt-1 text-text-secondary">{ruleText}</p> : null}
        </div>
      </details>
    </div>
  );
}
