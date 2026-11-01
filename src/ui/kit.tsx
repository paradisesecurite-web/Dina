import React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type TextStyle, type ViewStyle, type TextInputProps } from 'react-native';
import { useTheme } from './theme';

type TxtProps = { children: React.ReactNode; v?: 'title' | 'h2' | 'h3' | 'body' | 'small' | 'label'; color?: string; style?: TextStyle | TextStyle[]; center?: boolean; numberOfLines?: number; onPress?: () => void };
export function Txt({ children, v = 'body', color, style, center, numberOfLines, onPress }: TxtProps) {
  const t = useTheme();
  const base: TextStyle = {
    title: { fontFamily: t.fonts.title, fontSize: t.id === 'futur' ? 24 : 30, lineHeight: t.id === 'futur' ? 32 : 36, letterSpacing: t.id === 'futur' ? 2 : 0 },
    h2: { fontFamily: t.fonts.title, fontSize: t.id === 'futur' ? 15 : 21, lineHeight: t.id === 'futur' ? 22 : 27, letterSpacing: t.id === 'futur' ? 1.5 : 0 },
    h3: { fontFamily: t.fonts.uiBold, fontSize: 17, lineHeight: 23 },
    body: { fontFamily: t.fonts.body, fontSize: t.id === 'futur' ? 17 : 16, lineHeight: 23 },
    small: { fontFamily: t.fonts.body, fontSize: 13.5, lineHeight: 19 },
    label: { fontFamily: t.fonts.uiBold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  }[v] as TextStyle;
  const upper = t.upper && (v === 'title' || v === 'h2');
  return (
    <Text onPress={onPress} numberOfLines={numberOfLines} style={[base, { color: color ?? (v === 'small' || v === 'label' ? t.colors.muted : t.colors.ink) }, upper && { textTransform: 'uppercase' }, center && { textAlign: 'center' }, style as any]}>
      {children}
    </Text>
  );
}

export function Btn({ label, onPress, kind = 'primary', icon, disabled, style, small }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'ghost'; icon?: string; disabled?: boolean; style?: ViewStyle; small?: boolean }) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.colors.accent : 'transparent';
  const fg = kind === 'primary' ? t.colors.onAccent : t.colors.accent;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{
        backgroundColor: bg, borderColor: t.colors.accent, borderWidth: kind === 'ghost' ? 0 : 1.2, borderRadius: t.id === 'zen' ? 999 : t.radius,
        paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 14 : 20, minHeight: small ? 38 : 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      }, t.id === 'futur' && kind === 'primary' && { shadowColor: t.colors.accent, shadowOpacity: 0.7, shadowRadius: 12, elevation: 6 }, style]}>
      {icon ? <Text style={{ fontSize: small ? 15 : 17, color: fg }}>{icon}</Text> : null}
      <Text style={{ color: fg, fontFamily: t.fonts.uiBold, fontSize: small ? 14 : 16, letterSpacing: t.id === 'futur' ? 1.5 : 0.3, textTransform: t.id === 'futur' ? 'uppercase' : 'none' }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.colors.card, borderColor: t.colors.border, borderWidth: t.id === 'pro' ? StyleSheet.hairlineWidth * 2 : 1, borderRadius: t.radius, padding: 16 }, t.id === 'zen' && { shadowColor: '#5E8B67', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, style as any]}>
      {t.id === 'futur' ? <HudCorners /> : null}
      {children}
    </View>
  );
}

export function HudCorners() {
  const t = useTheme();
  const c = { position: 'absolute' as const, width: 12, height: 12, borderColor: t.colors.accent };
  return (
    <>
      <View pointerEvents="none" style={[c, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      <View pointerEvents="none" style={[c, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 }]} />
      <View pointerEvents="none" style={[c, { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
      <View pointerEvents="none" style={[c, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 }]} />
    </>
  );
}

export function Chip({ label, on, onPress, icon }: { label: string; on: boolean; onPress: () => void; icon?: string }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: t.id === 'zen' ? 999 : t.radius + 2, borderWidth: 1.2, borderColor: on ? t.colors.accent : t.colors.border, backgroundColor: on ? t.colors.accent : t.dark ? 'transparent' : t.colors.card, opacity: pressed ? 0.7 : 1 })}>
      {icon ? <Text style={{ fontSize: 15 }}>{icon}</Text> : null}
      <Text style={{ color: on ? t.colors.onAccent : t.colors.ink, fontFamily: t.fonts.ui, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  const t = useTheme();
  return <TextInput placeholderTextColor={t.colors.muted} {...props}
    style={[{ borderWidth: 1.2, borderColor: t.colors.border, borderRadius: t.id === 'zen' ? 16 : t.radius, paddingHorizontal: 14, paddingVertical: 12, color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 17, backgroundColor: t.dark ? 'rgba(0,229,255,0.04)' : t.colors.card }, props.style as any]} />;
}

export function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Txt v="h3">{label}</Txt>
        {hint ? <Txt v="small">{hint}</Txt> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: t.colors.accent, false: t.colors.border }} thumbColor={t.dark ? t.colors.ink : '#fff'} />
    </Pressable>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1.2, borderColor: t.colors.border, borderRadius: t.id === 'zen' ? 999 : t.radius + 2, overflow: 'hidden' }}>
      {options.map(o => (
        <Pressable key={o.v} onPress={() => onChange(o.v)} accessibilityRole="button" accessibilityState={{ selected: value === o.v }}
          style={{ flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: value === o.v ? t.colors.accent : 'transparent' }}>
          <Text style={{ color: value === o.v ? t.colors.onAccent : t.colors.ink, fontFamily: t.fonts.ui, fontSize: 15 }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Stepper({ value, onMinus, onPlus, label }: { value: string; onMinus: () => void; onPlus: () => void; label?: string }) {
  const t = useTheme();
  const b = (txt: string, f: () => void, a11y: string) => (
    <Pressable onPress={f} accessibilityLabel={a11y} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, borderWidth: 1.2, borderColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ color: t.colors.accent, fontSize: 22, fontFamily: t.fonts.uiBold }}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      {b('−', onMinus, `Diminuer ${label ?? ''}`)}
      <Text style={{ minWidth: 70, textAlign: 'center', color: t.colors.ink, fontFamily: t.fonts.title, fontSize: 24 }}>{value}</Text>
      {b('+', onPlus, `Augmenter ${label ?? ''}`)}
    </View>
  );
}

export const Gap = ({ h = 12 }: { h?: number }) => <View style={{ height: h }} />;
