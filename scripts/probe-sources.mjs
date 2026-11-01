// Teste les sources gratuites et affiche un extrait de chaque réponse.
const UA = 'Matinal/0.1 (application de test; contact via github.com/paradisesecurite-web)';
const urls = {
  franceinfo: 'https://www.francetvinfo.fr/titres.rss',
  lemonde: 'https://www.lemonde.fr/rss/une.xml',
  lemonde_intl: 'https://www.lemonde.fr/international/rss_full.xml',
  figaro: 'https://www.lefigaro.fr/rss/figaro_actualites.xml',
  figaro_intl: 'https://www.lefigaro.fr/rss/figaro_international.xml',
  liberation: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml',
  vingtminutes: 'https://www.20minutes.fr/feeds/rss-une.xml',
  vingtminutes_insolite: 'https://www.20minutes.fr/feeds/rss-insolite.xml',
  france24: 'https://www.france24.com/fr/rss',
  rfi: 'https://www.rfi.fr/fr/rss',
  courrier: 'https://www.courrierinternational.com/feed/all/rss.xml',
  ouestfrance: 'https://www.ouest-france.fr/rss/une',
  lacroix: 'https://www.la-croix.com/RSS/UNIVERS',
  lesechos: 'https://syndication.lesechos.fr/rss/rss_une.xml',
  bfm: 'https://www.bfmtv.com/rss/news-24-7/',
  lequipe: 'https://dwh.lequipe.fr/api/edito/rss?path=/',
  positivr: 'https://positivr.fr/feed/',
  allocine: 'https://www.allocine.fr/rss/news.xml',
  gnews: 'https://news.google.com/rss/search?q=MMA&hl=fr&gl=FR&ceid=FR:fr',
  meteo: 'https://api.open-meteo.com/v1/forecast?latitude=45.76&longitude=4.83&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&hourly=precipitation_probability&timezone=auto&forecast_days=1',
  geocode: 'https://geocoding-api.open-meteo.com/v1/search?name=Lyon&count=3&language=fr',
  air: 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=45.76&longitude=4.83&current=european_aqi,pm2_5&hourly=birch_pollen,grass_pollen,ragweed_pollen,alder_pollen,olive_pollen,mugwort_pollen&forecast_days=1&timezone=auto',
  marine: 'https://marine-api.open-meteo.com/v1/marine?latitude=48.65&longitude=-2.02&hourly=sea_level_height_msl&timezone=auto&forecast_days=1',
  metno: 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=45.76&lon=4.83',
  coingecko: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true',
  coingecko_search: 'https://api.coingecko.com/api/v3/search?query=solana',
  yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart/AIR.PA?range=5d&interval=1d',
  yahoo_search: 'https://query1.finance.yahoo.com/v1/finance/search?q=airbus&quotesCount=3&newsCount=0',
  stooq: 'https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv',
  deezer_search: 'https://api.deezer.com/search/artist?q=kemmler',
  deezer_albums: 'https://api.deezer.com/artist/27/albums?limit=5',
  sportsdb_team: 'https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=Lyon',
  sportsdb_last: 'https://www.thesportsdb.com/api/v1/json/123/eventslast.php?id=133713',
  sportsdb_next: 'https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=133713',
  onthisday: 'https://api.wikimedia.org/feed/v1/wikipedia/fr/onthisday/events/11/01',
  onthisday2: 'https://fr.wikipedia.org/api/rest_v1/feed/onthisday/events/11/01',
  carburant: "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?where=within_distance(geom%2C%20geom'POINT(4.83%2045.76)'%2C%203km)&limit=2",
  nominis: 'https://nominis.cef.fr/json/nominis.php',
  radiobrowser: 'https://de1.api.radio-browser.info/json/stations/search?name=fip&limit=2',
};
for (const [k, u] of Object.entries(urls)) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    console.log(`\n### ${k} ${r.status} ${r.headers.get('content-type')} len=${t.length}\n${t.slice(0, 700).replace(/\s+/g, ' ')}`);
  } catch (e) { console.log(`\n### ${k} ERREUR ${e.message}`); }
}
