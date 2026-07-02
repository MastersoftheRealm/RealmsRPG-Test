'use client';

import type { ReactElement } from 'react';
import { HelpTooltip, Tooltip } from '@/components/ui';
import { useTooltipByKey } from '@/hooks';
import type { TooltipPlacement } from '@/types/tooltips';
import type { TooltipTemplateContext, TooltipTrigger } from '@/types/tooltips';

interface ContextHelpTooltipProps {
  tooltipKey: string;
  scope?: string;
  label?: string;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  context?: TooltipTemplateContext;
  className?: string;
  children?: ReactElement<{ className?: string }>;
}

export function ContextHelpTooltip({
  tooltipKey,
  scope,
  label = 'Help information',
  placement,
  trigger,
  context,
  className,
  children,
}: ContextHelpTooltipProps) {
  const tooltip = useTooltipByKey(tooltipKey, { scope, context });

  if (!tooltip.showTooltips || !tooltip.body) {
    return children ?? null;
  }

  const resolvedPlacement = placement ?? tooltip.tooltip?.placement ?? 'top';
  const resolvedTrigger = trigger ?? tooltip.tooltip?.trigger ?? 'auto';

  if (children) {
    return (
      <Tooltip
        title={tooltip.title}
        content={tooltip.body}
        placement={resolvedPlacement}
        trigger={resolvedTrigger}
        className={className}
      >
        {children}
      </Tooltip>
    );
  }

  return (
    <HelpTooltip
      title={tooltip.title}
      content={tooltip.body}
      placement={resolvedPlacement}
      trigger={resolvedTrigger}
      label={label}
      className={className}
    />
  );
}
