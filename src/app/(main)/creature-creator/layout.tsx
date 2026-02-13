import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creature Creator',
  description: 'Design custom creatures and NPCs with abilities, feats, and equipment for your encounters.',
};

export default function CreatureCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
