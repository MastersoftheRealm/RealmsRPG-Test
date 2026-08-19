import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';

function MdxTable(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-sm" {...props} />
    </div>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    table: MdxTable,
  };
}
