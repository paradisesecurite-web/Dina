import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import type { RubriqueId, Settings, ThemeId } from '../types';
import { APP_NAME, APP_VERSION } from '../config';
import { RUBRIQUES, rubriqueMeta } from '../journal/rubriques';
import { ALL_INTERESTS } from '../data/catalogue';
import { SIGNES } from '../data/horoscope';
import { LANGUES } from '../data/mots';
import { searchArtist } from '../sources/musique';
import { searchCrypto, searchStock } from '../sources/finance';
import { loadCryptoNames, saveCryptoNames, resetAll } from '../services/storage';
import { enableDaily, disableDaily } from '../services/notify';
import { frenchVoices, player, toneOf } from '../services/player';
import { serverStatus, type ServerStatus } from '../services/ai';
import { Btn, Card, Chip, Field, Gap, Segmented, Stepper, Toggle, Txt, IconBtn } from '../ui/kit';
import { Screen } from '../ui/Screen';
import { useTheme, THEMES } from '../ui/theme';
import { CityPicker } from '../ui/CityPicker';
import { SearchAdd } from '../ui/SearchAdd';
import { InterestsPicker } from '../ui/InterestsPicker';
import { FollowPicker } from '../ui/FollowPicker';
import { DurationPicker, StylePicker, ThemePicker, TierPicker, VOICES } from '../ui/Pickers';
import { Icon } from '../ui/icons';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function SettingsScreen({ s, update, onBack, onReset }: { s: Settings; update: (p: Partial<Settings>) => void; onBack: () => void; onReset: () => void }) {
  const t = useTheme();
  const [voices, setVoices] = useState<{ id: string; name: string; quality: string }[]>([]);
  const [cryptoNames, setCryptoNames] = useState<Record<string, string>>({});
  const [notifMsg, setNotifMsg] = useState('');
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [showCatalogue, setShowCatalogue] = useState(false);
  useEffect(() => { frenchVoices().then(setVoices); loadCryptoNames().then(setCryptoNames); serverStatus(s).then(setStatus); }, []);

  // --- centres d'intérêt ---
  const selected = [
    ...ALL_INTERESTS.filter(i => i.rub && s.rubriques.includes(i.rub)).map(i => i.id),
    ...s.topics.map(x => x.id),
  ];
  const withLibre = (rubs: RubriqueId[], topicsCount: number) => (topicsCount && !rubs.includes('libre') ? insertBeforeEnd(rubs, 'libre') : rubs);
  const toggleInterest = (id: string) => {
    const it = ALL_INTERESTS.find(i => i.id === id)!;
    if (it.rub) { toggleRub(it.rub, !s.rubriques.includes(it.rub)); return; }
    const has = s.topics.some(x => x.id === id);
    const topics = has ? s.topics.filter(x => x.id !== id) : [...s.topics, { id, label: it.label, query: it.query!, icon: it.icon }];
    update({ topics, rubriques: withLibre(s.rubriques, topics.length) });
  };
  const toggleRub = (id: RubriqueId, on: boolean) => update({ rubriques: on ? insertBeforeEnd(s.rubriques, id) : s.rubriques.filter(r => r !== id) });
  const move = (id: RubriqueId, d: -1 | 1) => {
    const a = [...s.rubriques]; const i = a.indexOf(id); const j = i + d;
    if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; update({ rubriques: a });
  };
  const togglePrio = (key: string) => update({ priorities: s.priorities.includes(key) ? s.priorities.filter(p => p !== key) : [...s.priorities, key] });
  const setNotify = async (enabled: boolean, hour = s.notify.hour, minute = s.notify.minute) => {
    if (!enabled) { await disableDaily(); update({ notify: { enabled: false, hour, minute } }); setNotifMsg(''); return; }
    const ok = await enableDaily(hour, minute);
    update({ notify: { enabled: ok, hour, minute } });
    setNotifMsg(ok ? `Notification programmée chaque jour à ${hour} h ${pad2(minute)}.` : 'Autorisation refusée. Tu peux l\'activer dans les réglages Android de l\'application.');
  };
  const changeTime = (h: number, m: number) => (s.notify.enabled ? setNotify(true, h, m) : update({ notify: { ...s.notify, hour: h, minute: m } }));
  const custom = s.topics.filter(x => !ALL_INTERESTS.some(i => i.id === x.id));

  return (
    <Screen footer={<Btn label="Revenir au journal" onPress={onBack} full />}>
      <Txt v="label" color={t.colors.accent}>{APP_NAME}</Txt>
      <Txt v="display">Réglages</Txt>
      <Gap h={20} />

      <Section icon="user" title="Toi">
        <Txt v="h3">Prénom</Txt><Gap h={6} />
        <Field icon="user" value={s.firstName} onChangeText={v => update({ firstName: v })} placeholder="Ton prénom" accessibilityLabel="Prénom" />
        <Gap h={14} />
        <Txt v="h3">Ta ville</Txt><Gap h={6} />
        <CityPicker value={s.city} onChange={city => update({ city })} />
      </Section>

      <Section icon="sparkle" title="Formule">
        <TierPicker value={s.tier} onChange={tier => update({ tier })} />
        {status && s.tier !== 'gratuit' ? (
          <>
            <Gap h={10} />
            <Txt v="small" center>Aujourd'hui : {status.usage.journals} journal(aux) IA · {Math.round(status.usage.ttsChars / status.charsPerMinute)} min de voix IA sur {status.tiers[s.tier].aiVoiceMinutesPerDay} · {status.usage.questions} question(s) sur {status.tiers[s.tier].questionsPerDay}</Txt>
          </>
        ) : null}
      </Section>

      <Section icon="voice" title="Ton et voix">
        <StylePicker value={s.style} onChange={style => update({ style, tone: toneOf(style) })} onListen={(style, text) => player.sayOnce(text, { ...s, style })} />
        <Gap h={16} />
        <Txt v="h3">Voix IA</Txt><Gap h={8} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {VOICES.map(v => <Chip key={v.id} label={v.label} on={s.aiVoice === v.id} onPress={() => update({ aiVoice: v.id })} />)}
        </View>
        <Gap h={16} />
        <Txt v="h3">Vitesse de lecture</Txt><Gap h={6} />
        <Stepper label="la vitesse" value={`× ${s.rate.toFixed(1).replace('.', ',')}`} onMinus={() => update({ rate: Math.max(0.7, Math.round((s.rate - 0.1) * 10) / 10) })} onPlus={() => update({ rate: Math.min(1.5, Math.round((s.rate + 0.1) * 10) / 10) })} />
        <Gap h={16} />
        <Txt v="h3">Voix du téléphone (de secours)</Txt>
        <Txt v="small">Utilisée en formule gratuite ou quand la voix IA du jour est épuisée.</Txt>
        <Gap h={8} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip small label="Par défaut" on={!s.voiceId} onPress={() => update({ voiceId: undefined })} />
          {voices.slice(0, 10).map((v, i) => <Chip small key={v.id} label={`Voix ${i + 1}${v.quality === 'Enhanced' ? ' ★' : ''}`} on={s.voiceId === v.id} onPress={() => update({ voiceId: v.id })} />)}
        </View>
        <Gap h={10} />
        <Btn small kind="secondary" icon="play" label="Tester la voix" onPress={() => player.sayOnce(`Bonjour ${s.firstName}. Voici à quoi ressemble ma voix.`, s)} />
      </Section>

      <Section icon="clock" title="Durée et bien-être">
        <DurationPicker value={s.minutes} onChange={m => update({ minutes: m, length: m <= 4 ? 'flash' : 'complet' })} />
        <Gap h={18} />
        <Txt v="h3">Avant les infos</Txt><Gap h={8} />
        <Segmented value={s.wellbeing} onChange={wellbeing => update({ wellbeing })} options={[{ v: 'aucun', label: 'Rien' }, { v: 'respiration', label: 'Respiration' }, { v: 'pensee', label: 'Pensée positive' }]} />
      </Section>

      <Section icon="actu_france" title="Au programme">
        <Txt v="small">★ = prioritaire (passe en premier et plus en détail). Les flèches changent l'ordre.</Txt>
        <Gap h={6} />
        {s.rubriques.map(id => {
          if (id === 'libre') {
            return (
              <View key="libre" style={{ borderTopWidth: 1, borderColor: t.colors.border, paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="veille" size={18} color={t.colors.accent} />
                  <Txt v="h3" style={{ flex: 1 }}>Tes sujets ({s.topics.length})</Txt>
                  <Arrows onUp={() => move('libre', -1)} onDown={() => move('libre', 1)} label="tes sujets" />
                </View>
                {s.topics.map(x => (
                  <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 26, paddingVertical: 4 }}>
                    <Txt style={{ flex: 1 }}>{x.icon ?? '🔎'} {x.label}</Txt>
                    <IconBtn size={36} name={s.priorities.includes(`veille:${x.id}`) ? 'starFill' : 'star'} color={t.colors.accent2} label={`Prioritaire : ${x.label}`} onPress={() => togglePrio(`veille:${x.id}`)} />
                    <IconBtn size={36} name="trash" label={`Retirer ${x.label}`} onPress={() => { const topics = s.topics.filter(y => y.id !== x.id); update({ topics, rubriques: topics.length ? s.rubriques : s.rubriques.filter(r => r !== 'libre') }); }} />
                  </View>
                ))}
              </View>
            );
          }
          const m = rubriqueMeta(id);
          return (
            <View key={id} style={{ borderTopWidth: 1, borderColor: t.colors.border, paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={id} size={18} color={t.colors.accent} />
                <View style={{ flex: 1 }}>
                  <Txt v="h3">{m.label}</Txt>
                  {m.needsCity && !s.city ? <Txt v="small">Choisis d'abord ta ville</Txt> : null}
                </View>
                <IconBtn size={36} name={s.priorities.includes(id) ? 'starFill' : 'star'} color={t.colors.accent2} label={`Prioritaire : ${m.label}`} onPress={() => togglePrio(id)} />
                <Arrows onUp={() => move(id, -1)} onDown={() => move(id, 1)} label={m.label} />
                <IconBtn size={36} name="trash" label={`Retirer ${m.label}`} onPress={() => toggleRub(id, false)} />
              </View>
              <RubriqueOptions id={id} s={s} update={update} cryptoNames={cryptoNames} setCryptoNames={n => { setCryptoNames(n); saveCryptoNames(n); }} />
            </View>
          );
        })}
        <Gap h={10} />
        <Btn kind={showCatalogue ? 'secondary' : 'primary'} icon={showCatalogue ? 'up' : 'plus'} label={showCatalogue ? 'Fermer le catalogue' : 'Ajouter des centres d\'intérêt'} onPress={() => setShowCatalogue(!showCatalogue)} full />
        {showCatalogue ? (
          <View style={{ marginTop: 16 }}>
            <InterestsPicker selected={selected} custom={custom} onToggle={toggleInterest}
              onAddCustom={label => { const topics = [...s.topics, { id: `perso-${Date.now()}`, label, query: label, icon: '🔎' }]; update({ topics, rubriques: withLibre(s.rubriques, topics.length) }); }}
              onRemoveCustom={id => { const topics = s.topics.filter(x => x.id !== id); update({ topics }); }} />
          </View>
        ) : null}
      </Section>

      <Section icon="sport" title="Sport">
        <FollowPicker follows={s.follows} onChange={follows => update({ follows, rubriques: follows.length && !s.rubriques.includes('sport') ? insertBeforeEnd(s.rubriques, 'sport') : s.rubriques })} />
      </Section>

      {s.dislikes.length ? (
        <Section icon="thumbDown" title="Sujets écartés">
          <Txt v="small">Ce que tu as passé ou marqué « pas intéressé ». Touche pour le réintégrer.</Txt>
          <Gap h={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {s.dislikes.map(d => <Chip key={d} small label={`${d}  ✕`} on={false} onPress={() => update({ dislikes: s.dislikes.filter(x => x !== d) })} />)}
          </View>
        </Section>
      ) : null}

      <Section icon="bell" title="Notification du matin">
        <Toggle label="Me prévenir quand mon journal est prêt" hint={notifMsg || 'L\'autorisation est demandée seulement si tu l\'actives.'} value={s.notify.enabled} onChange={v => setNotify(v)} />
        <Gap h={6} />
        <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
          <Stepper label="l'heure" value={`${s.notify.hour} h`} onMinus={() => changeTime((s.notify.hour + 23) % 24, s.notify.minute)} onPlus={() => changeTime((s.notify.hour + 1) % 24, s.notify.minute)} />
          <Stepper label="les minutes" value={pad2(s.notify.minute)} onMinus={() => changeTime(s.notify.hour, (s.notify.minute + 55) % 60)} onPlus={() => changeTime(s.notify.hour, (s.notify.minute + 5) % 60)} />
        </View>
      </Section>

      <Section icon="palette" title="Apparence">
        <ThemePicker value={s.theme} onChange={(id: ThemeId) => update({ theme: id })} />
        <Gap h={10} />
        <Btn small kind="secondary" label="Appliquer le ton assorti à ce thème" onPress={() => update({ style: THEMES[s.theme].defaults.style, tone: toneOf(THEMES[s.theme].defaults.style), wellbeing: THEMES[s.theme].defaults.wellbeing })} />
      </Section>

      <Section icon="shield" title="Confidentialité">
        <Txt v="small">Tes réglages et tes goûts restent sur ton téléphone. Pour préparer le journal, l'application lit des sources publiques gratuites (Open-Meteo, flux des journaux, Google Actualités, CoinGecko, Yahoo Finance, Deezer, TheSportsDB, Wikipédia, Nominis, prix-carburants.gouv.fr).</Txt>
        <Gap h={8} />
        <Txt v="small">Avec une formule IA, les titres et résumés récupérés, ton prénom, ta ville et tes questions sont envoyés à notre serveur, qui les transmet à l'IA (Anthropic) et à la voix (OpenAI) uniquement pour fabriquer ton journal. Rien n'est conservé, à part un compteur d'utilisation du jour.</Txt>
      </Section>

      <Section icon="settings" title="À propos">
        <Txt v="small">{APP_NAME} · version de test {APP_VERSION}</Txt>
        <Gap h={10} />
        <Btn small kind="secondary" icon="trash" label="Tout réinitialiser" onPress={() => {
          const go = async () => { await disableDaily(); await resetAll(); onReset(); };
          if (Platform.OS === 'web') go();
          else Alert.alert('Tout réinitialiser ?', 'Tes réglages et tes goûts seront effacés.', [{ text: 'Annuler', style: 'cancel' }, { text: 'Réinitialiser', style: 'destructive', onPress: go }]);
        }} />
      </Section>
    </Screen>
  );
}

function insertBeforeEnd(rubs: RubriqueId[], id: RubriqueId): RubriqueId[] {
  if (rubs.includes(id)) return rubs;
  const end = rubs.indexOf('bonne_nouvelle');
  return end >= 0 ? [...rubs.slice(0, end), id, ...rubs.slice(end)] : [...rubs, id];
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name={icon} size={18} color={t.colors.accent} />
        <Txt v="h2">{title}</Txt>
      </View>
      <Card>{children}</Card>
    </View>
  );
}

function Arrows({ onUp, onDown, label }: { onUp: () => void; onDown: () => void; label: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <IconBtn size={36} name="up" label={`Monter ${label}`} onPress={onUp} />
      <IconBtn size={36} name="down" label={`Descendre ${label}`} onPress={onDown} />
    </View>
  );
}

function RubriqueOptions({ id, s, update, cryptoNames, setCryptoNames }: {
  id: RubriqueId; s: Settings; update: (p: Partial<Settings>) => void; cryptoNames: Record<string, string>; setCryptoNames: (n: Record<string, string>) => void;
}) {
  const wrap = (c: React.ReactNode) => <View style={{ paddingTop: 8, paddingBottom: 6, paddingLeft: 26 }}>{c}</View>;
  switch (id) {
    case 'horoscope':
      return wrap(<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{SIGNES.map(g => <Chip small key={g} label={g} on={s.sign === g} onPress={() => update({ sign: g })} />)}</View>);
    case 'mot':
      return wrap(<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{Object.keys(LANGUES).map(l => <Chip small key={l} label={l.charAt(0).toUpperCase() + l.slice(1)} on={s.language === l} onPress={() => update({ language: l as Settings['language'] })} />)}</View>);
    case 'musique':
      return wrap(<SearchAdd placeholder="Ajouter un artiste" search={searchArtist} items={s.artists} keyOf={a => String(a.id)} label={a => a.name} sub={(a: any) => a.fans ? `${a.fans.toLocaleString('fr-FR')} fans sur Deezer` : ''} onAdd={(a: any) => update({ artists: [...s.artists, { id: a.id, name: a.name }] })} onRemove={a => update({ artists: s.artists.filter(x => x.id !== a.id) })} />);
    case 'crypto':
      return wrap(<SearchAdd placeholder="Ajouter une crypto" search={searchCrypto} items={s.cryptos.map(c => ({ id: c, name: cryptoNames[c] || c, symbol: '' }))} keyOf={a => a.id} label={a => a.name} sub={a => a.symbol?.toUpperCase()} onAdd={a => { setCryptoNames({ ...cryptoNames, [a.id]: a.name }); update({ cryptos: [...s.cryptos, a.id] }); }} onRemove={a => update({ cryptos: s.cryptos.filter(x => x !== a.id) })} />);
    case 'bourse':
      return wrap(<SearchAdd placeholder="Ajouter une action ou un indice" search={searchStock} items={s.stocks} keyOf={a => a.symbol} label={a => a.name} sub={(a: any) => `${a.symbol}${a.place ? ' · ' + a.place : ''}`} onAdd={a => update({ stocks: [...s.stocks, { symbol: a.symbol, name: a.name }] })} onRemove={a => update({ stocks: s.stocks.filter(x => x.symbol !== a.symbol) })} />);
    case 'trafic': {
      const c = s.commute ?? { from: '', to: '', mode: 'driving' as const };
      return wrap(
        <View style={{ gap: 8 }}>
          <Field icon="pin" value={c.from} onChangeText={v => update({ commute: { ...c, from: v } })} placeholder="Départ (adresse ou ville)" accessibilityLabel="Départ" />
          <Field icon="pin" value={c.to} onChangeText={v => update({ commute: { ...c, to: v } })} placeholder="Arrivée (travail…)" accessibilityLabel="Arrivée" />
          <Segmented value={c.mode} onChange={mode => update({ commute: { ...c, mode } })} options={[{ v: 'driving', label: 'Voiture' }, { v: 'transit', label: 'Transports' }, { v: 'bicycling', label: 'Vélo' }, { v: 'walking', label: 'À pied' }]} />
        </View>);
    }
    case 'carburant':
      return wrap(<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{(['gazole', 'sp95', 'e10', 'sp98', 'gplc', 'e85'] as const).map(f => <Chip small key={f} label={{ gazole: 'Gazole', sp95: 'SP95', e10: 'E10', sp98: 'SP98', gplc: 'GPL', e85: 'E85' }[f]} on={s.fuel === f} onPress={() => update({ fuel: f })} />)}</View>);
    default:
      return null;
  }
}
