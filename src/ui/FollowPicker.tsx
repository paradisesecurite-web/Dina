import React from 'react';
import { View } from 'react-native';
import type { Follow } from '../types';
import { searchFollow, COMPETITIONS } from '../sources/sport';
import { SearchAdd } from './SearchAdd';
import { Chip, Gap, Txt } from './kit';

// Équipes (tous sports, sigles compris : PSG, OM, Lakers…), joueurs (tennis, F1, cyclisme…) et compétitions.
export function FollowPicker({ follows, onChange }: { follows: Follow[]; onChange: (f: Follow[]) => void }) {
  const has = (name: string) => follows.some(f => f.name === name);
  return (
    <View>
      <SearchAdd placeholder="Équipe, joueur, pilote… (ex. : PSG, OM, Mbappé, Sinner)"
        search={searchFollow} items={follows} keyOf={f => `${f.kind}:${f.id ?? f.name}`}
        label={f => `${f.kind === 'team' ? '🛡️' : f.kind === 'player' ? '👤' : '🏆'} ${f.name}`} sub={(f: any) => f.sub}
        onAdd={(f: any) => { const { sub, ...rest } = f; onChange([...follows, rest]); }}
        onRemove={f => onChange(follows.filter(x => !(x.kind === f.kind && (x.id ?? x.name) === (f.id ?? f.name))))} />
      <Gap h={14} />
      <Txt v="label">Compétitions</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {COMPETITIONS.map(c => (
          <Chip key={c.name} small label={c.name} on={has(c.name)} onPress={() => onChange(has(c.name) ? follows.filter(f => f.name !== c.name) : [...follows, { kind: 'competition', name: c.name, query: c.query, sport: c.sport }])} />
        ))}
      </View>
    </View>
  );
}
