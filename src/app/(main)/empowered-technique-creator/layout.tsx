import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Empowered Technique Creator',
  description: 'Build empowered techniques by combining power and technique mechanics.',
};

export default function EmpoweredTechniqueCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
