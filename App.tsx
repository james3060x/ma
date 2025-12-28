
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, Portfolio, CalculationResult } from './types';
import { SUPPORTED_SYMBOLS, STORAGE_KEYS } from './constants';
import { fetchPrice } from './services/binanceService';
import { getPortfolioInsights } from './services/geminiService';
import { translations, Language } from './translations';
import SummaryCard from './components/SummaryCard';
import TransactionForm from './components/TransactionForm';
import TransactionItem from './components/TransactionItem';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('spot_tracer_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  const t = translations[language];

  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    return saved ? JSON.parse(saved) : {};
  });

  const [currentSymbol, setCurrentSymbol] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SYMBOL) || SUPPORTED_SYMBOLS[0].symbol;
  });

  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const currentSymbolInfo = useMemo(() => 
    SUPPORTED_SYMBOLS.find(s => s.symbol === currentSymbol) || SUPPORTED_SYMBOLS[0]
  , [currentSymbol]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
    localStorage.setItem(STORAGE_KEYS.CURRENT_SYMBOL, currentSymbol);
    localStorage.setItem('spot_tracer_lang', language);
  }, [portfolio, currentSymbol, language]);

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'zh' : 'en');

  // Price Fetching
  const updatePrice = useCallback(async () => {
    if (currentSymbolInfo.hasApi) {
      const price = await fetchPrice(currentSymbol);
      if (price) setMarketPrice(price);
    } else {
      setMarketPrice(null);
    }
  }, [currentSymbol, currentSymbolInfo.hasApi]);

  useEffect(() => {
    updatePrice();
    const interval = setInterval(updatePrice, 20000);
    return () => clearInterval(interval);
  }, [updatePrice]);

  // Calculation Logic
  const stats: CalculationResult = useMemo(() => {
    const txs = [...(portfolio[currentSymbol] || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningQty = 0;
    let runningCost = 0;
    let realizedPL = 0;
    let currentAvgPrice = 0;

    const processed = txs.map(tx => {
      let txPL: number | undefined;
      const prevAvg = currentAvgPrice;

      if (tx.type === 'buy') {
        runningCost += (tx.price * tx.qty);
        runningQty += tx.qty;
        currentAvgPrice = runningQty > 0 ? (runningCost / runningQty) : 0;
      } else {
        if (runningQty > 0) {
          txPL = (tx.price - prevAvg) * tx.qty;
          realizedPL += txPL;
          runningCost -= (prevAvg * tx.qty);
          runningQty -= tx.qty;
        }
        if (runningQty < 0.00000001) {
          runningQty = 0;
          runningCost = 0;
          currentAvgPrice = 0;
        }
      }

      return {
        ...tx,
        postAvgPrice: currentAvgPrice,
        transactionPL: txPL,
        cumulativePL: realizedPL
      };
    });

    const marketValue = marketPrice ? marketPrice * runningQty : 0;
    const unrealizedPL = marketPrice ? (marketPrice - currentAvgPrice) * runningQty : 0;

    return {
      avgPrice: currentAvgPrice,
      totalQty: runningQty,
      realizedPL,
      currentValue: marketValue,
      unrealizedPL,
      processedTransactions: processed
    };
  }, [portfolio, currentSymbol, marketPrice]);

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, id?: string) => {
    const symbolTxs = [...(portfolio[currentSymbol] || [])];
    if (id) {
      const idx = symbolTxs.findIndex(t => t.id === id);
      if (idx !== -1) symbolTxs[idx] = { ...txData, id };
    } else {
      symbolTxs.push({ ...txData, id: Date.now().toString() });
    }
    setPortfolio({ ...portfolio, [currentSymbol]: symbolTxs });
    setAiInsights(null); 
  };

  const handleDeleteTransaction = (id: string) => {
    const symbolTxs = (portfolio[currentSymbol] || []).filter(t => t.id !== id);
    setPortfolio({ ...portfolio, [currentSymbol]: symbolTxs });
    setAiInsights(null);
  };

  const handleExportCSV = () => {
    const txs = stats.processedTransactions;
    if (txs.length === 0) return;
    
    let csv = "\uFEFFDate,Type,Price,Quantity,AvgPriceAfter,TransactionPL\n";
    txs.forEach(t => {
      csv += `${t.date},${t.type},${t.price},${t.qty},${t.postAvgPrice},${t.transactionPL || 0}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SpotTracer_${currentSymbolInfo.alias}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    const text = await getPortfolioInsights(currentSymbolInfo.alias, stats, marketPrice, language);
    setAiInsights(text);
    setIsLoadingInsights(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-4 backdrop-blur-md bg-white/80">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight leading-none">{t.appName}</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.version}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 transition-all"
            >
              {t.langToggle}
            </button>
            <select 
              value={currentSymbol} 
              onChange={(e) => setCurrentSymbol(e.target.value)}
              className="bg-slate-100 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {SUPPORTED_SYMBOLS.map(s => (
                <option key={s.symbol} value={s.symbol}>{s.alias}</option>
              ))}
            </select>
            <button 
              onClick={handleExportCSV}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title={t.exportCsv}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <SummaryCard 
          avgPrice={stats.avgPrice}
          totalQty={stats.totalQty}
          realizedPL={stats.realizedPL}
          marketPrice={marketPrice}
          marketValue={stats.currentValue}
          unrealizedPL={stats.unrealizedPL}
          symbolAlias={currentSymbolInfo.alias}
          lang={language}
        />

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                </span>
                <h3 className="font-bold text-slate-800">{t.geminiInsights}</h3>
              </div>
              <button 
                onClick={fetchInsights}
                disabled={isLoadingInsights || stats.processedTransactions.length === 0}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 disabled:opacity-50 transition-all"
              >
                {isLoadingInsights ? t.thinking : aiInsights ? t.refresh : t.analyzePortfolio}
              </button>
           </div>
           {aiInsights ? (
             <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-4 py-1">
               "{aiInsights}"
             </p>
           ) : (
             <p className="text-sm text-slate-400">{t.aiPlaceholder}</p>
           )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="font-extrabold text-slate-800 text-lg">{t.activityHistory}</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">
              {stats.processedTransactions.length} {t.records}
            </span>
          </div>

          <div className="space-y-3">
            {[...stats.processedTransactions].reverse().map(tx => (
              <TransactionItem 
                key={tx.id} 
                tx={tx} 
                lang={language}
                onClick={() => {
                  setEditingTx(tx);
                  setIsFormOpen(true);
                }} 
              />
            ))}
            {stats.processedTransactions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p className="text-slate-400 font-medium">{t.noTransactions} {currentSymbolInfo.alias}.</p>
                <p className="text-slate-300 text-xs">{t.tapPlus}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <button 
        onClick={() => {
          setEditingTx(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-300 hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all z-40"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
      </button>

      <TransactionForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        editingTransaction={editingTx}
        symbolAlias={currentSymbolInfo.alias}
        lang={language}
      />
    </div>
  );
};

export default App;
