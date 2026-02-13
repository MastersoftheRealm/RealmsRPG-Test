import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technique Creator',
  description: 'Build custom martial techniques by selecting parts, options, and damage types.',
};

export default function TechniqueCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
