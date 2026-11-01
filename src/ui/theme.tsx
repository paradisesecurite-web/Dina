import React, { createContext, useContext } from 'react';
import type { ThemeId, Tone } from '../types';

export type Theme = {
  id: ThemeId;
  name: string;
  tagline: string;
  dark: boolean;
  colors: { bg: string; bg2: string; card: string; border: string; ink: string; muted: string; accent: string; accent2: string; onAccent: string; good: string; bad: string };
  fonts: { title: string; body: string; ui: string; uiBold: string };
  radius: number;
  defaults: { tone: Tone; wellbeing: 'aucun' | 'respiration' | 'pensee'; sound: string };
  upper: boolean; // titres en majuscules
};

export const THEMES: Record<ThemeId, Theme> = {
  pro: {
    id: 'pro', name: 'Professionnel', tagline: 'Sobre et élégant, esprit grand journal', dark: false,
    colors: { bg: '#F6F2EA', bg2: '#EDE6D9', card: '#FFFDF8', border: '#D8CFBF', ink: '#1C1A17', muted: '#6E665A', accent: '#8C1C2B', accent2: '#B08D57', onAccent: '#FFFFFF', good: '#2F6B3A', bad: '#9B2C2C' },
    fonts: { title: 'PlayfairDisplay_700Bold', body: 'SourceSerif4_400Regular', ui: 'SourceSerif4_600SemiBold', uiBold: 'SourceSerif4_700Bold' },
    radius: 4, defaults: { tone: 'journaliste', wellbeing: 'aucun', sound: 'Jingle radio' }, upper: false,
  },
  futur: {
    id: 'futur', name: 'Futuriste', tagline: 'Assistant holographique, interface tête haute', dark: true,
    colors: { bg: '#03070D', bg2: '#071420', card: 'rgba(0, 229, 255, 0.06)', border: 'rgba(0, 229, 255, 0.35)', ink: '#DDF7FF', muted: '#6FA0B3', accent: '#00E5FF', accent2: '#FF9F1C', onAccent: '#001318', good: '#3BFFA8', bad: '#FF5470' },
    fonts: { title: 'Orbitron_700Bold', body: 'Rajdhani_500Medium', ui: 'Rajdhani_600SemiBold', uiBold: 'Rajdhani_700Bold' },
    radius: 2, defaults: { tone: 'assistant', wellbeing: 'aucun', sound: 'Montée électronique' }, upper: true,
  },
  zen: {
    id: 'zen', name: 'Nature / zen', tagline: 'Couleurs douces, végétal, apaisant', dark: false,
    colors: { bg: '#EEF3EA', bg2: '#E1EAD9', card: 'rgba(255, 255, 255, 0.78)', border: '#CBD9C3', ink: '#2E3B2F', muted: '#6F7F6E', accent: '#5E8B67', accent2: '#D4A373', onAccent: '#FFFFFF', good: '#4E8A5A', bad: '#B5634B' },
    fonts: { title: 'Nunito_700Bold', body: 'Nunito_400Regular', ui: 'Nunito_600SemiBold', uiBold: 'Nunito_700Bold' },
    radius: 22, defaults: { tone: 'calme', wellbeing: 'respiration', sound: 'Pluie en forêt' }, upper: false,
  },
};

const Ctx = createContext<Theme>(THEMES.pro);
export const ThemeProvider = ({ id, children }: { id: ThemeId; children: React.ReactNode }) => <Ctx.Provider value={THEMES[id]}>{children}</Ctx.Provider>;
export const useTheme = () => useContext(Ctx);
