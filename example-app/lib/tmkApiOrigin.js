export const TMK_API_BASE_URL =
  process.env.NEXT_PUBLIC_TMK_API_URL ||
  process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION ||
  'https://web-production-ed842.up.railway.app';

export function resolveTmkApiBaseUrl() {
  return TMK_API_BASE_URL;
}
