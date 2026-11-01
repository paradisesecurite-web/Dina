import type { Follow, JournalItem, JournalSection } from '../types';
import { getJson, enc } from './http';
import { fetchFeed, googleNewsUrl, splitGoogleTitle } from './rss';
import { pickBalanced, toItem, type Taste } from './actus';

// TheSportsDB : clé publique gratuite « 123 » (accès limité mais suffisant).
const API = 'https://www.thesportsdb.com/api/v1/json/123';
const SPORTS: Record<string, string> = { Soccer: 'Football', Basketball: 'Basket', Rugby: 'Rugby', 'Ice Hockey': 'Hockey', 'American Football': 'Football américain', Handball: 'Handball', Volleyball: 'Volley', Tennis: 'Tennis', Motorsport: 'Sport auto', Cycling: 'Cyclisme', Fighting: 'Sports de combat', Golf: 'Golf', Baseball: 'Baseball' };

// Surnoms et sigles courants -> nom utilisé par la base de données.
const ALIASES: Record<string, string[]> = {
  psg: ['Paris SG'], 'paris saint germain': ['Paris SG'], 'paris saint-germain': ['Paris SG'], om: ['Marseille'], ol: ['Lyon'], asse: ['Saint-Etienne'], 'sainté': ['Saint-Etienne'],
  losc: ['Lille'], rcl: ['Lens'], ogcn: ['Nice'], 'asm': ['Monaco'], 'fcn': ['Nantes'], 'srfc': ['Rennes'], 'rcsa': ['Strasbourg'], 'tfc': ['Toulouse'], 'mhsc': ['Montpellier'],
  real: ['Real Madrid'], barca: ['Barcelona'], 'barça': ['Barcelona'], atletico: ['Atletico Madrid'], bayern: ['Bayern Munich'], bvb: ['Dortmund'], juve: ['Juventus'],
  inter: ['Inter Milan'], milan: ['AC Milan'], 'man u': ['Manchester United'], 'man utd': ['Manchester United'], 'man city': ['Manchester City'], city: ['Manchester City'],
  liverpool: ['Liverpool'], arsenal: ['Arsenal'], chelsea: ['Chelsea'], spurs: ['Tottenham'], 'stade toulousain': ['Toulouse'], 'st': ['Toulouse'], 'rct': ['Toulon'],
  'asm clermont': ['Clermont'], 'ubb': ['Bordeaux Begles'], 'stade français': ['Stade Francais'], 'racing 92': ['Racing 92'], 'xv de france': ['France'], 'bleus': ['France'],
  lakers: ['Los Angeles Lakers'], celtics: ['Boston Celtics'], warriors: ['Golden State Warriors'], bulls: ['Chicago Bulls'], knicks: ['New York Knicks'], spurs_nba: ['San Antonio Spurs'],
  asvel: ['ASVEL'], 'paris basket': ['Paris Basketball'], 'ferrari': ['Ferrari'], 'red bull': ['Red Bull Racing'], 'mclaren': ['McLaren'], 'alpine': ['Alpine'],
};

