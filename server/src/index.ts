import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { TIERS, CHARS_PER_MINUTE, type TierId } from './tiers';

export interface Env {
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  INVITE_CODES: string;
  QUOTA: KVNamespace;
}

// ---------- outils ----------
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
});
const fail = (status: number, message: string) => json({ error: message }, status);
const today = () => new Date().toISOString().slice(0, 10);

type Usage = { journals: number; ttsChars: number; questions: number };
async function getUsage(env: Env, device: string): Promise<Usage> {
  return (await env.QUOTA.get<Usage>(`u:${device}:${today()}`, 'json')) ?? { journals: 0, ttsChars: 0, questions: 0 };
}
async function addUsage(env: Env, device: string, u: Usage) {
  await env.QUOTA.put(`u:${device}:${today()}`, JSON.stringify(u), { expirationTtl: 3 * 86400 });
}

function auth(req: Request, env: Env) {
  const code = (req.headers.get('x-invite-code') || '').trim().toUpperCase();
  const device = (req.headers.get('x-device-id') || '').trim();
  const codes = env.INVITE_CODES.split(',').map(c => c.trim().toUpperCase());
  if (!codes.includes(code)) return { error: fail(401, 'Code d\'invitation inconnu.') };
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(device)) return { error: fail(400, 'Identifiant d\'appareil manquant.') };
  return { device };
}

function tierOf(body: any): TierId {
  return body?.tier === 'premium' || body?.tier === 'standard' ? body.tier : 'gratuit';
}

const STYLES: Record<string, { write: string; voice: string }> = {
  chaleureux: { write: 'chaleureux, bienveillant et complice, comme un ami très bien informé qui te raconte l\'actualité autour d\'un café', voice: 'Voix chaleureuse, souriante et bienveillante, rythme naturel, comme une animatrice de radio du matin qui parle à un ami.' },
  decale: { write: 'décalé, avec de l\'humour léger et quelques touches d\'ironie bienveillante (jamais sur les sujets graves : là, tu restes sobre)', voice: 'Voix pétillante et complice, avec une pointe d\'humour dans l\'intonation, rythme vivant.' },
  pro: { write: 'très professionnel, carré et factuel, phrases nettes, façon flash info d\'une grande radio', voice: 'Voix de journaliste radio professionnelle, claire, posée et assurée, diction nette.' },
  zen: { write: 'calme, posé et apaisant, phrases douces, sans dramatiser', voice: 'Voix calme, douce et apaisante, débit lent, beaucoup de sérénité.' },
  energique: { write: 'énergique et enthousiaste, rythmé, façon matinale radio dynamique', voice: 'Voix énergique et enthousiaste, rythme soutenu, très souriante.' },
  assistant: { write: 'précis et efficace, façon assistant personnel intelligent, avec une pointe de chaleur', voice: 'Voix d\'assistant intelligent, claire, précise et légèrement futuriste, calme et assurée.' },
};

// ---------- rédaction du journal ----------
const JournalSchema = z.object({
  intro: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    paragraphs: z.array(z.string()),
    sources: z.array(z.number()),
  })),
  outro: z.string(),
});

type InItem = { n: number; source?: string; title: string; desc?: string; url?: string };
type InSection = { id: string; title: string; priority?: boolean; facts?: string; items?: InItem[] };

