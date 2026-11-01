import type { RubriqueId, Settings, ThemeId, Topic } from '../types';
import { THEMES } from '../ui/theme';
import { ALL_INTERESTS } from '../data/catalogue';
import { toneOf } from '../services/player';

export const GOALS = [
  { id: 'vite', label: 'Être informé vite' },
  { id: 'calme', label: 'Commencer la journée au calme' },
  { id: 'organiser', label: 'M\'organiser' },
  { id: 'culture', label: 'Me cultiver' },
  { id: 'passions', label: 'Suivre mes passions' },
  { id: 'sourire', label: 'Commencer avec le sourire' },
];

const ORDER: RubriqueId[] = ['meteo', 'trafic', 'carburant', 'air', 'marees', 'actu_france', 'actu_monde', 'libre', 'sport', 'bourse', 'crypto', 'musique', 'cine', 'evenements', 'saint', 'histoire', 'mot', 'horoscope', 'citation', 'bonne_nouvelle'];

// L'application propose un thème, des rubriques, des sujets et une ambiance selon les réponses.
export function propose(goals: string[], interestIds: string[], customTopics: Topic[]) {
  const has = (g: string) => goals.includes(g);
  const picked = ALL_INTERESTS.filter(i => interestIds.includes(i.id));
  const score: Record<ThemeId, number> = { pro: 1, futur: 0, zen: 0 };
  if (has('calme')) score.zen += 3;
  if (has('vite')) { score.futur += 1; score.pro += 1; }
  if (has('organiser')) score.futur += 2;
  if (has('culture')) score.pro += 2;
  if (has('sourire')) score.zen += 1;
  if (picked.some(i => ['crypto', 'bourse', 'ia', 'tech', 'jeux', 'esport', 'espace'].includes(i.id))) score.futur += 2;
  if (picked.some(i => ['bienetre', 'jardin', 'animaux', 'climat', 'nutrition', 'sommeil'].includes(i.id))) score.zen += 2;
  if (picked.some(i => ['actu', 'monde', 'politique', 'economie'].includes(i.id))) score.pro += 1;
  const theme = (Object.keys(score) as ThemeId[]).sort((a, b) => score[b] - score[a])[0];

  const set = new Set<RubriqueId>(['meteo']);
  picked.filter(i => i.rub).forEach(i => set.add(i.rub!));
  if (!picked.some(i => i.rub === 'actu_france' || i.rub === 'actu_monde') && picked.length < 3) { set.add('actu_france'); set.add('actu_monde'); }
  if (has('culture')) set.add('histoire');
  if (has('sourire') || !set.has('bonne_nouvelle')) set.add('bonne_nouvelle');
  set.add('citation');
  const topics: Topic[] = [
    ...picked.filter(i => i.query).map(i => ({ id: i.id, label: i.label, query: i.query!, icon: i.icon })),
    ...customTopics,
  ];
  if (topics.length) set.add('libre');
  const rubriques = ORDER.filter(r => set.has(r));
  const style = THEMES[theme].defaults.style === 'pro' && has('sourire') ? 'chaleureux' : THEMES[theme].defaults.style;
  const wellbeing: Settings['wellbeing'] = theme === 'zen' ? 'respiration' : has('calme') ? 'pensee' : 'aucun';
  const why = theme === 'zen' ? 'Tu veux démarrer en douceur : ambiance nature, voix posée et une minute de respiration avant les infos.'
    : theme === 'futur' ? 'Tu veux de l\'efficacité : un assistant façon tableau de bord, droit à l\'essentiel, avec la possibilité de lui poser des questions.'
    : 'Tu aimes être bien informé : un vrai journal du matin, sobre et élégant, raconté comme à la radio.';
  return { theme, style, tone: toneOf(style), rubriques, topics, wellbeing, why };
}
