import type { RubriqueId } from '../types';

// Grand catalogue de centres d'intérêt. Chaque choix ajoute soit une rubrique
// intégrée (rub), soit un sujet de veille suivi dans l'actualité (query).
export type Interest = { id: string; label: string; icon: string; rub?: RubriqueId; query?: string };
export type Category = { id: string; label: string; icon: string; items: Interest[] };

const q = (id: string, label: string, icon: string, query?: string): Interest => ({ id, label, icon, query: query ?? label });
const r = (id: string, label: string, icon: string, rub: RubriqueId): Interest => ({ id, label, icon, rub });

export const CATALOGUE: Category[] = [
  { id: 'essentiel', label: 'L\'essentiel', icon: '☀️', items: [
    r('meteo', 'Météo', '⛅', 'meteo'), r('actu', 'Actualité France', '🇫🇷', 'actu_france'), r('monde', 'Monde & géopolitique', '🌍', 'actu_monde'),
    r('trafic', 'Mon trajet', '🚗', 'trafic'), r('air', 'Air & pollens', '🍃', 'air'), r('marees', 'Marées', '🌊', 'marees'),
    r('carburant', 'Prix du carburant', '⛽', 'carburant'), r('sortir', 'Sorties près de chez moi', '🎭', 'evenements'),
  ] },
  { id: 'societe', label: 'Société & politique', icon: '🏛️', items: [
    q('politique', 'Politique française', '🏛️', 'politique France gouvernement'), q('europe', 'Union européenne', '🇪🇺', 'Union européenne'),
    q('usa', 'États-Unis', '🇺🇸', 'États-Unis politique'), q('afrique', 'Afrique', '🌍', 'Afrique actualité'), q('asie', 'Asie', '🌏', 'Asie actualité'),
    q('moyenorient', 'Moyen-Orient', '🕌', 'Moyen-Orient'), q('defense', 'Défense & armées', '🎖️', 'défense armée'), q('justice', 'Justice & faits divers', '⚖️', 'justice procès'),
    q('education', 'Éducation', '🎓', 'éducation école'), q('sante', 'Santé', '🩺', 'santé médecine'), q('emploi', 'Emploi & travail', '💼', 'emploi travail salariés'),
    q('retraite', 'Retraites', '👵', 'retraites'), q('logement', 'Logement', '🏠', 'logement'), q('immobilier', 'Immobilier', '🏡', 'immobilier prix'),
    q('conso', 'Consommation & pouvoir d\'achat', '🛒', 'pouvoir d\'achat consommation'), q('religion', 'Religions', '🕊️', 'religion'),
  ] },
  { id: 'eco', label: 'Économie & argent', icon: '💶', items: [
    r('bourse', 'Bourse', '📈', 'bourse'), r('crypto', 'Cryptomonnaies', '₿', 'crypto'), q('economie', 'Économie', '💶', 'économie'),
    q('entreprises', 'Entreprises & start-up', '🚀', 'start-up levée de fonds'), q('placements', 'Épargne & placements', '🐷', 'épargne placement livret'),
    q('impots', 'Impôts', '🧾', 'impôts fiscalité'), q('luxe', 'Luxe', '💎', 'industrie du luxe'), q('agriculture', 'Agriculture', '🚜', 'agriculture agriculteurs'),
    q('energie', 'Énergie', '⚡', 'énergie électricité'), q('auto', 'Automobile', '🚘', 'automobile voiture'), q('aero', 'Aéronautique & espace', '🛰️', 'aéronautique espace'),
  ] },
  { id: 'tech', label: 'Tech & sciences', icon: '🔬', items: [
    q('ia', 'Intelligence artificielle', '🤖', 'intelligence artificielle'), q('tech', 'High-tech', '📱', 'high-tech smartphone'), q('jeux', 'Jeux vidéo', '🎮', 'jeux vidéo'),
    q('esport', 'E-sport', '🕹️', 'esport compétition jeux vidéo'), q('cyber', 'Cybersécurité', '🛡️', 'cybersécurité'), q('sciences', 'Sciences', '🔬', 'découverte scientifique'),
    q('espace', 'Espace & astronomie', '🔭', 'espace astronomie'), q('climat', 'Climat & environnement', '🌱', 'climat environnement'), q('animaux', 'Animaux & nature', '🦊', 'animaux nature'),
    q('medecine', 'Recherche médicale', '🧬', 'recherche médicale'), q('archeo', 'Archéologie', '🏺', 'archéologie découverte'),
  ] },
  { id: 'sport', label: 'Sport', icon: '🏆', items: [
    r('sport', 'Mes équipes & joueurs', '⚽', 'sport'), q('foot', 'Football', '⚽', 'football'), q('rugby', 'Rugby', '🏉', 'rugby'), q('tennis', 'Tennis', '🎾', 'tennis'),
    q('basket', 'Basket / NBA', '🏀', 'basket NBA'), q('f1', 'Formule 1', '🏎️', 'Formule 1'), q('moto', 'MotoGP', '🏍️', 'MotoGP'), q('cyclisme', 'Cyclisme', '🚴', 'cyclisme'),
    q('mma', 'MMA & UFC', '🥊', 'MMA UFC'), q('boxe', 'Boxe', '🥊', 'boxe'), q('handball', 'Handball', '🤾', 'handball'), q('golf', 'Golf', '⛳', 'golf'),
    q('voile', 'Voile', '⛵', 'voile course au large'), q('equitation', 'Équitation', '🏇', 'équitation'), q('ski', 'Ski & sports d\'hiver', '⛷️', 'ski'),
    q('athle', 'Athlétisme', '🏃', 'athlétisme'), q('natation', 'Natation', '🏊', 'natation'), q('surf', 'Surf', '🏄', 'surf'), q('running', 'Running & trail', '👟', 'trail running marathon'),
    q('fitness', 'Fitness & musculation', '💪', 'musculation fitness'), q('hippisme', 'Courses hippiques', '🐎', 'turf courses hippiques'),
  ] },
  { id: 'culture', label: 'Culture & loisirs', icon: '🎨', items: [
    r('musique', 'Sorties musicales', '🎵', 'musique'), r('cine', 'Ciné & séries', '🎬', 'cine'), q('livres', 'Livres', '📚', 'livres littérature'),
    q('bd', 'BD & mangas', '📖', 'bande dessinée manga'), q('theatre', 'Théâtre & spectacles', '🎭', 'théâtre spectacle'), q('expos', 'Expos & musées', '🖼️', 'exposition musée'),
    q('rap', 'Rap', '🎤', 'rap français'), q('rock', 'Rock & métal', '🎸', 'rock'), q('electro', 'Musique électro', '🎧', 'musique électro'), q('classique', 'Musique classique & opéra', '🎻', 'musique classique opéra'),
    q('peoples', 'People & célébrités', '⭐', 'célébrités people'), q('tv', 'Télé & streaming', '📺', 'programme télé streaming'), q('photo', 'Photographie', '📷', 'photographie'),
    q('architecture', 'Architecture & design', '🏛️', 'architecture design'), q('mode', 'Mode', '👗', 'mode tendances'), q('beaute', 'Beauté', '💄', 'beauté cosmétiques'),
  ] },
  { id: 'vie', label: 'Vie quotidienne', icon: '🏡', items: [
    q('cuisine', 'Cuisine & recettes', '🍳', 'recette cuisine'), q('vin', 'Vin & gastronomie', '🍷', 'vin gastronomie'), q('voyage', 'Voyages', '✈️', 'voyage destination'),
    q('jardin', 'Jardinage', '🌻', 'jardinage'), q('deco', 'Déco & bricolage', '🛠️', 'décoration bricolage'), q('parentalite', 'Parentalité & famille', '👶', 'parents enfants famille'),
    q('animaux2', 'Chiens & chats', '🐶', 'chiens chats animaux de compagnie'), q('bienetre', 'Bien-être & psycho', '🧘', 'bien-être psychologie'), q('nutrition', 'Nutrition', '🥗', 'nutrition alimentation'),
    q('sommeil', 'Sommeil', '😴', 'sommeil'), q('auto2', 'Bons plans & réductions', '🏷️', 'bons plans promotions'), q('ecolo', 'Écologie au quotidien', '♻️', 'écologie quotidien'),
  ] },
  { id: 'esprit', label: 'Pour l\'esprit', icon: '✨', items: [
    r('histoire', 'Ce jour-là dans l\'histoire', '📜', 'histoire'), r('saint', 'Saint du jour', '🕯️', 'saint'), r('citation', 'Citation du jour', '💬', 'citation'),
    r('mot', 'Un mot dans une langue', '🗣️', 'mot'), r('horoscope', 'Horoscope', '✨', 'horoscope'), r('bonne', 'Une bonne nouvelle pour finir', '🌈', 'bonne_nouvelle'),
    q('philo', 'Philosophie', '🦉', 'philosophie'), q('histoire2', 'Histoire', '🏰', 'histoire découverte historique'), q('insolite', 'Insolite', '🤯', 'insolite'),
    q('patrimoine', 'Patrimoine & régions', '🏞️', 'patrimoine'), q('langue', 'Langue française', '🇫🇷', 'langue française mots'),
  ] },
];

export const ALL_INTERESTS = CATALOGUE.flatMap(c => c.items);
