import type { Journal, JournalSection, RubriqueId, Settings } from '../types';
import { meteoSection, airSection, mareesSection } from '../sources/meteo';
import { newsSection, topicSection, evenementsSection, cineSection, bonneNouvelleSection, type Taste } from '../sources/actus';
import { cryptoSection, bourseSection } from '../sources/finance';
import { musiqueSection } from '../sources/musique';
import { sportSection } from '../sources/sport';
import { trafficSection, carburantSection } from '../sources/route';
import { saintSection, histoireSection } from '../sources/ephemeride';
import { CITATIONS } from '../data/citations';
import { PENSEES } from '../data/pensees';
import { LANGUES } from '../data/mots';
import { H_AMBIANCE, H_COEUR, H_TRAVAIL, H_CONSEIL } from '../data/horoscope';
import { seeded, pick, dayOfYear } from './random';
import { GREETINGS, OUTROS, TRANSITIONS, fill, toneLine } from './phrases';
import { rubriqueMeta } from './rubriques';

export type BuildContext = { taste: Taste; cryptoNames: Record<string, string>; now?: Date; forAI?: boolean };

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('délai dépassé')), ms))]);

// Nettoie les phrases quand le prénom est vide (« Bonjour . » -> « Bonjour. »).
const tidy = (t: string) => t.replace(/Bonjour\s+([.!])/, (_, p) => (p === '!' ? 'Bonjour !' : 'Bonjour.')).replace(/,\s*\./g, '.').replace(/,\s*!/g, ' !').replace(/\s{2,}/g, ' ').trim();

