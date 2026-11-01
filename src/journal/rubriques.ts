import type { RubriqueId } from '../types';

export type RubriqueMeta = { id: RubriqueId; label: string; icon: string; desc: string; needsCity?: boolean };

export const RUBRIQUES: RubriqueMeta[] = [
  { id: 'meteo', label: 'Météo', icon: '⛅', desc: 'Le temps de ta ville', needsCity: true },
  { id: 'actu_france', label: 'Actualités France', icon: '🇫🇷', desc: 'Les titres de plusieurs journaux' },
  { id: 'actu_monde', label: 'Monde & géopolitique', icon: '🌍', desc: 'L\'international, sources variées' },
  { id: 'libre', label: 'Tes sujets', icon: '🔎', desc: 'Un sujet que tu choisis (MMA, immobilier…)' },
  { id: 'sport', label: 'Sport', icon: '⚽', desc: 'Résultats et matchs de tes équipes' },
  { id: 'crypto', label: 'Cryptos', icon: '₿', desc: 'Bitcoin et les cryptos de ton choix' },
  { id: 'bourse', label: 'Bourse', icon: '📈', desc: 'Les valeurs que tu suis' },
  { id: 'musique', label: 'Sorties musicales', icon: '🎵', desc: 'Les nouveautés de tes artistes' },
  { id: 'cine', label: 'Ciné & séries', icon: '🎬', desc: 'L\'actualité des films et séries' },
  { id: 'evenements', label: 'Sortir', icon: '🎭', desc: 'Concerts, spectacles, expos près de chez toi', needsCity: true },
  { id: 'trafic', label: 'Trajet', icon: '🚗', desc: 'Ton trajet en un geste (Maps, Waze)' },
  { id: 'carburant', label: 'Carburant', icon: '⛽', desc: 'Le prix le plus bas près de chez toi (France)', needsCity: true },
  { id: 'air', label: 'Air & pollens', icon: '🍃', desc: 'Qualité de l\'air et pollens', needsCity: true },
  { id: 'marees', label: 'Marées', icon: '🌊', desc: 'Pleine mer et basse mer', needsCity: true },
  { id: 'saint', label: 'Saint du jour', icon: '🕯️', desc: 'Qui fête-t-on aujourd\'hui ?' },
  { id: 'histoire', label: 'Ce jour-là', icon: '📜', desc: 'Ce qui s\'est passé un jour comme aujourd\'hui' },
  { id: 'citation', label: 'Citation', icon: '💬', desc: 'Une citation pour la journée' },
  { id: 'horoscope', label: 'Horoscope', icon: '✨', desc: 'Pour le plaisir' },
  { id: 'mot', label: 'Mot du jour', icon: '🗣️', desc: 'Un mot dans une langue à apprendre' },
  { id: 'bonne_nouvelle', label: 'Bonne nouvelle', icon: '🌈', desc: 'Une info qui fait sourire pour finir' },
];
export const rubriqueMeta = (id: RubriqueId) => RUBRIQUES.find(r => r.id === id)!;
