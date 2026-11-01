import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop, G } from 'react-native-svg';
import { useTheme } from './theme';

export const useLoop = (ms: number, active = true) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { v.stopAnimation(); return; }
    const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [active, ms, v]);
  return v;
};

// Fond de page propre à chaque thème (dessiné en code, aucun visuel externe).
export function Backdrop() {
  const t = useTheme();
  const { width: w, height: h } = useWindowDimensions();
  const scan = useLoop(7000, t.id === 'futur');
  const sway = useLoop(10000, t.id === 'zen');
  const grad = <LinearGradient colors={t.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} />;
  if (t.id === 'futur') {
    const lines = [];
    for (let x = 0; x < w; x += 28) lines.push(<Line key={'v' + x} x1={x} y1={0} x2={x} y2={h} stroke="#3CE6FF" strokeOpacity={0.045} strokeWidth={1} />);
    for (let y = 0; y < h; y += 28) lines.push(<Line key={'h' + y} x1={0} y1={y} x2={w} y2={y} stroke="#3CE6FF" strokeOpacity={0.045} strokeWidth={1} />);
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {grad}
        <Svg width={w} height={h}>
          <Defs>
            <RadialGradient id="g1" cx="80%" cy="8%" r="60%"><Stop offset="0" stopColor="#1B6DFF" stopOpacity="0.28" /><Stop offset="1" stopColor="#03060D" stopOpacity="0" /></RadialGradient>
            <RadialGradient id="g2" cx="10%" cy="70%" r="55%"><Stop offset="0" stopColor="#7D4DFF" stopOpacity="0.16" /><Stop offset="1" stopColor="#03060D" stopOpacity="0" /></RadialGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#g1)" />
          <Rect width={w} height={h} fill="url(#g2)" />
          {lines}
          <Circle cx={w * 0.88} cy={h * 0.07} r={86} stroke="#3CE6FF" strokeOpacity={0.12} strokeWidth={1} fill="none" strokeDasharray="2 7" />
          <Circle cx={w * 0.88} cy={h * 0.07} r={60} stroke="#A07CFF" strokeOpacity={0.14} strokeWidth={1} fill="none" />
        </Svg>
        <Animated.View style={{ position: 'absolute', left: 0, right: 0, height: 80, opacity: 0.5, transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [-80, h] }) }] }}>
          <LinearGradient colors={['rgba(60,230,255,0)', 'rgba(60,230,255,0.07)', 'rgba(60,230,255,0)']} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    );
  }
  if (t.id === 'zen') {
    const rot = sway.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-3deg', '3deg', '-3deg'] });
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {grad}
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="sun" cx="88%" cy="6%" r="40%"><Stop offset="0" stopColor="#F2C98F" stopOpacity="0.55" /><Stop offset="1" stopColor="#F2C98F" stopOpacity="0" /></RadialGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#sun)" />
          <Path d={`M0 ${h * 0.84} C ${w * 0.3} ${h * 0.78}, ${w * 0.62} ${h * 0.9}, ${w} ${h * 0.82} L ${w} ${h} L 0 ${h} Z`} fill="#7FA987" opacity={0.12} />
          <Path d={`M0 ${h * 0.91} C ${w * 0.38} ${h * 0.86}, ${w * 0.7} ${h * 0.96}, ${w} ${h * 0.88} L ${w} ${h} L 0 ${h} Z`} fill="#5B8A66" opacity={0.14} />
        </Svg>
        <Animated.View style={{ position: 'absolute', right: -16, top: h * 0.16, transform: [{ rotate: rot }] }}>
          <Svg width={100} height={190} viewBox="0 0 100 190">
            <Path d="M52 190 C 52 130, 44 80, 56 8" stroke="#5B8A66" strokeOpacity={0.3} strokeWidth={2} fill="none" />
            {[24, 52, 80, 108, 136].map((y, i) => (
              <G key={y}>
                <Path d={`M53 ${y} C 26 ${y - 12}, 14 ${y + 10}, 8 ${y + 3} C 24 ${y + 20}, 44 ${y + 12}, 53 ${y}`} fill="#5B8A66" opacity={0.14 + i * 0.025} />
                <Path d={`M53 ${y + 13} C 78 ${y + 1}, 90 ${y + 20}, 95 ${y + 13} C 80 ${y + 31}, 60 ${y + 25}, 53 ${y + 13}`} fill="#7FA987" opacity={0.12 + i * 0.025} />
              </G>
            ))}
          </Svg>
        </Animated.View>
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {grad}
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        {Array.from({ length: Math.ceil(h / 4) }).map((_, i) => i % 7 === 0 ? <Line key={i} x1={0} y1={i * 4} x2={w} y2={i * 4} stroke="#8A7A5C" strokeOpacity={0.035} strokeWidth={1} /> : null)}
      </Svg>
    </View>
  );
}

