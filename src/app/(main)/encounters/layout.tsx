import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Encounters',
  description: 'Track combat, skill, and mixed encounters with initiative, Health, conditions, and dice rolling.',
};

export default function EncountersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
