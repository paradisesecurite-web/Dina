import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import * as Location from 'expo-location';
import type { Place } from '../types';
import { searchPlaces } from '../sources/meteo';
import { Btn, Field, Txt } from './kit';
import { useTheme } from './theme';

export function CityPicker({ value, onChange }: { value?: Place; onChange: (p: Place) => void }) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const h = setTimeout(async () => {
      setBusy(true);
      try { setRes(await searchPlaces(q)); setMsg(''); } catch { setMsg('Recherche impossible, vérifie ta connexion.'); }
      setBusy(false);
    }, 400);
    return () => clearTimeout(h);
  }, [q]);
  // La localisation n'est demandée que si l'utilisateur touche ce bouton.
  const locate = async () => {
    setBusy(true); setMsg('');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { setMsg('Autorisation refusée : tape le nom de ta ville.'); setBusy(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let name = 'Ma position';
      try { const r = await Location.reverseGeocodeAsync(pos.coords); name = r[0]?.city || r[0]?.subregion || name; } catch {}
      onChange({ name, lat: pos.coords.latitude, lon: pos.coords.longitude });
      setQ(''); setRes([]);
    } catch { setMsg('Position introuvable : tape le nom de ta ville.'); }
    setBusy(false);
  };
  return (
    <View style={{ gap: 10 }}>
      {value ? <Txt v="h3">📍 {value.name}{value.admin ? `, ${value.admin}` : ''}</Txt> : null}
      <Field icon="pin" value={q} onChangeText={setQ} placeholder={value ? 'Changer de ville…' : 'Tape le nom de ta ville'} accessibilityLabel="Ville" autoCorrect={false} />
      {busy ? <ActivityIndicator color={t.colors.accent} /> : null}
      {res.map((p, i) => (
        <Pressable key={i} onPress={() => { onChange(p); setQ(''); setRes([]); }} style={({ pressed }) => ({ paddingVertical: 10, paddingHorizontal: 12, borderRadius: t.radius, backgroundColor: pressed ? t.colors.bg2 : 'transparent', borderBottomWidth: 1, borderColor: t.colors.border })}>
          <Txt>{p.name}</Txt>
          <Txt v="small">{[p.admin, p.country].filter(Boolean).join(', ')}</Txt>
        </Pressable>
      ))}
      {msg ? <Txt v="small">{msg}</Txt> : null}
      <Btn kind="secondary" small icon="pin" label="Utiliser ma position" onPress={locate} />
    </View>
  );
}
