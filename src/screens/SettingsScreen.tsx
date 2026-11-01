import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import type { RubriqueId, Settings, ThemeId } from '../types';
import { APP_NAME, APP_VERSION } from '../config';
import { RUBRIQUES, rubriqueMeta } from '../journal/rubriques';
import { SIGNES } from '../data/horoscope';
import { LANGUES } from '../data/mots';
import { searchArtist } from '../sources/musique';
import { searchTeam } from '../sources/sport';
import { searchCrypto, searchStock } from '../sources/finance';
import { loadCryptoNames, saveCryptoNames, resetAll } from '../services/storage';
import { enableDaily, disableDaily } from '../services/notify';
import { frenchVoices, player } from '../services/player';
import { Btn, Card, Chip, Field, Gap, Segmented, Stepper, Toggle, Txt } from '../ui/kit';
import { Screen } from '../ui/Screen';
import { useTheme, THEMES } from '../ui/theme';
import { CityPicker } from '../ui/CityPicker';
import { SearchAdd } from '../ui/SearchAdd';
import { ThemePicker } from './Onboarding';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function SettingsScreen({ s, update, onBack, onReset }: { s: Settings; update: (p: Partial<Settings>) => void; onBack: () => void; onReset: () => void }) {
  const t = useTheme();
  const [voices, setVoices] = useState<{ id: string; name: string; quality: string }[]>([]);
  const [cryptoNames, setCryptoNames] = useState<Record<string, string>>({});
  const [notifMsg, setNotifMsg] = useState('');
  const [topic, setTopic] = useState('');
  useEffect(() => { frenchVoices().then(setVoices); loadCryptoNames().then(setCryptoNames); }, []);

  const active = (id: RubriqueId) => s.rubriques.includes(id);
  const toggleRub = (id: RubriqueId, on: boolean) => update({ rubriques: on ? [...s.rubriques.filter(r => r !== 'bonne_nouvelle'), id, ...(id !== 'bonne_nouvelle' && s.rubriques.includes('bonne_nouvelle') ? ['bonne_nouvelle' as RubriqueId] : [])] : s.rubriques.filter(r => r !== id) });
  const move = (id: RubriqueId, d: -1 | 1) => {
    const a = [...s.rubriques]; const i = a.indexOf(id); const j = i + d;
    if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; update({ rubriques: a });
  };
  const setNotify = async (enabled: boolean, hour = s.notify.hour, minute = s.notify.minute) => {
    if (!enabled) { await disableDaily(); update({ notify: { enabled: false, hour, minute } }); setNotifMsg(''); return; }
    const ok = await enableDaily(hour, minute);
    update({ notify: { enabled: ok, hour, minute } });
    setNotifMsg(ok ? `Notification programmée chaque jour à ${hour} h ${pad2(minute)}.` : 'Autorisation refusée. Tu peux l\'activer dans les réglages Android de l\'application.');
  };
  const changeTime = (h: number, m: number) => (s.notify.enabled ? setNotify(true, h, m) : update({ notify: { ...s.notify, hour: h, minute: m } }));

  const order = [...s.rubriques, ...RUBRIQUES.map(r => r.id).filter(id => !s.rubriques.includes(id))];

  return (
    <Screen footer={<Btn label="Revenir au journal" onPress={onBack} />}>
      <Txt v="title">Réglages</Txt>
      <Gap h={18} />

      <Section title="Toi">
        <Txt v="h3">Prénom</Txt><Gap h={6} />
        <Field value={s.firstName} onChangeText={v => update({ firstName: v })} placeholder="Ton prénom" accessibilityLabel="Prénom" />
        <Gap />
        <Txt v="h3">Ta ville</Txt><Gap h={6} />
        <CityPicker value={s.city} onChange={city => update({ city })} />
      </Section>

      <Section title="Apparence">
        <ThemePicker value={s.theme} onChange={(id: ThemeId) => update({ theme: id })} />
        <Gap h={10} />
        <Btn small kind="secondary" label="Appliquer les réglages assortis à ce thème" onPress={() => update({ tone: THEMES[s.theme].defaults.tone, wellbeing: THEMES[s.theme].defaults.wellbeing })} />
      </Section>

      <Section title="Voix">
        <Txt v="h3">Ton</Txt><Gap h={6} />
        <Segmented value={s.tone} onChange={tone => update({ tone })} options={[{ v: 'calme', label: 'Calme' }, { v: 'assistant', label: 'Assistant IA' }, { v: 'journaliste', label: 'Journaliste' }]} />
        <Gap />
        <Txt v="h3">Vitesse</Txt><Gap h={6} />
        <Stepper label="la vitesse" value={`× ${s.rate.toFixed(1).replace('.', ',')}`} onMinus={() => update({ rate: Math.max(0.6, Math.round((s.rate - 0.1) * 10) / 10) })} onPlus={() => update({ rate: Math.min(1.5, Math.round((s.rate + 0.1) * 10) / 10) })} />
        <Gap />
        <Txt v="h3">Voix du téléphone</Txt>
        <Txt v="small">Gratuites. Pour en ajouter : Paramètres Android › Accessibilité › Synthèse vocale.</Txt>
        <Gap h={6} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Par défaut" on={!s.voiceId} onPress={() => update({ voiceId: undefined })} />
          {voices.slice(0, 12).map((v, i) => <Chip key={v.id} label={`Voix ${i + 1}${v.quality === 'Enhanced' ? ' ★' : ''}`} on={s.voiceId === v.id} onPress={() => update({ voiceId: v.id })} />)}
        </View>
        <Gap h={10} />
        <Btn small kind="secondary" icon="🔊" label="Tester la voix" onPress={() => player.say(`Bonjour ${s.firstName}. Voici à quoi ressemble ma voix.`, s)} />
      </Section>

      <Section title="Ton journal">
        <Txt v="h3">Durée</Txt><Gap h={6} />
        <Segmented value={s.length} onChange={length => update({ length })} options={[{ v: 'flash', label: 'Flash (~2 min)' }, { v: 'complet', label: 'Complet (~10 min)' }]} />
        <Gap />
        <Txt v="h3">Moment bien-être avant les infos</Txt><Gap h={6} />
        <Segmented value={s.wellbeing} onChange={wellbeing => update({ wellbeing })} options={[{ v: 'aucun', label: 'Aucun' }, { v: 'respiration', label: 'Respiration' }, { v: 'pensee', label: 'Pensée' }]} />
      </Section>

      <Section title="Rubriques">
        <Txt v="small">Active celles que tu veux, et range-les avec les flèches.</Txt>
        <Gap h={6} />
        {order.map(id => {
          const m = rubriqueMeta(id); const on = active(id);
          return (
            <View key={id} style={{ borderTopWidth: 1, borderColor: t.colors.border, paddingVertical: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Toggle label={`${m.icon}  ${m.label}`} hint={m.needsCity && !s.city ? `${m.desc} · choisis d'abord ta ville` : m.desc} value={on} onChange={v => toggleRub(id, v)} />
                </View>
                {on ? (
                  <View style={{ flexDirection: 'row', gap: 4, marginLeft: 6 }}>
                    <Arrow label="▲" a11y={`Monter ${m.label}`} onPress={() => move(id, -1)} />
                    <Arrow label="▼" a11y={`Descendre ${m.label}`} onPress={() => move(id, 1)} />
                  </View>
                ) : null}
              </View>
              {on ? <RubriqueOptions id={id} s={s} update={update} cryptoNames={cryptoNames} setCryptoNames={n => { setCryptoNames(n); saveCryptoNames(n); }} topic={topic} setTopic={setTopic} /> : null}
            </View>
          );
        })}
      </Section>

      <Section title="Notification du matin">
        <Toggle label="Me prévenir quand mon journal est prêt" hint={notifMsg || 'L\'autorisation est demandée seulement si tu l\'actives.'} value={s.notify.enabled} onChange={v => setNotify(v)} />
        <Gap h={6} />
        <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
          <Stepper label="l'heure" value={`${s.notify.hour} h`} onMinus={() => changeTime((s.notify.hour + 23) % 24, s.notify.minute)} onPlus={() => changeTime((s.notify.hour + 1) % 24, s.notify.minute)} />
          <Stepper label="les minutes" value={pad2(s.notify.minute)} onMinus={() => changeTime(s.notify.hour, (s.notify.minute + 55) % 60)} onPlus={() => changeTime(s.notify.hour, (s.notify.minute + 5) % 60)} />
        </View>
        <Gap h={8} />
        <Txt v="small">Le réveil en musique et les ambiances sonores arrivent à la prochaine étape.</Txt>
      </Section>

      <Section title="Confidentialité">
        <Txt v="small">Tout se passe sur ton téléphone : tes réglages et tes goûts ne sont envoyés à personne. Pour préparer le journal, l'application interroge des sources publiques gratuites (sans compte) : Open-Meteo, flux des journaux, Google Actualités, CoinGecko, Yahoo Finance, Deezer, TheSportsDB, Wikipédia, Nominis, prix-carburants.gouv.fr. Seul le nom de ta ville, ou tes sujets, leur est transmis.</Txt>
        <Gap h={8} />
        <Txt v="small">Chaque info affiche sa source et un lien vers l'article d'origine.</Txt>
      </Section>

      <Section title="À propos">
        <Txt v="small">{APP_NAME} · version de test {APP_VERSION}</Txt>
        <Gap h={10} />
        <Btn small kind="secondary" label="Tout réinitialiser" onPress={() => {
          const go = async () => { await disableDaily(); await resetAll(); onReset(); };
          if (Platform.OS === 'web') go();
          else Alert.alert('Tout réinitialiser ?', 'Tes réglages et tes goûts seront effacés.', [{ text: 'Annuler', style: 'cancel' }, { text: 'Réinitialiser', style: 'destructive', onPress: go }]);
        }} />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<><Txt v="h2">{title}</Txt><Gap h={8} /><Card>{children}</Card><Gap h={22} /></>);
}

function Arrow({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} hitSlop={4}
      style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}>
      <Txt v="small" color={t.colors.accent}>{label}</Txt>
    </Pressable>
  );
}

