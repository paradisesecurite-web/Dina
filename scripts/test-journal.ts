// Fabrique un journal complet avec les vraies sources et l'affiche (test automatique).
import { buildJournal, toSegments } from '../src/journal/compose';
import { RUBRIQUES } from '../src/journal/rubriques';
import { DEFAULT_SETTINGS } from '../src/services/defaults';
import type { Settings } from '../src/types';

const base: Settings = {
  ...DEFAULT_SETTINGS, onboarded: true, firstName: 'Yohann', tone: 'journaliste', length: 'complet',
  city: { name: 'Saint-Malo', lat: 48.6493, lon: -2.0257 },
  rubriques: RUBRIQUES.map(r => r.id), wellbeing: 'pensee', sign: 'Lion',
  cryptos: ['bitcoin', 'solana'], stocks: [{ symbol: '^FCHI', name: 'CAC 40' }, { symbol: 'AIR.PA', name: 'Airbus' }],
  artists: [{ id: 4661188, name: 'Kemmler' }, { id: 27, name: 'Daft Punk' }],
  teams: [{ id: '133713', name: 'Lyon' }, { id: '133714', name: 'Paris SG' }],
  language: 'espagnol', freeTopics: ['MMA', 'immobilier Lyon'],
  commute: { from: 'Saint-Malo', to: 'Rennes', mode: 'driving' }, fuel: 'gazole',
};

(async () => {
  let failures = 0;
  for (const tone of ['journaliste', 'calme', 'assistant'] as const) {
    const s = { ...base, tone, length: tone === 'journaliste' ? 'complet' as const : 'flash' as const };
    const t0 = Date.now();
    const j = await buildJournal(s, { taste: {}, cryptoNames: { bitcoin: 'Bitcoin', solana: 'Solana' } });
    console.log(`\n================ TON ${tone} · ${s.length} · ${(Date.now() - t0) / 1000}s ================`);
    for (const sec of j.sections) {
      console.log(`\n## ${sec.icon} ${sec.title}${sec.intro ? `  [${sec.intro}]` : ''}`);
      for (const it of sec.items) {
        console.log(` - ${it.title}${it.detail ? ` | ${it.detail}` : ''}${it.source ? ` (${it.source})` : ''}${it.action ? ` [${it.action.label}]` : ''}`);
        if (it.title === 'Indisponible ce matin') { failures++; console.log('   !!! ÉCHEC'); }
      }
    }
    const segs = toSegments(j, s);
    const words = segs.map(x => x.text).join(' ').split(/\s+/).length;
    console.log(`\n>>> ${segs.length} phrases, ${words} mots, environ ${Math.round(words / 150 * 10) / 10} min de lecture`);
    if (tone === 'journaliste') console.log('\n--- TEXTE LU ---\n' + segs.map(x => (x.lang ? `[${x.lang}] ` : '') + x.text).join('\n'));
  }
  // Ville sans mer : marées
  const j2 = await buildJournal({ ...base, city: { name: 'Lyon', lat: 45.76, lon: 4.83 }, rubriques: ['marees', 'carburant', 'evenements'] }, { taste: {}, cryptoNames: {} });
  j2.sections.forEach(s => console.log(`LYON ${s.title}: ${s.items.map(i => i.title).join(' / ')}`));
  console.log(`\nÉchecs : ${failures}`);
  process.exit(failures > 3 ? 1 : 0);
})();
