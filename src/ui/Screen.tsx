import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme';
import { Backdrop } from './decor';

export function Screen({ children, scroll = true, footer, refreshControl }: { children: React.ReactNode; scroll?: boolean; footer?: React.ReactNode; refreshControl?: ScrollViewProps['refreshControl'] }) {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const pad = { paddingTop: ins.top + 16, paddingHorizontal: 18, paddingBottom: (footer ? 16 : ins.bottom + 24) };
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Backdrop />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll
          ? <ScrollView contentContainerStyle={[pad, { maxWidth: 680, width: '100%', alignSelf: 'center' }]} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>{children}</ScrollView>
          : <View style={[{ flex: 1 }, pad]}>{children}</View>}
        {footer ? <View style={{ paddingHorizontal: 18, paddingBottom: ins.bottom + 12, paddingTop: 8, maxWidth: 680, width: '100%', alignSelf: 'center' }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  );
}
