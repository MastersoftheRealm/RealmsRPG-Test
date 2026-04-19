'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGameRules } from '@/hooks/use-game-rules';
import { apiFetch } from '@/lib/api-client';
import { DEFAULT_TOOLTIPS, getDefaultTooltipByKey } from '@/lib/tooltips/default-tooltips';
import { interpolateTooltipTemplate } from '@/lib/tooltips/interpolate';
import type { TooltipListResponse, TooltipRecord, TooltipTemplateContext } from '@/types/tooltips';

interface UseTooltipsOptions {
  scope?: string;
  keys?: string[];
}

interface UseTooltipResult {
  tooltip: TooltipRecord | null;
  title: string | null;
  body: string;
  showTooltips: boolean;
  isLoading: boolean;
}

function buildTooltipUrl(options: UseTooltipsOptions): string {
  const params = new URLSearchParams();
  if (options.scope) params.set('scope', options.scope);
  if (options.keys && options.keys.length > 0) {
    params.set('keys', options.keys.join(','));
  }
  const query = params.toString();
  return query ? `/api/tooltips?${query}` : '/api/tooltips';
}

export function useTooltips(options: UseTooltipsOptions = {}) {
  const keysKey = options.keys?.join('|');
  const url = useMemo(() => buildTooltipUrl(options), [options.scope, keysKey]);
  return useQuery<TooltipListResponse, Error>({
    queryKey: ['tooltips', url],
    queryFn: () => apiFetch<TooltipListResponse>(url, { cache: 'no-store' }),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useTooltipByKey(
  key: string,
  options: { scope?: string; context?: TooltipTemplateContext } = {}
): UseTooltipResult {
  const { rules } = useGameRules();
  const query = useTooltips({ scope: options.scope, keys: [key] });

  const tooltip = useMemo(() => {
    const fromApi = query.data?.tooltips?.find((item) => item.key === key);
    return fromApi ?? getDefaultTooltipByKey(key) ?? null;
  }, [key, query.data?.tooltips]);

  const mergedShowTooltips = query.data?.user.showTooltips ?? true;
  const context = options.context ?? {};

  const rendered = useMemo(() => {
    if (!tooltip) return { title: null, body: '' };
    return {
      title: tooltip.title ? interpolateTooltipTemplate(tooltip.title, rules, context) : null,
      body: interpolateTooltipTemplate(tooltip.bodyMd, rules, context),
    };
  }, [tooltip, rules, context]);

  return {
    tooltip,
    title: rendered.title,
    body: rendered.body,
    showTooltips: mergedShowTooltips,
    isLoading: query.isLoading,
  };
}

export function useTooltipDefaults() {
  return DEFAULT_TOOLTIPS;
}
