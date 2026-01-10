/**
 * Class Name Utility
 * ===================
 * Combines clsx and tailwind-merge for optimal class merging
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 * @example cn('px-4 py-2', 'px-6') // => 'py-2 px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
