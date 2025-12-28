
import React from 'react';
import { Transaction } from '../types';
import { translations, Language } from '../translations';

interface TransactionItemProps {
  tx: Transaction & { postAvgPrice: number; transactionPL?: number; cumulativePL: number };
  onClick: () => void;
  lang: Language;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ tx, onClick, lang }) => {
  const t = translations[lang];
  const isBuy = tx.type === 'buy';
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isBuy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {isBuy ? t.buy : t.sell}
          </span>
          <span className="text-xs text-gray-400 font-medium">{tx.date}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-medium">{t.totalVolume}</p>
          <p className="text-sm font-bold text-gray-700">{formatCurrency(tx.price * tx.qty)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{t.price}:</span>
          <span className="font-semibold text-gray-800">{formatCurrency(tx.price)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{t.quantity}:</span>
          <span className="font-semibold text-gray-800">{tx.qty.toFixed(4)}</span>
        </div>
        <div className="flex justify-between text-xs col-span-2 pt-1 border-t border-gray-50">
          <span className="text-gray-500 italic">{t.avgPriceAfter}:</span>
          <span className="font-semibold text-indigo-600">{formatCurrency(tx.postAvgPrice)}</span>
        </div>
      </div>

      {tx.transactionPL !== undefined && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-100 flex justify-between items-center text-xs">
          <span className="text-gray-500">{t.realizedPL}:</span>
          <span className={`font-bold ${tx.transactionPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {tx.transactionPL >= 0 ? '+' : ''}{formatCurrency(tx.transactionPL)}
          </span>
        </div>
      )}
    </div>
  );
};

export default TransactionItem;
