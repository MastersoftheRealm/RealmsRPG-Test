import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item Creator',
  description: 'Create custom weapons, armor, and equipment for your characters.',
};

export default function ItemCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