export function dateLabel(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function localSection(id: RubriqueId, s: Settings, d: Date): JournalSection | null {
  const day = dayOfYear(d);
  if (id === 'citation') {
    const [q, a] = CITATIONS[(day * 7 + d.getFullYear()) % CITATIONS.length];
    return { id, title: 'Citation du jour', icon: '💬', items: [{ id: `cit-${day}`, title: `« ${q} »`, detail: a, speech: `${q} ${a.startsWith('Attribué') || a.startsWith('Proverbe') || a.startsWith('Inscription') || a.startsWith('Devise') ? a : `Signé ${a}`}.` }] };
  }
  if (id === 'mot') {
    const lang = LANGUES[s.language] || LANGUES.anglais;
    const [w, tr, ex, exFr] = lang.mots[day % lang.mots.length];
    const word = w.replace(/\s*\(.*\)$/, '');
    const translit = (w.match(/\((.*)\)$/) || [])[1];
    return { id, title: `Mot du jour en ${lang.label}`, icon: '🗣️', items: [{
      id: `mot-${s.language}-${day}`, title: `${w} · ${tr}`, detail: `${ex} — ${exFr}`,
      speech: `Le mot du jour en ${lang.label} : ${translit || word}, qui veut dire ${tr}. Par exemple : ${exFr}`,
    }] };
  }
  if (id === 'horoscope') {
    if (!s.sign) return { id, title: 'Horoscope', icon: '✨', items: [{ id: 'horo-none', title: 'Choisis ton signe dans les réglages', speech: '' }] };
    const r = seeded(`${s.sign}-${d.toDateString()}`);
    const txt = [pick(H_AMBIANCE, r), pick(H_COEUR, r), pick(H_TRAVAIL, r), pick(H_CONSEIL, r)];
    return { id, title: `Horoscope · ${s.sign}`, icon: '✨', note: 'Pour le plaisir, sans aucune prétention scientifique.', items: [{ id: `horo-${day}`, title: txt[0], detail: txt.slice(1).join(' '), speech: `${s.sign} : ${txt.join(' ')}` }] };
  }
  return null;
}

// Quantité d'infos récupérées selon la durée choisie (2 à 60 minutes).
export const volume = (minutes: number) => ({
  news: Math.min(20, Math.max(3, Math.round(minutes / 2) + 2)),
  perTopic: Math.min(8, Math.max(1, Math.round(minutes / 6) + 1)),
  perFollow: Math.min(5, Math.max(1, Math.round(minutes / 10) + 1)),
});

async function remoteSection(id: RubriqueId, s: Settings, ctx: BuildContext, d: Date): Promise<JournalSection | null> {
  const v = volume(s.minutes || 10);
  const n = v.news;
  const c = s.city;
  switch (id) {
    case 'meteo': return c ? meteoSection(c) : null;
    case 'air': return c ? airSection(c) : null;
    case 'marees': return c ? mareesSection(c) : null;
    case 'actu_france': case 'actu_monde': return newsSection(id, n, ctx.taste);
    case 'libre': return null; // remplacé par une rubrique par sujet de veille
    case 'evenements': return c ? evenementsSection(c.name, s.length, ctx.taste) : null;
    case 'cine': return cineSection(s.length, ctx.taste);
    case 'bonne_nouvelle': return bonneNouvelleSection(ctx.taste, !!ctx.forAI);
    case 'crypto': return cryptoSection(s.cryptos, ctx.cryptoNames);
    case 'bourse': return bourseSection(s.stocks);
    case 'musique': return musiqueSection(s.artists);
    case 'sport': return sportSection(s.follows, v.perFollow, ctx.taste);
    case 'trafic': return s.commute ? trafficSection(s.commute) : { id: 'trafic', title: 'Ton trajet', icon: '🚗', items: [{ id: 'trafic-none', title: 'Indique ton trajet dans les réglages', speech: '' }] };
    case 'carburant': return c ? carburantSection(c, s.fuel) : null;
    case 'saint': return saintSection(d);
    case 'histoire': return histoireSection(d, s.length === 'flash' ? 1 : 2);
    default: return null;
  }
}

export async function buildJournal(s: Settings, ctx: BuildContext): Promise<Journal> {
  const d = ctx.now ?? new Date();
  const rnd = seeded(d.toDateString() + s.tone);
  const vars = { name: s.firstName || '', date: dateLabel(d) };
  // Ordre : rubriques choisies ; les sujets de veille prennent la place de « Tes sujets »
  // (ou se placent après l'actualité) ; les sujets prioritaires passent en tête.
  type Key = RubriqueId | `veille:${string}`;
  let order: Key[] = [...s.rubriques];
  const topicKeys = s.topics.map(t => `veille:${t.id}` as Key);
  const at = order.indexOf('libre');
  if (at >= 0) order.splice(at, 1, ...topicKeys);
  else { const after = Math.max(order.lastIndexOf('actu_monde'), order.lastIndexOf('actu_france'), order.indexOf('meteo')); order.splice(after + 1, 0, ...topicKeys); }
  const prio = order.filter(k => s.priorities.includes(k));
  const head = order.filter(k => k === 'meteo' && !prio.includes(k));
  order = [...head, ...prio, ...order.filter(k => !prio.includes(k) && !head.includes(k))];
  const v = volume(s.minutes || 10);
  const results = await Promise.all(order.map(async id => {
    if (id.startsWith('veille:')) {
      const t = s.topics.find(x => `veille:${x.id}` === id)!;
      try {
        const sec = await withTimeout(topicSection(t, v.perTopic, ctx.taste), 15000);
        return { ...sec, priority: s.priorities.includes(id) };
      } catch { return null; }
    }
    const rid = id as RubriqueId;
    const local = localSection(rid, s, d);
    if (local) return { ...local, priority: s.priorities.includes(rid) };
    try {
      const sec = await withTimeout(remoteSection(rid, s, ctx, d), 15000);
      return sec ? { ...sec, priority: s.priorities.includes(rid) } : null;
    } catch {
      const m = rubriqueMeta(rid);
      return { id: rid, title: m.label, icon: m.icon, items: [{ id: `${id}-err`, title: 'Indisponible ce matin', detail: 'La source n\'a pas répondu. Réessaie plus tard.', speech: '' }] } as JournalSection;
    }
  }));
  const sections: JournalSection[] = [];
  if (s.wellbeing === 'pensee') {
    const p = PENSEES[(dayOfYear(d) * 3) % PENSEES.length];
    sections.push({ id: 'bienetre', title: 'Pensée du matin', icon: '🌿', items: [{ id: 'pensee', title: p, speech: p }] });
  } else if (s.wellbeing === 'respiration') {
    sections.push({ id: 'bienetre', title: 'Une minute pour respirer', icon: '🌿', items: [{ id: 'respiration', title: 'Inspire 4 secondes, retiens 4 secondes, expire 6 secondes.', detail: 'Touche « Respirer » pour te laisser guider.', speech: '' }] });
  }
  for (const sec of results) {
    if (!sec || !sec.items.length) continue;
    const tr = TRANSITIONS[sec.id as string];
    sections.push({ ...sec, intro: tr ? toneLine(tr, s.tone, rnd) : undefined });
  }
  return {
    createdAt: d.toISOString(),
    dateLabel: dateLabel(d),
    greeting: tidy(fill(toneLine(GREETINGS, s.tone, rnd), vars)),
    sections,
    outro: tidy(fill(toneLine(OUTROS, s.tone, rnd), vars)),
  };
}

// Découpe le journal en phrases à lire, avec la position (rubrique, info).
export type Segment = { text: string; lang?: string; section: number; item: number; para?: number };
export function toSegments(j: Journal, s: Settings): Segment[] {
  const out: Segment[] = [{ text: j.greeting, section: -1, item: -1 }];
  j.sections.forEach((sec, si) => {
    if (sec.paragraphs) {
      sec.paragraphs.forEach((p, pi) => out.push({ text: p, section: si, item: -1, para: pi }));
      return;
    }
    if (sec.intro) out.push({ text: sec.intro, section: si, item: -1 });
    sec.items.forEach((it, ii) => {
      const t = (it.speech ?? it.title).trim();
      if (t) out.push({ text: t, section: si, item: ii });
      if (sec.id === 'mot' && it.title) {
        const lang = LANGUES[s.language];
        const ex = it.detail?.split(' — ')[0];
        if (lang && ex && lang.code !== 'ar') out.push({ text: ex, lang: lang.code, section: si, item: ii });
      }
    });
  });
  out.push({ text: j.outro, section: j.sections.length, item: -1 });
  return out;
}
