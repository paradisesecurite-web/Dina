import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Journal, JournalItem, JournalSection, RubriqueId, Settings } from '../types';
import { APP_NAME } from '../config';
import { getJournal, suggestRubriques } from '../services/journal';
import { loadTaste, loadVotes, vote } from '../services/storage';
import { player, usePlayer } from '../services/player';
import { aiVoiceCharsLeft, serverStatus } from '../services/ai';
import { toSegments } from '../journal/compose';
import { rubriqueMeta } from '../journal/rubriques';
import { keywords } from '../sources/rss';
import { Btn, Card, Gap, IconBtn, SectionHead, Txt } from '../ui/kit';
import { Screen } from '../ui/Screen';
import { VoiceOrb } from '../ui/decor';
import { useTheme } from '../ui/theme';
import { Icon } from '../ui/icons';
import { Conversation } from '../ui/Conversation';
import { Breathing } from './Breathing';

export function JournalScreen({ settings, onSettings, update }: { settings: Settings; onSettings: () => void; update: (p: Partial<Settings>) => void }) {
  const t = useTheme();
  const [j, setJ] = useState<Journal | null>(null);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [votes, setVotes] = useState<Record<string, 1 | -1>>({});
  const [suggest, setSuggest] = useState<RubriqueId[]>([]);
  const [breathe, setBreathe] = useState(false);
  const [convo, setConvo] = useState<{ open: boolean; keyboard?: boolean; resumeAt: number }>({ open: false, resumeAt: 0 });
  const p = usePlayer();

  const load = useCallback(async (force = false) => {
    setBusy(true); setErr(''); setNotice('');
    try {
      const [{ journal, notice: n }, st] = await Promise.all([getJournal(settings, force), serverStatus(settings)]);
      setJ(journal); if (n) setNotice(n);
      await player.load(toSegments(journal, settings), settings, aiVoiceCharsLeft(st, settings));
    } catch {
      setErr('Impossible de préparer le journal. Vérifie ta connexion internet.');
    }
    setBusy(false);
  }, [settings.rubriques, settings.topics, settings.follows, settings.priorities, settings.minutes, settings.style, settings.tier, settings.city, settings.wellbeing, settings.sign, settings.language, settings.cryptos, settings.stocks, settings.artists, settings.commute, settings.fuel, settings.firstName]);

  useEffect(() => { load(); return () => player.stop(); }, [load]);
  useEffect(() => { player.setSettings(settings); }, [settings]);
  useEffect(() => { loadVotes().then(setVotes); loadTaste().then(tt => setSuggest(suggestRubriques(tt, settings.rubriques))); }, [settings.rubriques]);

  // « Pas intéressé » sur une rubrique : on retient le sujet pour les prochains journaux.
  const sectionWords = (sec: JournalSection) => Array.from(new Set(sec.items.flatMap(i => i.keywords ?? []).concat(keywords(sec.title)))).slice(0, 20);
  const onVoteSection = async (sec: JournalSection, v: 1 | -1) => {
    const id = `sec:${sec.id}:${j?.dateLabel}`;
    const nv = votes[id] === v ? 0 : v;
    const r = await vote(id, sectionWords(sec), nv);
    setVotes({ ...r.votes });
    if (nv === -1 && !settings.dislikes.includes(sec.title)) update({ dislikes: [...settings.dislikes, sec.title].slice(-50) });
    if (nv !== -1 && settings.dislikes.includes(sec.title)) update({ dislikes: settings.dislikes.filter(d => d !== sec.title) });
    setSuggest(suggestRubriques(r.taste, settings.rubriques));
  };
  const onVoteItem = async (it: JournalItem, v: 1 | -1) => {
    const nv = votes[it.id] === v ? 0 : v;
    const r = await vote(it.id, it.keywords?.length ? it.keywords : [it.id], nv);
    setVotes({ ...r.votes });
  };

  const openConvo = (keyboard = false) => {
    const resumeAt = player.get().index;
    if (player.get().status !== 'idle') player.pause();
    setConvo({ open: true, keyboard, resumeAt });
  };
  const curSection = j && p.current ? j.sections[p.current.section] : undefined;
  const handlers = {
    onNext: () => { if (curSection) onVoteSection(curSection, -1); player.play(convo.resumeAt); setTimeout(() => player.next(), 50); },
    onPause: () => {},
    onResume: () => player.play(convo.resumeAt),
    onRepeat: () => { if (j && p.current) player.playSection(p.current.section); },
    context: () => {
      const sec = j?.sections[p.current?.section ?? 0];
      if (!sec) return j?.greeting ?? '';
      return `${sec.title}\n${(sec.paragraphs ?? sec.items.map(i => `${i.title}. ${i.desc ?? i.detail ?? ''}`)).join('\n')}`;
    },
  };

  const playing = p.status === 'playing' || p.status === 'loading';
  const minutes = useMemo(() => {
    if (!j) return 0;
    const words = toSegments(j, settings).reduce((n, x) => n + x.text.split(/\s+/).length, 0);
    return Math.max(1, Math.round(words / (150 * settings.rate)));
  }, [j, settings.rate]);
  const progress = p.total ? (p.index + (p.status === 'idle' ? 0 : 1)) / p.total : 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={() => load(true)} tintColor={t.colors.accent} />}>
        <Masthead dateLabel={j?.dateLabel ?? ''} name={settings.firstName} onSettings={onSettings} city={settings.city?.name} />
        <Gap h={16} />

        <Card style={{ alignItems: 'center', overflow: 'hidden' }} pad={22}>
          <VoiceOrb active={playing} size={t.id === 'pro' ? 96 : 132} />
          <Gap h={10} />
          {j?.ai ? <Txt v="label" color={t.colors.accent2}>Raconté par l'IA · environ {minutes} min</Txt> : j ? <Txt v="label">Version simple · environ {minutes} min</Txt> : null}
          <Gap h={8} />
          <Txt v="body" center numberOfLines={4}>{p.current ? p.current.text : j ? j.greeting : busy ? 'Je fais la veille pour toi…' : ''}</Txt>
          <Gap h={16} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {playing
              ? <Btn icon="pause" label="Pause" onPress={() => player.pause()} />
              : <Btn icon="play" label={p.status === 'paused' ? 'Reprendre' : 'Écouter'} onPress={() => player.play()} disabled={!j} />}
            <Btn kind="secondary" icon="mic" label="Question" onPress={() => openConvo(false)} disabled={!j} />
          </View>
        </Card>

        {busy && !j ? (
          <View style={{ padding: 36, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={t.colors.accent} /><Gap />
            <Txt center>Je lis les journaux, je fais le tri et je prépare ton résumé…</Txt>
            <Txt v="small" center>Cela peut prendre jusqu'à une minute avec l'IA.</Txt>
          </View>
        ) : null}
        {err ? <><Gap /><Card><Txt>{err}</Txt><Gap h={10} /><Btn label="Réessayer" icon="refresh" onPress={() => load(true)} /></Card></> : null}
        {notice || p.notice ? <><Gap /><Card alt pad={14}><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Icon name="sparkle" size={18} color={t.colors.accent2} /><Txt v="small" style={{ flex: 1 }}>{notice || p.notice}</Txt></View></Card></> : null}

        {suggest.length ? (
          <>
            <Gap />
            <Card alt>
              <Txt v="label" color={t.colors.accent2}>Suggestion</Txt><Gap h={4} />
              <Txt>Tu sembles aimer ce sujet : ajouter la rubrique {suggest.map(r => `« ${rubriqueMeta(r).label} »`).join(', ')} ?</Txt>
              <Gap h={10} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Btn small label="Ajouter" onPress={() => { const end = settings.rubriques.indexOf('bonne_nouvelle'); const r = [...settings.rubriques]; r.splice(end >= 0 ? end : r.length, 0, ...suggest); update({ rubriques: r }); setSuggest([]); }} />
                <Btn small kind="secondary" label="Non merci" onPress={() => setSuggest([])} />
              </View>
            </Card>
          </>
        ) : null}

        {j?.sections.map((sec, si) => {
          const active = p.current?.section === si && p.status !== 'idle';
          const sid = `sec:${sec.id}:${j.dateLabel}`;
          return (
            <View key={sec.id + si} style={{ marginTop: 22 }}>
              <Pressable onPress={() => player.playSection(si)} accessibilityRole="button" accessibilityLabel={`Écouter : ${sec.title}`}>
                <SectionHead icon={sec.id} title={sec.title} index={si} active={active}
                  right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{sec.priority ? <Icon name="starFill" size={14} color={t.colors.accent2} /> : null}<Icon name={active && playing ? 'voice' : 'play'} size={16} color={t.colors.accent} /></View>} />
              </Pressable>
              <Card style={[active && { borderColor: t.colors.accent, borderWidth: 1.5 }]}>
                {sec.id === 'bienetre' && sec.items[0]?.id === 'respiration' ? (
                  <><Txt>{sec.items[0].title}</Txt><Gap h={12} /><Btn label="Respirer une minute" icon="bienetre" onPress={() => { player.pause(); setBreathe(true); }} /></>
                ) : sec.paragraphs ? (
                  <>
                    {sec.paragraphs.map((para, pi) => {
                      const on = active && p.current?.para === pi;
                      return (
                        <View key={pi} style={{ flexDirection: 'row', marginTop: pi ? 12 : 0 }}>
                          <View style={{ width: 3, borderRadius: 2, backgroundColor: on ? t.colors.accent : 'transparent', marginRight: on ? 10 : 0 }} />
                          {pi === 0 && t.id === 'pro' ? <DropCap text={para} /> : <Txt v="body" style={{ flex: 1 }}>{para}</Txt>}
                        </View>
                      );
                    })}
                    <SourcesRow items={sec.items} />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                      <VoteBtn on={votes[sid] === 1} icon="thumbUp" a11y="J'aime cette rubrique" onPress={() => onVoteSection(sec, 1)} />
                      <VoteBtn on={votes[sid] === -1} icon="thumbDown" a11y="Pas intéressé par cette rubrique" onPress={() => onVoteSection(sec, -1)} />
                    </View>
                  </>
                ) : sec.items.map((it, ii) => (
                  <Item key={it.id + ii} it={it} first={ii === 0} speaking={active && p.current?.item === ii} vote={votes[it.id]} onVote={v => onVoteItem(it, v)} canVote={!!it.keywords?.length} />
                ))}
                {sec.note ? <><Gap h={10} /><Txt v="small" style={{ fontStyle: 'italic' }}>{sec.note}</Txt></> : null}
              </Card>
            </View>
          );
        })}

        {j ? (
          <>
            <Gap h={26} />
            <Txt v="body" center style={{ fontStyle: 'italic' }}>{j.outro}</Txt>
            <Gap h={6} />
            <Txt v="small" center>Tire vers le bas pour refaire le journal.</Txt>
          </>
        ) : null}
        <Gap h={110} />
      </Screen>

      {j ? <MiniPlayer playing={playing} progress={progress} title={curSection?.title ?? APP_NAME} status={p.status} onMic={() => openConvo(false)} onKeyboard={() => openConvo(true)} /> : null}
      <Breathing visible={breathe} onClose={() => setBreathe(false)} settings={settings} voice />
      <Conversation visible={convo.open} s={settings} h={handlers} startWithKeyboard={convo.keyboard}
        onClose={resume => { setConvo(c => ({ ...c, open: false })); if (resume) player.play(convo.resumeAt); }} />
    </View>
  );
}

