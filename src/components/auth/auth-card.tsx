/**
 * AuthCard Component
 * ===================
 * Card wrapper for auth forms — surface card on landing-style background.
 */

import { cn } from '@/lib/utils/cn';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AuthCard({ children, title, subtitle, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full max-w-md p-6 sm:p-8 rounded-card',
        'bg-surface/95 backdrop-blur-md',
        'border border-border-light dark:border-border',
        'shadow-raised',
        className
      )}
    >
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-2">{title}</h1>
        {subtitle ? (
          <p className="font-nunito text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
