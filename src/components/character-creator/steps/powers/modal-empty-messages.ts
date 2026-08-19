import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';
import type { SourceFilterValue } from '@/components/patterns';

export function powerModalEmptyCopy(args: {
  items: SelectableItem[];
  displayFilterFn: (item: SelectableItem) => boolean;
  source: SourceFilterValue;
  publicPowersError: boolean;
}): { emptyMessage?: string | undefined; emptySubMessage?: string | undefined } {
  const { items, displayFilterFn, source, publicPowersError } = args;
  if (items.filter(displayFilterFn).length > 0) return {};
  const emptyMessage =
    source === 'public'
      ? 'No powers in the Realms Library'
      : source === 'my'
        ? 'No powers in your library'
        : 'No powers found';
  let emptySubMessage: string | undefined;
  if (source === 'public' && publicPowersError) {
    emptySubMessage = 'Failed to load Realms Library. Check your connection and try again.';
  } else if (source === 'public') {
    emptySubMessage = 'Official content is added via Admin → Realms Library Editor.';
  } else if (source === 'my') {
    emptySubMessage = 'Create powers in the Power Creator, then return here.';
  }
  return { emptyMessage, emptySubMessage };
}

export function techniqueModalEmptyCopy(args: {
  items: SelectableItem[];
  displayFilterFn: (item: SelectableItem) => boolean;
  source: SourceFilterValue;
  publicTechniquesError: boolean;
}): { emptyMessage?: string | undefined; emptySubMessage?: string | undefined } {
  const { items, displayFilterFn, source, publicTechniquesError } = args;
  if (items.filter(displayFilterFn).length > 0) return {};
  const emptyMessage =
    source === 'public'
      ? 'No techniques in the Realms Library'
      : source === 'my'
        ? 'No techniques in your library'
        : 'No techniques found';
  let emptySubMessage: string | undefined;
  if (source === 'public' && publicTechniquesError) {
    emptySubMessage = 'Failed to load Realms Library. Check your connection and try again.';
  } else if (source === 'my') {
    emptySubMessage = 'Create techniques in the Technique Creator, then return here.';
  }
  return { emptyMessage, emptySubMessage };
}
