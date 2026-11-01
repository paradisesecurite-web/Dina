import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Chip, Field, Txt } from './kit';
import { useTheme } from './theme';

// Recherche + liste de choix ajoutés (artistes, équipes, cryptos, actions…)
export function SearchAdd<T>({ placeholder, search, items, label, sub, keyOf, onAdd, onRemove }: {
  placeholder: string; search: (q: string) => Promise<T[]>; items: T[];
  label: (x: T) => string; sub?: (x: T) => string; keyOf: (x: T) => string;
  onAdd: (x: T) => void; onRemove: (x: T) => void;
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<T[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const h = setTimeout(async () => {
      setBusy(true);
      try { const r = await search(q.trim()); setRes(r); setMsg(r.length ? '' : 'Aucun résultat.'); } catch { setMsg('Recherche impossible pour le moment.'); }
      setBusy(false);
    }, 450);
    return () => clearTimeout(h);
  }, [q]);
  return (
    <View style={{ gap: 8 }}>
      {items.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map(x => <Chip key={keyOf(x)} label={`${label(x)}  ✕`} on onPress={() => onRemove(x)} />)}
        </View>
      ) : null}
      <Field value={q} onChangeText={setQ} placeholder={placeholder} autoCorrect={false} accessibilityLabel={placeholder} />
      {busy ? <ActivityIndicator color={t.colors.accent} /> : null}
      {res.filter(r => !items.some(i => keyOf(i) === keyOf(r))).map(r => (
        <Pressable key={keyOf(r)} onPress={() => { onAdd(r); setQ(''); setRes([]); }}
          style={({ pressed }) => ({ paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.bg2 : 'transparent' })}>
          <Txt>＋ {label(r)}</Txt>
          {sub ? <Txt v="small">{sub(r)}</Txt> : null}
        </Pressable>
      ))}
      {msg ? <Txt v="small">{msg}</Txt> : null}
    </View>
  );
}
