import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, View } from 'react-native';
import { useTheme } from '../ui/theme';
import { Btn, Txt } from '../ui/kit';
import { Backdrop } from '../ui/decor';
import { player } from '../services/player';
import type { Settings } from '../types';

// Une minute de respiration guidée : inspire 4 s, retiens 4 s, expire 6 s.
const STEPS = [{ label: 'Inspire', ms: 4000, to: 1 }, { label: 'Retiens', ms: 4000, to: 1 }, { label: 'Expire', ms: 6000, to: 0 }];

export function Breathing({ visible, onClose, settings, voice }: { visible: boolean; onClose: () => void; settings: Settings; voice: boolean }) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const [label, setLabel] = useState('Prêt ?');
  const [left, setLeft] = useState(60);
  useEffect(() => {
    if (!visible) return;
    let alive = true, k = 0;
    const start = Date.now();
    const tick = setInterval(() => setLeft(Math.max(0, 60 - Math.round((Date.now() - start) / 1000))), 500);
    const run = () => {
      if (!alive) return;
      if (Date.now() - start > 58000) { setLabel('Bravo. Belle journée !'); if (voice) player.say('Bravo. Tu peux reprendre ta journée, en douceur.', settings); return; }
      const st = STEPS[k % 3]; k++;
      setLabel(st.label);
      if (voice) player.say(st.label, { ...settings, tone: 'calme' });
      Animated.timing(scale, { toValue: st.to, duration: st.ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start(() => run());
    };
    scale.setValue(0);
    const first = setTimeout(run, 800);
    return () => { alive = false; clearTimeout(first); clearInterval(tick); scale.stopAnimation(); player.stop(); };
  }, [visible]);
  const s = scale.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Backdrop />
        <Txt v="label">Une minute pour toi</Txt>
        <View style={{ height: 300, width: 300, alignItems: 'center', justifyContent: 'center', marginVertical: 24 }}>
          <Animated.View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 200, backgroundColor: t.colors.accent, opacity: 0.12, transform: [{ scale: s }] }} />
          <Animated.View style={{ width: 200, height: 200, borderRadius: 200, backgroundColor: t.colors.accent, opacity: 0.55, transform: [{ scale: s }] }} />
          <Txt v="title" style={{ position: 'absolute' }}>{label}</Txt>
        </View>
        <Txt v="small">{left > 0 ? `${left} secondes` : 'Terminé'}</Txt>
        <View style={{ height: 24 }} />
        <Btn label={left > 0 ? 'Arrêter' : 'Revenir au journal'} kind={left > 0 ? 'secondary' : 'primary'} onPress={onClose} />
      </View>
    </Modal>
  );
}
