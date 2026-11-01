import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Topic } from '../types';
import { CATALOGUE } from '../data/catalogue';
import { Btn, Chip, Field, Gap, Txt } from './kit';
import { useTheme } from './theme';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Catalogue de centres d'intérêt + sujets libres tapés par l'utilisateur.
export function InterestsPicker({ selected, custom, onToggle, onAddCustom, onRemoveCustom }: {
  selected: string[]; custom: Topic[]; onToggle: (id: string) => void; onAddCustom: (label: string) => void; onRemoveCustom: (id: string) => void;
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const [mine, setMine] = useState('');
  const cats = useMemo(() => {
    if (!q.trim()) return CATALOGUE;
    const n = norm(q);
    return CATALOGUE.map(c => ({ ...c, items: c.items.filter(i => norm(i.label).includes(n)) })).filter(c => c.items.length);
  }, [q]);
  const add = () => { if (mine.trim()) { onAddCustom(mine.trim()); setMine(''); } };
  return (
    <View>
      <Txt v="label">Un sujet qui n'est pas dans la liste ?</Txt>
      <Gap h={8} />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Field icon="plus" value={mine} onChangeText={setMine} placeholder="Ex. : l'équitation, le MMA, l'immobilier à Lyon" onSubmitEditing={add} returnKeyType="done" accessibilityLabel="Ajouter un sujet" />
        </View>
        <Btn small label="Ajouter" onPress={add} disabled={!mine.trim()} />
      </View>
      {custom.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {custom.map(c => <Chip key={c.id} icon="🔎" label={`${c.label}  ✕`} on onPress={() => onRemoveCustom(c.id)} />)}
        </View>
      ) : null}
      <Txt v="small" style={{ marginTop: 6 }}>L'IA suivra l'actualité de ce sujet pour toi, chaque matin.</Txt>
      <Gap h={18} />
      <Field icon="libre" value={q} onChangeText={setQ} placeholder="Chercher dans les idées (sport, cuisine, IA…)" accessibilityLabel="Chercher un centre d'intérêt" />
      {cats.map(c => (
        <View key={c.id} style={{ marginTop: 18 }}>
          <Txt v="label" color={t.colors.accent}>{c.icon}  {c.label}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {c.items.map(i => <Chip key={i.id} icon={i.icon} label={i.label} on={selected.includes(i.id)} onPress={() => onToggle(i.id)} />)}
          </View>
        </View>
      ))}
    </View>
  );
}
