import React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type TextStyle, type ViewStyle, type TextInputProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from './theme';
import { Icon, type IconName } from './icons';

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };

type V = 'display' | 'title' | 'h2' | 'h3' | 'body' | 'lead' | 'small' | 'label' | 'mono';
type TxtProps = { children: React.ReactNode; v?: V; color?: string; style?: TextStyle | (TextStyle | false | undefined)[]; center?: boolean; numberOfLines?: number; onPress?: () => void; selectable?: boolean };
export function Txt({ children, v = 'body', color, style, center, numberOfLines, onPress, selectable }: TxtProps) {
  const t = useTheme();
  const F = t.id === 'futur';
  const base: Record<V, TextStyle> = {
    display: { fontFamily: t.fonts.display, fontSize: F ? 26 : t.id === 'pro' ? 44 : 34, lineHeight: F ? 34 : t.id === 'pro' ? 48 : 40, letterSpacing: F ? 3 : t.id === 'pro' ? -0.5 : -0.3 },
    title: { fontFamily: t.fonts.title, fontSize: F ? 19 : t.id === 'pro' ? 28 : 26, lineHeight: F ? 26 : t.id === 'pro' ? 33 : 32, letterSpacing: F ? 2 : -0.2 },
    h2: { fontFamily: t.fonts.title, fontSize: F ? 14 : t.id === 'pro' ? 21 : 20, lineHeight: F ? 20 : 26, letterSpacing: F ? 2.2 : 0 },
    h3: { fontFamily: t.fonts.bodyBold, fontSize: F ? 18 : 17, lineHeight: 23 },
    body: { fontFamily: t.fonts.body, fontSize: F ? 17.5 : t.id === 'pro' ? 17 : 16.5, lineHeight: F ? 24 : 25.5 },
    lead: { fontFamily: t.fonts.body, fontSize: F ? 19 : 18.5, lineHeight: F ? 26 : 28.5 },
    small: { fontFamily: t.fonts.ui, fontSize: 13.5, lineHeight: 19 },
    label: { fontFamily: t.fonts.uiBold, fontSize: F ? 11.5 : 11, letterSpacing: F ? 2.4 : 1.6, textTransform: 'uppercase' },
    mono: { fontFamily: t.fonts.mono, fontSize: 14, letterSpacing: F ? 1 : 0.2 },
  };
  const upper = t.upper && (v === 'display' || v === 'title' || v === 'h2');
  return (
    <Text onPress={onPress} selectable={selectable} numberOfLines={numberOfLines}
      style={[base[v], { color: color ?? (v === 'small' || v === 'label' ? t.colors.muted : t.colors.ink) }, upper && { textTransform: 'uppercase' }, center && { textAlign: 'center' }, ...(Array.isArray(style) ? style : [style])] as any}>
      {children}
    </Text>
  );
}

export function Btn({ label, onPress, kind = 'primary', icon, disabled, style, small, full }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'ghost'; icon?: IconName; disabled?: boolean; style?: ViewStyle; small?: boolean; full?: boolean }) {
  const t = useTheme();
  const fg = kind === 'primary' ? t.colors.onAccent : t.colors.accent;
  const radius = t.id === 'zen' ? 999 : t.id === 'futur' ? 12 : 4;
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: small ? 9 : 14, paddingHorizontal: small ? 14 : 22, minHeight: small ? 40 : 52 }}>
      {icon ? <Icon name={icon} size={small ? 16 : 19} color={fg} /> : null}
      {label ? <Text style={{ color: fg, fontFamily: t.fonts.uiBold, fontSize: small ? 14 : 16, letterSpacing: t.id === 'futur' ? 1.6 : 0.2, textTransform: t.id === 'futur' ? 'uppercase' : 'none' }}>{label}</Text> : null}
    </View>
  );
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label || icon} disabled={disabled} onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{ borderRadius: radius, opacity: disabled ? 0.4 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }], alignSelf: full ? 'stretch' : undefined }, style]}>
      {kind === 'primary'
        ? <LinearGradient colors={t.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ borderRadius: radius }, t.id === 'futur' && { shadowColor: t.colors.accent, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8 }]}>{inner}</LinearGradient>
        : <View style={{ borderRadius: radius, borderWidth: kind === 'ghost' ? 0 : 1.3, borderColor: t.id === 'futur' ? t.colors.border : t.colors.accent, backgroundColor: kind === 'secondary' && t.id === 'futur' ? t.colors.card : 'transparent' }}>{inner}</View>}
    </Pressable>
  );
}

