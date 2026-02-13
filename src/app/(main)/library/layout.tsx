import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Manage your personal collection of powers, techniques, armaments, and creatures.',
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
