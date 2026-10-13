/** Enter and Escape close an inline field. Focus should return to the opener, not the page. */
export function sheetFieldDismissReturnsFocus(key: string): boolean {
  return key === 'Enter' || key === 'Escape';
}