export const COMPETITIONS: { name: string; query: string; sport: string }[] = [
  { name: 'Ligue 1', query: 'Ligue 1', sport: 'Football' }, { name: 'Ligue des champions', query: 'Ligue des champions', sport: 'Football' },
  { name: 'Premier League', query: 'Premier League', sport: 'Football' }, { name: 'Liga', query: 'Liga espagnole', sport: 'Football' },
  { name: 'Serie A', query: 'Serie A football', sport: 'Football' }, { name: 'Bundesliga', query: 'Bundesliga', sport: 'Football' },
  { name: 'Équipe de France de foot', query: 'équipe de France football Bleus', sport: 'Football' }, { name: 'Top 14', query: 'Top 14 rugby', sport: 'Rugby' },
  { name: 'XV de France', query: 'XV de France rugby', sport: 'Rugby' }, { name: 'Tournoi des Six Nations', query: 'Six Nations rugby', sport: 'Rugby' },
  { name: 'NBA', query: 'NBA', sport: 'Basket' }, { name: 'Formule 1', query: 'Formule 1 Grand Prix', sport: 'Sport auto' }, { name: 'MotoGP', query: 'MotoGP', sport: 'Moto' },
  { name: 'Tour de France', query: 'Tour de France cyclisme', sport: 'Cyclisme' }, { name: 'Roland-Garros', query: 'Roland-Garros', sport: 'Tennis' },
  { name: 'Circuit ATP', query: 'tennis ATP', sport: 'Tennis' }, { name: 'Circuit WTA', query: 'tennis WTA', sport: 'Tennis' }, { name: 'UFC', query: 'UFC', sport: 'MMA' },
  { name: 'PFL / MMA français', query: 'MMA France combat', sport: 'MMA' }, { name: 'Jeux olympiques', query: 'Jeux olympiques', sport: 'Multisport' },
  { name: 'Biathlon', query: 'biathlon coupe du monde', sport: 'Ski' }, { name: 'Handball - Starligue', query: 'Starligue handball', sport: 'Handball' },
  { name: 'LoL / e-sport', query: 'League of Legends e-sport', sport: 'E-sport' }, { name: 'Vendée Globe / voile', query: 'voile course au large', sport: 'Voile' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Recherche équipes + joueurs + compétitions ; propose toujours de suivre le nom tapé via l'actualité.
export async function searchFollow(qRaw: string): Promise<(Follow & { sub: string })[]> {
  const qn = norm(qRaw);
  const terms = Array.from(new Set([...(ALIASES[qn] ?? ALIASES[qRaw.toLowerCase().trim()] ?? []), qRaw.trim()]));
  const out: (Follow & { sub: string })[] = [];
  const comps = COMPETITIONS.filter(c => norm(c.name).includes(qn) || norm(c.query).includes(qn));
  comps.forEach(c => out.push({ kind: 'competition', name: c.name, query: c.query, sport: c.sport, sub: `Compétition · ${c.sport}` }));
  const [teams, players] = await Promise.all([
    Promise.all(terms.map(t => getJson(`${API}/searchteams.php?t=${enc(t)}`).then(d => d.teams || []).catch(() => []))).then(a => a.flat()),
    getJson(`${API}/searchplayers.php?p=${enc(qRaw.trim())}`).then(d => d.player || []).catch(() => []),
  ]);
  for (const t of teams.slice(0, 8)) {
    if (out.some(o => o.id === t.idTeam)) continue;
    out.push({ kind: 'team', id: t.idTeam, name: t.strTeam, sport: SPORTS[t.strSport] || t.strSport, query: `"${t.strTeam}" ${SPORTS[t.strSport] || ''}`.trim(), sub: [SPORTS[t.strSport] || t.strSport, t.strLeague, t.strCountry].filter(Boolean).join(' · ') });
  }
  for (const p of players.slice(0, 6)) {
    out.push({ kind: 'player', id: p.idPlayer, name: p.strPlayer, sport: SPORTS[p.strSport] || p.strSport, query: `"${p.strPlayer}"`, sub: ['Joueur', SPORTS[p.strSport] || p.strSport, p.strTeam && p.strTeam !== '_Retired Soccer' ? p.strTeam : ''].filter(Boolean).join(' · ') });
  }
  if (qRaw.trim().length >= 2 && !out.some(o => norm(o.name) === qn)) {
    out.push({ kind: 'player', name: qRaw.trim(), query: `"${qRaw.trim()}"`, sub: 'Suivre ce nom dans l\'actualité sportive' });
  }
  return out;
}

const when = (ts: string) => new Date(ts.endsWith('Z') ? ts : ts + 'Z');
const hh = (d: Date) => `${d.getHours()} h${d.getMinutes() ? ' ' + String(d.getMinutes()).padStart(2, '0') : ''}`;

export async function sportSection(follows: Follow[], perFollow: number, taste: Taste): Promise<JournalSection> {
  const items: JournalItem[] = [];
  const now = Date.now();
  // Résultats et prochains matchs des équipes (base TheSportsDB).
  await Promise.all(follows.filter(f => f.kind === 'team' && f.id).map(async t => {
    try {
      const [last, next] = await Promise.all([getJson(`${API}/eventslast.php?id=${t.id}`), getJson(`${API}/eventsnext.php?id=${t.id}`)]);
      const l = (last.results || [])[0];
      if (l && l.intHomeScore != null && now - when(l.strTimestamp).getTime() < 4 * 86400e3) {
        items.push({ id: `s-${l.idEvent}`, title: `${l.strHomeTeam} ${l.intHomeScore} - ${l.intAwayScore} ${l.strAwayTeam}`, detail: `Résultat · ${l.strLeague}`, speech: `Résultat : ${l.strHomeTeam} ${l.intHomeScore}, ${l.strAwayTeam} ${l.intAwayScore}.`, desc: `Score final (${l.strLeague}, ${l.dateEvent}).`, source: 'TheSportsDB', url: `https://www.thesportsdb.com/event/${l.idEvent}` });
      }
      const n = (next.events || []).find((e: any) => when(e.strTimestamp).getTime() > now - 3 * 3600e3);
      if (n) {
        const d = when(n.strTimestamp);
        const today = d.toDateString() === new Date().toDateString();
        const tomorrow = d.toDateString() === new Date(now + 86400e3).toDateString();
        if (today || tomorrow) {
          items.push({ id: `s-${n.idEvent}`, title: `${n.strHomeTeam} - ${n.strAwayTeam}`, detail: `${today ? "Aujourd'hui" : 'Demain'} à ${hh(d)} · ${n.strLeague}`, speech: `${today ? "Aujourd'hui" : 'Demain'}, à ${hh(d)}, ${n.strHomeTeam} reçoit ${n.strAwayTeam}.`, desc: `Match à venir ${today ? "aujourd'hui" : 'demain'} à ${hh(d)} (${n.strLeague}).`, source: 'TheSportsDB', url: `https://www.thesportsdb.com/event/${n.idEvent}` });
        }
      }
    } catch { /* équipe indisponible */ }
  }));
  // Actualité de chaque équipe, joueur ou compétition suivi.
  const news = await Promise.all(follows.map(f => fetchFeed(googleNewsUrl(`${f.query} when:3d`), 'Google Actualités').then(l => l.map(splitGoogleTitle))));
  news.forEach((l, k) => pickBalanced([l], perFollow, taste, 80).forEach(i => { if (!items.some(x => x.title === i.title)) items.push({ ...toItem(i), detail: follows[k].name }); }));
  if (!follows.length) {
    const feed = await fetchFeed('https://dwh.lequipe.fr/api/edito/rss?path=/', "L'Équipe");
    pickBalanced([feed], perFollow + 1, taste, 36).forEach(i => items.push(toItem(i)));
  }
  return { id: 'sport', title: 'Sport', icon: '⚽', items };
}
