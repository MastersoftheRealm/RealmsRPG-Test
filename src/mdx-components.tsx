import type { MDXComponents } from 'mdx/types';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { TableScroll } from '@/components/ui/table-scroll';
import { classifyRulebookCallout, rulebookCalloutClassName } from '@/lib/rules/rulebook-callout';

function walkRows(node: ReactNode, visit: (cells: ReactNode[]) => void) {
  Children.forEach(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return;
    const kids = child.props.children;
    if (child.type === 'tr') {
      visit(Children.toArray(kids));
      return;
    }
    walkRows(kids, visit);
  });
}

function getTableColumnCount(children: ReactNode): number {
  let count = 0;
  walkRows(children, (cells) => {
    count = Math.max(count, cells.length);
  });
  return count;
}

function collectText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return collectText(node.props.children);
  return '';
}

function getFirstCellContent(children: ReactNode): ReactNode {
  let content: ReactNode = null;
  walkRows(children, (cells) => {
    if (content != null || cells.length === 0) return;
    const cell = cells[0];
    content = isValidElement<{ children?: ReactNode }>(cell) ? cell.props.children : cell;
  });
  return content;
}

function MdxTable(props: ComponentPropsWithoutRef<'table'>) {
  const columnCount = getTableColumnCount(props.children);
  if (columnCount <= 1) {
    const content = getFirstCellContent(props.children);
    const kind = classifyRulebookCallout(collectText(content));
    return <aside className={rulebookCalloutClassName(kind)}>{content}</aside>;
  }

  return (
    <TableScroll className="mb-4">
      <table className="w-full min-w-[32rem] border-collapse text-sm" {...props} />
    </TableScroll>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    table: MdxTable,
  };
}
