/**
 * AuthCard Component
 * ===================
 * Card wrapper for auth forms — surface card on landing-style background.
 */

import { cn } from '@/lib/utils/cn';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string | undefined;
  className?: string | undefined;
}

export function AuthCard({ children, title, subtitle, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full max-w-md rounded-card p-6 sm:p-8',
        'bg-surface/95 backdrop-blur-md',
        'border border-border-light dark:border-border',
        'shadow-raised',
        className,
      )}
    >
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle ? <p className="font-nunito text-text-secondary">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
