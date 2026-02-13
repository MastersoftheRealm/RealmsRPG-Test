import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Characters',
  description: 'Create and manage your tabletop RPG characters.',
};

export default function CharactersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
