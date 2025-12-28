
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { translations, Language } from '../translations';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
  editingTransaction?: Transaction | null;
  symbolAlias: string;
  lang: Language;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  editingTransaction,
  symbolAlias,
  lang
}) => {
  const t = translations[lang];
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('buy');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setDate(editingTransaction.date);
      setType(editingTransaction.type);
      setPrice(editingTransaction.price.toString());
      setQty(editingTransaction.qty.toString());
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setType('buy');
      setPrice('');
      setQty('');
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    const q = parseFloat(qty);
    if (isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
      alert(t.errorValidInput);
      return;
    }
    onSubmit({ date, type, price: p, qty: q }, editingTransaction?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {editingTransaction ? t.editRecord : t.addRecord} ({symbolAlias})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.date}</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.type}</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white"
              >
                <option value="buy">{t.buy}</option>
                <option value="sell">{t.sell}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.price}</label>
              <input 
                type="number" 
                step="any"
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.quantity} ({symbolAlias})</label>
            <input 
              type="number" 
              step="any"
              value={qty} 
              onChange={(e) => setQty(e.target.value)}
              placeholder="0.0000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              required
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
            >
              {t.saveTransaction}
            </button>
            {editingTransaction && onDelete && (
              <button 
                type="button"
                onClick={() => {
                  if(confirm(t.confirmDelete)) {
                    onDelete(editingTransaction.id);
                    onClose();
                  }
                }}
                className="w-full border border-rose-100 text-rose-500 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all"
              >
                {t.deleteRecord}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
