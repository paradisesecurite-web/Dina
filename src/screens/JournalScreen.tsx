import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, View } from 'react-native';
import type { Journal, JournalItem, RubriqueId, Settings } from '../types';
import { APP_NAME } from '../config';
import { getJournal, suggestRubriques } from '../services/journal';
import { loadTaste, loadVotes, vote } from '../services/storage';
import { player, usePlayer } from '../services/player';
import { toSegments } from '../journal/compose';
import { rubriqueMeta } from '../journal/rubriques';
import { Btn, Card, Gap, Txt } from '../ui/kit';
import { Screen } from '../ui/Screen';
import { VoiceOrb } from '../ui/decor';
import { useTheme } from '../ui/theme';
import { Breathing } from './Breathing';

export function JournalScreen({ settings, onSettings, update }: { settings: Settings; onSettings: () => void; update: (p: Partial<Settings>) => void }) {
  const t = useTheme();
  const [j, setJ] = useState<Journal | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [votes, setVotes] = useState<Record<string, 1 | -1>>({});
  const [suggest, setSuggest] = useState<RubriqueId[]>([]);
  const [breathe, setBreathe] = useState(false);
  const p = usePlayer();

  const load = useCallback(async (force = false) => {
    setBusy(true); setErr('');
    try {
      const nj = await getJournal(settings, force);
      setJ(nj);
      player.load(toSegments(nj, settings), settings);
    } catch (e) {
      setErr('Impossible de préparer le journal. Vérifie ta connexion internet.');
    }
    setBusy(false);
  }, [settings]);

  useEffect(() => { load(); return () => player.stop(); }, [load]);
  useEffect(() => { loadVotes().then(setVotes); loadTaste().then(tt => setSuggest(suggestRubriques(tt, settings.rubriques))); }, [settings.rubriques]);

  const onVote = async (it: JournalItem, v: 1 | -1) => {
    const nv = votes[it.id] === v ? 0 : v;
    const r = await vote(it.id, it.keywords?.length ? it.keywords : [it.id], nv);
    setVotes({ ...r.votes });
    setSuggest(suggestRubriques(r.taste, settings.rubriques));
  };

  const speaking = p.status === 'playing';
  const minutes = useMemo(() => {
    if (!j) return 0;
    const words = toSegments(j, settings).reduce((n, s) => n + s.text.split(/\s+/).length, 0);
    return Math.max(1, Math.round(words / (150 * settings.rate)));
  }, [j, settings]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={() => load(true)} tintColor={t.colors.accent} />}>
      <Masthead dateLabel={j?.dateLabel ?? ''} onSettings={onSettings} />
      <Gap h={14} />

      <Card style={{ alignItems: 'center' }}>
        <VoiceOrb active={speaking} size={t.id === 'pro' ? 84 : 104} />
        <Gap h={8} />
        <Txt v="small" center numberOfLines={3}>
          {p.current ? p.current.text : j ? `${j.greeting}` : busy ? 'Je prépare ton journal…' : ''}
        </Txt>
        <Gap h={12} />
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {p.status === 'playing'
            ? <Btn icon="⏸" label="Pause" onPress={() => player.pause()} />
            : <Btn icon="▶" label={p.status === 'paused' ? 'Reprendre' : `Écouter · ${minutes} min`} onPress={() => player.play()} disabled={!j} />}
          {p.status !== 'idle' ? <Btn small kind="secondary" icon="⏮" label="" onPress={() => player.prev()} /> : null}
          {p.status !== 'idle' ? <Btn small kind="secondary" icon="⏭" label="" onPress={() => player.next()} /> : null}
          {p.status !== 'idle' ? <Btn small kind="secondary" icon="⏹" label="" onPress={() => player.stop()} /> : null}
        </View>
      </Card>

      {busy && !j ? <View style={{ padding: 40 }}><ActivityIndicator size="large" color={t.colors.accent} /><Gap /><Txt center v="small">Je rassemble les infos du jour…</Txt></View> : null}
      {err ? <><Gap /><Card><Txt>{err}</Txt><Gap h={10} /><Btn label="Réessayer" onPress={() => load(true)} /></Card></> : null}

      {suggest.length ? (
        <>
          <Gap />
          <Card style={{ borderColor: t.colors.accent2 }}>
            <Txt v="label">Suggestion</Txt>
            <Gap h={4} />
            <Txt>Tu sembles aimer ce sujet : ajouter la rubrique {suggest.map(r => `« ${rubriqueMeta(r).label} »`).join(', ')} ?</Txt>
            <Gap h={10} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn small label="Ajouter" onPress={() => { update({ rubriques: [...settings.rubriques.filter(r => r !== 'bonne_nouvelle'), ...suggest, ...(settings.rubriques.includes('bonne_nouvelle') ? ['bonne_nouvelle' as RubriqueId] : [])] }); setSuggest([]); }} />
              <Btn small kind="secondary" label="Non merci" onPress={() => setSuggest([])} />
            </View>
          </Card>
        </>
      ) : null}

      {j?.sections.map((sec, si) => {
        const current = p.current?.section === si && p.status !== 'idle';
        return (
          <View key={sec.id + si} style={{ marginTop: 16 }}>
            <Pressable onPress={() => player.playSection(si)} accessibilityRole="button" accessibilityLabel={`Écouter la rubrique ${sec.title}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Txt style={{ fontSize: 20 }}>{sec.icon}</Txt>
              <Txt v="h2" style={{ flex: 1 }} color={current ? t.colors.accent : undefined}>{sec.title}</Txt>
              <Txt v="small" color={t.colors.accent}>{current ? '🔊' : '▶'}</Txt>
            </Pressable>
            {t.id === 'pro' ? <View style={{ height: 2, backgroundColor: t.colors.ink, marginBottom: 2 }} /> : null}
            {t.id === 'pro' ? <View style={{ height: 1, backgroundColor: t.colors.ink, marginBottom: 10 }} /> : null}
            <Card style={current ? { borderColor: t.colors.accent, borderWidth: 1.5 } : undefined}>
              {sec.id === 'bienetre' && sec.items[0]?.id === 'respiration'
                ? (<><Txt>{sec.items[0].title}</Txt><Gap h={10} /><Btn label="Respirer une minute" icon="🌿" onPress={() => { player.stop(); setBreathe(true); }} /></>)
                : sec.items.map((it, ii) => (
                  <Item key={it.id + ii} it={it} first={ii === 0} speaking={current && p.current?.item === ii} vote={votes[it.id]} onVote={v => onVote(it, v)} canVote={!!it.keywords?.length} />
                ))}
              {sec.note ? <><Gap h={8} /><Txt v="small" style={{ fontStyle: 'italic' }}>{sec.note}</Txt></> : null}
            </Card>
          </View>
        );
      })}

      {j ? (
        <>
          <Gap h={24} />
          <Txt v="small" center>{j.outro}</Txt>
          <Gap h={6} />
          <Txt v="small" center>Tire vers le bas pour actualiser.</Txt>
        </>
      ) : null}
      <Breathing visible={breathe} onClose={() => setBreathe(false)} settings={settings} voice />
    </Screen>
  );
}

function Masthead({ dateLabel, onSettings }: { dateLabel: string; onSettings: () => void }) {
  const t = useTheme();
  const gear = (
    <Pressable onPress={onSettings} accessibilityRole="button" accessibilityLabel="Réglages" hitSlop={12}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: t.colors.border }}>
      <Txt style={{ fontSize: 20 }}>⚙️</Txt>
    </Pressable>
  );
  if (t.id === 'pro') {
    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt v="label">Édition du matin</Txt>{gear}
        </View>
        <Txt v="title" center style={{ fontSize: 40, lineHeight: 46, marginTop: 4 }}>{APP_NAME}</Txt>
        <View style={{ height: 2, backgroundColor: t.colors.ink, marginTop: 6 }} />
        <Txt v="small" center style={{ textTransform: 'capitalize', paddingVertical: 4 }}>{dateLabel}</Txt>
        <View style={{ height: 1, backgroundColor: t.colors.ink }} />
      </View>
    );
  }
  if (t.id === 'futur') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Txt v="label" color={t.colors.accent2}>// Briefing quotidien</Txt>
          <Txt v="title">{APP_NAME}</Txt>
          <Txt v="small" style={{ textTransform: 'uppercase', letterSpacing: 2 }}>{dateLabel}</Txt>
        </View>
        {gear}
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Txt v="small" style={{ textTransform: 'capitalize' }}>{dateLabel}</Txt>
        <Txt v="title">Belle matinée 🌿</Txt>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10, flexWrap: 'wrap' }}>
        {it.source ? (
          <Txt v="small" color={t.colors.accent} onPress={it.url ? () => Linking.openURL(it.url!) : undefined} style={{ flex: 1, textDecorationLine: it.url ? 'underline' : 'none' }}>
            {it.source}{it.url ? ' ↗' : ''}
          </Txt>
        ) : <View style={{ flex: 1 }} />}
        {canVote ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <VoteBtn on={vote === 1} label="👍" a11y="J'aime" onPress={() => onVote(1)} />
            <VoteBtn on={vote === -1} label="👎" a11y="Pas intéressé" onPress={() => onVote(-1)} />
          </View>
        ) : null}
      </View>
      {it.action ? <View style={{ marginTop: 10, alignSelf: 'flex-start' }}><Btn small kind="secondary" label={it.action.label} icon="↗" onPress={() => Linking.openURL(it.action!.url)} /></View> : null}
    </View>
  );
}

function VoteBtn({ on, label, a11y, onPress }: { on: boolean; label: string; a11y: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: on }} hitSlop={6}
      style={{ width: 40, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? t.colors.accent : t.colors.border, backgroundColor: on ? t.colors.accent : 'transparent', opacity: on ? 1 : 0.75 }}>
      <Txt style={{ fontSize: 15 }}>{label}</Txt>
    </Pressable>
  );
}
