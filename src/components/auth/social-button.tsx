/**
 * SocialButton Component
 * =======================
 * Buttons for social authentication
 */

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const providerConfig = {
  google: {
    label: 'Continue with Google',
    icon: '/images/Google.png',
    bg: 'bg-white hover:bg-gray-100',
    text: 'text-gray-800',
  },
  apple: {
    label: 'Continue with Apple',
    icon: '/images/Apple.png',
    bg: 'bg-black hover:bg-gray-900',
    text: 'text-white',
  },
};

export function SocialButton({ provider, onClick, disabled, className }: SocialButtonProps) {
  const config = providerConfig[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg',
        'font-medium transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        config.bg,
        config.text,
        className
      )}
    >
      <Image
        src={config.icon}
        alt={provider}
        width={20}
        height={20}
        className="w-5 h-5"
      />
      <span>{config.label}</span>
    </button>
  );
}
