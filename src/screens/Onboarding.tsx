import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Settings, ThemeId } from '../types';
import { APP_NAME } from '../config';
import { GOALS, INTERESTS, propose } from '../journal/proposal';
import { rubriqueMeta } from '../journal/rubriques';
import { Btn, Card, Chip, Field, Gap, Segmented, Stepper, Toggle, Txt } from '../ui/kit';
import { Screen } from '../ui/Screen';
import { THEMES, ThemeProvider, useTheme } from '../ui/theme';
import { CityPicker } from '../ui/CityPicker';
import { enableDaily } from '../services/notify';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function Onboarding({ initial, onDone, onPreviewTheme }: { initial: Settings; onDone: (s: Settings) => void; onPreviewTheme: (t: ThemeId) => void }) {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<Settings>(initial);
  const [interests, setInterests] = useState<string[]>([]);
  const [notifMsg, setNotifMsg] = useState('');
  const up = (p: Partial<Settings>) => setS(x => ({ ...x, ...p }));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const prop = useMemo(() => propose(s.goals, interests, s.length), [s.goals, interests, s.length]);
  const STEPS = 7;

  const goProposal = () => {
    const p = propose(s.goals, interests, s.length);
    up({ theme: p.theme, tone: p.tone, rubriques: p.rubriques, wellbeing: p.wellbeing });
    onPreviewTheme(p.theme);
    setStep(6);
  };
  const next = () => (step === 5 ? goProposal() : setStep(step + 1));
  const canNext = [true, s.firstName.trim().length > 0, s.goals.length > 0, true, interests.length > 0, true, true][step];

  const footer = (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {step > 0 ? <Btn kind="secondary" label="Retour" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
      {step < 6
        ? <Btn label={step === 0 ? 'Commencer' : step === 5 && !s.city ? 'Passer' : 'Continuer'} onPress={next} disabled={!canNext} style={{ flex: 2 }} />
        : <Btn label="C'est parti !" onPress={() => onDone({ ...s, onboarded: true })} style={{ flex: 2 }} />}
    </View>
  );

  return (
    <Screen footer={footer}>
      <Progress step={step} total={STEPS} />
      <Gap h={18} />
      {step === 0 && (
        <View>
          <Txt v="title">Bonjour ☀️</Txt>
          <Gap />
          <Txt>{APP_NAME} prépare chaque matin un journal rien que pour toi : météo, actualités, tes passions, une bonne nouvelle… À lire ou à écouter.</Txt>
          <Gap />
          <Txt>Réponds à quelques questions (une minute) et je te proposerai un journal sur mesure. Tu pourras tout changer ensuite.</Txt>
          <Gap h={20} />
          <Card><Txt v="small">🔒 Tout reste sur ton téléphone. Pas de compte, pas de publicité, rien à payer.</Txt></Card>
        </View>
      )}
      {step === 1 && (
        <View>
          <Txt v="h2">Comment tu t'appelles ?</Txt>
          <Gap />
          <Txt v="small">Pour te dire bonjour chaque matin.</Txt>
          <Gap />
          <Field value={s.firstName} onChangeText={v => up({ firstName: v })} placeholder="Ton prénom" autoFocus autoCapitalize="words" accessibilityLabel="Prénom" returnKeyType="next" onSubmitEditing={() => s.firstName.trim() && next()} />
        </View>
      )}
      {step === 2 && (
        <View>
          <Txt v="h2">Qu'attends-tu de ton journal ?</Txt>
          <Gap />
          <Txt v="small">Plusieurs réponses possibles.</Txt>
          <Gap />
          <View style={{ gap: 10 }}>
            {GOALS.map(g => <Chip key={g.id} label={g.label} on={s.goals.includes(g.id)} onPress={() => up({ goals: toggle(s.goals, g.id) })} />)}
          </View>
        </View>
      )}
      {step === 3 && (
        <View>
          <Txt v="h2">Ton rythme le matin ?</Txt>
          <Gap />
          <Segmented value={s.length} onChange={v => up({ length: v })} options={[{ v: 'flash', label: 'Flash (~2 min)' }, { v: 'complet', label: 'Complet (~10 min)' }]} />
          <Gap />
          <Txt v="small">{s.length === 'flash' ? 'L\'essentiel, vite fait, pour les matins pressés.' : 'Plus d\'infos, pour ceux qui prennent leur temps.'}</Txt>
          <Gap h={24} />
          <Txt v="h3">À quelle heure veux-tu ton journal ?</Txt>
          <Gap />
          <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
            <Stepper label="l'heure" value={`${s.notify.hour} h`} onMinus={() => up({ notify: { ...s.notify, hour: (s.notify.hour + 23) % 24 } })} onPlus={() => up({ notify: { ...s.notify, hour: (s.notify.hour + 1) % 24 } })} />
            <Stepper label="les minutes" value={pad2(s.notify.minute)} onMinus={() => up({ notify: { ...s.notify, minute: (s.notify.minute + 55) % 60 } })} onPlus={() => up({ notify: { ...s.notify, minute: (s.notify.minute + 5) % 60 } })} />
          </View>
        </View>
      )}
      {step === 4 && (
        <View>
          <Txt v="h2">Qu'est-ce qui t'intéresse ?</Txt>
          <Gap />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {INTERESTS.map(i => <Chip key={i.id} icon={i.icon} label={i.label} on={interests.includes(i.id)} onPress={() => setInterests(toggle(interests, i.id))} />)}
          </View>
        </View>
      )}
      {step === 5 && (
        <View>
          <Txt v="h2">Où habites-tu ?</Txt>
          <Gap />
          <Txt v="small">Pour la météo, les sorties et le carburant près de chez toi. N'importe quelle ville.</Txt>
          <Gap />
          <CityPicker value={s.city} onChange={city => up({ city })} />
        </View>
      )}
      {step === 6 && (
        <View>
          <Txt v="h2">Ma proposition pour toi, {s.firstName.trim()}</Txt>
          <Gap />
          <Txt>{prop.why}</Txt>
          <Gap h={18} />
          <Txt v="label">Thème (touche pour essayer)</Txt>
          <Gap h={8} />
          <ThemePicker value={s.theme} onChange={id => { up({ theme: id, tone: THEMES[id].defaults.tone, wellbeing: THEMES[id].defaults.wellbeing }); onPreviewTheme(id); }} />
          <Gap h={18} />
          <Txt v="label">Tes rubriques</Txt>
          <Gap h={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {s.rubriques.filter(r => s.city || !rubriqueMeta(r).needsCity).map(r => <Chip key={r} icon={rubriqueMeta(r).icon} label={rubriqueMeta(r).label} on onPress={() => up({ rubriques: s.rubriques.filter(x => x !== r) })} />)}
          </View>
          <Gap h={6} />
          <Txt v="small">Touche une rubrique pour la retirer. Tu en ajouteras d'autres dans les réglages.</Txt>
          <Gap h={18} />
          <Txt v="label">Ambiance</Txt>
          <Gap h={4} />
          <Txt v="small">Voix {s.tone === 'calme' ? 'calme et posée' : s.tone === 'assistant' ? 'd\'assistant IA' : 'de journaliste'} · {s.wellbeing === 'respiration' ? 'une minute de respiration avant les infos' : s.wellbeing === 'pensee' ? 'une pensée positive avant les infos' : 'droit aux infos'} · son de réveil « {THEMES[s.theme].defaults.sound} » (bientôt)</Txt>
          <Gap h={14} />
          <Toggle label={`Me prévenir à ${s.notify.hour} h ${pad2(s.notify.minute)}`} hint={notifMsg || 'Une notification quand ton journal est prêt.'} value={s.notify.enabled}
            onChange={async v => {
              if (!v) { up({ notify: { ...s.notify, enabled: false } }); return; }
              const ok = await enableDaily(s.notify.hour, s.notify.minute);
              setNotifMsg(ok ? 'C\'est noté !' : 'Autorisation refusée : tu pourras l\'activer plus tard dans les réglages.');
              up({ notify: { ...s.notify, enabled: ok } });
            }} />
        </View>
      )}
    </Screen>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Étape ${step + 1} sur ${total}`}>
      {Array.from({ length: total }).map((_, i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i <= step ? t.colors.accent : t.colors.border }} />)}
    </View>
  );
}

export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (t: ThemeId) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {(Object.keys(THEMES) as ThemeId[]).map(id => (
        <ThemeProvider key={id} id={id}>
          <ThemeCard id={id} on={value === id} onPress={() => onChange(id)} />
        </ThemeProvider>
      ))}
    </View>
  );
}

function ThemeCard({ id, on, onPress }: { id: ThemeId; on: boolean; onPress: () => void }) {
  const t = THEMES[id];
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }}
      style={{ borderRadius: t.radius + 6, borderWidth: on ? 2.5 : 1, borderColor: on ? t.colors.accent : t.colors.border, backgroundColor: t.colors.bg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: id === 'zen' ? 22 : t.radius, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Txt style={{ fontSize: 20 }}>{id === 'pro' ? '📰' : id === 'futur' ? '◎' : '🌿'}</Txt>
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="h3" color={t.colors.ink} style={{ fontFamily: t.fonts.uiBold }}>{t.name}{on ? '  ✓' : ''}</Txt>
        <Txt v="small" color={t.colors.muted} style={{ fontFamily: t.fonts.body }}>{t.tagline}</Txt>
      </View>
    </Pressable>
  );
}
