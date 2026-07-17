/**
 * Sitewide flex-wrap layout for an expanded chip.
 *
 * The expanded chip keeps its collapsed row, moves to that row's left edge,
 * and occupies the group's full width. Chips that shared its row, plus every
 * later chip, reflow below it.
 */

export type FullRowExpandSnapshot = {
  group: HTMLElement;
  item: HTMLElement;
  itemsAbove: ReadonlySet<HTMLElement>;
};

type InlineStyleSnapshot = {
  element: HTMLElement;
  flex: string;
  maxWidth: string;
  order: string;
  width: string;
};

function directGroupItem(element: HTMLElement, group: HTMLElement): HTMLElement | null {
  let item: HTMLElement | null = element;
  while (item?.parentElement && item.parentElement !== group) {
    item = item.parentElement;
  }
  return item?.parentElement === group ? item : null;
}

function chipGroupFor(element: HTMLElement): HTMLElement | null {
  return (element.closest('[data-chip-group]') as HTMLElement | null) ?? element.parentElement;
}

export function captureFullRowExpandLayout(
  element: HTMLElement
): FullRowExpandSnapshot | null {
  const group = chipGroupFor(element);
  if (!group) return null;

  const item = directGroupItem(element, group);
  if (!item) return null;

  const itemTop = item.getBoundingClientRect().top;
  const itemsAbove = new Set(
    Array.from(group.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.getBoundingClientRect().top < itemTop - 1
    )
  );

  return { group, item, itemsAbove };
}

export function applyFullRowExpandLayout(
  element: HTMLElement,
  captured?: FullRowExpandSnapshot | null
): () => void {
  const current = captureFullRowExpandLayout(element);
  if (!current) return () => {};

  const layout =
    captured?.group === current.group && captured.item === current.item ? captured : current;
  const items = Array.from(layout.group.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
  const snapshots: InlineStyleSnapshot[] = items.map((item) => ({
    element: item,
    flex: item.style.flex,
    maxWidth: item.style.maxWidth,
    order: item.style.order,
    width: item.style.width,
  }));

  if (layout.item !== element) {
    snapshots.push({
      element,
      flex: element.style.flex,
      maxWidth: element.style.maxWidth,
      order: element.style.order,
      width: element.style.width,
    });
  }

  for (const item of items) {
    item.style.order =
      item === layout.item ? '1' : layout.itemsAbove.has(item) ? '0' : '2';
  }

  layout.item.style.width = '100%';
  layout.item.style.maxWidth = '100%';

  if (layout.item !== element) {
    element.style.flex = '1 1 0%';
    element.style.width = 'auto';
    element.style.maxWidth = '100%';
  }

  return () => {
    for (const snapshot of snapshots) {
      snapshot.element.style.flex = snapshot.flex;
      snapshot.element.style.maxWidth = snapshot.maxWidth;
      snapshot.element.style.order = snapshot.order;
      snapshot.element.style.width = snapshot.width;
    }
  };
}