const SYSTEM_JOURNAL = `Tu es « Matinal », la voix d'un journal radio du matin entièrement personnalisé, en français.
Ta mission : à partir des informations fournies (titres et résumés de plusieurs médias, données météo, chiffres…), écrire le texte qui sera LU À VOIX HAUTE par une voix de synthèse.

Règles d'écriture :
- Écris pour l'oreille : phrases fluides, transitions naturelles entre les sujets, aucune liste, aucun tiret, aucun emoji, aucun titre lu « à la récitation ».
- Raconte et explique chaque sujet avec tes propres mots : qui, quoi, pourquoi c'est important. Regroupe les articles qui parlent du même événement et croise les sources.
- Ne recopie jamais les phrases des articles. Ne cite pas les médias à chaque phrase ; mentionne une source seulement si c'est utile (« selon Le Monde… »).
- N'invente AUCUN fait, chiffre, date, nom, score, résultat ou citation absent des informations fournies. Ne déduis jamais l'issue d'un match, d'un vote ou d'un procès si elle n'est pas écrite noir sur blanc. Tu peux ajouter du contexte général bien établi (définition, rappel historique connu) pour aider à comprendre.
- Dans une rubrique, ignore les informations qui ne correspondent pas vraiment à son sujet (par exemple du football dans une rubrique « e-sport »).
- Si les informations sont maigres pour un sujet, n'invente rien : développe plutôt le contexte général, les enjeux et ce qu'il faut savoir pour comprendre (sans ajouter de faits d'actualité non fournis).
- Écris les nombres comme ils se disent (« vingt-trois degrés », « deux virgule cinq pour cent ») quand c'est plus naturel à l'oral, et écris en toutes lettres les sigles difficiles à prononcer.
- Tutoie TOUJOURS l'auditeur, quel que soit le ton (même « professionnel »). Utilise son prénom une ou deux fois au maximum.
- Respecte l'ordre des rubriques et la longueur indiquée pour chacune. La LONGUEUR TOTALE est importante : l'auditeur a choisi une durée, vise le nombre de mots total demandé (à 15 % près). Pour un journal court, une ou deux phrases suffisent pour les rubriques secondaires. Pour un journal long (plus de 10 minutes), c'est une vraie émission : développe chaque sujet important en plusieurs paragraphes, explique le contexte, les enjeux, les réactions, les chiffres fournis, et fais des liens entre les sujets. Ne rends JAMAIS un texte deux fois plus court que demandé.
- Rubrique « bonne_nouvelle » : choisis uniquement une info vraiment positive ou réjouissante (solidarité, découverte, réussite, nature, insolite qui fait sourire). Ignore les faits divers tristes ou les conseils pratiques. S'il n'y a rien de vraiment positif, dis une courte pensée positive à la place.
- Rubriques horoscope, citation, mot du jour, saint du jour : présente-les avec légèreté.
- Pour chaque rubrique, renvoie dans "sources" les numéros [n] des informations réellement utilisées.
- "paragraphs" : découpe chaque rubrique en paragraphes de 2 à 5 phrases (chaque paragraphe sera lu d'une traite).`;

function budgets(sections: InSection[], minutes: number) {
  const total = Math.max(220, Math.round(minutes * 150));
  const base: Record<string, number> = { actu_france: 3, actu_monde: 3, libre: 2, sport: 2, meteo: 1, bonne_nouvelle: 1, histoire: 1, bourse: 1, crypto: 1, musique: 1, cine: 1.5, evenements: 1.5 };
  const w = sections.map(s => (base[s.id] ?? (s.id.startsWith('veille') ? 2 : 0.6)) * (s.priority ? 2 : 1));
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  return sections.map((_, i) => Math.max(minutes <= 5 ? 12 : 25, Math.round((total - 60) * w[i] / sum)));
}

function sectionText(s: InSection, words: number) {
  const lines = [`### Rubrique id="${s.id}" titre="${s.title}"${s.priority ? ' (PRIORITAIRE)' : ''} — longueur visée : ${words} mots`];
  if (s.facts) lines.push(s.facts);
  for (const it of s.items ?? []) lines.push(`[${it.n}] ${it.source ? `(${it.source}) ` : ''}${it.title}${it.desc ? ` — ${it.desc}` : ''}`);
  return lines.join('\n');
}

