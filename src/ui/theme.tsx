import React, { createContext, useContext } from 'react';
import type { Style, ThemeId } from '../types';

export type Theme = {
  id: ThemeId;
  name: string;
  tagline: string;
  dark: boolean;
  colors: {
    bg: string; bg2: string; card: string; cardAlt: string; border: string; hair: string;
    ink: string; muted: string; faint: string; accent: string; accent2: string; onAccent: string;
    good: string; bad: string; player: string; onPlayer: string;
  };
  gradient: [string, string, ...string[]];      // fond de page
  accentGradient: [string, string, ...string[]]; // boutons, orbe
  fonts: { display: string; title: string; body: string; bodyBold: string; ui: string; uiBold: string; mono: string };
  radius: number;
  defaults: { style: Style; wellbeing: 'aucun' | 'respiration' | 'pensee'; sound: string };
  upper: boolean;
};

export const THEMES: Record<ThemeId, Theme> = {
  pro: {
    id: 'pro', name: 'Édition', tagline: 'Sobre et élégant, l\'esprit d\'un grand quotidien', dark: false,
    colors: {
      bg: '#F5F1E8', bg2: '#ECE5D6', card: '#FFFCF6', cardAlt: '#F0E9DA', border: '#DDD3C1', hair: '#1A1714',
      ink: '#16130F', muted: '#6B6255', faint: '#A39A8B', accent: '#9E1B2F', accent2: '#B4893F', onAccent: '#FFFFFF',
      good: '#2F6B3A', bad: '#9B2C2C', player: '#16130F', onPlayer: '#F5F1E8',
    },
    gradient: ['#F7F3EA', '#EFE8DA'], accentGradient: ['#B0223A', '#86152A'],
    fonts: { display: 'PlayfairDisplay_800ExtraBold', title: 'PlayfairDisplay_700Bold', body: 'SourceSerif4_400Regular', bodyBold: 'SourceSerif4_600SemiBold', ui: 'Inter_500Medium', uiBold: 'Inter_700Bold', mono: 'Inter_600SemiBold' },
    radius: 6, defaults: { style: 'pro', wellbeing: 'aucun', sound: 'Jingle radio' }, upper: false,
  },
  futur: {
    id: 'futur', name: 'Holo', tagline: 'Assistant holographique, interface tête haute', dark: true,
    colors: {
      bg: '#03060D', bg2: '#081424', card: 'rgba(120, 220, 255, 0.055)', cardAlt: 'rgba(120, 220, 255, 0.1)', border: 'rgba(110, 225, 255, 0.28)', hair: 'rgba(110, 225, 255, 0.5)',
      ink: '#E3F7FF', muted: '#7FA6B8', faint: '#4A6878', accent: '#3CE6FF', accent2: '#A07CFF', onAccent: '#021018',
      good: '#4BFFB0', bad: '#FF5C7A', player: 'rgba(8, 22, 38, 0.92)', onPlayer: '#E3F7FF',
    },
    gradient: ['#020409', '#06142A', '#03060D'], accentGradient: ['#3CE6FF', '#7D7BFF'],
    fonts: { display: 'Orbitron_700Bold', title: 'Orbitron_600SemiBold', body: 'Rajdhani_500Medium', bodyBold: 'Rajdhani_700Bold', ui: 'Rajdhani_600SemiBold', uiBold: 'Rajdhani_700Bold', mono: 'Rajdhani_600SemiBold' },
    radius: 14, defaults: { style: 'assistant', wellbeing: 'aucun', sound: 'Montée électronique' }, upper: true,
  },
  zen: {
    id: 'zen', name: 'Zen', tagline: 'Couleurs douces, végétal, apaisant', dark: false,
    colors: {
      bg: '#EEF2EA', bg2: '#E2EADC', card: 'rgba(255, 255, 255, 0.82)', cardAlt: 'rgba(255, 255, 255, 0.6)', border: 'rgba(94, 139, 103, 0.18)', hair: 'rgba(94, 139, 103, 0.3)',
      ink: '#26332A', muted: '#68786A', faint: '#9AA89B', accent: '#5B8A66', accent2: '#D08C60', onAccent: '#FFFFFF',
      good: '#4E8A5A', bad: '#B5634B', player: 'rgba(255, 255, 255, 0.92)', onPlayer: '#26332A',
    },
    gradient: ['#F6F1E7', '#E8EFE1', '#DDE8D6'], accentGradient: ['#79A884', '#4F7D5A'],
    fonts: { display: 'Nunito_800ExtraBold', title: 'Nunito_700Bold', body: 'Nunito_400Regular', bodyBold: 'Nunito_600SemiBold', ui: 'Nunito_600SemiBold', uiBold: 'Nunito_700Bold', mono: 'Nunito_700Bold' },
    radius: 26, defaults: { style: 'zen', wellbeing: 'respiration', sound: 'Pluie en forêt' }, upper: false,
  },
};

const Ctx = createContext<Theme>(THEMES.pro);
export const ThemeProvider = ({ id, children }: { id: ThemeId; children: React.ReactNode }) => <Ctx.Provider value={THEMES[id]}>{children}</Ctx.Provider>;
export const useTheme = () => useContext(Ctx);
