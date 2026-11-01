import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Journal, Settings } from '../types';
import type { Taste } from '../sources/actus';

export { DEFAULT_SETTINGS } from './defaults';
import { DEFAULT_SETTINGS } from './defaults';

const K = { settings: 'matinal.settings', taste: 'matinal.taste', votes: 'matinal.votes', journal: 'matinal.journal', crypto: 'matinal.cryptoNames' };

async function read<T>(k: string, d: T): Promise<T> {
  try { const v = await AsyncStorage.getItem(k); return v ? { ...d as any, ...JSON.parse(v) } : d; } catch { return d; }
}
async function write(k: string, v: unknown) { try { await AsyncStorage.setItem(k, JSON.stringify(v)); } catch {} }

export const loadSettings = () => read<Settings>(K.settings, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => write(K.settings, s);

// Goûts : chaque mot-clé gagne ou perd des points avec « j'aime » / « pas intéressé ».
export const loadTaste = () => read<Taste>(K.taste, {});
export const loadVotes = () => read<Record<string, 1 | -1>>(K.votes, {});
export async function vote(itemId: string, keywords: string[], v: 1 | -1 | 0) {
  const [taste, votes] = await Promise.all([loadTaste(), loadVotes()]);
  const prev = votes[itemId] || 0;
  for (const w of keywords) taste[w] = Math.max(-5, Math.min(5, (taste[w] || 0) - prev + v));
  if (v) votes[itemId] = v; else delete votes[itemId];
  await Promise.all([write(K.taste, taste), write(K.votes, votes)]);
  return { taste, votes };
}

export const loadCryptoNames = () => read<Record<string, string>>(K.crypto, { bitcoin: 'Bitcoin', ethereum: 'Ethereum' });
export const saveCryptoNames = (n: Record<string, string>) => write(K.crypto, n);

export async function loadCachedJournal(): Promise<Journal | null> {
  try { const v = await AsyncStorage.getItem(K.journal); return v ? JSON.parse(v) : null; } catch { return null; }
}
export const saveJournal = (j: Journal) => write(K.journal, j);

export async function resetAll() { try { await AsyncStorage.multiRemove(Object.values(K)); } catch {} }
