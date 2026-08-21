import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';
import { TableScroll } from '@/components/ui/table-scroll';

function MdxTable(props: ComponentPropsWithoutRef<'table'>) {
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
