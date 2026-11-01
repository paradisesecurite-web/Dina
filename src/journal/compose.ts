import type { Journal, JournalSection, RubriqueId, Settings } from '../types';
import { meteoSection, airSection, mareesSection } from '../sources/meteo';
import { newsSection, libreSection, evenementsSection, cineSection, bonneNouvelleSection, type Taste } from '../sources/actus';
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

export type BuildContext = { taste: Taste; cryptoNames: Record<string, string>; now?: Date };

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

async function remoteSection(id: RubriqueId, s: Settings, ctx: BuildContext, d: Date): Promise<JournalSection | null> {
  const n = s.length === 'flash' ? 3 : 6;
  const c = s.city;
  switch (id) {
    case 'meteo': return c ? meteoSection(c) : null;
    case 'air': return c ? airSection(c) : null;
    case 'marees': return c ? mareesSection(c) : null;
    case 'actu_france': case 'actu_monde': return newsSection(id, n, ctx.taste);
    case 'libre': return libreSection(s.freeTopics, s.length, ctx.taste);
    case 'evenements': return c ? evenementsSection(c.name, s.length, ctx.taste) : null;
    case 'cine': return cineSection(s.length, ctx.taste);
    case 'bonne_nouvelle': return bonneNouvelleSection(ctx.taste);
    case 'crypto': return cryptoSection(s.cryptos, ctx.cryptoNames);
    case 'bourse': return bourseSection(s.stocks);
    case 'musique': return musiqueSection(s.artists);
    case 'sport': return s.teams.length ? sportSection(s.teams, s.length, ctx.taste) : { id: 'sport', title: 'Sport', icon: '⚽', items: [{ id: 'sport-none', title: 'Choisis tes équipes dans les réglages', speech: '' }] };
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
  const order = s.rubriques;
  const results = await Promise.all(order.map(async id => {
    const local = localSection(id, s, d);
    if (local) return local;
    try {
      return await withTimeout(remoteSection(id, s, ctx, d), 15000);
    } catch {
      const m = rubriqueMeta(id);
      return { id, title: m.label, icon: m.icon, items: [{ id: `${id}-err`, title: 'Indisponible ce matin', detail: 'La source n\'a pas répondu. Réessaie plus tard.', speech: '' }] } as JournalSection;
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
export type Segment = { text: string; lang?: string; section: number; item: number };
export function toSegments(j: Journal, s: Settings): Segment[] {
  const out: Segment[] = [{ text: j.greeting, section: -1, item: -1 }];
  j.sections.forEach((sec, si) => {
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
