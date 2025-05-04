import axios from 'axios';
import NodeCache from 'node-cache';

// In-memory cache (5 minute TTL) for stock data
const stockCache = new NodeCache({ stdTTL: 300 });

// Mock/demo data for fallback
export const demoStockData = {
  IBM:   { price: 130, volume: 3000000, percent_change: 0.5 },
  AAPL:  { price: 150, volume: 5000000, percent_change: 0.7 },
  MSFT:  { price: 280, volume: 2000000, percent_change: -0.3 },
  GOOGL: { price: 2700, volume: 1000000, percent_change: 0.2 },
  AMZN:  { price: 3400, volume: 1500000, percent_change: -0.1 },
  TSLA:  { price: 700, volume: 4000000, percent_change: 1.2 },
  NFLX:  { price: 550, volume: 1800000, percent_change: -0.5 },
  META:  { price: 330, volume: 2200000, percent_change: 0.8 },
  NVDA:  { price: 200, volume: 2500000, percent_change: 2.1 },
  ORCL:  { price: 90, volume: 1500000, percent_change: -0.3 },
  WMT:   { price: 140, volume: 3000000, percent_change: 0.3 },
  HD:    { price: 300, volume: 1000000, percent_change: -0.2 },
  JNJ:   { price: 170, volume: 900000,  percent_change: 0.1 },
  PFE:   { price: 50,  volume: 2000000, percent_change: -0.4 },
  BAC:   { price: 40,  volume: 2500000, percent_change: 0.6 },
};

// Historical price series for demo
export const historicalData = {
  IBM:   [128, 129, 130, 131, 130],
  AAPL:  [148, 149, 150, 151, 150],
  MSFT:  [278, 279, 280, 281, 280],
  GOOGL: [2690,2700,2700,2710,2700],
  AMZN:  [3380,3390,3400,3410,3400],
  TSLA:  [680, 690, 700, 710, 700],
  NFLX:  [545, 547, 550, 553, 550],
  META:  [325, 327, 330, 332, 330],
  NVDA:  [195, 197, 200, 202, 200],
  ORCL:  [88,  89,  90,  91,  90],
  WMT:   [136, 138, 140, 142, 140],
  HD:    [295, 298, 300, 305, 300],
  JNJ:   [168, 169, 170, 171, 170],
  PFE:   [48,  49,  50,  51,  50],
  BAC:   [38,  39,  40,  41,  40],
};

// Risk factor map for portfolio risk calculations
export const riskFactors = {
  IBM:   0.3, AAPL:  0.4, MSFT:  0.5, GOOGL: 0.2, AMZN:  0.6,
  TSLA:  0.8, NFLX:  0.7, META:  0.5, NVDA:  0.9, ORCL:  0.3,
  WMT:   0.4, HD:    0.5, JNJ:   0.3, PFE:   0.4, BAC:   0.5,
};

// Rate-limiting state for Alpha Vantage calls
export const API_PROVIDERS = {
  ALPHA_VANTAGE: 'alphavantage',
  YAHOO_FINANCE: 'yahoofinance',
  MOCK:          'mock'
};
export let alphaVantageCallsToday = 0;
export let lastApiReset = new Date().setHours(0, 0, 0, 0);

// Decide which API provider to use (resets daily)
export function getCurrentApiProvider() {
  const today = new Date().setHours(0, 0, 0, 0);
  if (today > lastApiReset) {
    alphaVantageCallsToday = 0;
    lastApiReset = today;
  }
  if (alphaVantageCallsToday < 20 && process.env.ALPHAVANTAGE_API_KEY) {
    return API_PROVIDERS.ALPHA_VANTAGE;
  }
  if (process.env.YAHOO_FINANCE_API_KEY) {
    return API_PROVIDERS.YAHOO_FINANCE;
  }
  return API_PROVIDERS.MOCK;
}

