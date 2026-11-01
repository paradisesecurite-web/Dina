import type { JournalSection, Place, Settings } from '../types';
import { getJson } from './http';

export function trafficSection(c: NonNullable<Settings['commute']>): JournalSection {
  const gmaps = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(c.from)}&destination=${encodeURIComponent(c.to)}&travelmode=${c.mode}`;
  const waze = `https://waze.com/ul?q=${encodeURIComponent(c.to)}&navigate=yes`;
  return {
    id: 'trafic', title: 'Ton trajet', icon: '🚗',
    note: 'Le trafic en direct s\'affiche dans Google Maps ou Waze (gratuits).',
    items: [
      { id: 'trafic', title: `${c.from} → ${c.to}`, speech: 'Pour ton trajet, un bouton t\'attend dans le journal pour voir le trafic en direct.', action: { label: 'Voir le trafic (Google Maps)', url: gmaps } },
      ...(c.mode === 'driving' ? [{ id: 'trafic-waze', title: 'Ouvrir dans Waze', speech: '', action: { label: 'Lancer Waze', url: waze } }] : []),
    ],
  };
}

const FUEL_LABEL: Record<Settings['fuel'], string> = { gazole: 'gazole', sp95: 'SP95', e10: 'SP95-E10', sp98: 'SP98', gplc: 'GPL', e85: 'E85' };

// Prix officiels des carburants (data.economie.gouv.fr), France uniquement.
export async function carburantSection(p: Place, fuel: Settings['fuel']): Promise<JournalSection> {
  const where = encodeURIComponent(`within_distance(geom, geom'POINT(${p.lon} ${p.lat})', 6km) and ${fuel}_prix is not null`);
  const d = await getJson(`https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?where=${where}&order_by=${fuel}_prix&limit=20`);
  const rows = (d.results || []).filter((r: any) => typeof r[`${fuel}_prix`] === 'number');
  const label = FUEL_LABEL[fuel];
  if (!rows.length) return { id: 'carburant', title: 'Carburant', icon: '⛽', items: [{ id: 'fuel-none', title: `Pas de prix ${label} trouvé près de ${p.name}`, detail: 'Les prix officiels ne couvrent que la France.', speech: '' }] };
  const best = rows[0];
  const avg = rows.reduce((s: number, r: any) => s + r[`${fuel}_prix`], 0) / rows.length;
  const eur = (n: number) => n.toFixed(3).replace('.', ',') + ' €';
  const name = `${best.adresse}, ${best.ville}`.replace(/\b([A-ZÀ-Ü]{2,})\b/g, w => w.charAt(0) + w.slice(1).toLowerCase());
  return {
    id: 'carburant', title: 'Carburant', icon: '⛽',
    items: [{
      id: 'fuel', title: `${label} le moins cher : ${eur(best[`${fuel}_prix`])}`, detail: `${name} · moyenne alentour ${eur(avg)}`,
      speech: `Le ${label} le moins cher près de chez toi est à ${best[`${fuel}_prix`].toFixed(2).replace('.', ' euros ')}, ${name}.`,
      source: 'prix-carburants.gouv.fr', url: 'https://www.prix-carburants.gouv.fr/',
      action: { label: 'Y aller', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}` },
    }],
  };
}
