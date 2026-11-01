export type ThemeId = 'pro' | 'futur' | 'zen';
export type Tone = 'calme' | 'assistant' | 'journaliste';
export type Style = 'chaleureux' | 'decale' | 'pro' | 'zen' | 'energique' | 'assistant';
export type Tier = 'gratuit' | 'standard' | 'premium';
export type AiVoice = 'femme' | 'homme' | 'douce' | 'dynamique' | 'grave';
export type Topic = { id: string; label: string; query: string; icon?: string };
export type Follow = { kind: 'team' | 'player' | 'competition'; name: string; id?: string; sport?: string; query: string };
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
  tone: Tone;              // réglage de la voix gratuite du téléphone (déduit du style)
  style: Style;            // ton de l'écriture et de la voix IA
  tier: Tier;              // formule choisie
  aiVoice: AiVoice;
  minutes: number;         // durée visée (approximative), 2 à 60
  length: Length;          // déduit de minutes (compatibilité)
  deviceId: string;
  rate: number;          // vitesse de la voix, 0.7 à 1.3
  voiceId?: string;      // voix choisie (sinon voix française par défaut)
  city?: Place;
  rubriques: RubriqueId[];           // rubriques actives, dans l'ordre
  topics: Topic[];                   // sujets de veille (catalogue ou tapés par l'utilisateur)
  priorities: string[];              // rubriques ou sujets prioritaires
  follows: Follow[];                 // équipes, joueurs, compétitions suivis
  dislikes: string[];                // sujets écartés (« suivant », « pas intéressé »)
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
  desc?: string;          // résumé fourni par la source (envoyé à l'IA)
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
  id: RubriqueId | 'intro' | 'bienetre' | 'fin' | `veille:${string}`;
  paragraphs?: string[];  // texte rédigé par l'IA (mode IA)
  priority?: boolean;
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
  ai?: { model: string };  // présent si le journal a été rédigé par l'IA
};
