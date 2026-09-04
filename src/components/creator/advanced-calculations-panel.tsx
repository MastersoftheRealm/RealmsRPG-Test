export interface AdvancedCalculationRow {
  label: string;
  value: string;
  note?: string | undefined;
}

export interface AdvancedCalculationGroup {
  title: string;
  rows: AdvancedCalculationRow[];
}

interface AdvancedCalculationsPanelProps {
  title?: string | undefined;
  groups?: AdvancedCalculationGroup[] | undefined;
  ruleText?: string | undefined;
}

function CalculationRow({ row }: { row: AdvancedCalculationRow }) {
  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-text-secondary">{row.label}</span>
        <span className="shrink-0 text-right text-text-primary tabular-nums">{row.value}</span>
      </div>
      {row.note ? <p className="pr-1 text-text-muted">{row.note}</p> : null}
    </div>
  );
}

export function AdvancedCalculationsPanel({
  title = 'Advanced Calculations',
  groups,
  ruleText,
}: AdvancedCalculationsPanelProps) {
  const visibleGroups = groups ?? [];
  if (visibleGroups.length === 0) return null;

  return (
    <div className="mt-2 min-w-0">
      <details className="group rounded-lg border border-border-light bg-surface-alt">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          {title}
        </summary>
        <div className="space-y-3 border-t border-border-light px-3 py-3 text-xs">
          {visibleGroups.map((group) => (
            <div key={group.title} className="min-w-0 space-y-1.5">
              <h3 className="font-semibold text-text-primary">{group.title}</h3>
              {group.rows.map((row, index) => (
                <CalculationRow key={`${group.title}-${row.label}-${index}`} row={row} />
              ))}
            </div>
          ))}
          {ruleText ? <p className="pt-1 text-text-secondary">{ruleText}</p> : null}
        </div>
      </details>
    </div>
  );
}
