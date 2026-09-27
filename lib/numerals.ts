/**
 * Converts Western digits (0-9) into Eastern Arabic / Hindi digits (٠-٩).
 */
export function toHindiNumerals(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const hindiDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(val).replace(/[0-9]/g, d => hindiDigits[Number(d)]);
}

/**
 * Converts time range strings like "7:00-8:30" into formatted Hindi numerals e.g. "٧:٠٠ - ٨:٣٠".
 */
export function formatTimeHindi(timeStr: string): string {
  return toHindiNumerals(timeStr);
}
