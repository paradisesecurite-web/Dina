import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, preload, type AudioPlayer } from 'expo-audio';
import { useSyncExternalStore } from 'react';
import type { Settings, Style, Tone } from '../types';
import type { Segment } from '../journal/compose';
import { ttsSource } from './ai';

// Lecteur du journal : voix IA (serveur) quand elle est disponible, sinon voix du téléphone.
// La voix IA se met vraiment en pause ; la voix du téléphone reprend au début de la phrase.

type Engine = 'ai' | 'device';
type State = { status: 'idle' | 'loading' | 'playing' | 'paused'; index: number; total: number; current?: Segment; engine: Engine; notice?: string };
let state: State = { status: 'idle', index: 0, total: 0, engine: 'device' };
let segments: Segment[] = [];
let settings: Settings | null = null;
let aiCharsLeft = 0;
let token = 0;
let audio: AudioPlayer | null = null;
let audioSub: { remove(): void } | null = null;
let loadTimer: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<() => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach(f => f()); };

export const TONE_VOICE: Record<Tone, { rate: number; pitch: number }> = {
  calme: { rate: 0.9, pitch: 0.97 },
  assistant: { rate: 1.0, pitch: 1.04 },
  journaliste: { rate: 1.04, pitch: 1.0 },
};
export const toneOf = (st: Style): Tone => (st === 'zen' ? 'calme' : st === 'assistant' ? 'assistant' : 'journaliste');

let audioModeSet = false;
async function ensureAudioMode() {
  if (audioModeSet || Platform.OS === 'web') return;
  audioModeSet = true;
  try { await setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: 'doNotMix', playsInSilentMode: true } as any); } catch {}
}

function cleanupAudio() {
  if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
  audioSub?.remove(); audioSub = null;
  try { audio?.pause(); } catch {}
}

function next(i: number, my: number, pause = 220) {
  setTimeout(() => { if (my === token) speakAt(i + 1); }, pause);
}

function playDevice(i: number, my: number) {
  const seg = segments[i];
  const s = settings!;
  const tv = TONE_VOICE[toneOf(s.style)];
  set({ status: 'playing', engine: 'device' });
  Speech.speak(seg.text, {
    language: seg.lang ?? 'fr-FR', voice: seg.lang ? undefined : s.voiceId, rate: tv.rate * s.rate, pitch: tv.pitch,
    onDone: () => { if (my === token) next(i, my, seg.para === undefined && seg.item === -1 ? 350 : 220); },
    onError: () => { if (my === token) next(i, my); },
  });
}

function playAI(i: number, my: number) {
  const seg = segments[i];
  const s = settings!;
  cleanupAudio();
  const src = ttsSource(s, seg.text);
  if (!audio) audio = createAudioPlayer(src);
  else audio.replace(src);
  set({ status: 'loading', engine: 'ai' });
  let started = false;
  // Si la voix IA ne répond pas (réseau, limite atteinte), on bascule sur la voix du téléphone.
  loadTimer = setTimeout(() => {
    if (my !== token || started) return;
    aiCharsLeft = 0;
    set({ notice: 'Voix IA indisponible : je continue avec la voix du téléphone.' });
    cleanupAudio(); playDevice(i, my);
  }, 20000);
  audioSub = audio.addListener('playbackStatusUpdate', st => {
    if (my !== token) return;
    if (st.playing && !started) { started = true; if (loadTimer) clearTimeout(loadTimer); set({ status: 'playing' }); }
    if (st.didJustFinish) { cleanupAudio(); next(i, my, 120); }
  });
  audio.play();
  aiCharsLeft -= seg.text.length;
  // Prépare la phrase suivante pour éviter les blancs.
  const nx = segments[i + 1];
  if (nx && !nx.lang && aiCharsLeft > nx.text.length) preload(ttsSource(s, nx.text)).catch(() => {});
}

