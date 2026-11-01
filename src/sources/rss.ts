import { XMLParser } from 'fast-xml-parser';
import { getText } from './http';

export type FeedItem = { title: string; link: string; date: number; source: string; category?: string };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  processEntities: true,
  htmlEntities: true,
  trimValues: true,
  parseTagValue: false,
});

const asArray = <T,>(x: T | T[] | undefined): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);

function text(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return text(v['#text'] ?? v['@href'] ?? '');
  return '';
}

export function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseFeed(xml: string, source: string): FeedItem[] {
  const doc = parser.parse(xml);
  const items = asArray(doc?.rss?.channel?.item);
  const entries = asArray(doc?.feed?.entry);
  const out: FeedItem[] = [];
  for (const it of items) {
    out.push({
      title: cleanText(text(it.title)),
      link: text(it.link).trim(),
      date: Date.parse(text(it.pubDate) || text(it['dc:date'])) || 0,
      source,
      category: cleanText(text(asArray(it.category)[0])),
    });
  }
  for (const e of entries) {
    const link = asArray(e.link).map((l: any) => l?.['@href']).find(Boolean) || '';
    out.push({ title: cleanText(text(e.title)), link, date: Date.parse(text(e.updated) || text(e.published)) || 0, source });
  }
  return out.filter(i => i.title && i.link);
}

export async function fetchFeed(url: string, source: string): Promise<FeedItem[]> {
  try {
    return parseFeed(await getText(url), source);
  } catch {
    return [];
  }
}

// Google Actualités met la source à la fin du titre : « Titre - Le Parisien ».
export function splitGoogleTitle(i: FeedItem): FeedItem {
  const m = i.title.match(/^(.*) - ([^-]{2,60})$/);
  return m ? { ...i, title: m[1].trim(), source: m[2].trim() } : i;
}

export function googleNewsUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
}

// Regroupe les titres qui parlent de la même chose (mots en commun).
const STOP = new Set('le la les un une des de du d l à au aux et en sur pour par avec dans ce cette ces qui que quoi est sont a ont son sa ses leur leurs pas plus ne se il elle ils elles on après avant contre selon comme mais ou où été être fait faire après'.split(' '));
export function keywords(title: string): string[] {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(' ')
    .filter(w => w.length > 3 && !STOP.has(w));
}

export function similar(a: string, b: string): boolean {
  const ka = new Set(keywords(a));
  const kb = keywords(b);
  if (!ka.size || !kb.length) return false;
  const common = kb.filter(w => ka.has(w)).length;
  return common / Math.min(ka.size, kb.length) >= 0.5;
}