async function writeJournal(env: Env, model: string, body: any) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const p = body.profile ?? {};
  const sections: InSection[] = (body.sections ?? []).slice(0, 40);
  const minutes = Math.min(60, Math.max(2, Number(p.minutes) || 10));
  const words = budgets(sections, minutes);
  const style = STYLES[p.style] ?? STYLES.chaleureux;
  // Les journaux longs sont écrits en plusieurs morceaux en parallèle (plus rapide).
  const groups: { s: InSection; w: number }[][] = [[]];
  let acc = 0;
  sections.forEach((s, i) => {
    // Parties d'environ 600 mots : l'IA tient bien la longueur demandée sur des textes courts.
    if (acc >= 600 && groups[groups.length - 1].length) { groups.push([]); acc = 0; }
    groups[groups.length - 1].push({ s, w: words[i] }); acc += words[i];
  });
  const profile = `Auditeur : ${p.firstName || 'sans prénom'}${p.city ? `, habite à ${p.city}` : ''}. Date : ${p.date || today()}.
Ton demandé : ${style.write}.
Tutoie l'auditeur (tu, ton, toi) : n'utilise jamais « vous » ni « votre » pour t'adresser à lui.
Durée totale visée : environ ${minutes} minutes, soit environ ${Math.round(minutes * 150)} mots au total pour l'ensemble du journal${groups.length > 1 ? ' (toutes parties confondues)' : ''}.
${(body.dislikes ?? []).length ? `Sujets qui ne l'intéressent pas (à éviter ou à survoler) : ${body.dislikes.slice(0, 30).join(', ')}.` : ''}
${(body.likes ?? []).length ? `Sujets qu'il apprécie : ${body.likes.slice(0, 30).join(', ')}.` : ''}`;
  const isSonnet = model.startsWith('claude-sonnet');
  const results = await Promise.all(groups.map(async (g, gi) => {
    const target = g.reduce((n, x) => n + x.w, 0);
    const part = groups.length > 1
      ? `\nCe texte est la partie ${gi + 1} sur ${groups.length} du journal (les autres parties sont écrites à part). Cette partie doit faire environ ${target} mots au total. ${gi === 0 ? 'Écris une introduction courte (salutation, date).' : 'Ne salue pas et ne refais pas d\'introduction : "intro" doit être vide ; enchaîne directement par une transition naturelle.'} ${gi === groups.length - 1 ? 'Écris une conclusion chaleureuse.' : '"outro" doit être vide.'}`
      : `\nLe journal complet doit faire environ ${target} mots.`;
    const res = await client.beta.messages.parse({
      model,
      max_tokens: 16000,
      ...(isSonnet ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      output_config: { effort: 'low', format: betaZodOutputFormat(JournalSchema) },
      system: SYSTEM_JOURNAL,
      messages: [{ role: 'user', content: `${profile}${part}\n\nInformations du jour, rubrique par rubrique :\n\n${g.map(x => sectionText(x.s, x.w)).join('\n\n')}` }],
    });
    if (res.stop_reason === 'refusal' || !res.parsed_output) throw new Error('rédaction impossible');
    return { out: res.parsed_output, usage: res.usage };
  }));
  return {
    intro: results[0].out.intro,
    sections: results.flatMap(r => r.out.sections),
    outro: results[results.length - 1].out.outro,
    usage: results.reduce((a, r) => ({ input: a.input + r.usage.input_tokens, output: a.output + r.usage.output_tokens }), { input: 0, output: 0 }),
  };
}

// ---------- questions pendant l'écoute ----------
const SYSTEM_ASK = `Tu es « Matinal », l'assistant vocal d'un journal du matin. L'auditeur t'interrompt pour poser une question pendant l'écoute.
Réponds en français, à l'oral (aucune liste, aucun emoji, aucun lien), de façon claire et concise : 3 à 6 phrases, sauf si on te demande plus de détails.
Appuie-toi d'abord sur le contexte du journal fourni. Si la question demande des informations plus récentes ou plus précises, fais une recherche web.
Si tu n'es pas sûr, dis-le simplement. Tutoie l'auditeur. Termine sans proposer de relancer la discussion.`;

async function answer(env: Env, model: string, body: any) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const isSonnet = model.startsWith('claude-sonnet');
  const style = STYLES[body.style] ?? STYLES.chaleureux;
  const history = (body.history ?? []).slice(-6).flatMap((h: any) => [
    { role: 'user' as const, content: String(h.q).slice(0, 800) },
    { role: 'assistant' as const, content: String(h.a).slice(0, 2000) },
  ]);
  const res = await client.beta.messages.create({
    model,
    max_tokens: 4000,
    ...(isSonnet ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    output_config: { effort: 'low' },
    system: `${SYSTEM_ASK}\nTon : ${style.write}.\n\nContexte — rubrique en cours d'écoute :\n${String(body.context ?? '').slice(0, 6000)}`,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 2, user_location: { type: 'approximate', country: 'FR', timezone: 'Europe/Paris' } }],
    messages: [...history, { role: 'user', content: String(body.question ?? '').slice(0, 800) }],
  });
  if (res.stop_reason === 'refusal') return { text: 'Désolé, je ne peux pas répondre à cette question.', sources: [] };
  let text = '';
  const sources: { title: string; url: string }[] = [];
  for (const b of res.content) {
    if (b.type === 'text') {
      text += b.text;
      for (const c of (b as any).citations ?? []) if (c.url && !sources.some(s => s.url === c.url)) sources.push({ title: c.title || c.url, url: c.url });
    }
  }
  return { text: text.trim(), sources: sources.slice(0, 4) };
}

