import { Platform } from 'react-native';
import { setFetchOverride } from './sources/http';

// Mode démonstration (navigateur uniquement, adresse avec ?demo) :
// remplace internet par des données d'exemple, pour tester les écrans.
// N'a aucun effet dans l'application installée sur un téléphone.
export function installDemoIfAsked() {
  if (Platform.OS !== 'web' || typeof location === 'undefined' || !location.search.includes('demo')) return;
  const rss = (items: string[], src = '') => `<?xml version="1.0"?><rss><channel>${items.map((t, i) => `<item><title>${t}${src}</title><link>https://exemple.fr/${i}</link><pubDate>${new Date(Date.now() - i * 3600e3).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
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
