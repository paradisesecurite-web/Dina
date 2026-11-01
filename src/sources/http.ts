import { USER_AGENT } from '../config';

// Permet aux tests (navigateur de démonstration) de remplacer les vraies requêtes.
type Fetcher = (url: string) => Promise<string>;
let override: Fetcher | null = null;
export function setFetchOverride(f: Fetcher | null) { override = f; }

export async function getText(url: string, timeoutMs = 12000): Promise<string> {
  if (override) return override(url);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: '*/*' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

export async function getJson<T = any>(url: string, timeoutMs?: number): Promise<T> {
  return JSON.parse(await getText(url, timeoutMs)) as T;
}

export const enc = encodeURIComponent;
