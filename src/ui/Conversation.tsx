import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import type { Settings } from '../types';
import { askAI } from '../services/ai';
import { player } from '../services/player';
import { Btn, Card, Field, Gap, Txt, IconBtn } from './kit';
import { VoiceOrb } from './decor';
import { useTheme } from './theme';
import { Icon } from './icons';

// Ce que l'on peut dire pendant l'écoute.
const CMD_NEXT = /^(next|suivant|la suite|passe|on passe|zappe|ça m'intéresse pas|ca m'interesse pas|pas intéressée?|ça ne m'intéresse pas|sujet suivant)\b/i;
const CMD_PAUSE = /^(stop|pause|arrête|arrete|tais-toi|chut)\b/i;
const CMD_RESUME = /^(reprends|reprend|continue|vas-y|vas y|c'est bon|ok merci|merci)\b/i;
const CMD_REPEAT = /(répète|repete|redis|recommence)/i;

export type ConvoHandlers = { onNext: () => void; onPause: () => void; onResume: () => void; onRepeat: () => void; context: () => string };

export function Conversation({ visible, onClose, s, h, startWithKeyboard }: { visible: boolean; onClose: (resume: boolean) => void; s: Settings; h: ConvoHandlers; startWithKeyboard?: boolean }) {
  const t = useTheme();
  const [mode, setMode] = useState<'listening' | 'thinking' | 'answer' | 'typing' | 'error'>('listening');
  const [heard, setHeard] = useState('');
  const [answer, setAnswer] = useState<{ text: string; sources: { title: string; url: string }[] } | null>(null);
  const [msg, setMsg] = useState('');
  const [typed, setTyped] = useState('');
  const history = useRef<{ q: string; a: string }[]>([]);
  const handled = useRef(false);

  const listen = async () => {
    handled.current = false; setHeard(''); setAnswer(null); setMsg('');
    if (Platform.OS === 'web') { setMode('typing'); return; }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) { setMsg('Micro non autorisé : tu peux écrire ta question.'); setMode('typing'); return; }
      setMode('listening');
      ExpoSpeechRecognitionModule.start({ lang: 'fr-FR', interimResults: true, continuous: false, maxAlternatives: 1 });
    } catch { setMsg('La reconnaissance vocale n\'est pas disponible : écris ta question.'); setMode('typing'); }
  };

  useEffect(() => {
    if (!visible) return;
    if (startWithKeyboard) { setMode('typing'); setAnswer(null); setMsg(''); } else listen();
    return () => { try { ExpoSpeechRecognitionModule.abort(); } catch {} };
  }, [visible]);

  useSpeechRecognitionEvent('result', e => {
    const txt = e.results[0]?.transcript ?? '';
    setHeard(txt);
    if (e.isFinal && !handled.current && txt.trim()) { handled.current = true; handle(txt.trim()); }
  });
  useSpeechRecognitionEvent('error', e => {
    if (handled.current || !visible) return;
    setMsg(e.error === 'no-speech' || e.error === 'speech-timeout' ? 'Je n\'ai rien entendu. Réessaie ou écris ta question.' : 'Je n\'ai pas bien compris. Réessaie ou écris ta question.');
    setMode('error');
  });

  const handle = async (text: string) => {
    if (CMD_NEXT.test(text)) { h.onNext(); onClose(false); return; }
    if (CMD_PAUSE.test(text)) { h.onPause(); onClose(false); return; }
    if (CMD_RESUME.test(text)) { onClose(true); return; }
    if (CMD_REPEAT.test(text)) { h.onRepeat(); onClose(false); return; }
    if (s.tier === 'gratuit') { setMsg('Les questions demandent une formule avec IA (Standard ou Premium).'); setMode('error'); return; }
    setMode('thinking');
    try {
      const r = await askAI(s, text, h.context(), history.current);
      history.current = [...history.current, { q: text, a: r.text }].slice(-6);
      setAnswer(r); setMode('answer');
      player.sayOnce(r.text, s, () => {});
    } catch (e: any) {
      setMsg(e?.status === 429 ? 'Tu as posé toutes tes questions du jour. On reprend le journal ?' : 'Je n\'arrive pas à joindre l\'IA pour le moment.');
      setMode('error');
    }
  };

  const close = (resume: boolean) => { try { ExpoSpeechRecognitionModule.abort(); } catch {} player.stop(); onClose(resume); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => close(true)} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 34, maxHeight: '86%', borderTopWidth: t.id === 'futur' ? 1 : 0, borderColor: t.colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt v="label" color={t.colors.accent} style={{ flex: 1 }}>{mode === 'listening' ? 'Je t\'écoute' : mode === 'thinking' ? 'Je cherche…' : mode === 'answer' ? 'Réponse' : 'Ta question'}</Txt>
            <IconBtn name="close" size={38} label="Fermer" onPress={() => close(true)} />
          </View>
          <ScrollView style={{ marginTop: 8 }} keyboardShouldPersistTaps="handled">
            {(mode === 'listening' || mode === 'thinking') ? (
              <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                <VoiceOrb active={mode === 'thinking'} listening={mode === 'listening'} size={130} />
                <Gap h={14} />
                <Txt v="lead" center>{heard || (mode === 'listening' ? 'Pose ta question… ou dis « suivant », « pause », « reprends ».' : '')}</Txt>
                {mode === 'thinking' ? <><Gap /><ActivityIndicator color={t.colors.accent} /></> : null}
              </View>
            ) : null}
            {mode === 'answer' && answer ? (
              <View>
                {heard ? <Txt v="small" style={{ fontStyle: 'italic' }}>« {heard} »</Txt> : null}
                <Gap h={8} />
                <Card><Txt v="lead" selectable>{answer.text}</Txt></Card>
                {answer.sources.length ? (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    <Txt v="label">Sources</Txt>
                    {answer.sources.map(src => (
                      <Pressable key={src.url} onPress={() => Linking.openURL(src.url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="external" size={14} color={t.colors.accent} />
                        <Txt v="small" color={t.colors.accent} numberOfLines={1} style={{ flex: 1 }}>{src.title}</Txt>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            {(mode === 'typing' || mode === 'error') ? (
              <View>
                {msg ? <><Txt>{msg}</Txt><Gap h={10} /></> : null}
                <Field icon="keyboard" value={typed} onChangeText={setTyped} placeholder="Ex. : explique-moi ce sujet plus en détail" autoFocus={mode === 'typing'} onSubmitEditing={() => typed.trim() && (handle(typed.trim()), setHeard(typed.trim()), setTyped(''))} returnKeyType="send" accessibilityLabel="Ta question" />
              </View>
            ) : null}
          </ScrollView>
          <Gap h={14} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {mode === 'typing' || mode === 'error'
              ? <Btn kind="secondary" icon="send" label="Envoyer" disabled={!typed.trim()} onPress={() => { const q = typed.trim(); setHeard(q); setTyped(''); handle(q); }} style={{ flex: 1 }} />
              : <Btn kind="secondary" icon="mic" label="Reparler" onPress={listen} style={{ flex: 1 }} />}
            <Btn icon="play" label="Reprendre" onPress={() => close(true)} style={{ flex: 1 }} />
          </View>
          {mode !== 'typing' ? <Pressable onPress={() => { try { ExpoSpeechRecognitionModule.abort(); } catch {} setMode('typing'); }} style={{ alignSelf: 'center', marginTop: 12 }}><Txt v="small" color={t.colors.accent}>Écrire plutôt</Txt></Pressable> : null}
        </View>
      </View>
    </Modal>
  );
}
