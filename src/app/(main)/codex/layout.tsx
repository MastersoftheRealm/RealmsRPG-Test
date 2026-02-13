import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codex',
  description: 'Browse the complete game reference — feats, skills, species, equipment, properties, parts, and traits.',
};

export default function CodexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
