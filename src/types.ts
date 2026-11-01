export type ThemeId = 'pro' | 'futur' | 'zen';
export type Tone = 'calme' | 'assistant' | 'journaliste';
export type Length = 'flash' | 'complet';

export type RubriqueId =
  | 'meteo' | 'horoscope' | 'crypto' | 'bourse' | 'actu_france' | 'actu_monde'
  | 'musique' | 'evenements' | 'sport' | 'cine' | 'trafic' | 'carburant'
  | 'air' | 'marees' | 'saint' | 'histoire' | 'citation' | 'bonne_nouvelle'
  | 'mot' | 'libre';

export type Place = { name: string; lat: number; lon: number; country?: string; admin?: string };

export type Settings = {
  onboarded: boolean;
  invited: boolean;
  firstName: string;
  theme: ThemeId;
  tone: Tone;
  length: Length;
  rate: number;          // vitesse de la voix, 0.7 à 1.3
  voiceId?: string;      // voix choisie (sinon voix française par défaut)
  city?: Place;
  rubriques: RubriqueId[];           // rubriques actives, dans l'ordre
  wellbeing: 'aucun' | 'respiration' | 'pensee';
  notify: { enabled: boolean; hour: number; minute: number };
  goals: string[];                   // réponses du questionnaire
  // réglages propres aux rubriques
  sign?: string;                     // signe astrologique
  cryptos: string[];                 // identifiants CoinGecko
  stocks: { symbol: string; name: string }[];
  artists: { id: number; name: string }[];
  teams: { id: string; name: string; sport?: string }[];
  language: 'anglais' | 'espagnol' | 'italien' | 'allemand' | 'portugais' | 'arabe';
  freeTopics: string[];
  commute?: { from: string; to: string; mode: 'driving' | 'transit' | 'bicycling' | 'walking' };
  fuel: 'gazole' | 'sp95' | 'e10' | 'sp98' | 'gplc' | 'e85';
};

export type JournalItem = {
  id: string;             // identifiant stable (pour j'aime / pas intéressé)
  title: string;          // texte affiché
  detail?: string;        // ligne secondaire affichée
  speech?: string;        // ce que la voix lit (sinon le titre)
  source?: string;        // nom de la source
  url?: string;           // lien vers la source
  action?: { label: string; url: string }; // bouton (YouTube, Waze...)
  keywords?: string[];    // mots-clés pour affiner les goûts
};

export type JournalSection = {
  id: RubriqueId | 'intro' | 'bienetre' | 'fin';
  title: string;
  icon: string;
  intro?: string;         // phrase d'introduction lue
  items: JournalItem[];
  note?: string;          // petite mention (ex. « pour le plaisir »)
};

export type Journal = {
  createdAt: string;
  dateLabel: string;
  greeting: string;
  sections: JournalSection[];
  outro: string;
};
