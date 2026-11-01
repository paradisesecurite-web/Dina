import type { JournalSection, Place } from '../types';
import { getJson, enc } from './http';

export async function searchPlaces(q: string): Promise<Place[]> {
  if (q.trim().length < 2) return [];
  const d = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${enc(q.trim())}&count=8&language=fr`);
  return (d.results || []).map((r: any) => ({
    name: r.name, lat: r.latitude, lon: r.longitude, country: r.country, admin: r.admin1,
  }));
}

const WMO: Record<number, string> = {
  0: 'ciel dégagé', 1: 'plutôt ensoleillé', 2: 'partiellement nuageux', 3: 'ciel couvert',
  45: 'brouillard', 48: 'brouillard givrant', 51: 'légère bruine', 53: 'bruine', 55: 'bruine épaisse',
  56: 'bruine verglaçante', 57: 'bruine verglaçante', 61: 'pluie faible', 63: 'pluie', 65: 'forte pluie',
  66: 'pluie verglaçante', 67: 'pluie verglaçante', 71: 'faibles chutes de neige', 73: 'neige', 75: 'fortes chutes de neige',
  77: 'grains de neige', 80: 'averses', 81: 'averses', 82: 'fortes averses', 85: 'averses de neige', 86: 'fortes averses de neige',
  95: 'orages', 96: 'orages avec grêle', 99: 'orages avec grêle',
};
export const weatherLabel = (c: number) => WMO[c] ?? 'temps variable';
export function weatherIcon(c: number) {
  if (c === 0 || c === 1) return '☀️';
  if (c === 2) return '⛅';
  if (c === 3) return '☁️';
  if (c === 45 || c === 48) return '🌫️';
  if (c >= 71 && c <= 77 || c === 85 || c === 86) return '❄️';
  if (c >= 95) return '⛈️';
  return '🌧️';
}
const deg = (n: number) => `${Math.round(n)} degré${Math.abs(Math.round(n)) > 1 ? 's' : ''}`;
const hourLabel = (iso: string) => `${Number(iso.slice(11, 13))} h`;

export async function meteoSection(p: Place): Promise<JournalSection> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}`
    + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max'
    + '&hourly=precipitation_probability&timezone=auto&forecast_days=1';
  const d = await getJson(url);
  const cur = d.current, day = d.daily;
  const code = day.weather_code[0];
  const nowHour = Number(String(cur.time).slice(11, 13));
  const rainHours = (d.hourly.time as string[])
    .map((t, i) => ({ t, p: d.hourly.precipitation_probability[i] as number }))
    .filter(h => Number(h.t.slice(11, 13)) >= nowHour && Number(h.t.slice(11, 13)) <= 22 && h.p >= 50);
  const max = day.temperature_2m_max[0], min = day.temperature_2m_min[0];
  let speech = `À ${p.name}, il fait ${deg(cur.temperature_2m)} en ce moment, ${weatherLabel(cur.weather_code)}. `
    + `Dans la journée : ${weatherLabel(code)}, avec un maximum de ${deg(max)}.`;
  if (rainHours.length) speech += ` Risque de pluie à partir de ${hourLabel(rainHours[0].t)} : pense au parapluie.`;
  if (Math.abs(cur.apparent_temperature - cur.temperature_2m) >= 3) speech += ` Ressenti : ${deg(cur.apparent_temperature)}.`;
  if (cur.wind_speed_10m >= 40) speech += ` Attention, vent fort, ${Math.round(cur.wind_speed_10m)} kilomètres heure.`;
  if (day.uv_index_max?.[0] >= 6) speech += ' Indice UV élevé, protège-toi du soleil.';
  return {
    id: 'meteo', title: 'Météo', icon: weatherIcon(code),
    items: [{
      id: `meteo-${p.name}`,
      title: `${Math.round(cur.temperature_2m)}° à ${p.name} · ${weatherLabel(code)}`,
      detail: `Min ${Math.round(min)}° · Max ${Math.round(max)}°${rainHours.length ? ` · pluie vers ${hourLabel(rainHours[0].t)}` : ''}`,
      speech, source: 'Open-Meteo', url: 'https://open-meteo.com',
    }],
  };
}

