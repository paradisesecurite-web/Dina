import type { Tone } from '../types';
import { pick } from './random';

type ByTone = Record<Tone, string[]>;

export const GREETINGS: ByTone = {
  calme: [
    'Bonjour {name}. Nous sommes {date}. Installe-toi tranquillement, voici ton journal du matin.',
    'Bonjour {name}. Prends ton temps. Nous sommes {date}, et voici ce qui t\'attend aujourd\'hui.',
  ],
  assistant: [
    'Bonjour {name}. Systèmes prêts. Nous sommes {date}. Voici ton briefing du jour.',
    'Bonjour {name}. Analyse terminée. Nous sommes {date}, voici les informations sélectionnées pour toi.',
  ],
  journaliste: [
    'Bonjour {name}, nous sommes {date}. Voici l\'essentiel de l\'actualité qui t\'intéresse.',
    'Bonjour {name} ! {date}, il est l\'heure de ton journal. On commence tout de suite.',
  ],
};

export const OUTROS: ByTone = {
  calme: ['C\'est tout pour ce matin. Belle journée à toi, {name}.', 'Voilà pour aujourd\'hui. Prends soin de toi, {name}.'],
  assistant: ['Fin du briefing. Bonne journée, {name}.', 'Briefing terminé. Je reste disponible. Bonne journée, {name}.'],
  journaliste: ['C\'était ton journal. Excellente journée, {name} !', 'Merci de ton écoute, {name}. À demain pour un nouveau journal !'],
};

export const TRANSITIONS: Record<string, ByTone> = {
  meteo: { calme: ['Commençons par la météo.'], assistant: ['Module météo.'], journaliste: ['D\'abord, la météo.', 'Côté météo.'] },
  actu_france: { calme: ['Quelques nouvelles de France.'], assistant: ['Actualité nationale.'], journaliste: ['En France ce matin.', 'L\'actualité en France.'] },
  actu_monde: { calme: ['Et dans le monde.'], assistant: ['Actualité internationale.'], journaliste: ['À l\'international.', 'Dans le monde.'] },
  libre: { calme: ['Tes sujets du moment.'], assistant: ['Veille sur tes sujets.'], journaliste: ['Sur les sujets que tu suis.'] },
  sport: { calme: ['Un peu de sport.'], assistant: ['Données sportives.'], journaliste: ['Place au sport.', 'Côté sport.'] },
  crypto: { calme: ['Les cryptos.'], assistant: ['Marchés crypto.'], journaliste: ['Côté cryptomonnaies.'] },
  bourse: { calme: ['La bourse.'], assistant: ['Marchés financiers.'], journaliste: ['À la bourse.'] },
  musique: { calme: ['En musique.'], assistant: ['Nouvelles sorties musicales détectées.'], journaliste: ['Côté musique.'] },
  cine: { calme: ['Au cinéma.'], assistant: ['Actualité cinéma et séries.'], journaliste: ['Côté écrans.'] },
  evenements: { calme: ['Pour sortir.'], assistant: ['Événements à proximité.'], journaliste: ['Pour sortir près de chez toi.'] },
  trafic: { calme: ['Ton trajet.'], assistant: ['Trajet.'], journaliste: ['Sur la route.'] },
  carburant: { calme: ['Le carburant.'], assistant: ['Prix du carburant.'], journaliste: ['À la pompe.'] },
  air: { calme: ['L\'air que tu respires.'], assistant: ['Qualité de l\'air.'], journaliste: ['Qualité de l\'air.'] },
  marees: { calme: ['Les marées.'], assistant: ['Marées.'], journaliste: ['Les marées.'] },
  saint: { calme: [''], assistant: [''], journaliste: [''] },
  histoire: { calme: ['Un regard en arrière.'], assistant: ['Archives du jour.'], journaliste: ['C\'était un jour comme aujourd\'hui.'] },
  citation: { calme: ['Une pensée pour la journée.'], assistant: ['Citation du jour.'], journaliste: ['La citation du jour.'] },
  horoscope: { calme: ['Ton horoscope, pour le plaisir.'], assistant: ['Horoscope, à titre divertissant.'], journaliste: ['L\'horoscope, pour sourire.'] },
  mot: { calme: ['Le mot du jour.'], assistant: ['Module linguistique.'], journaliste: ['Le mot du jour.'] },
  bonne_nouvelle: { calme: ['Pour finir, une note légère.'], assistant: ['Pour finir, une information positive.'], journaliste: ['Et pour finir sur le sourire.'] },
};

export const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
export const toneLine = (set: ByTone, tone: Tone, rnd: () => number) => pick(set[tone], rnd);
