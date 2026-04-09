export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTrigger = 'auto' | 'hover' | 'focus' | 'click';
export type TooltipAudience = 'new_player' | 'all' | 'admin';

export interface TooltipRecord {
  id: string;
  key: string;
  scope: string;
  title: string | null;
  bodyMd: string;
  placement: TooltipPlacement;
  trigger: TooltipTrigger;
  audience: TooltipAudience;
  enabled: boolean;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
}

export interface TooltipContextInfo {
  role: string | null;
  showTooltips: boolean;
  isAdmin: boolean;
}

export interface TooltipListResponse {
  tooltips: TooltipRecord[];
  user: TooltipContextInfo;
}

export interface TooltipTemplateContext {
  [key: string]: string | number | boolean | null | undefined;
}
