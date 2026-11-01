import type { JournalSection } from '../types';
import { getJson, enc } from './http';

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')} %`;
const pctSpoken = (n: number) => `${n >= 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(n).toFixed(1).replace('.', ',')} pour cent`;
const money = (n: number, cur = '€') => `${n.toLocaleString('fr-FR', { maximumFractionDigits: n >= 100 ? 0 : 2 })} ${cur}`;

export const DEFAULT_CRYPTOS = [{ id: 'bitcoin', name: 'Bitcoin' }, { id: 'ethereum', name: 'Ethereum' }];

export async function searchCrypto(q: string): Promise<{ id: string; name: string; symbol: string }[]> {
  const d = await getJson(`https://api.coingecko.com/api/v3/search?query=${enc(q)}`);
  return (d.coins || []).slice(0, 8).map((c: any) => ({ id: c.id, name: c.name, symbol: c.symbol }));
}

export async function cryptoSection(ids: string[], names: Record<string, string>): Promise<JournalSection> {
  const list = ids.length ? ids : DEFAULT_CRYPTOS.map(c => c.id);
  const d = await getJson(`https://api.coingecko.com/api/v3/simple/price?ids=${list.join(',')}&vs_currencies=eur&include_24hr_change=true`);
  const items = list.filter(id => d[id]).map(id => {
    const n = names[id] || id.charAt(0).toUpperCase() + id.slice(1);
    const v = d[id].eur as number, ch = (d[id].eur_24h_change ?? 0) as number;
    return { id: `c-${id}`, title: `${n} : ${money(v)}`, detail: `${pct(ch)} sur 24 h`, speech: `${n} vaut ${money(v).replace('€', 'euros')}, ${pctSpoken(ch)} sur vingt-quatre heures.`, source: 'CoinGecko', url: `https://www.coingecko.com/fr/pi%C3%A8ces/${id}` };
  });
  return { id: 'crypto', title: 'Cryptos', icon: '₿', items };
}

export const DEFAULT_STOCKS = [{ symbol: '^FCHI', name: 'CAC 40' }];

export async function searchStock(q: string): Promise<{ symbol: string; name: string; place: string }[]> {
  const d = await getJson(`https://query1.finance.yahoo.com/v1/finance/search?q=${enc(q)}&quotesCount=8&newsCount=0`);
  return (d.quotes || []).filter((x: any) => x.symbol).map((x: any) => ({ symbol: x.symbol, name: x.longname || x.shortname || x.symbol, place: x.exchDisp || '' }));
}

export async function bourseSection(stocks: { symbol: string; name: string }[]): Promise<JournalSection> {
  const list = stocks.length ? stocks : DEFAULT_STOCKS;
  const res = await Promise.all(list.map(async s => {
    try {
      const d = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${enc(s.symbol)}?range=5d&interval=1d`);
      const m = d.chart.result[0].meta;
      const price = m.regularMarketPrice as number;
      const ch = typeof m.regularMarketChangePercent === 'number' ? m.regularMarketChangePercent : ((price - m.chartPreviousClose) / m.chartPreviousClose) * 100;
      const cur = m.currency === 'EUR' ? '€' : m.currency === 'USD' ? '$' : (m.currency || '');
      const isIndex = s.symbol.startsWith('^');
      return {
        id: `b-${s.symbol}`, title: `${s.name} : ${isIndex ? Math.round(price).toLocaleString('fr-FR') + ' points' : money(price, cur)}`,
        detail: `${pct(ch)} à la dernière séance`,
        speech: `${s.name} : ${pctSpoken(ch)} à la dernière séance.`,
        source: 'Yahoo Finance', url: `https://fr.finance.yahoo.com/quote/${enc(s.symbol)}`,
      };
    } catch { return null; }
  }));
  return { id: 'bourse', title: 'Bourse', icon: '📈', items: res.filter(Boolean) as any };
}
