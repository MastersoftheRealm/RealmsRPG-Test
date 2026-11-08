/** Present forgot-password action failures without re-mapping safe server copy. */
export function presentPasswordResetActionFailure(result: {
  success: false;
  error: string;
}): string {
  return result.error;
}
