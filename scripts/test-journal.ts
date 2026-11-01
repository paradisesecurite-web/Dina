// Fabrique un journal complet avec les vraies sources, puis le fait rédiger par la vraie IA (test automatique).
import { buildJournal, toSegments } from '../src/journal/compose';
import { DEFAULT_SETTINGS } from '../src/services/defaults';
import { writeWithAI } from '../src/services/ai';
import type { Settings } from '../src/types';

const base: Settings = {
  ...DEFAULT_SETTINGS, onboarded: true, firstName: 'Yohann', style: 'chaleureux', tier: 'premium', minutes: 10, deviceId: 'test-automatique-0002',
  city: { name: 'Lyon', lat: 45.76, lon: 4.83 },
  rubriques: ['meteo', 'actu_france', 'actu_monde', 'libre', 'sport', 'crypto', 'carburant', 'saint', 'horoscope', 'mot', 'citation', 'bonne_nouvelle'],
  topics: [{ id: 'immo', label: 'Immobilier', query: 'immobilier prix' }, { id: 'esport', label: 'E-sport', query: 'e-sport' }, { id: 'perso-1', label: "L'équitation", query: 'équitation' }],
  priorities: ['veille:esport'], wellbeing: 'pensee', sign: 'Lion',
  follows: [{ kind: 'team', id: '133714', name: 'Paris SG', query: '"Paris SG"' }, { kind: 'player', name: 'Jannik Sinner', query: '"Sinner"' }, { kind: 'competition', name: 'Ligue 1', query: 'Ligue 1' }],
  cryptos: ['bitcoin'], language: 'anglais', fuel: 'gazole',
};

(async () => {
  const t0 = Date.now();
  const raw = await buildJournal(base, { taste: {}, cryptoNames: { bitcoin: 'Bitcoin' }, forAI: true });
  const nItems = raw.sections.reduce((n, s) => n + s.items.length, 0);
  console.log(`Collecte : ${raw.sections.length} rubriques, ${nItems} infos, ${(Date.now() - t0) / 1000}s`);
  raw.sections.forEach(s => console.log(`  - ${s.title}${s.priority ? ' ★' : ''} : ${s.items.length} infos (${s.items.filter(i => i.desc).length} avec résumé)`));
  for (const [style, minutes] of [['chaleureux', 10], ['decale', 4]] as const) {
    const t1 = Date.now();
    const j = await writeWithAI({ ...base, style, minutes }, raw);
    const segs = toSegments(j, { ...base, style, minutes });
    const words = segs.map(s => s.text).join(' ').split(/\s+/).length;
    console.log(`\n================ IA ${j.ai?.model} · style ${style} · ${minutes} min visées · ${((Date.now() - t1) / 1000).toFixed(1)}s · ${words} mots ≈ ${(words / 150).toFixed(1)} min ================`);
    console.log(j.greeting);
    for (const s of j.sections) console.log(`\n## ${s.title}${s.priority ? ' ★' : ''}  [sources : ${s.items.filter(i => i.source).map(i => i.source).join(', ')}]\n` + (s.paragraphs ?? s.items.map(i => i.title)).join('\n'));
    console.log('\n' + j.outro);
  }
})().catch(e => { console.error('ÉCHEC', e); process.exit(1); });
