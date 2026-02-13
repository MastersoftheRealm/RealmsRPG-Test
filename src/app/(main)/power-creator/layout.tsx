import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Power Creator',
  description: 'Build custom powers for your characters by selecting parts, options, and damage types.',
};

export default function PowerCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
