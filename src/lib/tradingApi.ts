import axios from 'axios';
import { supabase } from './supabase';

const FREECRYPTO_BASE = 'https://api.freecryptoapi.com/v1';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingPair {
  id: string;
  base_currency: string;
  quote_currency: string;
  display_name: string;
  price_precision: number;
  min_trade_amount: number;
  is_active?: boolean;
}

export interface UserWallet {
  id: string;
  user_id?: string;
  currency: string;
  balance: number;
}

export interface UserTrade {
  id: string;
  pair_id: string;
  user_id?: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  status?: string;
  created_at: string;
  pair?: { display_name: string };
}

function coerceNum(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseFreeCryptoOHLC(body: unknown): CandleData[] {
  if (!body || typeof body !== 'object') return [];
  const obj = body as Record<string, unknown>;
  const containers: unknown[] = [obj.data, obj.result, obj.ohlc, obj.candles, body];

  const parseRow = (row: unknown): CandleData | null => {
    if (!row || typeof row !== 'object') return null;
    const r = row as Record<string, unknown>;
    const tRaw = r.time ?? r.t ?? r.timestamp ?? r.date;
    const o = coerceNum(r.open ?? r.o);
    const h = coerceNum(r.high ?? r.h);
    const l = coerceNum(r.low ?? r.l);
    const c = coerceNum(r.close ?? r.c);
    const v = coerceNum(r.volume ?? r.v) ?? 0;
    if (o == null || h == null || l == null || c == null) return null;

    // time: accept seconds, ms, or YYYY-MM-DD
    let timeSec: number | null = null;
    if (typeof tRaw === 'number') {
      timeSec = tRaw > 2_000_000_000 ? Math.floor(tRaw / 1000) : Math.floor(tRaw);
    } else if (typeof tRaw === 'string') {
      const n = coerceNum(tRaw);
      if (n != null) {
        timeSec = n > 2_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
      } else {
        const d = Date.parse(tRaw);
        if (Number.isFinite(d)) timeSec = Math.floor(d / 1000);
      }
    }
    if (timeSec == null) return null;
    return { time: timeSec, open: o, high: h, low: l, close: c, volume: v };
  };

  for (const container of containers) {
    if (!container) continue;
    if (Array.isArray(container)) {
      const candles = container.map(parseRow).filter(Boolean) as CandleData[];
      if (candles.length) return candles;
      continue;
    }
    if (typeof container === 'object') {
      const maybeRows = Object.values(container as Record<string, unknown>);
      const candles = maybeRows.map(parseRow).filter(Boolean) as CandleData[];
      if (candles.length) return candles;
    }
  }
  return [];
}

function inferBaseSymbolFromPairString(pair: string): string {
  const raw = pair.trim().toUpperCase();
  if (raw.includes('/')) return raw.split('/')[0] || raw;

  const knownQuotes = ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'BTC', 'ETH'];
  for (const q of knownQuotes) {
    if (raw.endsWith(q) && raw.length > q.length) return raw.slice(0, -q.length);
  }
  return raw;
}

/** Parse `/getData` JSON — shape varies; extract symbol → price / 24h change when possible. */
function parseFreeCryptoGetData(body: unknown): Map<string, { price: number; change24h: number }> {
  const map = new Map<string, { price: number; change24h: number }>();
  if (!body || typeof body !== 'object') return map;

  const obj = body as Record<string, unknown>;
  const tryObjects: unknown[] = [obj.data, obj.result, obj.coins, obj.crypto, obj.markets, body];

  const ingestRecord = (sym: string, r: Record<string, unknown>) => {
    const price = coerceNum(
      r.price ?? r.last ?? r.close ?? r.rate ?? r.USD ?? r.usd ?? r.current_price
    );
    const change24h =
      coerceNum(
        r.change_24h ??
          r.percent_change_24h ??
          r.price_change_percentage_24h ??
          r.change24h ??
          r.changePercent24h
      ) ?? 0;
    if (price != null) map.set(sym.toUpperCase(), { price, change24h });
  };

  for (const c of tryObjects) {
    if (!c || typeof c !== 'object') continue;
    if (Array.isArray(c)) {
      for (const row of c) {
        if (!row || typeof row !== 'object') continue;
        const r = row as Record<string, unknown>;
        const sym = (r.symbol ?? r.ticker ?? r.name ?? r.currency ?? r.code) as string | undefined;
        if (sym) ingestRecord(sym, r);
      }
      if (map.size) return map;
      continue;
    }
    for (const [k, v] of Object.entries(c as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        map.set(k.toUpperCase(), { price: v, change24h: 0 });
        continue;
      }
      if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
      ingestRecord(k, v as Record<string, unknown>);
    }
    if (map.size) return map;
  }

  return map;
}