export function IconBtn({ name, onPress, label, size = 44, filled, color, disabled }: { name: IconName; onPress: () => void; label: string; size?: number; filled?: boolean; color?: string; disabled?: boolean }) {
  const t = useTheme();
  const c = color ?? (filled ? t.colors.onAccent : t.colors.ink);
  return (
    <Pressable onPress={() => { tap(); onPress(); }} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : pressed ? 0.6 : 1, overflow: 'hidden', borderWidth: filled ? 0 : 1, borderColor: t.colors.border, backgroundColor: filled ? undefined : t.id === 'futur' ? t.colors.card : 'transparent' })}>
      {filled ? <LinearGradient colors={t.accentGradient} style={StyleSheet.absoluteFill} /> : null}
      <Icon name={name} size={size * 0.46} color={c} />
    </Pressable>
  );
}

export function Card({ children, style, alt, pad = 18 }: { children: React.ReactNode; style?: ViewStyle | (ViewStyle | false | undefined)[]; alt?: boolean; pad?: number }) {
  const t = useTheme();
  const s: ViewStyle[] = [{ backgroundColor: alt ? t.colors.cardAlt : t.colors.card, borderRadius: t.radius, padding: pad }];
  if (t.id === 'pro') s.push({ borderWidth: StyleSheet.hairlineWidth * 2, borderColor: t.colors.border });
  if (t.id === 'futur') s.push({ borderWidth: 1, borderColor: t.colors.border });
  if (t.id === 'zen') s.push({ shadowColor: '#3E5E46', shadowOpacity: 0.1, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' });
  return (
    <View style={[...s, ...(Array.isArray(style) ? style : [style])] as any}>
      {t.id === 'futur' ? <HudCorners /> : null}
      {children}
    </View>
  );
}

export function HudCorners({ color }: { color?: string }) {
  const t = useTheme();
  const c = { position: 'absolute' as const, width: 10, height: 10, borderColor: color ?? t.colors.accent };
  return (
    <>
      <View pointerEvents="none" style={[c, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 }]} />
      <View pointerEvents="none" style={[c, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 }]} />
      <View pointerEvents="none" style={[c, { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 }]} />
      <View pointerEvents="none" style={[c, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 }]} />
    </>
  );
}

export function Chip({ label, on, onPress, icon, small }: { label: string; on: boolean; onPress: () => void; icon?: string; small?: boolean }) {
  const t = useTheme();
  const radius = t.id === 'zen' ? 999 : t.id === 'futur' ? 10 : 3;
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: small ? 7 : 10, paddingHorizontal: small ? 11 : 14, borderRadius: radius, borderWidth: 1.2,
        borderColor: on ? t.colors.accent : t.colors.border, backgroundColor: on ? (t.id === 'futur' ? 'rgba(60,230,255,0.16)' : t.colors.accent) : t.id === 'futur' ? t.colors.card : t.colors.card, opacity: pressed ? 0.7 : 1 })}>
      {icon ? <Text style={{ fontSize: small ? 13 : 15 }}>{icon}</Text> : null}
      <Text style={{ color: on ? (t.id === 'futur' ? t.colors.accent : t.colors.onAccent) : t.colors.ink, fontFamily: t.fonts.ui, fontSize: small ? 13.5 : 15 }}>{label}</Text>
      {on && !small ? <Icon name="check" size={14} color={t.id === 'futur' ? t.colors.accent : t.colors.onAccent} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { icon?: IconName }) {
  const t = useTheme();
  const { icon, style, ...rest } = props;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: t.colors.border, borderRadius: t.id === 'zen' ? 18 : t.id === 'futur' ? 12 : 4, backgroundColor: t.dark ? 'rgba(60,230,255,0.04)' : t.colors.card, paddingHorizontal: 14 }}>
      {icon ? <Icon name={icon} size={18} color={t.colors.muted} /> : null}
      <TextInput placeholderTextColor={t.colors.faint} {...rest}
        style={[{ flex: 1, paddingHorizontal: icon ? 10 : 0, paddingVertical: 13, color: t.colors.ink, fontFamily: t.fonts.body, fontSize: 17 }, style as any]} />
    </View>
  );
}

