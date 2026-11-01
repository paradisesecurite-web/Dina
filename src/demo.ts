import { Platform } from 'react-native';
import { setFetchOverride } from './sources/http';
import { API_URL } from './config';

// Mode démonstration (navigateur uniquement, adresse avec ?demo) :
// remplace internet par des données d'exemple, pour tester les écrans.
// N'a aucun effet dans l'application installée sur un téléphone.
export function installDemoIfAsked() {
  if (Platform.OS !== 'web' || typeof location === 'undefined' || !location.search.includes('demo')) return;
  const rss = (items: string[], src = '') => `<?xml version="1.0"?><rss><channel>${items.map((t, i) => `<item><title>${t}${src}</title><link>https://exemple.fr/${i}</link><pubDate>${new Date(Date.now() - i * 3600e3).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
  // Faux serveur IA (navigateur uniquement).
  const realFetch = globalThis.fetch.bind(globalThis);
  const reply = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } });
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = String(input?.url ?? input);
    if (!url.startsWith(API_URL)) return realFetch(input, init);
    await new Promise(r => setTimeout(r, 400));
    if (url.includes('/v1/status')) return reply({ usage: { journals: 0, ttsChars: 0, questions: 0 }, charsPerMinute: 900, tiers: { standard: { label: 'Standard', price: '', aiVoiceMinutesPerDay: 10, questionsPerDay: 5, journalsPerDay: 3 }, premium: { label: 'Premium', price: '', aiVoiceMinutesPerDay: 15, questionsPerDay: 15, journalsPerDay: 4 } } });
    if (url.includes('/v1/ask')) return reply({ text: 'Bonne question ! En résumé, les Vingt-Sept vont acheter leur gaz ensemble pour peser plus lourd face aux fournisseurs et éviter la flambée des prix cet hiver.', sources: [{ title: 'Le Monde — Énergie', url: 'https://www.lemonde.fr' }] });
    if (url.includes('/v1/journal')) {
      const b = JSON.parse(init.body);
      return reply({ model: 'claude-sonnet-5-5', intro: `Bonjour ${b.profile.firstName}, installe-toi, le café est prêt : voici ce qu'il faut savoir ce matin.`, outro: 'C\'est tout pour ce matin. Belle journée à toi, et à demain !',
        sections: b.sections.map((x: any) => ({ id: x.id, title: x.title, sources: (x.items || []).slice(0, 3).map((i: any) => i.n),
          paragraphs: x.items?.length ? [`Côté ${x.title.toLowerCase()}, ${x.items[0].title.charAt(0).toLowerCase() + x.items[0].title.slice(1)}. C'est le sujet qui fait parler ce matin, et plusieurs médias le racontent chacun à leur manière.`, x.items[1] ? `Autre info à retenir : ${x.items[1].title.charAt(0).toLowerCase() + x.items[1].title.slice(1)}. On en saura sans doute plus dans la journée.` : ''].filter(Boolean) : [String(x.facts || x.title).split('\n')[0]] })) });
    }
    return reply({ error: 'démo' });
  }) as any;
  setFetchOverride(async (url: string) => {
    await new Promise(r => setTimeout(r, 150));
    if (url.includes('geocoding')) return JSON.stringify({ results: [{ name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France', admin1: 'Auvergne-Rhône-Alpes' }, { name: 'Lyons', latitude: 43.5, longitude: -91, country: 'États-Unis', admin1: 'Nebraska' }] });
    if (url.includes('api.open-meteo.com')) return JSON.stringify({ current: { time: '2026-11-02T07:00', temperature_2m: 9.4, apparent_temperature: 6.8, weather_code: 2, wind_speed_10m: 12 }, daily: { weather_code: [61], temperature_2m_max: [15.2], temperature_2m_min: [7.1], uv_index_max: [2] }, hourly: { time: Array.from({ length: 24 }, (_, i) => `2026-11-02T${String(i).padStart(2, '0')}:00`), precipitation_probability: Array.from({ length: 24 }, (_, i) => (i >= 15 ? 70 : 10)) } });
    if (url.includes('air-quality')) return JSON.stringify({ current: { european_aqi: 31 }, hourly: { grass_pollen: [3, 25] } });
    if (url.includes('marine')) return JSON.stringify({ hourly: { time: [], sea_level_height_msl: [] } });
    if (url.includes('coingecko.com/api/v3/simple')) return JSON.stringify({ bitcoin: { eur: 69637, eur_24h_change: 0.43 }, ethereum: { eur: 2022.18, eur_24h_change: -1.2 } });
    if (url.includes('finance/chart')) return JSON.stringify({ chart: { result: [{ meta: { regularMarketPrice: 7969.3, regularMarketChangePercent: 0.62, chartPreviousClose: 7920, currency: 'EUR' } }] } });
    if (url.includes('nominis')) return JSON.stringify({ response: { prenoms: { majeurs: { 'Défunts': {}, 'Victorin': {} } } } });
    if (url.includes('onthisday')) return JSON.stringify({ events: [{ year: 1959, text: 'premier vol de démonstration de la Caravelle au départ de Toulouse.', pages: [{ title: 'Sud-Aviation_Caravelle' }] }, { year: 1983, text: 'sortie en France d\'un album de musique devenu culte.' }] });
    if (url.includes('lequipe')) return rss(['L\'OL s\'impose face à Angers et remonte au classement', 'Tennis : la saison indoor démarre à Paris']);
    if (url.includes('allocine')) return rss(['Les films les plus attendus de novembre', 'Une série française cartonne sur les plateformes']);
    if (url.includes('positivr')) return rss(['Une ville plante 10 000 arbres grâce à ses habitants']);
    if (url.includes('insolite')) return rss(['Un chat retrouve sa famille après 3 ans d\'absence']);
    if (url.includes('news.google')) return rss(['Concert événement ce week-end au Transbordeur', 'Festival des lumières : le programme dévoilé'], ' - Le Progrès');
    if (url.includes('international') || url.includes('france24') || url.includes('rfi') || url.includes('courrier')) return rss(['Sommet européen : accord trouvé sur l\'énergie', 'Élections au Brésil : le dépouillement se poursuit', 'Japon : un nouveau train à grande vitesse inauguré']);
    return rss(['Budget : le gouvernement présente ses arbitrages', 'Météo : un automne plus doux que prévu', 'Éducation : la réforme du bac en débat', 'Santé : la campagne de vaccination débute', 'Transports : grève annoncée jeudi']);
  });
}
