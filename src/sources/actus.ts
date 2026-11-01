import type { JournalItem, JournalSection } from '../types';
import { fetchFeed, googleNewsUrl, keywords, similar, splitGoogleTitle, type FeedItem } from './rss';

// Sources variées (sensibilités différentes) pour rester équilibré.
export const FEEDS_FRANCE = [
  { name: 'franceinfo', url: 'https://www.francetvinfo.fr/titres.rss' },
  { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml' },
  { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml' },
  { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml' },
  { name: '20 Minutes', url: 'https://www.20minutes.fr/feeds/rss-une.xml' },
  { name: 'Ouest-France', url: 'https://www.ouest-france.fr/rss/une' },
  { name: 'La Croix', url: 'https://www.la-croix.com/RSS/UNIVERS' },
  { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/' },
];
export const FEEDS_MONDE = [
  { name: 'Le Monde', url: 'https://www.lemonde.fr/international/rss_full.xml' },
  { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_international.xml' },
  { name: 'France 24', url: 'https://www.france24.com/fr/rss' },
  { name: 'RFI', url: 'https://www.rfi.fr/fr/rss' },
  { name: 'Courrier international', url: 'https://www.courrierinternational.com/feed/all/rss.xml' },
];

// Ajoute un point final seulement s'il manque une ponctuation.
export const sentence = (t: string) => (/[.!?…»"”)]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

export type Taste = Record<string, number>; // mot-clé -> poids (+ j'aime, - pas intéressé)

export function score(title: string, taste: Taste): number {
  return keywords(title).reduce((s, w) => s + (taste[w] || 0), 0);
}

export const itemId = (title: string) => 'n-' + keywords(title).slice(0, 6).join('-');

// Pioche à tour de rôle dans chaque source, en évitant les doublons
// et en tenant compte des goûts (j'aime / pas intéressé).
export function pickBalanced(lists: FeedItem[][], count: number, taste: Taste, maxAgeH = 30): FeedItem[] {
  const now = Date.now();
  const pools = lists.map(l => l
    .filter(i => !i.date || now - i.date < maxAgeH * 3600e3)
    .slice(0, 15)
    .map((i, rank) => ({ i, s: score(i.title, taste) - rank * 0.15 }))
    .filter(x => x.s > -1.5)
    .sort((a, b) => b.s - a.s)
    .map(x => x.i));
  const out: FeedItem[] = [];
  let guard = 0;
  while (out.length < count && pools.some(p => p.length) && guard++ < 200) {
    for (const p of pools) {
      while (p.length) {
        const it = p.shift()!;
        if (!out.some(o => similar(o.title, it.title))) { out.push(it); break; }
      }
      if (out.length >= count) break;
    }
  }
  return out;
}

export const toItem = (i: FeedItem, prefix = ''): JournalItem => ({
  id: itemId(i.title), title: i.title, source: i.source, url: i.link,
  speech: sentence(`${prefix}${i.title}`), keywords: keywords(i.title),
});

export async function newsSection(kind: 'actu_france' | 'actu_monde', count: number, taste: Taste): Promise<JournalSection> {
  const feeds = kind === 'actu_france' ? FEEDS_FRANCE : FEEDS_MONDE;
  const lists = await Promise.all(feeds.map(f => fetchFeed(f.url, f.name)));
  const picked = pickBalanced(lists, count, taste);
  return {
    id: kind, title: kind === 'actu_france' ? 'France' : 'Monde & géopolitique', icon: kind === 'actu_france' ? '🇫🇷' : '🌍',
    items: picked.map(i => toItem(i)),
  };
}

export async function googleSection(id: 'libre' | 'evenements' | 'cine', title: string, icon: string, queries: string[], perQuery: number, taste: Taste, maxAgeH = 72): Promise<JournalItem[]> {
  const lists = await Promise.all(queries.map(q => fetchFeed(googleNewsUrl(q), 'Google Actualités').then(l => l.map(splitGoogleTitle))));
  const items: JournalItem[] = [];
  lists.forEach(l => {
    pickBalanced([l], perQuery, taste, maxAgeH).forEach(i => {
      if (!items.some(x => similar(x.title, i.title))) items.push(toItem(i));
    });
  });
  return items;
}

export async function libreSection(topics: string[], length: 'flash' | 'complet', taste: Taste): Promise<JournalSection | null> {
  if (!topics.length) return null;
  const per = length === 'flash' ? 1 : 3;
  const lists = await Promise.all(topics.map(t => fetchFeed(googleNewsUrl(`${t} when:3d`), 'Google Actualités').then(l => l.map(splitGoogleTitle))));
  const items: JournalItem[] = [];
  lists.forEach((l, k) => pickBalanced([l], per, taste, 80).forEach(i => items.push({ ...toItem(i), detail: topics[k] })));
  return { id: 'libre', title: topics.length === 1 ? topics[0] : 'Tes sujets', icon: '🔎', items };
}

export async function evenementsSection(city: string, length: 'flash' | 'complet', taste: Taste): Promise<JournalSection> {
  const items = await googleSection('evenements', '', '', [`"${city}" concert OR spectacle OR exposition OR festival when:7d`], length === 'flash' ? 2 : 4, taste, 24 * 8);
  return {
    id: 'evenements', title: `Sortir à ${city}`, icon: '🎭',
    note: 'Annonces récentes trouvées dans la presse.',
    items: [...items, {
      id: 'ev-agenda', title: `Que faire à ${city} aujourd'hui ?`, speech: '',
      action: { label: 'Chercher les sorties', url: `https://www.google.com/search?q=${encodeURIComponent(`que faire à ${city} aujourd'hui`)}` },
    }],
  };
}

export async function cineSection(length: 'flash' | 'complet', taste: Taste): Promise<JournalSection> {
  const l = await fetchFeed('https://www.allocine.fr/rss/news.xml', 'AlloCiné');
  const picked = pickBalanced([l], length === 'flash' ? 2 : 4, taste, 72);
  return { id: 'cine', title: 'Ciné & séries', icon: '🎬', items: picked.map(i => toItem(i)) };
}

export async function bonneNouvelleSection(taste: Taste): Promise<JournalSection> {
  const [pos, ins] = await Promise.all([
    fetchFeed('https://positivr.fr/feed/', 'POSITIVR'),
    fetchFeed('https://www.20minutes.fr/feeds/rss-insolite.xml', '20 Minutes'),
  ]);
  const a = pickBalanced([pos], 1, taste, 24 * 21)[0];
  const b = pickBalanced([ins], 1, taste, 48)[0];
  const items: JournalItem[] = [];
  if (a) items.push({ ...toItem(a), detail: 'Bonne nouvelle' });
  if (b) items.push({ ...toItem(b), detail: 'Insolite' });
  return { id: 'bonne_nouvelle', title: 'Pour finir sur le sourire', icon: '🌈', items };
}
