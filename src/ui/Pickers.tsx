import React from 'react';
import { Pressable, View } from 'react-native';
import Slider from '@react-native-community/slider';
import type { AiVoice, Style, ThemeId, Tier } from '../types';
import { THEMES, ThemeProvider, useTheme } from './theme';
import { Card, Gap, Txt, tap } from './kit';
import { Icon } from './icons';

// Curseur de durée (2 à 60 minutes, approximatif).
export function DurationPicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const t = useTheme();
  const label = value <= 4 ? 'Flash : l\'essentiel, vite fait' : value <= 12 ? 'Le tour de l\'actu, tranquillement' : value <= 25 ? 'Complet : on prend le temps' : value <= 40 ? 'Grand format : tous tes sujets en détail' : 'Émission : une vraie matinale radio';
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
        <Txt v="display" color={t.colors.accent}>{value}</Txt>
        <Txt v="h3" style={{ marginBottom: 8 }}>min</Txt>
      </View>
      <Txt center v="body">{label}</Txt>
      <Gap h={10} />
      <Slider minimumValue={2} maximumValue={60} step={1} value={value} onValueChange={v => onChange(Math.round(v))} onSlidingComplete={() => tap()}
        minimumTrackTintColor={t.colors.accent} maximumTrackTintColor={t.colors.border} thumbTintColor={t.colors.accent} accessibilityLabel="Durée du journal" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt v="small">2 min</Txt><Txt v="small">30 min</Txt><Txt v="small">1 h</Txt>
      </View>
      <Gap h={8} />
      <Txt v="small" center>Durée approximative : pour {value} min, ton journal peut durer de {Math.max(1, Math.round(value * 0.85))} à {Math.round(value * 1.15)} min selon l'actualité du jour.</Txt>
    </View>
  );
}

export const STYLES: { id: Style; label: string; sample: string }[] = [
  { id: 'chaleureux', label: 'Chaleureux', sample: 'Bonjour ! Installe-toi, le café est chaud : voici ce qu\'il faut savoir ce matin.' },
  { id: 'decale', label: 'Décalé', sample: 'Bonjour ! Pendant que tu cherchais tes chaussettes, le monde a continué de tourner. Résumé.' },
  { id: 'pro', label: 'Pro et carré', sample: 'Bonjour. Voici l\'essentiel de l\'actualité, en quelques minutes.' },
  { id: 'zen', label: 'Zen', sample: 'Bonjour. Prends une grande inspiration… Voici, en douceur, les nouvelles du jour.' },
  { id: 'energique', label: 'Énergique', sample: 'Bonjour bonjour ! On démarre la journée à fond, voici les infos !' },
  { id: 'assistant', label: 'Assistant IA', sample: 'Bonjour. Analyse terminée. Voici ton briefing personnalisé.' },
];

export function StylePicker({ value, onChange, onListen }: { value: Style; onChange: (s: Style) => void; onListen?: (s: Style, text: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {STYLES.map(s => {
        const on = value === s.id;
        return (
          <Pressable key={s.id} onPress={() => { tap(); onChange(s.id); }} accessibilityRole="radio" accessibilityState={{ checked: on }}>
            <Card style={[on && { borderColor: t.colors.accent, borderWidth: 2 }]} pad={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Txt v="h3" color={on ? t.colors.accent : undefined}>{s.label}</Txt>
                  <Txt v="small" style={{ fontStyle: 'italic' }}>« {s.sample} »</Txt>
                </View>
                {onListen ? (
                  <Pressable onPress={() => { onChange(s.id); onListen(s.id, s.sample); }} accessibilityLabel={`Écouter le style ${s.label}`} hitSlop={8}
                    style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="play" size={16} color={t.colors.accent} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

export const VOICES: { id: AiVoice; label: string }[] = [
  { id: 'femme', label: 'Féminine chaleureuse' }, { id: 'homme', label: 'Masculine posée' }, { id: 'douce', label: 'Douce' },
  { id: 'dynamique', label: 'Dynamique' }, { id: 'grave', label: 'Grave' },
];

export const TIER_INFO: { id: Tier; label: string; price: string; points: string[] }[] = [
  { id: 'gratuit', label: 'Gratuite', price: '0 €', points: ['Journal assemblé à partir des titres', 'Voix du téléphone', 'Sans IA'] },
  { id: 'standard', label: 'Standard', price: '≈ 5 € / mois', points: ['Journal raconté par l\'IA Claude Haiku', 'Voix IA naturelle jusqu\'à 10 min / jour', '5 questions par jour'] },
  { id: 'premium', label: 'Premium', price: '≈ 10 € / mois', points: ['Journal raconté par l\'IA Claude Sonnet, plus fine', 'Voix IA naturelle jusqu\'à 15 min / jour', '15 questions par jour'] },
];

export function TierPicker({ value, onChange }: { value: Tier; onChange: (t: Tier) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {TIER_INFO.map(x => {
        const on = value === x.id;
        return (
          <Pressable key={x.id} onPress={() => { tap(); onChange(x.id); }} accessibilityRole="radio" accessibilityState={{ checked: on }}>
            <Card style={[on && { borderColor: t.colors.accent, borderWidth: 2 }]} pad={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Txt v="h3" style={{ flex: 1 }} color={on ? t.colors.accent : undefined}>{x.label}{x.id === 'premium' ? '  ★' : ''}</Txt>
                <Txt v="mono" color={t.colors.accent}>{x.price}</Txt>
              </View>
              <Gap h={6} />
              {x.points.map(p => <Txt key={p} v="small">•  {p}</Txt>)}
            </Card>
          </Pressable>
        );
      })}
      <Txt v="small" center>Pendant la phase de test, c'est offert. Au-delà des limites du jour, la voix du téléphone prend le relais.</Txt>
    </View>
  );
}

export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (t: ThemeId) => void }) {
  return (
    <View style={{ gap: 12 }}>
      {(Object.keys(THEMES) as ThemeId[]).map(id => (
        <ThemeProvider key={id} id={id}><ThemeCard id={id} on={value === id} onPress={() => onChange(id)} /></ThemeProvider>
      ))}
    </View>
  );
}

function ThemeCard({ id, on, onPress }: { id: ThemeId; on: boolean; onPress: () => void }) {
  const t = THEMES[id];
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
      style={{ borderRadius: t.radius + 4, borderWidth: on ? 2.5 : 1, borderColor: on ? t.colors.accent : t.colors.border, backgroundColor: t.colors.bg, padding: 16, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: id === 'zen' ? 26 : id === 'futur' ? 14 : 4, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={id === 'pro' ? 'actu_france' : id === 'futur' ? 'voice' : 'bienetre'} size={26} color={t.colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="h3" color={t.colors.ink} style={{ fontFamily: t.fonts.title, fontSize: id === 'futur' ? 15 : 19, letterSpacing: id === 'futur' ? 2 : 0 }}>{id === 'futur' ? t.name.toUpperCase() : t.name}</Txt>
          <Txt v="small" color={t.colors.muted} style={{ fontFamily: t.fonts.body }}>{t.tagline}</Txt>
        </View>
        {on ? <Icon name="check" size={22} color={t.colors.accent} strokeWidth={2.6} /> : null}
      </View>
    </Pressable>
  );
}
