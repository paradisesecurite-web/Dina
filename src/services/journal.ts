import type { Journal, RubriqueId, Settings } from '../types';
import { buildJournal } from '../journal/compose';
import { loadCachedJournal, loadCryptoNames, loadTaste, saveJournal } from './storage';

// Empreinte des réglages qui changent le contenu (pour savoir si le journal en cache est encore bon).
const fingerprint = (s: Settings) => JSON.stringify([s.rubriques, s.city?.name, s.length, s.tone, s.wellbeing, s.sign, s.cryptos, s.stocks, s.artists, s.teams, s.language, s.freeTopics, s.commute, s.fuel, s.firstName]);

export async function getJournal(s: Settings, force = false): Promise<Journal> {
  const cached = (await loadCachedJournal()) as (Journal & { fp?: string }) | null;
  const fresh = cached && new Date(cached.createdAt).toDateString() === new Date().toDateString() && Date.now() - Date.parse(cached.createdAt) < 3 * 3600e3;
  if (!force && cached && fresh && cached.fp === fingerprint(s)) return cached;
  const [taste, cryptoNames] = await Promise.all([loadTaste(), loadCryptoNames()]);
  const j = await buildJournal(s, { taste, cryptoNames });
  await saveJournal({ ...j, fp: fingerprint(s) } as Journal);
  return j;
}

// Suggestions de rubriques selon ce que l'utilisateur aime.
const HINTS: Partial<Record<RubriqueId, string[]>> = {
  sport: ['match', 'ligue', 'football', 'rugby', 'tennis', 'coupe', 'champion', 'joueur', 'entraineur', 'olympique'],
  bourse: ['bourse', 'marches', 'entreprise', 'economie', 'inflation', 'banque', 'action', 'croissance'],
  crypto: ['bitcoin', 'crypto', 'ethereum', 'blockchain'],
  cine: ['film', 'serie', 'cinema', 'netflix', 'acteur', 'actrice', 'realisateur'],
  musique: ['album', 'chanteur', 'chanteuse', 'concert', 'rappeur', 'musique', 'chanson'],
  histoire: ['histoire', 'guerre', 'siecle', 'anniversaire'],
  evenements: ['festival', 'spectacle', 'exposition', 'concert'],
};
export function suggestRubriques(taste: Record<string, number>, active: RubriqueId[]): RubriqueId[] {
  const out: RubriqueId[] = [];
  for (const [id, words] of Object.entries(HINTS) as [RubriqueId, string[]][]) {
    if (active.includes(id)) continue;
    const score = Object.entries(taste).filter(([w]) => words.some(h => w.startsWith(h))).reduce((s, [, v]) => s + v, 0);
    if (score >= 2) out.push(id);
  }
  return out;
}