// Animation qui « vit » quand la voix parle (différente selon le thème).
export function VoiceOrb({ active, size = 120, listening }: { active: boolean; size?: number; listening?: boolean }) {
  const t = useTheme();
  const on = active || !!listening;
  const spin = useLoop(t.id === 'futur' ? 3600 : 2400, on);
  const spin2 = useLoop(5200, on);
  const pulse = useLoop(t.id === 'zen' ? 4200 : listening ? 900 : 1400, on);
  const s1 = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.86, 1.1, 0.86] });
  const s2 = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.08, 0.92, 1.08] });
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rot2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  if (t.id === 'futur') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={listening ? 'J\'écoute' : active ? 'La voix parle' : 'Voix en attente'}>
        <Animated.View style={{ position: 'absolute', transform: [{ rotate: rot }] }}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx={50} cy={50} r={47} stroke="#3CE6FF" strokeWidth={1.2} fill="none" strokeDasharray="70 12 6 12" opacity={0.9} />
            {Array.from({ length: 24 }).map((_, i) => { const a = (i / 24) * Math.PI * 2; return <Line key={i} x1={50 + Math.cos(a) * 41} y1={50 + Math.sin(a) * 41} x2={50 + Math.cos(a) * (i % 6 === 0 ? 36 : 39)} y2={50 + Math.sin(a) * (i % 6 === 0 ? 36 : 39)} stroke="#3CE6FF" strokeOpacity={0.6} strokeWidth={1} />; })}
          </Svg>
        </Animated.View>
        <Animated.View style={{ position: 'absolute', transform: [{ rotate: rot2 }] }}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100">
            <Circle cx={50} cy={50} r={46} stroke={listening ? '#4BFFB0' : '#A07CFF'} strokeWidth={1.4} fill="none" strokeDasharray="4 7" opacity={0.85} />
          </Svg>
        </Animated.View>
        <Animated.View style={{ width: size * 0.42, height: size * 0.42, borderRadius: size, overflow: 'hidden', opacity: on ? 1 : 0.55, transform: [{ scale: on ? s1 : 1 }], shadowColor: '#3CE6FF', shadowOpacity: 1, shadowRadius: 24, elevation: 14 }}>
          <LinearGradient colors={listening ? ['#4BFFB0', '#1B9F7A'] : ['#9AF3FF', '#3CE6FF', '#5B5BFF']} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
        </Animated.View>
        <View style={{ position: 'absolute', width: size * 0.13, height: size * 0.13, borderRadius: size, backgroundColor: '#F2FDFF' }} />
      </View>
    );
  }
  if (t.id === 'zen') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: listening ? '#D08C60' : '#5B8A66', opacity: 0.12, transform: [{ scale: on ? s2 : 1 }] }} />
        <Animated.View style={{ position: 'absolute', width: size * 0.8, height: size * 0.8, borderRadius: size, backgroundColor: '#5B8A66', opacity: 0.12, transform: [{ scale: on ? s1 : 1 }] }} />
        <Animated.View style={{ width: size * 0.56, height: size * 0.56, borderRadius: size, overflow: 'hidden', transform: [{ scale: on ? s1 : 1 }] }}>
          <LinearGradient colors={listening ? ['#E7A77B', '#C47A4F'] : ['#8DB896', '#4F7D5A']} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} />
        </Animated.View>
      </View>
    );
  }
  const bars = [0.45, 0.8, 0.6, 1, 0.7, 0.9, 0.5];
  return (
    <View style={{ width: size, height: size * 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      {bars.map((b, i) => {
        const sc = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: i % 2 ? [b, 0.25, b] : [0.25, b, 0.25] });
        return <Animated.View key={i} style={{ width: 5, height: size * 0.42, borderRadius: 3, backgroundColor: listening ? t.colors.accent2 : i % 3 === 1 ? t.colors.accent2 : t.colors.accent, transform: [{ scaleY: on ? sc : 0.18 }] }} />;
      })}
    </View>
  );
}
