/**
 * AuthCard Component
 * ===================
 * Card wrapper for auth forms
 */

import { cn } from '@/lib/utils';

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
        'w-full max-w-md p-8 rounded-2xl',
        'bg-gray-800/80 backdrop-blur-lg',
        'border border-gray-700/50',
        'shadow-2xl',
        className
      )}
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        {subtitle ? (
          <p className="text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