// ---------- voix IA (OpenAI) ----------
const VOICES: Record<string, string> = { femme: 'coral', homme: 'onyx', douce: 'sage', dynamique: 'nova', grave: 'ash' };

async function speech(env: Env, body: any) {
  const text = String(body.text ?? '').slice(0, 3800);
  const style = STYLES[body.style] ?? STYLES.chaleureux;
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: VOICES[body.voice] ?? 'coral',
      input: text,
      instructions: `Langue : français de France, accent neutre et naturel. ${style.voice} Respecte la ponctuation, marque de courtes pauses entre les idées.`,
      response_format: 'mp3',
      speed: Math.min(1.5, Math.max(0.7, Number(body.speed) || 1)),
    }),
  });
  if (!r.ok) throw new Error(`voix indisponible (${r.status}) ${(await r.text()).slice(0, 200)}`);
  return { audio: await r.arrayBuffer(), chars: text.length };
}

// ---------- routes ----------
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST' } });
    if (url.pathname === '/' || url.pathname === '/v1/health') return json({ ok: true, service: 'matinal-api', date: today() });

    const a = auth(req, env);
    if ('error' in a) return a.error!;
    const device = a.device;

    try {
      if (url.pathname === '/v1/status' && req.method === 'GET') {
        const u = await getUsage(env, device);
        return json({ usage: u, tiers: TIERS, charsPerMinute: CHARS_PER_MINUTE });
      }
      // La voix IA peut aussi être demandée en GET : le lecteur audio du téléphone la lit directement.
      const isTtsGet = req.method === 'GET' && url.pathname === '/v1/tts';
      if (req.method !== 'POST' && !isTtsGet) return fail(405, 'Méthode non autorisée.');
      const body = isTtsGet ? Object.fromEntries(url.searchParams) : await req.json<any>().catch(() => ({}));
      const tier = TIERS[tierOf(body)];
      if (!tier.model) return fail(402, 'La formule gratuite n\'utilise pas l\'IA.');
      const u = await getUsage(env, device);

      if (url.pathname === '/v1/journal') {
        if (u.journals >= tier.journalsPerDay) return fail(429, 'Nombre de journaux IA atteint pour aujourd\'hui.');
        const out = await writeJournal(env, tier.model, body);
        u.journals++; await addUsage(env, device, u);
        return json({ ...out, model: tier.model });
      }
      if (url.pathname === '/v1/ask') {
        if (u.questions >= tier.questionsPerDay) return fail(429, 'Nombre de questions atteint pour aujourd\'hui.');
        const out = await answer(env, tier.model, body);
        u.questions++; await addUsage(env, device, u);
        return json(out);
      }
      if (url.pathname === '/v1/tts') {
        const limit = tier.aiVoiceMinutesPerDay * CHARS_PER_MINUTE;
        const len = String(body.text ?? '').length;
        if (u.ttsChars + len > limit) return fail(429, 'Temps de voix IA atteint pour aujourd\'hui.');
        const { audio, chars } = await speech(env, body);
        u.ttsChars += chars; await addUsage(env, device, u);
        return new Response(audio, { headers: { 'content-type': 'audio/mpeg', 'x-remaining-chars': String(Math.max(0, limit - u.ttsChars)) } });
      }
      return fail(404, 'Adresse inconnue.');
    } catch (e: any) {
      if (e instanceof Anthropic.RateLimitError) return fail(503, 'L\'IA est très demandée, réessaie dans une minute.');
      if (e instanceof Anthropic.AuthenticationError) return fail(500, 'Clé Anthropic refusée (vérifie le secret ANTHROPIC_API_KEY).');
      if (e instanceof Anthropic.APIError) return fail(502, `Erreur de l'IA (${e.status}).`);
      return fail(500, String(e?.message ?? e).slice(0, 300));
    }
  },
};
