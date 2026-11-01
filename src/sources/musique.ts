import type { JournalSection } from '../types';
import { getJson, enc } from './http';

export const youtubeSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export async function searchArtist(q: string): Promise<{ id: number; name: string; fans: number }[]> {
  const d = await getJson(`https://api.deezer.com/search/artist?q=${enc(q)}&limit=8`);
  return (d.data || []).map((a: any) => ({ id: a.id, name: a.name, fans: a.nb_fan }));
}

export async function musiqueSection(artists: { id: number; name: string }[]): Promise<JournalSection> {
  if (!artists.length) {
    return { id: 'musique', title: 'Sorties musicales', icon: '🎵', items: [{ id: 'm-none', title: 'Choisis tes artistes dans les réglages', speech: '' }] };
  }
  const limit = Date.now() - 14 * 86400e3;
  const found = await Promise.all(artists.map(async a => {
    try {
      const d = await getJson(`https://api.deezer.com/artist/${a.id}/albums?limit=15`);
      return (d.data || [])
        .filter((x: any) => Date.parse(x.release_date) >= limit)
        .map((x: any) => ({ artist: a.name, title: x.title as string, date: x.release_date as string, type: x.record_type as string, link: x.link as string }));
    } catch { return []; }
  }));
  const rel = found.flat().sort((a, b) => b.date.localeCompare(a.date));
  const kind = (t: string) => (t === 'single' ? 'le single' : t === 'ep' ? "l'EP" : "l'album");
  const items = rel.slice(0, 6).map(r => ({
    id: `m-${r.artist}-${r.title}`, title: `${r.artist} · ${r.title}`, detail: `Sorti le ${new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
    speech: `Nouveau chez ${r.artist} : ${kind(r.type)} « ${r.title} ».`, source: 'Deezer', url: r.link,
    action: { label: 'Écouter sur YouTube', url: youtubeSearch(`${r.artist} ${r.title}`) },
  }));
  if (!items.length) items.push({ id: 'm-rien', title: 'Pas de nouvelle sortie ces deux dernières semaines', detail: artists.map(a => a.name).join(', '), speech: 'Pas de nouvelle sortie cette semaine pour tes artistes.' } as any);
  return { id: 'musique', title: 'Sorties musicales', icon: '🎵', items };
}
