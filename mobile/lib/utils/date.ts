import { format, isValid } from 'date-fns';

/**
 * Safely formats a date. If the date is invalid, returns a fallback string.
 * Prevents crashes from date-fns format() throwing on invalid dates.
 */
export function safeFormat(
  date: Date | string | number | undefined | null,
  formatStr: string,
  fallback = '—'
): string {
  if (!date) return fallback;
  
  try {
    const d = new Date(date);
    if (!isValid(d)) return fallback;
    return format(d, formatStr);
  } catch (err) {
    console.warn('[safeFormat] Error formatting date:', err, { date, formatStr });
    return fallback;
  }
}
