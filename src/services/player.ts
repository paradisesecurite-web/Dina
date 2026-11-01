import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';
import type { Settings, Tone } from '../types';
import type { Segment } from '../journal/compose';

// Lecteur à voix haute : enchaîne les phrases du journal avec la voix du téléphone.
// Android ne sait pas « mettre en pause » une phrase : on s'arrête et on reprend
// au début de la phrase en cours.

type State = { status: 'idle' | 'playing' | 'paused'; index: number; total: number; current?: Segment };
let state: State = { status: 'idle', index: 0, total: 0 };
let segments: Segment[] = [];
let opts: { tone: Tone; rate: number; voice?: string } = { tone: 'journaliste', rate: 1 };
let token = 0;
const subs = new Set<() => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach(f => f()); };

export const TONE_VOICE: Record<Tone, { rate: number; pitch: number }> = {
  calme: { rate: 0.88, pitch: 0.95 },
  assistant: { rate: 1.0, pitch: 1.06 },
  journaliste: { rate: 1.06, pitch: 1.0 },
};

function speakAt(i: number) {
  const my = ++token;
  if (i >= segments.length) { set({ status: 'idle', index: 0, current: undefined }); return; }
  const seg = segments[i];
  set({ status: 'playing', index: i, current: seg });
  const tv = TONE_VOICE[opts.tone];
  Speech.speak(seg.text, {
    language: seg.lang ?? 'fr-FR',
    voice: seg.lang ? undefined : opts.voice,
    rate: tv.rate * opts.rate,
    pitch: tv.pitch,
    onDone: () => { if (my === token) setTimeout(() => my === token && speakAt(i + 1), seg.item === -1 ? 350 : 220); },
    onError: () => { if (my === token) speakAt(i + 1); },
  });
}

export const player = {
  load(segs: Segment[], s: Pick<Settings, 'tone' | 'rate' | 'voiceId'>) {
    this.stop();
    segments = segs;
    opts = { tone: s.tone, rate: s.rate, voice: s.voiceId };
    set({ total: segs.length, index: 0, status: 'idle', current: undefined });
  },
  play(from?: number) { speakAt(from ?? (state.status === 'paused' ? state.index : 0)); },
  pause() { token++; Speech.stop(); set({ status: 'paused' }); },
  stop() { token++; Speech.stop(); set({ status: 'idle', index: 0, current: undefined }); },
  next() { const i = state.index; let j = i + 1; while (j < segments.length && segments[j].section === segments[i].section) j++; token++; Speech.stop(); speakAt(j); },
  prev() { const i = state.index; const sec = segments[i]?.section; let j = i; while (j > 0 && segments[j - 1].section === sec) j--; if (j === i && j > 0) { const s2 = segments[j - 1].section; while (j > 0 && segments[j - 1].section === s2) j--; } token++; Speech.stop(); speakAt(j); },
  playSection(section: number) { const j = segments.findIndex(s => s.section === section); if (j >= 0) { token++; Speech.stop(); speakAt(j); } },
  say(text: string, s: Pick<Settings, 'tone' | 'rate' | 'voiceId'>) {
    token++; Speech.stop(); const tv = TONE_VOICE[s.tone];
    Speech.speak(text, { language: 'fr-FR', voice: s.voiceId, rate: tv.rate * s.rate, pitch: tv.pitch });
  },
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
