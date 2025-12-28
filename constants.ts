
import { SymbolInfo } from './types';

export const SUPPORTED_SYMBOLS: SymbolInfo[] = [
  { symbol: 'BTCUSDT', alias: 'BTC', hasApi: true },
  { symbol: 'ETHUSDT', alias: 'ETH', hasApi: true },
  { symbol: 'SOLUSDT', alias: 'SOL', hasApi: true },
  { symbol: 'BNBUSDT', alias: 'BNB', hasApi: true },
  { symbol: 'ADAUSDT', alias: 'ADA', hasApi: true },
  { symbol: 'DOGEUSDT', alias: 'DOGE', hasApi: true },
  { symbol: 'TSLA', alias: 'TSLA', hasApi: false },
  { symbol: 'NVDA', alias: 'NVDA', hasApi: false },
  { symbol: 'AAPLE', alias: 'AAPL', hasApi: false },
];

export const STORAGE_KEYS = {
  PORTFOLIO: 'spot_tracer_portfolio_v6',
  CURRENT_SYMBOL: 'spot_tracer_current_symbol_v6',
};