function RubriqueOptions({ id, s, update, cryptoNames, setCryptoNames, topic, setTopic }: {
  id: RubriqueId; s: Settings; update: (p: Partial<Settings>) => void;
  cryptoNames: Record<string, string>; setCryptoNames: (n: Record<string, string>) => void; topic: string; setTopic: (t: string) => void;
}) {
  const wrap = (c: React.ReactNode) => <View style={{ paddingBottom: 12, paddingLeft: 4 }}>{c}</View>;
  switch (id) {
    case 'horoscope':
      return wrap(<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{SIGNES.map(g => <Chip key={g} label={g} on={s.sign === g} onPress={() => update({ sign: g })} />)}</View>);
    case 'mot':
      return wrap(<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{Object.keys(LANGUES).map(l => <Chip key={l} label={l.charAt(0).toUpperCase() + l.slice(1)} on={s.language === l} onPress={() => update({ language: l as Settings['language'] })} />)}</View>);
    case 'musique':
      return wrap(<SearchAdd placeholder="Ajouter un artiste" search={searchArtist} items={s.artists} keyOf={a => String(a.id)} label={a => a.name} sub={(a: any) => a.fans ? `${a.fans.toLocaleString('fr-FR')} fans sur Deezer` : ''} onAdd={(a: any) => update({ artists: [...s.artists, { id: a.id, name: a.name }] })} onRemove={a => update({ artists: s.artists.filter(x => x.id !== a.id) })} />);
    case 'sport':
      return wrap(<SearchAdd placeholder="Ajouter une équipe (ex. : Lyon)" search={searchTeam} items={s.teams} keyOf={a => a.id} label={a => a.name} sub={(a: any) => [a.sport, a.league].filter(Boolean).join(' · ')} onAdd={(a: any) => update({ teams: [...s.teams, { id: a.id, name: a.name, sport: a.sport }] })} onRemove={a => update({ teams: s.teams.filter(x => x.id !== a.id) })} />);
    case 'crypto':
      return wrap(<SearchAdd placeholder="Ajouter une crypto" search={searchCrypto} items={s.cryptos.map(c => ({ id: c, name: cryptoNames[c] || c, symbol: '' }))} keyOf={a => a.id} label={a => a.name} sub={a => a.symbol?.toUpperCase()} onAdd={a => { setCryptoNames({ ...cryptoNames, [a.id]: a.name }); update({ cryptos: [...s.cryptos, a.id] }); }} onRemove={a => update({ cryptos: s.cryptos.filter(x => x !== a.id) })} />);
    case 'bourse':
      return wrap(<SearchAdd placeholder="Ajouter une action ou un indice" search={searchStock} items={s.stocks} keyOf={a => a.symbol} label={a => a.name} sub={(a: any) => `${a.symbol}${a.place ? ' · ' + a.place : ''}`} onAdd={a => update({ stocks: [...s.stocks, { symbol: a.symbol, name: a.name }] })} onRemove={a => update({ stocks: s.stocks.filter(x => x.symbol !== a.symbol) })} />);
    case 'libre':
      return wrap(
        <View style={{ gap: 8 }}>
          {s.freeTopics.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{s.freeTopics.map(tp => <Chip key={tp} label={`${tp}  ✕`} on onPress={() => update({ freeTopics: s.freeTopics.filter(x => x !== tp) })} />)}</View> : null}
          <Field value={topic} onChangeText={setTopic} placeholder="Un sujet : « le MMA », « l'immobilier à Lyon »…" accessibilityLabel="Nouveau sujet" onSubmitEditing={() => { if (topic.trim()) { update({ freeTopics: [...s.freeTopics, topic.trim()] }); setTopic(''); } }} returnKeyType="done" />
          <Btn small kind="secondary" label="Ajouter ce sujet" disabled={!topic.trim()} onPress={() => { update({ freeTopics: [...s.freeTopics, topic.trim()] }); setTopic(''); }} />
        </View>);
    case 'trafic': {
      const c = s.commute ?? { from: '', to: '', mode: 'driving' as const };
      return wrap(
        <View style={{ gap: 8 }}>
          <Field value={c.from} onChangeText={v => update({ commute: { ...c, from: v } })} placeholder="Départ (adresse ou ville)" accessibilityLabel="Départ" />
          <Field value={c.to} onChangeText={v => update({ commute: { ...c, to: v } })} placeholder="Arrivée (travail…)" accessibilityLabel="Arrivée" />
          <Segmented value={c.mode} onChange={mode => update({ commute: { ...c, mode } })} options={[{ v: 'driving', label: '🚗' }, { v: 'transit', label: '🚆' }, { v: 'bicycling', label: '🚲' }, { v: 'walking', label: '🚶' }]} />
        </View>);
    }
    case 'carburant':
      return wrap(<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{(['gazole', 'sp95', 'e10', 'sp98', 'gplc', 'e85'] as const).map(f => <Chip key={f} label={{ gazole: 'Gazole', sp95: 'SP95', e10: 'E10', sp98: 'SP98', gplc: 'GPL', e85: 'E85' }[f]} on={s.fuel === f} onPress={() => update({ fuel: f })} />)}</View>);
    default:
      return null;
  }
}