export function Toggle({ label, value, onChange, hint, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string; icon?: IconName }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}>
      {icon ? <Icon name={icon} size={20} color={t.colors.accent} /> : null}
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
  const r = t.id === 'zen' ? 999 : t.id === 'futur' ? 12 : 4;
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1.2, borderColor: t.colors.border, borderRadius: r, padding: 3, backgroundColor: t.id === 'futur' ? t.colors.card : t.colors.cardAlt }}>
      {options.map(o => (
        <Pressable key={o.v} onPress={() => { tap(); onChange(o.v); }} accessibilityRole="button" accessibilityState={{ selected: value === o.v }}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: r, backgroundColor: value === o.v ? t.colors.accent : 'transparent' }}>
          <Text style={{ color: value === o.v ? t.colors.onAccent : t.colors.ink, fontFamily: t.fonts.ui, fontSize: 14.5 }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Stepper({ value, onMinus, onPlus, label }: { value: string; onMinus: () => void; onPlus: () => void; label?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <IconBtn name="down" label={`Diminuer ${label ?? ''}`} onPress={onMinus} />
      <Text style={{ minWidth: 74, textAlign: 'center', color: t.colors.ink, fontFamily: t.fonts.title, fontSize: 26 }}>{value}</Text>
      <IconBtn name="up" label={`Augmenter ${label ?? ''}`} onPress={onPlus} />
    </View>
  );
}

// En-tête de rubrique, différent selon le thème.
export function SectionHead({ icon, title, index, right, active }: { icon: string; title: string; index?: number; right?: React.ReactNode; active?: boolean }) {
  const t = useTheme();
  const color = active ? t.colors.accent : t.colors.ink;
  if (t.id === 'pro') {
    return (
      <View style={{ marginBottom: 10 }}>
        <View style={{ height: 3, backgroundColor: t.colors.hair }} />
        <View style={{ height: 1, backgroundColor: t.colors.hair, marginTop: 2 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 }}>
          <Icon name={icon} size={17} color={t.colors.accent} />
          <Txt v="label" color={t.colors.accent} style={{ flex: 1 }}>{title}</Txt>
          {right}
        </View>
      </View>
    );
  }
  if (t.id === 'futur') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(60,230,255,0.08)' }}>
          <Icon name={icon} size={16} color={t.colors.accent} />
        </View>
        {index !== undefined ? <Txt v="mono" color={t.colors.accent2}>{String(index + 1).padStart(2, '0')} //</Txt> : null}
        <Txt v="h2" color={color} style={{ flex: 1 }}>{title}</Txt>
        {right}
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingHorizontal: 4 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(91,138,102,0.13)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color={t.colors.accent} />
      </View>
      <Txt v="h2" color={color} style={{ flex: 1 }}>{title}</Txt>
      {right}
    </View>
  );
}

export const Gap = ({ h = 12 }: { h?: number }) => <View style={{ height: h }} />;

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: t.colors.border, marginVertical: 12 }} />;
}
