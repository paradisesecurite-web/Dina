import { API_URL, INVITE_CODES } from '../config';
import type { Journal, JournalItem, JournalSection, Settings } from '../types';

// Échanges avec le petit serveur Matinal (IA Claude + voix IA). Les clés restent sur le serveur.

const headers = (s: Settings) => ({ 'content-type': 'application/json', 'x-invite-code': INVITE_CODES[0], 'x-device-id': s.deviceId });

async function post<T>(s: Settings, path: string, body: unknown, timeoutMs = 180000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(API_URL + path, { method: 'POST', headers: headers(s), body: JSON.stringify(body), signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || `Erreur ${r.status}`), { status: r.status });
    return j as T;
  } finally { clearTimeout(t); }
}

export type ServerStatus = { usage: { journals: number; ttsChars: number; questions: number }; tiers: Record<string, { label: string; price: string; aiVoiceMinutesPerDay: number; questionsPerDay: number; journalsPerDay: number }>; charsPerMinute: number };
export async function serverStatus(s: Settings): Promise<ServerStatus | null> {
  try {
    const r = await fetch(API_URL + '/v1/status', { headers: headers(s) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

export function aiVoiceCharsLeft(st: ServerStatus | null, s: Settings): number {
  if (!st || s.tier === 'gratuit') return 0;
  const t = st.tiers[s.tier];
  return Math.max(0, t.aiVoiceMinutesPerDay * st.charsPerMinute - st.usage.ttsChars);
}

// Adresse de la voix IA pour un texte (lue directement par le lecteur audio du téléphone).
export function ttsSource(s: Settings, text: string) {
  const q = new URLSearchParams({ text, style: s.style, voice: s.aiVoice, tier: s.tier, speed: String(s.rate) });
  return { uri: `${API_URL}/v1/tts?${q.toString()}`, headers: { 'x-invite-code': INVITE_CODES[0], 'x-device-id': s.deviceId } };
}

// Une info est « à résumer » si elle vient d'un média (elle a des mots-clés) ; sinon c'est une donnée.
const isNews = (it: JournalItem) => !!it.keywords?.length;

export async function writeWithAI(s: Settings, j: Journal): Promise<Journal> {
  let n = 0;
  const byN = new Map<number, JournalItem>();
  const kept = j.sections.filter(sec => !(sec.id === 'bienetre' && sec.items[0]?.id === 'respiration'));
  const input = kept.map(sec => {
    const facts = sec.items.filter(i => !isNews(i) && (i.speech ?? i.title)).map(i => `${i.title}${i.detail ? ` (${i.detail})` : ''}. ${i.speech ?? ''}`).join('\n');
    const items = sec.items.filter(isNews).map(i => { n++; byN.set(n, i); return { n, source: i.source, title: i.title, desc: i.desc }; });
    return { id: sec.id, title: sec.title, priority: !!sec.priority, facts: facts || undefined, items };
  });
  const out = await post<{ intro: string; outro: string; model: string; sections: { id: string; title: string; paragraphs: string[]; sources: number[] }[] }>(s, '/v1/journal', {
    tier: s.tier,
    profile: { firstName: s.firstName, city: s.city?.name, style: s.style, minutes: s.minutes, date: j.dateLabel },
    dislikes: s.dislikes,
    sections: input,
  });
  const sections: JournalSection[] = [];
  const breath = j.sections.find(sec => sec.id === 'bienetre' && sec.items[0]?.id === 'respiration');
  if (breath) sections.push(breath);
  for (const a of out.sections) {
    const tpl = kept.find(x => x.id === a.id);
    if (!tpl || !a.paragraphs.length) continue;
    const sources = a.sources.map(k => byN.get(k)).filter(Boolean) as JournalItem[];
    const actions = tpl.items.filter(i => i.action && !sources.includes(i));
    sections.push({ id: tpl.id, title: tpl.title, icon: tpl.icon, note: tpl.note, priority: tpl.priority, paragraphs: a.paragraphs, items: [...sources, ...actions] });
  }
  return { ...j, greeting: out.intro || j.greeting, outro: out.outro || j.outro, sections, ai: { model: out.model } };
}

export async function askAI(s: Settings, question: string, context: string, history: { q: string; a: string }[]) {
  return post<{ text: string; sources: { title: string; url: string }[] }>(s, '/v1/ask', { tier: s.tier, style: s.style, question, context, history }, 60000);
}