// Fetch daily-adjusted series from Alpha Vantage
export async function fetchAlphaVantageDailyAdjusted(symbol) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}`;
  try {
    alphaVantageCallsToday++;
    const resp = await axios.get(url);
    const series = resp.data['Time Series (Daily)'];
    if (!series) return null;
    const dates = Object.keys(series).sort();
    const last30 = dates.slice(-30);
    const closes = last30.map(d => parseFloat(series[d]['4. close']));
    const latest = closes[closes.length - 1];
    let pct = 0;
    if (closes.length > 1) {
      const prev = closes[closes.length - 2];
      pct = ((latest - prev) / prev) * 100;
    }
    return { price: latest, volume: 0, percent_change: +pct.toFixed(2), historicalPrices: closes };
  } catch {
    return null;
  }
}

// Fetch historical options via Alpha Vantage
export async function fetchAlphaVantageHistoricalOptions(symbol) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;
  const date = '2017-11-15';
  const url = `https://www.alphavantage.co/query?function=HISTORICAL_OPTIONS&symbol=${symbol}&date=${date}&apikey=${apiKey}`;
  try {
    alphaVantageCallsToday++;
    const { data } = await axios.get(url);
    if (!data?.data) return null;
    return data.data.map(item => ({
      strike: item.strike,
      expiry: item.expiry || date,
      premium: item.premium || 0,
      openInterest: item.openInterest || 0,
      attackIntensity: +(((item.premium||0)*(item.openInterest||0)/100000).toFixed(2))
    }));
  } catch {
    return null;
  }
}

// Fetch news sentiment via Alpha Vantage
export async function fetchAlphaVantageNewsSentiment(tickers = 'COIN,CRYPTO:BTC,FOREX:USD') {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickers}&limit=1000&apikey=${apiKey}`;
  try {
    alphaVantageCallsToday++;
    const { data } = await axios.get(url);
    return data.feed || null;
  } catch {
    return null;
  }
}

// Generate mock data when external APIs fail
export function getMockStockData(symbol) {
  if (!demoStockData[symbol]) return null;
  const base = demoStockData[symbol].price;
  const varPct = (Math.random()*4 - 2)/100;
  const newPrice = +((base*(1+varPct)).toFixed(2));
  const prev = historicalData[symbol]?.slice(-1)[0] || base;
  const pct = +(((newPrice - prev)/prev)*100).toFixed(2);
  if (historicalData[symbol]) {
    historicalData[symbol].shift();
    historicalData[symbol].push(newPrice);
  }
  return { price: newPrice, volume: Math.floor(demoStockData[symbol].volume*(1+(Math.random()*0.2-0.1))), percent_change: pct, historicalPrices: historicalData[symbol] };
}

// Unified fetch with fallback & caching
export async function fetchStockData(symbol) {
  const key = `stock_${symbol}`;
  const cached = stockCache.get(key);
  if (cached) return cached;
  const provider = getCurrentApiProvider();
  let result = null;
  if (provider === API_PROVIDERS.ALPHA_VANTAGE) {
    result = await fetchAlphaVantageDailyAdjusted(symbol) ||
             await fetchAlphaVantageIntraday(symbol);
  } else if (provider === API_PROVIDERS.YAHOO_FINANCE) {
    // placeholder for Yahoo logic
    result = null;
  }
  if (!result) result = getMockStockData(symbol);
  if (result) stockCache.set(key, result);
  return result;
}

// Fallback intraday 5-min averages (used internally)
async function fetchAlphaVantageIntraday(symbol) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;
  try {
    alphaVantageCallsToday++;
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;
    const { data } = await axios.get(url);
    const series = data['Time Series (5min)'];
    if (!series) return null;
    const times = Object.keys(series).sort();
    const dates = {};
    times.forEach(ts => {
      const d = ts.split(' ')[0];
      dates[d] = dates[d] || [];
      dates[d].push(+series[ts]['4. close']);
    });
    const last30 = Object.keys(dates).sort().slice(-30);
    const averages = last30.map(d => {
      const arr = dates[d];
      return +(arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(4);
    });
    const lastAvg = averages.at(-1);
    const prevAvg = averages.at(-2) || lastAvg;
    const pct = +(((lastAvg - prevAvg)/prevAvg)*100).toFixed(2);
    return { price: lastAvg, volume: 0, percent_change: pct, historicalPrices: averages };
  } catch {
    return null;
  }
}