function MiniPlayer({ playing, progress, title, status, onMic, onKeyboard }: { playing: boolean; progress: number; title: string; status: string; onMic: () => void; onKeyboard: () => void }) {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, bottom: ins.bottom + 10, borderRadius: t.id === 'zen' ? 28 : t.id === 'futur' ? 18 : 10, overflow: 'hidden', backgroundColor: t.colors.player, borderWidth: t.id === 'futur' ? 1 : t.id === 'zen' ? 1 : 0, borderColor: t.id === 'zen' ? 'rgba(255,255,255,0.9)' : t.colors.border, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
      <View style={{ height: 3, backgroundColor: t.id === 'pro' ? 'rgba(245,241,232,0.18)' : t.colors.border }}>
        <LinearGradient colors={t.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.round(progress * 100)}%`, height: 3 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt v="label" color={t.id === 'pro' ? t.colors.accent2 : t.colors.accent} numberOfLines={1}>{status === 'loading' ? 'Chargement de la voix…' : playing ? 'En lecture' : status === 'paused' ? 'En pause' : 'Prêt'}</Txt>
          <Txt v="h3" color={t.colors.onPlayer} numberOfLines={1}>{title}</Txt>
        </View>
        <PlayerBtn icon="prev" label="Rubrique précédente" onPress={() => player.prev()} />
        <PlayerBtn icon={playing ? 'pause' : 'play'} label={playing ? 'Pause' : 'Lecture'} onPress={() => (playing ? player.pause() : player.play())} big />
        <PlayerBtn icon="next" label="Rubrique suivante" onPress={() => player.next()} />
        <PlayerBtn icon="mic" label="Poser une question" onPress={onMic} onLongPress={onKeyboard} />
      </View>
    </View>
  );
}

function PlayerBtn({ icon, label, onPress, big, onLongPress }: { icon: string; label: string; onPress: () => void; big?: boolean; onLongPress?: () => void }) {
  const t = useTheme();
  const size = big ? 48 : 40;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: pressed ? 0.6 : 1 })}>
      {big ? <LinearGradient colors={t.accentGradient} style={StyleSheet.absoluteFill} /> : null}
      <Icon name={icon} size={big ? 22 : 20} color={big ? t.colors.onAccent : t.colors.onPlayer} />
    </Pressable>
  );
}

function DropCap({ text }: { text: string }) {
  const t = useTheme();
  const first = text.charAt(0), rest = text.slice(1);
  return (
    <Txt v="body" style={{ flex: 1 }}>
      <Txt v="body" style={{ fontFamily: t.fonts.display, color: t.colors.accent }}>{first}</Txt>{rest}
    </Txt>
  );
}

function SourcesRow({ items }: { items: JournalItem[] }) {
  const t = useTheme();
  const sources = items.filter(i => i.source && i.url).slice(0, 8);
  const actions = items.filter(i => i.action);
  if (!sources.length && !actions.length) return null;
  return (
    <View style={{ marginTop: 14 }}>
      {sources.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {sources.map((src, k) => (
            <Pressable key={k} onPress={() => Linking.openURL(src.url!)} accessibilityRole="link" accessibilityLabel={`${src.source} : ${src.title}`}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 9, borderRadius: t.id === 'zen' ? 999 : 6, borderWidth: 1, borderColor: t.colors.border, opacity: pressed ? 0.6 : 1, maxWidth: '100%' })}>
              <Txt v="small" color={t.colors.accent} numberOfLines={1}>{src.source}</Txt>
              <Icon name="external" size={11} color={t.colors.accent} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {actions.map((a, k) => <View key={k} style={{ marginTop: 10, alignSelf: 'flex-start' }}><Btn small kind="secondary" icon="external" label={a.action!.label} onPress={() => Linking.openURL(a.action!.url)} /></View>)}
    </View>
  );
}

function Masthead({ dateLabel, onSettings, name, city }: { dateLabel: string; onSettings: () => void; name: string; city?: string }) {
  const t = useTheme();
  const gear = <IconBtn name="settings" label="Réglages" onPress={onSettings} />;
  if (t.id === 'pro') {
    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt v="label">Édition du matin{city ? ` · ${city}` : ''}</Txt>{gear}
        </View>
        <Txt v="display" center style={{ marginTop: 2 }}>{APP_NAME}</Txt>
        <View style={{ height: 3, backgroundColor: t.colors.hair, marginTop: 8 }} />
        <View style={{ height: 1, backgroundColor: t.colors.hair, marginTop: 2 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
          <Txt v="small" style={{ textTransform: 'capitalize' }}>{dateLabel}</Txt>
          <Txt v="small">Pour {name || 'toi'}</Txt>
        </View>
        <View style={{ height: 1, backgroundColor: t.colors.hair }} />
      </View>
    );
  }
  if (t.id === 'futur') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Txt v="mono" color={t.colors.accent2}>// BRIEFING · {name ? name.toUpperCase() : 'UTILISATEUR'}</Txt>
          <Txt v="display">{APP_NAME}</Txt>
          <Txt v="mono" color={t.colors.muted} style={{ textTransform: 'uppercase', letterSpacing: 2 }}>{dateLabel}{city ? ` · ${city}` : ''}</Txt>
        </View>
        {gear}
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Txt v="small" style={{ textTransform: 'capitalize' }}>{dateLabel}</Txt>
        <Txt v="display">Bonjour{name ? ` ${name}` : ''} 🌿</Txt>
      </View>
      {gear}
    </View>
  );
}

function Item({ it, first, speaking, vote, onVote, canVote }: { it: JournalItem; first: boolean; speaking: boolean; vote?: 1 | -1; onVote: (v: 1 | -1) => void; canVote: boolean }) {
  const t = useTheme();
  return (
    <View style={{ paddingTop: first ? 0 : 12, marginTop: first ? 0 : 12, borderTopWidth: first ? 0 : 1, borderColor: t.colors.border }}>
      <Txt v={first && t.id === 'pro' ? 'h3' : 'body'} style={speaking ? { color: t.colors.accent } : undefined}>{it.title}</Txt>
      {it.detail ? <Txt v="small" style={{ marginTop: 3 }}>{it.detail}</Txt> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
        {it.source ? (
          <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={it.url ? () => Linking.openURL(it.url!) : undefined}>
            <Txt v="small" color={t.colors.accent} numberOfLines={1}>{it.source}</Txt>{it.url ? <Icon name="external" size={11} color={t.colors.accent} /> : null}
          </Pressable>
        ) : <View style={{ flex: 1 }} />}
        {canVote ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <VoteBtn on={vote === 1} icon="thumbUp" a11y="J'aime" onPress={() => onVote(1)} />
            <VoteBtn on={vote === -1} icon="thumbDown" a11y="Pas intéressé" onPress={() => onVote(-1)} />
          </View>
        ) : null}
      </View>
      {it.action ? <View style={{ marginTop: 10, alignSelf: 'flex-start' }}><Btn small kind="secondary" icon="external" label={it.action.label} onPress={() => Linking.openURL(it.action!.url)} /></View> : null}
    </View>
  );
}

function VoteBtn({ on, icon, a11y, onPress }: { on: boolean; icon: string; a11y: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: on }} hitSlop={6}
      style={{ width: 40, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? t.colors.accent : t.colors.border, backgroundColor: on ? t.colors.accent : 'transparent' }}>
      <Icon name={icon} size={16} color={on ? t.colors.onAccent : t.colors.muted} />
    </Pressable>
  );
}
