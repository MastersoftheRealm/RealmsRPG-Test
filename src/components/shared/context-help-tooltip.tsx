'use client';

import { HelpTooltip } from '@/components/ui';
import { useTooltipByKey } from '@/hooks';
import type { TooltipPlacement } from '@/types/tooltips';
import type { TooltipTemplateContext } from '@/types/tooltips';

interface ContextHelpTooltipProps {
  tooltipKey: string;
  scope?: string;
  label: string;
  placement?: TooltipPlacement;
  context?: TooltipTemplateContext;
  className?: string;
}

export function ContextHelpTooltip({
  tooltipKey,
  scope,
  label,
  placement = 'top',
  context,
  className,
}: ContextHelpTooltipProps) {
  const tooltip = useTooltipByKey(tooltipKey, { scope, context });

  if (!tooltip.showTooltips || !tooltip.body) {
    return null;
  }

  return (
    <HelpTooltip
      title={tooltip.title}
      content={tooltip.body}
      placement={placement}
      label={label}
      className={className}
    />
  );
}