const AQI = (v: number) => v <= 20 ? 'bonne' : v <= 40 ? 'correcte' : v <= 60 ? 'moyenne' : v <= 80 ? 'médiocre' : v <= 100 ? 'mauvaise' : 'très mauvaise';
const POLLENS: Record<string, string> = {
  alder_pollen: 'aulne', birch_pollen: 'bouleau', grass_pollen: 'graminées',
  mugwort_pollen: 'armoise', olive_pollen: 'olivier', ragweed_pollen: 'ambroisie',
};

export async function airSection(p: Place): Promise<JournalSection> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.lat}&longitude=${p.lon}`
    + `&current=european_aqi&hourly=${Object.keys(POLLENS).join(',')}&forecast_days=1&timezone=auto`;
  const d = await getJson(url);
  const aqi = d.current?.european_aqi;
  const high: string[] = [], mid: string[] = [];
  for (const [k, name] of Object.entries(POLLENS)) {
    const vals = (d.hourly?.[k] || []).filter((v: any) => typeof v === 'number') as number[];
    const m = vals.length ? Math.max(...vals) : 0;
    if (m >= 100) high.push(name); else if (m >= 20) mid.push(name);
  }
  let pol = 'Pas de pollen notable aujourd\'hui.';
  if (high.length) pol = `Pollens élevés : ${high.join(', ')}.`;
  else if (mid.length) pol = `Pollens modérés : ${mid.join(', ')}.`;
  const aq = typeof aqi === 'number' ? `La qualité de l'air est ${AQI(aqi)} à ${p.name}.` : '';
  return {
    id: 'air', title: 'Air & pollens', icon: '🍃',
    items: [{ id: 'air', title: typeof aqi === 'number' ? `Qualité de l'air ${AQI(aqi)} (indice ${Math.round(aqi)})` : 'Qualité de l\'air indisponible', detail: pol, speech: `${aq} ${pol}`, source: 'Open-Meteo (CAMS)', url: 'https://open-meteo.com/en/docs/air-quality-api' }],
  };
}

export async function mareesSection(p: Place): Promise<JournalSection | null> {
  const d = await getJson(`https://marine-api.open-meteo.com/v1/marine?latitude=${p.lat}&longitude=${p.lon}&hourly=sea_level_height_msl&timezone=auto&forecast_days=2`);
  const t: string[] = d.hourly?.time || [];
  const h: (number | null)[] = d.hourly?.sea_level_height_msl || [];
  if (!h.some(v => typeof v === 'number')) {
    return { id: 'marees', title: 'Marées', icon: '🌊', items: [{ id: 'marees-none', title: `Pas de marées à ${p.name}`, detail: 'Cette ville est loin de la mer.', speech: '' }] };
  }
  const ext: { t: string; type: 'haute' | 'basse' }[] = [];
  for (let i = 1; i < h.length - 1 && i < 24; i++) {
    const a = h[i - 1], b = h[i], c = h[i + 1];
    if (a == null || b == null || c == null) continue;
    if (b > a && b >= c) ext.push({ t: t[i], type: 'haute' });
    if (b < a && b <= c) ext.push({ t: t[i], type: 'basse' });
  }
  const txt = ext.map(e => `${e.type === 'haute' ? 'pleine mer' : 'basse mer'} vers ${hourLabel(e.t)}`).join(', ');
  return {
    id: 'marees', title: 'Marées', icon: '🌊', note: 'Horaires approximatifs, à ne pas utiliser pour la navigation.',
    items: [{ id: 'marees', title: txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : 'Marées indisponibles', speech: txt ? `Marées à ${p.name} : ${txt}.` : '', source: 'Open-Meteo Marine', url: 'https://open-meteo.com/en/docs/marine-weather-api' }],
  };
}