/**
 * Live spot quotes from FreeCryptoAPI (optional).
 * Set `VITE_FREECRYPTOAPI_KEY` in `.env` — requests use `Authorization: Bearer <key>`.
 * @see https://freecryptoapi.com/
 */
export async function fetchFreeCryptoSpotQuotes(
  pairs: TradingPair[]
): Promise<Map<string, { price: number; change24h: number }> | null> {
  const key = (import.meta.env.VITE_FREECRYPTOAPI_KEY as string | undefined)?.trim();
  if (!key || pairs.length === 0) return null;

  const symbols = [...new Set(pairs.map((p) => p.base_currency))].join('+');
  try {
    const url = new URL(`${FREECRYPTO_BASE}/getData`);
    url.searchParams.set('symbol', symbols);
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn('FreeCryptoAPI getData failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const body = await res.json();
    const map = parseFreeCryptoGetData(body);
    return map.size > 0 ? map : null;
  } catch (e) {
    console.warn('FreeCryptoAPI request error:', e);
    return null;
  }
}

export const generateMockCandleData = (limit: number): CandleData[] => {
  const now = Math.floor(Date.now() / 1000);
  let price = 30000 + Math.random() * 2000;
  const interval = 3600;
  return Array.from({ length: limit }, (_, i) => {
    const time = now - (limit - 1 - i) * interval;
    const open = price;
    const change = (Math.random() - 0.48) * (open * 0.02);
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * open * 0.01;
    const low = Math.min(open, close) - Math.random() * open * 0.01;
    const volume = Math.random() * 1000;
    price = close;
    return { time, open, high, low, close, volume };
  });
};

export const fetchTradingPairs = async (): Promise<TradingPair[]> => {
  const { data, error } = await supabase.from('trading_pairs').select('*').limit(200);
  if (error) {
    console.error('fetchTradingPairs:', error);
    throw error;
  }
  return (data ?? []) as TradingPair[];
};

export const fetchUserWallets = async (): Promise<UserWallet[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', user.id)
    .limit(100);

  if (error) {
    console.error('fetchUserWallets:', error);
    throw error;
  }
  return (data ?? []) as UserWallet[];
};

export const fetchUserTrades = async (): Promise<UserTrade[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_trades')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('fetchUserTrades:', error);
    throw error;
  }
  return (data ?? []) as UserTrade[];
};

export const fetchCandleData = async (
  pairId: string,
  interval = '1h',
  limit = 100
): Promise<CandleData[]> => {
  try {
    const key = (import.meta.env.VITE_FREECRYPTOAPI_KEY as string | undefined)?.trim();

    // Derive a base symbol for APIs that don't use pairs (e.g. "BTC" not "BTCUSDT")
    let baseSymbol = inferBaseSymbolFromPairString(pairId);

    // If pairId is a DB id (uuid or mock numeric), fetch its base_currency
    if (pairId.includes('-') || /^\d+$/.test(pairId)) {
      const { data } = await supabase
        .from('trading_pairs')
        .select('base_currency')
        .eq('id', pairId)
        .single();
      if (data?.base_currency) baseSymbol = String(data.base_currency).toUpperCase();
    }

    if (key) {
      // FreeCryptoAPI offers OHLC by days/range (browser-friendly; avoids Binance CORS issues)
      const days =
        interval === '1m' || interval === '5m' || interval === '15m'
          ? 1
          : interval === '1d'
            ? 90
            : 7;

      const url = new URL(`${FREECRYPTO_BASE}/getOHLC`);
      url.searchParams.set('symbol', baseSymbol);
      url.searchParams.set('days', String(days));

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const body = await res.json();
        const candles = parseFreeCryptoOHLC(body);
        if (candles.length) {
          // Prefer the most recent `limit` points
          return candles.slice(-limit);
        }
      } else {
        console.warn('FreeCryptoAPI getOHLC failed:', res.status, await res.text().catch(() => ''));
      }
    }

    // Fallback: mock candles (prevents hard-fail during development)
    return generateMockCandleData(limit);
  } catch (error) {
    console.error('Error fetching candle data:', error);
    return generateMockCandleData(limit);
  }
};

export const executeTrade = async (
  pairId: string,
  type: 'buy' | 'sell',
  amount: number,
  price: number
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to execute trades');
  }

  const { data, error } = await supabase.rpc('process_trade', {
    p_user_id: user.id,
    p_pair_id: pairId,
    p_type: type,
    p_amount: amount,
    p_price: price,
  });

  if (error) {
    console.error('Error executing trade via RPC:', error);
    throw error;
  }

  return data as string;
};
