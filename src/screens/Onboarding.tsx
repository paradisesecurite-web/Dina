import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Settings, ThemeId, Topic } from '../types';
import { APP_NAME } from '../config';
import { GOALS, propose } from '../journal/proposal';
import { rubriqueMeta } from '../journal/rubriques';
import { ALL_INTERESTS } from '../data/catalogue';
import { Btn, Card, Chip, Field, Gap, Toggle, Txt } from '../ui/kit';
import { Screen } from '../ui/Screen';
import { THEMES, useTheme } from '../ui/theme';
import { CityPicker } from '../ui/CityPicker';
import { InterestsPicker } from '../ui/InterestsPicker';
import { FollowPicker } from '../ui/FollowPicker';
import { DurationPicker, StylePicker, ThemePicker, TierPicker, VOICES } from '../ui/Pickers';
import { enableDaily } from '../services/notify';
import { player, toneOf } from '../services/player';
import { Icon } from '../ui/icons';

const pad2 = (n: number) => String(n).padStart(2, '0');
const SPORTY = ['sport', 'foot', 'rugby', 'tennis', 'basket', 'f1', 'moto', 'cyclisme', 'mma', 'boxe', 'handball', 'golf', 'voile', 'equitation', 'ski', 'athle', 'esport'];

export function Onboarding({ initial, onDone, onPreviewTheme }: { initial: Settings; onDone: (s: Settings) => void; onPreviewTheme: (t: ThemeId) => void }) {
  const t = useTheme();
  const [s, setS] = useState<Settings>(initial);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [custom, setCustom] = useState<Topic[]>([]);
  const [notifMsg, setNotifMsg] = useState('');
  const up = (p: Partial<Settings>) => setS(x => ({ ...x, ...p }));
  const wantsSport = interests.some(i => SPORTY.includes(i));
  const steps = ['bienvenue', 'prenom', 'attentes', 'duree', 'interets', ...(wantsSport ? ['sport'] : []), 'ville', 'ton', 'formule', 'proposition'] as const;
  const cur = steps[Math.min(step, steps.length - 1)];
  const prop = useMemo(() => propose(s.goals, interests, custom), [s.goals, interests, custom]);

  const goNext = () => {
    const nextStep = steps[step + 1];
    if (nextStep === 'proposition') {
      const sportOn = wantsSport || s.follows.length > 0;
      up({ theme: prop.theme, rubriques: sportOn && !prop.rubriques.includes('sport') ? [...prop.rubriques.slice(0, -2), 'sport', ...prop.rubriques.slice(-2)] : prop.rubriques, topics: prop.topics.filter(x => !SPORTY.includes(x.id) || !s.follows.length), wellbeing: prop.wellbeing });
      onPreviewTheme(prop.theme);
    }
    if (nextStep === 'ton') up({ style: prop.style, tone: prop.tone });
    setStep(step + 1);
  };
  const canNext: Record<string, boolean> = { prenom: s.firstName.trim().length > 0, attentes: s.goals.length > 0, interets: interests.length + custom.length > 0 };
  const listen = (style: Settings['style'], text: string) => player.sayOnce(text, { ...s, style }, undefined);

  const footer = (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {step > 0 ? <Btn kind="secondary" label="Retour" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
      {cur !== 'proposition'
        ? <Btn label={cur === 'bienvenue' ? 'Commencer' : cur === 'ville' && !s.city ? 'Passer' : 'Continuer'} onPress={goNext} disabled={canNext[cur] === false} style={{ flex: 2 }} />
        : <Btn label="C'est parti !" icon="sparkle" onPress={() => { player.stop(); onDone({ ...s, onboarded: true }); }} style={{ flex: 2 }} />}
    </View>
  );

  return (
    <Screen footer={footer}>
      <View style={{ flexDirection: 'row', gap: 5 }} accessibilityLabel={`Étape ${step + 1} sur ${steps.length}`}>
        {steps.map((_, i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i <= step ? t.colors.accent : t.colors.border }} />)}
      </View>
      <Gap h={22} />
      {cur === 'bienvenue' && (
        <View>
          <Txt v="label" color={t.colors.accent}>Bienvenue</Txt>
          <Gap h={6} />
          <Txt v="display">Ton journal du matin, sur mesure.</Txt>
          <Gap h={14} />
          <Txt v="lead">{APP_NAME} fait la veille pour toi pendant la nuit, puis te raconte l'essentiel comme une radio rien que pour toi. Tu peux l'écouter, le lire… et même lui poser des questions.</Txt>
          <Gap h={20} />
          <Card>
            {[['clock', 'Une minute pour répondre à quelques questions'], ['sparkle', 'Une proposition de journal faite pour toi'], ['settings', 'Tout reste modifiable ensuite']].map(([i, l]) => (
              <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                <Icon name={i} size={20} color={t.colors.accent} /><Txt style={{ flex: 1 }}>{l}</Txt>
              </View>
            ))}
          </Card>
        </View>
      )}
      {cur === 'prenom' && (
        <View>
          <Txt v="title">Comment tu t'appelles ?</Txt>
          <Gap h={6} /><Txt v="small">Pour te dire bonjour chaque matin.</Txt><Gap h={14} />
          <Field icon="user" value={s.firstName} onChangeText={v => up({ firstName: v })} placeholder="Ton prénom" autoFocus autoCapitalize="words" accessibilityLabel="Prénom" returnKeyType="next" onSubmitEditing={() => s.firstName.trim() && goNext()} />
        </View>
      )}
      {cur === 'attentes' && (
        <View>
          <Txt v="title">Qu'attends-tu de ton journal ?</Txt>
          <Gap h={6} /><Txt v="small">Plusieurs réponses possibles.</Txt><Gap h={14} />
          <View style={{ gap: 10 }}>
            {GOALS.map(g => <Chip key={g.id} label={g.label} on={s.goals.includes(g.id)} onPress={() => up({ goals: s.goals.includes(g.id) ? s.goals.filter(x => x !== g.id) : [...s.goals, g.id] })} />)}
          </View>
        </View>
      )}
      {cur === 'duree' && (
        <View>
          <Txt v="title">Quelle durée pour ton journal ?</Txt>
          <Gap h={6} /><Txt v="small">Fais glisser le curseur. Tu pourras changer ça à tout moment.</Txt><Gap h={22} />
          <DurationPicker value={s.minutes} onChange={m => up({ minutes: m, length: m <= 4 ? 'flash' : 'complet' })} />
        </View>
      )}
      {cur === 'interets' && (
        <View>
          <Txt v="title">Qu'est-ce qui t'intéresse ?</Txt>
          <Gap h={6} /><Txt v="small">Choisis autant de sujets que tu veux, ou ajoute les tiens.</Txt><Gap h={14} />
          <InterestsPicker selected={interests} custom={custom}
            onToggle={id => setInterests(interests.includes(id) ? interests.filter(x => x !== id) : [...interests, id])}
            onAddCustom={label => setCustom([...custom, { id: `perso-${Date.now()}`, label, query: label, icon: '🔎' }])}
            onRemoveCustom={id => setCustom(custom.filter(c => c.id !== id))} />
        </View>
      )}
      {cur === 'sport' && (
        <View>
          <Txt v="title">Qui suis-tu en sport ?</Txt>
          <Gap h={6} /><Txt v="small">Équipes de tous les sports, joueurs, pilotes, compétitions… Tape un nom ou un sigle (PSG, OM, Lakers).</Txt><Gap h={14} />
          <FollowPicker follows={s.follows} onChange={follows => up({ follows })} />
        </View>
      )}
      {cur === 'ville' && (
        <View>
          <Txt v="title">Où habites-tu ?</Txt>
          <Gap h={6} /><Txt v="small">Pour la météo, les sorties et le carburant près de chez toi. N'importe quelle ville.</Txt><Gap h={14} />
          <CityPicker value={s.city} onChange={city => up({ city })} />
        </View>
      )}
      {cur === 'ton' && (
        <View>
          <Txt v="title">Quel ton te plaît ?</Txt>
          <Gap h={6} /><Txt v="small">C'est la façon dont ton journal te parle. Touche ▶ pour écouter.</Txt><Gap h={14} />
          <StylePicker value={s.style} onChange={style => up({ style, tone: toneOf(style) })} onListen={listen} />
          <Gap h={18} />
          <Txt v="label">Voix IA</Txt><Gap h={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VOICES.map(v => <Chip key={v.id} label={v.label} on={s.aiVoice === v.id} onPress={() => up({ aiVoice: v.id })} />)}
          </View>
        </View>
      )}
      {cur === 'formule' && (
        <View>
          <Txt v="title">Choisis ta formule</Txt>
          <Gap h={6} /><Txt v="small">Elle décide de la qualité des résumés et de la voix.</Txt><Gap h={14} />
          <TierPicker value={s.tier} onChange={tier => up({ tier })} />
        </View>
      )}
      {cur === 'proposition' && (
        <View>
          <Txt v="label" color={t.colors.accent}>Ma proposition</Txt>
          <Gap h={4} />
          <Txt v="title">Ton journal, {s.firstName.trim()}</Txt>
          <Gap h={8} /><Txt>{prop.why}</Txt><Gap h={18} />
          <Txt v="label">Apparence (touche pour essayer)</Txt><Gap h={8} />
          <ThemePicker value={s.theme} onChange={id => { up({ theme: id, wellbeing: THEMES[id].defaults.wellbeing }); onPreviewTheme(id); }} />
          <Gap h={18} />
          <Txt v="label">Au programme · environ {s.minutes} min</Txt><Gap h={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {s.rubriques.filter(r => r !== 'libre' && (s.city || !rubriqueMeta(r).needsCity)).map(r => <Chip key={r} small label={rubriqueMeta(r).label} on onPress={() => up({ rubriques: s.rubriques.filter(x => x !== r) })} />)}
            {s.topics.map(x => <Chip key={x.id} small label={x.label} on onPress={() => up({ topics: s.topics.filter(y => y.id !== x.id) })} />)}
            {s.follows.map(f => <Chip key={f.name} small label={f.name} on onPress={() => up({ follows: s.follows.filter(y => y.name !== f.name) })} />)}
          </View>
          <Gap h={6} /><Txt v="small">Touche un élément pour le retirer. Tout se règle ensuite dans les réglages.</Txt>
          <Gap h={14} />
          <Card>
            <Toggle icon="bell" label={`Me prévenir à ${s.notify.hour} h ${pad2(s.notify.minute)}`} hint={notifMsg || 'Une notification quand ton journal est prêt (heure modifiable).'} value={s.notify.enabled}
              onChange={async v => {
                if (!v) { up({ notify: { ...s.notify, enabled: false } }); return; }
                const ok = await enableDaily(s.notify.hour, s.notify.minute);
                setNotifMsg(ok ? 'C\'est noté !' : 'Autorisation refusée : tu pourras l\'activer plus tard dans les réglages.');
                up({ notify: { ...s.notify, enabled: ok } });
              }} />
          </Card>
        </View>
      )}
    </Screen>
  );
}
