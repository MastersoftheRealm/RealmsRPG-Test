/**
 * Subtle static dice accents for landing hero and auth shell.
 * `hero` = faint texture; `auth` = slightly more visible (less competing content).
 */

import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

const shellClass = 'pointer-events-none absolute overflow-hidden inset-0';

const diceWrap =
  'pointer-events-none absolute select-none hidden sm:block';

type LandingDiceDecorProps = {
  variant?: 'hero' | 'auth';
};

export function LandingDiceDecor({ variant = 'hero' }: LandingDiceDecorProps) {
  const isAuth = variant === 'auth';

  const faint = isAuth
    ? 'opacity-[0.24] dark:opacity-[0.32]'
    : 'opacity-[0.18] dark:opacity-[0.24]';
  const softer = isAuth
    ? 'opacity-[0.18] dark:opacity-[0.26]'
    : 'opacity-[0.12] dark:opacity-[0.18]';

  return (
    <div className={shellClass} aria-hidden="true">
      {/* D20 — tilted so the asset’s upright vertex doesn’t read stiff */}
      <div
        className={cn(
          diceWrap,
          faint,
          isAuth
            ? 'top-[8%] right-[5%] w-[4.5rem] h-[4.5rem] lg:w-[5.25rem] lg:h-[5.25rem] rotate-[34deg]'
            : 'top-[8%] right-[5%] w-[4.75rem] h-[4.75rem] md:w-[5.5rem] md:h-[5.5rem] rotate-[42deg]'
        )}
      >
        <Image src="/images/D20_2.png" alt="" fill className="object-contain" sizes="88px" />
      </div>

      <div
        className={cn(
          diceWrap,
          softer,
          '-rotate-[18deg]',
          isAuth
            ? 'top-[38%] left-[3%] w-16 h-16 lg:w-[4.5rem] lg:h-[4.5rem]'
            : 'bottom-[16%] left-[4%] w-11 h-11 md:w-12 md:h-12'
        )}
      >
        <Image
          src={isAuth ? '/images/D20_3.png' : '/images/D8.png'}
          alt=""
          fill
          className="object-contain"
          sizes="72px"
        />
      </div>

      <div
        className={cn(
          diceWrap,
          softer,
          'rotate-[22deg]',
          isAuth
            ? 'bottom-[14%] left-[7%] w-14 h-14 xl:w-[4rem] xl:h-[4rem]'
            : 'top-[36%] left-[6%] w-11 h-11 hidden md:block'
        )}
      >
        <Image
          src={isAuth ? '/images/D20_1.png' : '/images/D6.png'}
          alt=""
          fill
          className="object-contain"
          sizes="64px"
        />
      </div>

      {isAuth ? (
        <div
          className={cn(
            diceWrap,
            'bottom-[18%] right-[18%] w-12 h-12 xl:w-14 xl:h-14 opacity-[0.16] dark:opacity-[0.24] rotate-[12deg] hidden lg:block'
          )}
        >
          <Image src="/images/D8.png" alt="" fill className="object-contain" sizes="56px" />
        </div>
      ) : null}
    </div>
  );
}
