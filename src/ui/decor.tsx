import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Rect, Stop, G } from 'react-native-svg';
import { useTheme } from './theme';

const useLoop = (ms: number, active = true) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { v.stopAnimation(); return; }
    const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [active, ms, v]);
  return v;
};

// Décor de fond propre à chaque thème (dessiné en code, aucun visuel externe).
export function Backdrop() {
  const t = useTheme();
  const { width: w, height: h } = useWindowDimensions();
  const scan = useLoop(6000, t.id === 'futur');
  const sway = useLoop(9000, t.id === 'zen');
  if (t.id === 'futur') {
    const lines = [];
    for (let x = 0; x < w; x += 32) lines.push(<Line key={'v' + x} x1={x} y1={0} x2={x} y2={h} stroke="#00E5FF" strokeOpacity={0.06} strokeWidth={1} />);
    for (let y = 0; y < h; y += 32) lines.push(<Line key={'h' + y} x1={0} y1={y} x2={w} y2={y} stroke="#00E5FF" strokeOpacity={0.06} strokeWidth={1} />);
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={w} height={h}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="18%" r="70%"><Stop offset="0" stopColor="#0A3A52" stopOpacity="0.9" /><Stop offset="1" stopColor="#03070D" stopOpacity="0" /></RadialGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#glow)" />
          {lines}
          <Circle cx={w * 0.85} cy={h * 0.12} r={70} stroke="#00E5FF" strokeOpacity={0.12} strokeWidth={1} fill="none" strokeDasharray="4 8" />
          <Circle cx={w * 0.85} cy={h * 0.12} r={48} stroke="#FF9F1C" strokeOpacity={0.12} strokeWidth={1} fill="none" />
        </Svg>
        <Animated.View style={{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#00E5FF', opacity: 0.18, transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [0, h] }) }] }} />
      </View>
    );
  }
  if (t.id === 'zen') {
    const rot = sway.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-4deg', '4deg', '-4deg'] });
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F4F1E6" /><Stop offset="1" stopColor="#E3ECDC" /></LinearGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#sky)" />
          <Circle cx={w * 0.9} cy={h * 0.08} r={110} fill="#D4A373" opacity={0.13} />
          <Circle cx={w * 0.05} cy={h * 0.55} r={160} fill="#5E8B67" opacity={0.07} />
          <Path d={`M0 ${h * 0.86} C ${w * 0.3} ${h * 0.8}, ${w * 0.6} ${h * 0.92}, ${w} ${h * 0.84} L ${w} ${h} L 0 ${h} Z`} fill="#5E8B67" opacity={0.1} />
          <Path d={`M0 ${h * 0.92} C ${w * 0.35} ${h * 0.88}, ${w * 0.7} ${h * 0.97}, ${w} ${h * 0.9} L ${w} ${h} L 0 ${h} Z`} fill="#5E8B67" opacity={0.12} />
        </Svg>
        <Animated.View style={{ position: 'absolute', right: -10, top: h * 0.2, transform: [{ rotate: rot }] }}>
          <Svg width={90} height={160} viewBox="0 0 90 160">
            <Path d="M45 160 C 45 110, 40 70, 48 10" stroke="#5E8B67" strokeOpacity={0.35} strokeWidth={2} fill="none" />
            {[30, 55, 80, 105].map((y, i) => (
              <G key={y}>
                <Path d={`M46 ${y} C ${20} ${y - 10}, ${12} ${y + 8}, ${8} ${y + 2} C ${22} ${y + 16}, ${40} ${y + 10}, 46 ${y}`} fill="#5E8B67" opacity={0.18 + i * 0.03} />
                <Path d={`M46 ${y + 12} C ${70} ${y + 2}, ${80} ${y + 18}, ${84} ${y + 12} C ${70} ${y + 28}, ${52} ${y + 22}, 46 ${y + 12}`} fill="#5E8B67" opacity={0.15 + i * 0.03} />
              </G>
            ))}
          </Svg>
        </Animated.View>
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={w} height={h}>
        <Rect width={w} height={h} fill="#F6F2EA" />
        {Array.from({ length: Math.ceil(h / 26) }).map((_, i) => <Line key={i} x1={0} y1={i * 26} x2={w} y2={i * 26} stroke="#B08D57" strokeOpacity={0.05} strokeWidth={1} />)}
      </Svg>
    </View>
  );
}

// Animation qui « vit » quand la voix parle (différente selon le thème).
export function VoiceOrb({ active, size = 96 }: { active: boolean; size?: number }) {
  const t = useTheme();
  const spin = useLoop(t.id === 'futur' ? 3200 : 2400, active);
  const pulse = useLoop(t.id === 'zen' ? 4000 : 1400, active);
  const s1 = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 1.12, 0.85] });
  const s2 = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.1, 0.9, 1.1] });
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  if (t.id === 'futur') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={active ? 'La voix parle' : 'Voix en attente'}>
        <Animated.View style={{ position: 'absolute', transform: [{ rotate: rot }] }}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx={50} cy={50} r={46} stroke="#00E5FF" strokeWidth={1.5} fill="none" strokeDasharray="60 20 10 20" opacity={0.9} />
            <Circle cx={50} cy={50} r={38} stroke="#FF9F1C" strokeWidth={1} fill="none" strokeDasharray="3 6" opacity={0.7} />
          </Svg>
        </Animated.View>
        <Animated.View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size, backgroundColor: '#00E5FF', opacity: active ? 0.9 : 0.35, transform: [{ scale: active ? s1 : 1 }], shadowColor: '#00E5FF', shadowOpacity: 1, shadowRadius: 20, elevation: 12 }} />
        <View style={{ position: 'absolute', width: size * 0.22, height: size * 0.22, borderRadius: size, backgroundColor: '#E6FCFF' }} />
      </View>
    );
  }
  if (t.id === 'zen') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: '#5E8B67', opacity: 0.15, transform: [{ scale: active ? s2 : 1 }] }} />
        <Animated.View style={{ width: size * 0.62, height: size * 0.62, borderRadius: size, backgroundColor: '#5E8B67', opacity: active ? 0.75 : 0.45, transform: [{ scale: active ? s1 : 1 }] }} />
        <View style={{ position: 'absolute', width: size * 0.2, height: size * 0.2, borderRadius: size, backgroundColor: '#F4F1E6' }} />
      </View>
    );
  }
  // Professionnel : un égaliseur sobre
  const bars = [0.5, 0.9, 0.65, 1, 0.7, 0.45];
  return (
    <View style={{ width: size, height: size * 0.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      {bars.map((b, i) => {
        const sc = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: i % 2 ? [b, 0.3, b] : [0.3, b, 0.3] });
        return <Animated.View key={i} style={{ width: 6, height: size * 0.5, borderRadius: 2, backgroundColor: i % 3 === 1 ? '#B08D57' : '#8C1C2B', transform: [{ scaleY: active ? sc : 0.25 }] }} />;
      })}
    </View>
  );
}
