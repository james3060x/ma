
import React from 'react';
import { translations, Language } from '../translations';

interface SummaryCardProps {
  avgPrice: number;
  totalQty: number;
  realizedPL: number;
  marketPrice: number | null;
  marketValue: number;
  unrealizedPL: number;
  symbolAlias: string;
  lang: Language;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  avgPrice,
  totalQty,
  realizedPL,
  marketPrice,
  marketValue,
  unrealizedPL,
  symbolAlias,
  lang
}) => {
  const t = translations[lang];
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  const isProfit = unrealizedPL >= 0;

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-indigo-100 text-sm font-medium">{t.avgBuyPrice}</p>
          <h2 className="text-3xl font-bold">{avgPrice > 0 ? formatCurrency(avgPrice) : '$0.00'}</h2>
        </div>
        <div className="text-right">
          <p className="text-indigo-100 text-sm font-medium">{t.holdings}</p>
          <p className="text-xl font-bold">{totalQty.toFixed(4)} {symbolAlias}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-400/30">
        <div>
          <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">{t.realizedPL}</p>
          <p className={`text-lg font-bold ${realizedPL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {realizedPL >= 0 ? '+' : ''}{formatCurrency(realizedPL)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">{t.marketValue}</p>
          <p className="text-lg font-bold">
            {marketPrice ? formatCurrency(marketValue) : '---'}
          </p>
        </div>
      </div>

      {marketPrice && (
        <div className="mt-4 p-3 bg-white/10 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-indigo-100 text-xs">{t.unrealizedPL}</p>
            <p className={`font-bold ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
              {isProfit ? '▲' : '▼'} {formatCurrency(unrealizedPL)} ({((unrealizedPL / (avgPrice * totalQty || 1)) * 100).toFixed(2)}%)
            </p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-xs">{t.marketPrice}</p>
            <p className="font-bold">{formatCurrency(marketPrice)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
