import type { Category, CategoryBudgetDto } from '@/Types';
import { Wallet, Check, X, Pencil } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';

type BudgetCellProps = {
  category: Category;
  budgetEntry?: CategoryBudgetDto;
  month: number;
  year: number;
  onSet: (categoryId: number, amount: number) => void;
  isSaving: boolean;
};

export default function BudgetCell({
  category,
  budgetEntry,
  onSet,
  isSaving,
}: BudgetCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onSet(category.id, parsed);
      setEditing(false);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') { setEditing(false); setValue(''); }
  };

  if (!budgetEntry && !editing) {
    return (
      <button
        onClick={() => { setEditing(true); setValue(''); }}
        className="flex items-center gap-1.5 text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
      >
        <Wallet size={12} />
        Set budget
      </button>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">PKR</span>
        <input
          type="number"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={budgetEntry ? String(budgetEntry.amount) : '0'}
          className="w-24 text-sm border border-blue-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button onClick={handleConfirm} disabled={isSaving} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
          <Check size={12} />
        </button>
        <button onClick={() => { setEditing(false); setValue(''); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
          <X size={12} />
        </button>
      </div>
    );
  }

  const pct = Math.min(budgetEntry!.percentageUsed, 100);
  const isOver = budgetEntry!.isOverBudget;

  return (
    <div className="flex items-center gap-3 min-w-45">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700">
            {formatCurrency(budgetEntry!.totalSpent)}
            <span className="text-gray-400 font-normal"> / {formatCurrency(budgetEntry!.amount)}</span>
          </span>
          <span className={`text-[10px] font-semibold ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
            {budgetEntry!.percentageUsed.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: isOver ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#42be85' }}
          />
        </div>
        {isOver && (
          <p className="text-[10px] text-red-500 mt-0.5">
            {formatCurrency(budgetEntry!.totalSpent - budgetEntry!.amount)} over
          </p>
        )}
      </div>
      <button
        onClick={() => { setEditing(true); setValue(String(budgetEntry!.amount)); }}
        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0"
        title="Edit budget"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}