/** A line-clamped heading is hiding text when its scroll height exceeds the box. */
export function sheetHeaderNameClamped(scrollHeight: number, clientHeight: number): boolean {
  return scrollHeight > clientHeight + 1;
}
