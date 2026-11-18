const eurFormatter = new Intl.NumberFormat('sk-SK', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('sk-SK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 6900 → "6 900 €" */
export function formatEur(value: number | null | undefined): string {
  return eurFormatter.format(Math.round(value ?? 0));
}

/** 14.5 → "14,5" */
export function formatDecimal(value: number | null | undefined): string {
  return decimalFormatter.format(value ?? 0);
}

/**
 * Slovak plural forms: [1, 2–4, 0 & 5+].
 * plural(3, ['kajuta', 'kajuty', 'kajút']) → "kajuty"
 */
export function plural(count: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(count);
  if (n === 1) return forms[0];
  if (n >= 2 && n <= 4) return forms[1];
  return forms[2];
}

export const PLURALS = {
  yacht: ['jachta', 'jachty', 'jácht'],
  cabin: ['kajuta', 'kajuty', 'kajút'],
  berth: ['lôžko', 'lôžka', 'lôžok'],
  person: ['osoba', 'osoby', 'osôb'],
  guest: ['hosť', 'hostia', 'hostí'],
  week: ['týždeň', 'týždne', 'týždňov'],
  bathroom: ['kúpeľňa', 'kúpeľne', 'kúpeľní'],
} as const satisfies Record<string, readonly [string, string, string]>;

/** Format a Date as YYYY-MM-DD in local time (for API payloads and <input type=date>). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Next Saturday at least `minDaysAhead` days in the future. */
export function nextSaturday(minDaysAhead = 7, from: Date = new Date()): Date {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + minDaysAhead);
  const offset = (6 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + offset);
  return date;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}
