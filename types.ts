
export type TransactionType = 'buy' | 'sell';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  price: number;
  qty: number;
}

export interface Portfolio {
  [symbol: string]: Transaction[];
}

export interface SymbolInfo {
  symbol: string;
  alias: string;
  hasApi: boolean;
}

export interface CalculationResult {
  avgPrice: number;
  totalQty: number;
  realizedPL: number;
  currentValue: number;
  unrealizedPL: number;
  processedTransactions: (Transaction & {
    postAvgPrice: number;
    transactionPL?: number;
    cumulativePL: number;
  })[];
}
