import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
// Polices importées une par une (évite d'embarquer toutes les graisses dans l'APK).
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { SourceSerif4_400Regular } from '@expo-google-fonts/source-serif-4/400Regular';
import { SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4/600SemiBold';
import { SourceSerif4_700Bold } from '@expo-google-fonts/source-serif-4/700Bold';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron/700Bold';
import { Rajdhani_500Medium } from '@expo-google-fonts/rajdhani/500Medium';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani/600SemiBold';
import { Rajdhani_700Bold } from '@expo-google-fonts/rajdhani/700Bold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import type { Settings, ThemeId } from './src/types';
import { ThemeProvider, THEMES } from './src/ui/theme';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './src/services/storage';
import { Invite } from './src/screens/Invite';
import { Onboarding } from './src/screens/Onboarding';
import { JournalScreen } from './src/screens/JournalScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { installDemoIfAsked } from './src/demo';

SplashScreen.preventAutoHideAsync().catch(() => {});
installDemoIfAsked();

export default function App() {
  const [fontsOk] = useFonts({
    PlayfairDisplay_700Bold, SourceSerif4_400Regular, SourceSerif4_600SemiBold, SourceSerif4_700Bold,
    Orbitron_700Bold, Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold,
    Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold,
  });
  const [s, setS] = useState<Settings | null>(null);
  const [view, setView] = useState<'journal' | 'settings'>('journal');
  const [preview, setPreview] = useState<ThemeId | null>(null);

  useEffect(() => { loadSettings().then(setS); }, []);
  useEffect(() => { if (fontsOk && s) SplashScreen.hideAsync().catch(() => {}); }, [fontsOk, s]);

  // Toucher la notification du matin ouvre directement le journal.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => setView('journal'));
    return () => sub.remove();
  }, []);

  // Bouton « retour » d'Android : des réglages vers le journal.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'settings') { setView('journal'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [view]);

  const update = useCallback((p: Partial<Settings>) => {
    setS(prev => { const n = { ...(prev as Settings), ...p }; saveSettings(n); return n; });
  }, []);

  if (!fontsOk || !s) return <View style={{ flex: 1, backgroundColor: '#F6F2EA', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#8C1C2B" /></View>;

  const themeId = !s.onboarded && preview ? preview : s.theme;
  return (
    <SafeAreaProvider>
      <ThemeProvider id={themeId}>
        <StatusBar style={THEMES[themeId].dark ? 'light' : 'dark'} />
        {!s.invited ? <Invite onOk={() => update({ invited: true })} />
          : !s.onboarded ? <Onboarding initial={s} onPreviewTheme={setPreview} onDone={n => { setS(n); saveSettings(n); setView('journal'); }} />
          : view === 'settings' ? <SettingsScreen s={s} update={update} onBack={() => setView('journal')} onReset={() => { setS({ ...DEFAULT_SETTINGS }); setPreview(null); setView('journal'); }} />
          : <JournalScreen settings={s} update={update} onSettings={() => setView('settings')} />}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
