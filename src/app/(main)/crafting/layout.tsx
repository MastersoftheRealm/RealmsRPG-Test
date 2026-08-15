import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crafting',
  description: 'Plan and run crafting sessions for items, enhancements, and downtime work.',
};

export default function CraftingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
