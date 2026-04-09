import { calculateAbilityPoints, calculateProficiency, calculateSkillPointsForEntity, calculateTrainingPoints } from '@/lib/game/formulas';
import type { CoreRulesMap } from '@/types/core-rules';
import type { TooltipTemplateContext } from '@/types/tooltips';

type CalcFn = (args: unknown[], context: TooltipTemplateContext, rules: CoreRulesMap) => string | number;

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stripQuotes(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
}

function parseArgs(raw: string, context: TooltipTemplateContext): unknown[] {
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((arg) => {
      const unquoted = stripQuotes(arg);
      if (/^-?\d+(\.\d+)?$/.test(unquoted)) return Number(unquoted);
      if (unquoted === 'true') return true;
      if (unquoted === 'false') return false;
      if (arg.includes('.') && !arg.includes('"') && !arg.includes("'")) {
        const pathValue = getPathValue(context, unquoted);
        if (pathValue !== undefined) return pathValue;
      }
      return context[unquoted] ?? unquoted;
    });
}

const CALCS: Record<string, CalcFn> = {
  abilityPointsAtLevel: (args, _ctx, rules) => {
    const level = asNumber(args[0], 1);
    return calculateAbilityPoints(level, false, rules);
  },
  skillPointsAtLevel: (args, _ctx, rules) => {
    const level = asNumber(args[0], 1);
    const entity = String(args[1] ?? 'character') === 'creature' ? 'creature' : 'character';
    return calculateSkillPointsForEntity(level, entity, rules);
  },
  proficiencyAtLevel: (args, _ctx, rules) => {
    const level = asNumber(args[0], 1);
    return calculateProficiency(level, false, rules);
  },
  trainingPointsAtLevel: (args, _ctx, rules) => {
    const level = asNumber(args[0], 1);
    const ability = asNumber(args[1], 0);
    return calculateTrainingPoints(level, ability, rules);
  },
  abilityIncreaseCostAt: (args, _ctx, rules) => {
    const value = asNumber(args[0], 0);
    const threshold = rules.ABILITY_RULES.costIncreaseThreshold;
    return value >= threshold ? rules.ABILITY_RULES.increasedCost : rules.ABILITY_RULES.normalCost;
  },
};

function resolveToken(expr: string, rules: CoreRulesMap, context: TooltipTemplateContext): string {
  if (expr.startsWith('rules.')) {
    const value = getPathValue(rules, expr.replace(/^rules\./, ''));
    return value == null ? '—' : String(value);
  }

  if (expr.startsWith('context.')) {
    const value = getPathValue(context, expr.replace(/^context\./, ''));
    return value == null ? '—' : String(value);
  }

  if (expr.startsWith('calc.')) {
    const fnMatch = expr.match(/^calc\.([A-Za-z0-9_]+)\((.*)\)$/);
    if (!fnMatch) return '—';
    const [, fnName, argsRaw] = fnMatch;
    const fn = CALCS[fnName];
    if (!fn) return '—';
    const args = parseArgs(argsRaw, context);
    const value = fn(args, context, rules);
    return value == null ? '—' : String(value);
  }

  if (expr in context) {
    const value = context[expr];
    return value == null ? '—' : String(value);
  }

  return '—';
}

export function interpolateTooltipTemplate(template: string, rules: CoreRulesMap, context: TooltipTemplateContext = {}): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, expr: string) => {
    return resolveToken(expr.trim(), rules, context);
  });
}
