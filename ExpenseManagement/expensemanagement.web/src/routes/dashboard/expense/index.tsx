import ExpenseForm from '@/components/expence/ExpenseForm';
import TopCard from '@/components/expence/TopCard';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import { useCategories } from '@/hooks/useCategories';
import type { Expense, MonthlySummaryDto } from '@/Types';
import { createFileRoute } from '@tanstack/react-router';
import { Pencil, Trash2, Search, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMonthlySummary } from '@/api/expense';
import MonthNavigator from '@/components/common/MonthNavigator';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency } from '@/lib/currency';

export const Route = createFileRoute('/dashboard/expense/')({
  component: ExpensePage,
});

const BAR_COLORS = ['#0058be', '#42be85', '#8B5CF6', '#F97316', '#EC4899', '#FFC107'];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Budget banner ─────────────────────────────────────────────────────────────

function BudgetBanner({
  summary,
  categoryMeta,
}: {
  summary?: MonthlySummaryDto;
  categoryMeta: Map<string, { icon: string; color: string }>;
}) {
  if (!summary || summary.totalBudget === 0) return null;

  const pct = Math.min((summary.totalSpent / summary.totalBudget) * 100, 100);
  const isOver = summary.isOverBudget;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-800">Monthly budget overview</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isOver ? 'bg-red-100 text-red-600' : pct >= 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        }`}>
          {pct.toFixed(0)}% used
        </span>
      </div>

      {/* Main bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: isOver ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#42be85',
          }}
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500 mb-4">
        <span>Spent: <strong className="text-gray-800">{formatCurrency(summary.totalSpent)}</strong></span>
        <span>Budget: <strong className="text-gray-800">{formatCurrency(summary.totalBudget)}</strong></span>
        <span className={isOver ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
          {isOver
            ? `${formatCurrency(summary.totalSpent - summary.totalBudget)} over`
            : `${formatCurrency(summary.remaining)} left`}
        </span>
      </div>

      {/* Per-category mini bars with icon + color */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {summary.categories.map((cat, i) => {
          const meta = categoryMeta.get(cat.categoryName);
          const barColor = meta?.color ?? BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={cat.categoryId}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  {meta && (
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: meta.color + "22" }}
                    >
                      {meta.icon}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-500 truncate">{cat.categoryName}</span>
                </div>
                <span className={`text-[11px] font-medium ${cat.isOverBudget ? 'text-red-500' : 'text-gray-400'}`}>
                  {cat.percentageUsed.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(cat.percentageUsed, 100)}%`,
                    background: cat.isOverBudget ? '#EF4444' : barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ExpensePage() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Expense | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const {expenses,deleteExpense,error,isPending} = useExpenses();
  const { categories } = useCategories();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const handlePrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const handleNext = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // category name → { icon, color }
  const categoryMeta = useMemo(() => {
    const map = new Map<string, { icon: string; color: string }>();
    categories?.forEach((c) => map.set(c.categoryName, { icon: c.icon, color: c.color }));
    return map;
  }, [categories]);

  const { data: monthlySummary } = useQuery({
    queryKey: ['category-budgets', month, year],
    queryFn: () => getMonthlySummary(month, year),
  });

  

const handleDelete = (id: number) => {
  toast((toastInstance) => (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{t("expense.deleteConfirm")}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => toast.dismiss(toastInstance.id)}
          className="px-3 py-1 text-sm bg-gray-200 rounded-md"
        >
          {t("common.no")}
        </button>
        <button
          onClick={() => { deleteExpense(id); toast.dismiss(toastInstance.id); }}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md"
        >
          {t("common.yes")}
        </button>
      </div>
    </div>
  ));
};

  const filteredExpenses = useMemo(() => {
    return (expenses ?? []).filter((exp) => {
      const d = new Date(exp.date);
      const matchesMonth = d.getMonth() + 1 === month && d.getFullYear() === year;
      const matchesCategory = activeCategory === 'All' || exp.categoryName === activeCategory;
      const matchesSearch = exp.title.toLowerCase().includes(search.toLowerCase());
      return matchesMonth && matchesCategory && matchesSearch;
    });
  }, [expenses, month, year, activeCategory, search]);

  const totalAll = (expenses ?? []).reduce((sum, exp) => sum + exp.amount, 0);
  const monthlySpend = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

if (isPending) return <Loader text="Loading expenses..." />;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error.message}</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <Heading HeadTitle={t('expense.title')} SubTitle={t('expense.subTitle')} />
        {open && <ExpenseForm onClose={() => setOpen(false)} expense={selectedItem} />}
        <button
          type="button"
          className="w-full rounded-xl bg-primary-gradient px-6 py-3 font-bold text-white editorial-shadow transition-all duration-200 hover:brightness-95 active:scale-95 sm:w-auto sm:px-8 sm:py-4"
          onClick={() => { setSelectedItem(null); setOpen(true); }}
        >
          {t('expense.addExpense')}
        </button>
      </div>

      <TopCard totalAll={totalAll} monthlySpend={monthlySpend} />

      {/* Month navigator + search */}
      <div className="flex items-center justify-between mt-6 mb-4 flex-wrap gap-3">
        <MonthNavigator month={month} year={year} onPrev={handlePrev} onNext={handleNext} />
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm sm:w-auto">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder-gray-400 sm:w-44"
          />
        </div>
      </div>

      {/* Budget banner */}
      <BudgetBanner summary={monthlySummary} categoryMeta={categoryMeta} />

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeCategory === 'All'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>

        {categories?.map((category) => {
          const isActive = activeCategory === category.categoryName;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.categoryName)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={{
                backgroundColor: isActive ? category.color : category.color + "18",
                borderColor: category.color + "55",
                color: isActive ? "#fff" : category.color,
              }}
            >
              <span className="text-base leading-none">{category.icon}</span>
              {category.categoryName}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-3">
        {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} in {MONTH_NAMES[month - 1]} {year}
        {activeCategory !== 'All' && ` · ${activeCategory}`}
        {search && ` · "${search}"`}
      </p>

      {/* Table header */}
      <div className="mt-2 hidden grid-cols-5 rounded-xl bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-gray-400 shadow-sm md:grid">
        <span>{t('expense.table.date')}</span>
        <span>{t('expense.table.expense')}</span>
        <span>{t('expense.table.category')}</span>
        <span>{t('expense.table.amount')}</span>
        <span className="text-right">{t('expense.table.actions')}</span>
      </div>

      {/* Expense rows */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Trash2 size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No expenses found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search
              ? `No results for "${search}"`
              : `Nothing recorded in ${MONTH_NAMES[month - 1]} ${year}`}
          </p>
        </div>
      ) : (
        filteredExpenses.map((expense) => {
          const meta = categoryMeta.get(expense.categoryName);
          return (
            <div
              key={expense.id}
              className="mb-3 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:bg-muted/40 md:grid-cols-5 md:items-center md:gap-2 md:p-5"
            >
              {/* Date */}
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Title — avatar uses category icon + color */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-lg flex-shrink-0"
                  style={{
                    backgroundColor: meta ? meta.color + "22" : "#F1F5F9",
                    border: `1.5px solid ${meta ? meta.color + "55" : "#E2E8F0"}`,
                  }}
                >
                  {meta ? meta.icon : expense.title.charAt(0).toUpperCase()}
                </div>
                <p className="font-medium text-sm truncate">{expense.title}</p>
              </div>

              {/* Category badge — icon + color */}
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: meta ? meta.color + "18" : "#F3F4F6",
                    color: meta ? meta.color : "#374151",
                  }}
                >
                  {meta && <span>{meta.icon}</span>}
                  {expense.categoryName}
                </span>
              </div>

              {/* Amount */}
              <div>
                <p className="font-semibold text-gray-800">{formatCurrency(expense.amount)}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-start gap-2 md:justify-end">
                <button
                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                  title="Edit"
                  onClick={() => { setSelectedItem(expense); setOpen(true); }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50"
                  title="Delete"
                  onClick={() => handleDelete(expense.id)}
                  disabled={isPending}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}