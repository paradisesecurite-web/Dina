import type { JournalSection } from '../types';
import { getJson } from './http';
import { seeded } from '../journal/random';

export async function saintSection(date: Date): Promise<JournalSection> {
  const d = await getJson(`https://nominis.cef.fr/json/nominis.php?jour=${date.getDate()}&mois=${date.getMonth() + 1}`);
  const names = Object.keys(d?.response?.prenoms?.majeurs || {}).filter(n => n !== 'Tous les prénoms');
  const toussaint = names.includes('Toussaint');
  const list = names.filter(n => n !== 'Toussaint');
  let speech = '', title = '';
  if (toussaint) { title = 'Toussaint'; speech = "C'est la Toussaint, la fête de tous les saints."; }
  if (list.length) {
    const s = list.length > 1 ? `${list.slice(0, -1).join(', ')} et ${list[list.length - 1]}` : list[0];
    title = title ? `${title} · ${s}` : `Bonne fête aux ${s}`;
    speech += `${speech ? ' ' : ''}Aujourd'hui, on souhaite une bonne fête aux ${s}.`;
  }
  return { id: 'saint', title: 'Saint du jour', icon: '🕯️', items: [{ id: 'saint', title: title || 'Saint du jour', speech, source: 'Nominis', url: 'https://nominis.cef.fr' }] };
}

export async function histoireSection(date: Date, count: number): Promise<JournalSection> {
  const mm = String(date.getMonth() + 1).padStart(2, '0'), dd = String(date.getDate()).padStart(2, '0');
  const d = await getJson(`https://api.wikimedia.org/feed/v1/wikipedia/fr/onthisday/events/${mm}/${dd}`);
  const events = (d.events || []).filter((e: any) => e.year && e.year < date.getFullYear() - 3 && e.text);
  const rnd = seeded(`histoire-${date.toDateString()}`);
  const chosen = [...events].sort(() => rnd() - 0.5).slice(0, count).sort((a: any, b: any) => a.year - b.year);
  return {
    id: 'histoire', title: 'Ce jour-là dans l\'histoire', icon: '📜',
    items: chosen.map((e: any) => {
      const page = e.pages?.[0];
      const t = String(e.text).replace(/\s+/g, ' ').trim();
      return { id: `h-${e.year}`, title: `${e.year} · ${t.charAt(0).toUpperCase()}${t.slice(1)}`, speech: `En ${e.year}, ${t.replace(/\.$/, '')}.`, source: 'Wikipédia', url: page ? `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.title)}` : 'https://fr.wikipedia.org' };
    }),
  };
}
