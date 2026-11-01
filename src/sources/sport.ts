import type { JournalItem, JournalSection } from '../types';
import { getJson, enc } from './http';
import { fetchFeed } from './rss';
import { pickBalanced, toItem, type Taste } from './actus';

// TheSportsDB : clé publique gratuite « 123 » (accès limité mais suffisant).
const API = 'https://www.thesportsdb.com/api/v1/json/123';
const SPORTS: Record<string, string> = { Soccer: 'Football', Basketball: 'Basket', Rugby: 'Rugby', 'Ice Hockey': 'Hockey', 'American Football': 'Football américain', Handball: 'Handball', Volleyball: 'Volley' };

export async function searchTeam(q: string): Promise<{ id: string; name: string; sport: string; league: string }[]> {
  const d = await getJson(`${API}/searchteams.php?t=${enc(q)}`);
  return (d.teams || []).slice(0, 8).map((t: any) => ({ id: t.idTeam, name: t.strTeam, sport: SPORTS[t.strSport] || t.strSport, league: t.strLeague }));
}

const when = (ts: string) => new Date(ts.endsWith('Z') ? ts : ts + 'Z');
const hh = (d: Date) => `${d.getHours()} h${d.getMinutes() ? ' ' + String(d.getMinutes()).padStart(2, '0') : ''}`;

export async function sportSection(teams: { id: string; name: string }[], length: 'flash' | 'complet', taste: Taste): Promise<JournalSection> {
  const items: JournalItem[] = [];
  const now = Date.now();
  await Promise.all(teams.map(async t => {
    try {
      const [last, next] = await Promise.all([
        getJson(`${API}/eventslast.php?id=${t.id}`), getJson(`${API}/eventsnext.php?id=${t.id}`),
      ]);
      const l = (last.results || [])[0];
      if (l && l.intHomeScore != null && now - when(l.strTimestamp).getTime() < 4 * 86400e3) {
        const s = `${l.strHomeTeam} ${l.intHomeScore} - ${l.intAwayScore} ${l.strAwayTeam}`;
        items.push({ id: `s-${l.idEvent}`, title: s, detail: `Résultat · ${l.strLeague}`, speech: `Résultat : ${l.strHomeTeam} ${l.intHomeScore}, ${l.strAwayTeam} ${l.intAwayScore}.`, source: 'TheSportsDB', url: `https://www.thesportsdb.com/event/${l.idEvent}` });
      }
      const n = (next.events || []).find((e: any) => when(e.strTimestamp).getTime() > now - 3 * 3600e3);
      if (n) {
        const d = when(n.strTimestamp);
        const today = d.toDateString() === new Date().toDateString();
        const tomorrow = d.toDateString() === new Date(now + 86400e3).toDateString();
        if (today || tomorrow) {
          const lab = `${today ? "Aujourd'hui" : 'Demain'} à ${hh(d)}`;
          items.push({ id: `s-${n.idEvent}`, title: `${n.strHomeTeam} - ${n.strAwayTeam}`, detail: `${lab} · ${n.strLeague}`, speech: `${today ? "Aujourd'hui" : 'Demain'}, à ${hh(d)}, ${n.strHomeTeam} reçoit ${n.strAwayTeam}.`, source: 'TheSportsDB', url: `https://www.thesportsdb.com/event/${n.idEvent}` });
        }
      }
    } catch { /* équipe indisponible */ }
  }));
  // Actualité sport : on garde en priorité ce qui parle des équipes suivies.
  const feed = await fetchFeed('https://dwh.lequipe.fr/api/edito/rss?path=/', "L'Équipe");
  const names = teams.map(t => t.name.toLowerCase());
  const mine = feed.filter(i => names.some(n => i.title.toLowerCase().includes(n)));
  const extra = pickBalanced([mine.length ? mine : feed], length === 'flash' ? 1 : 3, taste, 36);
  extra.forEach(i => items.push(toItem(i)));
  return { id: 'sport', title: 'Sport', icon: '⚽', items };
}
