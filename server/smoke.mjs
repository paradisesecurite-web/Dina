// Test du serveur en ligne avec les vraies clés : santé, journal, voix, question.
const URL_ = process.argv[2];
const H = { 'content-type': 'application/json', 'x-invite-code': 'MATINAL-AMIS', 'x-device-id': 'test-automatique-0001' };
const post = (p, b) => fetch(URL_ + p, { method: 'POST', headers: H, body: JSON.stringify(b) });
const sample = {
  profile: { firstName: 'Yohann', city: 'Lyon', style: 'chaleureux', minutes: 3, date: 'lundi 2 novembre' },
  dislikes: ['politique intérieure'],
  sections: [
    { id: 'meteo', title: 'Météo', facts: 'Lyon : 9 °C au réveil, ciel couvert, maximum 15 °C, pluie probable à partir de 15 h.' },
    { id: 'actu_monde', title: 'Monde', items: [
      { n: 1, source: 'France 24', title: 'Sommet européen : accord trouvé sur l\'énergie', desc: 'Les Vingt-Sept se sont entendus sur un mécanisme commun d\'achat de gaz pour l\'hiver.' },
      { n: 2, source: 'Le Monde', title: 'L\'UE adopte un plan commun pour ses achats de gaz', desc: 'Le dispositif doit limiter la flambée des prix cet hiver.' } ] },
    { id: 'bonne_nouvelle', title: 'Pour finir', items: [
      { n: 3, source: 'POSITIVR', title: 'Une ville plante 10 000 arbres grâce à ses habitants' },
      { n: 4, source: '20 Minutes', title: 'Gazon en automne : cette erreur de fertilisation à éviter' } ] },
  ],
};
let ok = true;
const t = async (name, f) => { const t0 = Date.now(); try { const r = await f(); console.log(`✅ ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); return r; } catch (e) { ok = false; console.log(`❌ ${name} : ${e.message}`); } };
await t('santé', async () => { const r = await fetch(URL_ + '/v1/health'); if (!r.ok) throw new Error(r.status); console.log(await r.text()); });
await t('code refusé si faux', async () => { const r = await fetch(URL_ + '/v1/status', { headers: { ...H, 'x-invite-code': 'FAUX' } }); if (r.status !== 401) throw new Error('attendu 401, reçu ' + r.status); });
for (const tier of ['standard', 'premium']) {
  await t(`journal ${tier}`, async () => {
    const r = await post('/v1/journal', { ...sample, tier });
    const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j));
    console.log(`   modèle ${j.model}, ${j.usage.input} jetons lus, ${j.usage.output} écrits`);
    console.log('   INTRO : ' + j.intro);
    for (const s of j.sections) console.log(`   [${s.id}] ${s.title} (sources ${s.sources.join(',')})\n     ` + s.paragraphs.join('\n     '));
    console.log('   FIN : ' + j.outro);
  });
}
await t('voix IA', async () => {
  const r = await post('/v1/tts', { tier: 'premium', text: 'Bonjour Yohann ! Il fait neuf degrés à Lyon ce matin. Belle journée à toi.', style: 'chaleureux', voice: 'femme' });
  if (!r.ok) throw new Error(await r.text());
  const b = await r.arrayBuffer(); if (b.byteLength < 5000) throw new Error('audio trop court');
  console.log(`   ${b.byteLength} octets d'audio MP3, reste ${r.headers.get('x-remaining-chars')} caractères aujourd'hui`);
});
await t('question', async () => {
  const r = await post('/v1/ask', { tier: 'premium', style: 'chaleureux', question: 'C\'est quoi exactement ce mécanisme commun d\'achat de gaz ?', context: sample.sections[1].items.map(i => i.title + ' — ' + i.desc).join('\n') });
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j));
  console.log('   RÉPONSE : ' + j.text); console.log('   sources : ' + j.sources.map(s => s.url).join(' '));
});
await t('formule gratuite refusée', async () => { const r = await post('/v1/journal', { ...sample, tier: 'gratuit' }); if (r.status !== 402) throw new Error('attendu 402'); });
process.exit(ok ? 0 : 1);
