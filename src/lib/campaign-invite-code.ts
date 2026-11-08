import { randomInt } from 'node:crypto';

export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Cryptographically uniform code over the invite alphabet (rejection sampling). */
export function generateInviteCode(random: (max: number) => number = randomInt): string {
  const alphabet = INVITE_CODE_ALPHABET;
  const n = alphabet.length;
  const maxValid = Math.floor(0x100000000 / n) * n;
  let code = '';
  while (code.length < INVITE_CODE_LENGTH) {
    let x: number;
    do {
      x = random(0x100000000);
    } while (x >= maxValid);
    code += alphabet.charAt(x % n);
  }
  return code;
}
