import type { RubriqueId, Settings, ThemeId } from '../types';
import { THEMES } from '../ui/theme';

export const GOALS = [
  { id: 'vite', label: 'Être informé vite' },
  { id: 'calme', label: 'Commencer la journée au calme' },
  { id: 'organiser', label: 'M\'organiser' },
  { id: 'culture', label: 'Me cultiver' },
  { id: 'passions', label: 'Suivre mes passions' },
];

export const INTERESTS: { id: string; label: string; icon: string; rubriques: RubriqueId[] }[] = [
  { id: 'actu', label: 'Actualité', icon: '📰', rubriques: ['actu_france'] },
  { id: 'geo', label: 'Monde & géopolitique', icon: '🌍', rubriques: ['actu_monde'] },
  { id: 'sport', label: 'Sport', icon: '⚽', rubriques: ['sport'] },
  { id: 'musique', label: 'Musique', icon: '🎵', rubriques: ['musique'] },
  { id: 'cine', label: 'Ciné & séries', icon: '🎬', rubriques: ['cine'] },
  { id: 'finance', label: 'Bourse & cryptos', icon: '📈', rubriques: ['bourse', 'crypto'] },
  { id: 'sorties', label: 'Sorties & concerts', icon: '🎭', rubriques: ['evenements'] },
  { id: 'culture', label: 'Histoire & culture', icon: '📜', rubriques: ['histoire', 'saint'] },
  { id: 'langues', label: 'Apprendre une langue', icon: '🗣️', rubriques: ['mot'] },
  { id: 'route', label: 'Voiture & trajet', icon: '🚗', rubriques: ['trafic', 'carburant'] },
  { id: 'nature', label: 'Air, pollens, marées', icon: '🍃', rubriques: ['air', 'marees'] },
  { id: 'astro', label: 'Horoscope', icon: '✨', rubriques: ['horoscope'] },
];

// L'application propose un thème, des rubriques et une ambiance selon les réponses.
export function propose(goals: string[], interests: string[], length: Settings['length']): Pick<Settings, 'theme' | 'tone' | 'rubriques' | 'wellbeing' | 'length'> & { why: string } {
  const has = (g: string) => goals.includes(g);
  const score: Record<ThemeId, number> = { pro: 1, futur: 0, zen: 0 };
  if (has('calme')) score.zen += 3;
  if (has('vite')) { score.futur += 1; score.pro += 1; }
  if (has('organiser')) score.futur += 2;
  if (has('culture')) score.pro += 2;
  if (interests.includes('finance')) score.futur += 1;
  if (interests.includes('nature')) score.zen += 1;
  if (interests.includes('actu') || interests.includes('geo')) score.pro += 1;
  const theme = (Object.keys(score) as ThemeId[]).sort((a, b) => score[b] - score[a])[0];

  const set = new Set<RubriqueId>(['meteo']);
  INTERESTS.filter(i => interests.includes(i.id)).forEach(i => i.rubriques.forEach(r => set.add(r)));
  if (!interests.length) ['actu_france', 'actu_monde'].forEach(r => set.add(r as RubriqueId));
  if (has('culture')) { set.add('histoire'); set.add('citation'); }
  set.add('citation');
  set.add('bonne_nouvelle');
  // Ordre logique : météo, actus, passions, pratique, culture, bonne nouvelle à la fin.
  const ORDER: RubriqueId[] = ['meteo', 'trafic', 'carburant', 'air', 'marees', 'actu_france', 'actu_monde', 'libre', 'sport', 'bourse', 'crypto', 'musique', 'cine', 'evenements', 'saint', 'histoire', 'mot', 'horoscope', 'citation', 'bonne_nouvelle'];
  const rubriques = ORDER.filter(r => set.has(r));

  const wellbeing = theme === 'zen' ? 'respiration' : has('calme') ? 'pensee' : 'aucun';
  const why = theme === 'zen' ? 'Tu veux démarrer en douceur : ambiance nature, voix calme et une minute de respiration.'
    : theme === 'futur' ? 'Tu veux de l\'efficacité : un assistant façon tableau de bord, droit à l\'essentiel.'
    : 'Tu aimes être bien informé : un vrai journal du matin, sobre et élégant.';
  return { theme, tone: THEMES[theme].defaults.tone, rubriques, wellbeing, length, why };
}
