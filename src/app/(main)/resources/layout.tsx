import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Helpful resources, guides, and tools for playing RealmsRPG.',
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
