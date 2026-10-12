/**
 * Public site URL. Set NEXT_PUBLIC_SITE_URL in production (see .env.example);
 * falls back to localhost for development.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** "https://lifeblackhole.app" → "lifeblackhole.app" */
export function displayHost(url: string = SITE_URL): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
