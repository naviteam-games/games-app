export const APP_NAME = "Tiny Gam";
export const INVITE_CODE_LENGTH = 8;
export const DEFAULT_MAX_PLAYERS = 20;
export const MAX_ROOM_PLAYERS = 100;

/**
 * Returns the base URL for the app. Uses NEXT_PUBLIC_SITE_URL (set in Vercel
 * env vars) so OAuth redirects work in production. Falls back to
 * window.location.origin for local dev.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