function speakAt(i: number) {
  const my = ++token;
  cleanupAudio();
  if (i >= segments.length) { set({ status: 'idle', index: 0, current: undefined }); return; }
  const seg = segments[i];
  set({ index: i, current: seg });
  const useAI = Platform.OS !== 'web' && !seg.lang && aiCharsLeft >= seg.text.length && settings!.tier !== 'gratuit';
  if (!useAI && state.engine === 'ai' && aiCharsLeft < seg.text.length && settings!.tier !== 'gratuit') set({ notice: 'Temps de voix IA du jour atteint : je continue avec la voix du téléphone.' });
  if (useAI) playAI(i, my); else playDevice(i, my);
}

export const player = {
  async load(segs: Segment[], s: Settings, voiceCharsLeft: number) {
    this.stop();
    segments = segs; settings = s; aiCharsLeft = voiceCharsLeft;
    await ensureAudioMode();
    set({ total: segs.length, index: 0, status: 'idle', current: undefined, notice: undefined, engine: voiceCharsLeft > 0 ? 'ai' : 'device' });
  },
  setSettings(s: Settings) { settings = s; },
  play(from?: number) {
    if (from === undefined && state.status === 'paused' && state.engine === 'ai' && audio) {
      token++; const my = token; const i = state.index;
      set({ status: 'playing' });
      audioSub?.remove();
      audioSub = audio.addListener('playbackStatusUpdate', st => { if (my === token && st.didJustFinish) { cleanupAudio(); next(i, my, 120); } });
      audio.play(); return;
    }
    speakAt(from ?? (state.status === 'paused' ? state.index : 0));
  },
  pause() {
    token++;
    if (state.engine === 'ai' && audio) { if (loadTimer) clearTimeout(loadTimer); audio.pause(); } else Speech.stop();
    set({ status: 'paused' });
  },
  stop() { token++; cleanupAudio(); Speech.stop(); set({ status: 'idle', index: 0, current: undefined }); },
  // Passe à la rubrique suivante (renvoie la rubrique quittée).
  next(): number { const i = state.index; const sec = segments[i]?.section; let j = i + 1; while (j < segments.length && segments[j].section === sec) j++; speakAt(j); return sec; },
  prev() { const i = state.index; const sec = segments[i]?.section; let j = i; while (j > 0 && segments[j - 1].section === sec) j--; if (j === i && j > 0) { const s2 = segments[j - 1].section; while (j > 0 && segments[j - 1].section === s2) j--; } speakAt(j); },
  playSection(section: number) { const j = segments.findIndex(x => x.section === section); if (j >= 0) speakAt(j); },
  // Lit un texte isolé (réponse à une question), puis appelle onEnd.
  sayOnce(text: string, s: Settings, onEnd?: () => void) {
    token++; const my = token; cleanupAudio(); Speech.stop();
    const useAI = Platform.OS !== 'web' && aiCharsLeft >= text.length && s.tier !== 'gratuit';
    const done = () => { if (my === token) onEnd?.(); };
    if (useAI) {
      const src = ttsSource(s, text);
      if (!audio) audio = createAudioPlayer(src); else audio.replace(src);
      aiCharsLeft -= text.length;
      audioSub = audio.addListener('playbackStatusUpdate', st => { if (st.didJustFinish) { cleanupAudio(); done(); } });
      audio.play();
    } else {
      const tv = TONE_VOICE[toneOf(s.style)];
      Speech.speak(text, { language: 'fr-FR', voice: s.voiceId, rate: tv.rate * s.rate, pitch: tv.pitch, onDone: done, onError: done });
    }
  },
  say(text: string, s: Settings) { this.sayOnce(text, { ...s, tier: 'gratuit' }); },
  clearNotice() { set({ notice: undefined }); },
  get: () => state,
};

export function usePlayer() {
  return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => state, () => state);
}

export async function frenchVoices(): Promise<{ id: string; name: string; quality: string }[]> {
  try {
    const v = await Speech.getAvailableVoicesAsync();
    return v.filter(x => x.language?.toLowerCase().startsWith('fr')).map(x => ({ id: x.identifier, name: x.name, quality: String(x.quality) }));
  } catch { return []; }
}
