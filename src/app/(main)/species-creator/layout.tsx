import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Species Creator',
  description: 'Create custom species for your characters. Define traits, skills, sizes, and languages.',
};

export default function SpeciesCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
