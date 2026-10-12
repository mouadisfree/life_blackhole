/**
 * What goes on a share card. Pure: the UI passes already-formatted strings,
 * this decides which of them appear. Cards are rendered on the device
 * (PROGRESS.md D1) and the birth date is off unless the user turns it on.
 */

export type ShareFormat = "story" | "post";

export const SHARE_SIZES: Record<
  ShareFormat,
  { width: number; height: number }
> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

export type ShareOptions = {
  showPercent: boolean;
  showRemaining: boolean;
  showWeekends: boolean;
  showBirthDate: boolean;
};

export const DEFAULT_SHARE_OPTIONS: ShareOptions = {
  showPercent: true,
  showRemaining: true,
  showWeekends: true,
  showBirthDate: false,
};

export type ShareStrings = {
  brand: string;
  percent: string;
  percentCaption: string;
  remaining: string;
  weekends: string;
  birthDate: string;
  tagline: string;
  /** Display host, e.g. "lifeblackhole.app". */
  host: string;
};

export type ShareCardContent = {
  brand: string;
  percent: { value: string; caption: string } | null;
  lines: string[];
  tagline: string;
  host: string;
};

export function shareCardContent(
  strings: ShareStrings,
  options: ShareOptions,
): ShareCardContent {
  const lines: string[] = [];
  if (options.showRemaining) lines.push(strings.remaining);
  if (options.showWeekends) lines.push(strings.weekends);
  if (options.showBirthDate) lines.push(strings.birthDate);
  return {
    brand: strings.brand,
    percent: options.showPercent
      ? { value: strings.percent, caption: strings.percentCaption }
      : null,
    lines,
    tagline: strings.tagline,
    host: strings.host,
  };
}

/** File names never contain personal data. */
export function shareFileName(format: ShareFormat): string {
  return `life-blackhole-${format}.png`;
}

/**
 * "1996-03-14" → a Date at UTC midnight, for formatting a calendar date with
 * `timeZone: "UTC"` (so it never shifts by a day).
 */
export function calendarDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}
