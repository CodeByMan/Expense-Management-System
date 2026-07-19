import CategoryForm from '@/components/category/CategoryForm'
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import type { Category, CategoryBudgetDto } from '@/Types';
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Trash2 } from "lucide-react";
import { useState } from 'react';
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMonthlySummary, setBudget } from '@/api/expense';
import { useCategories } from '@/hooks/useCategories';
import MonthNavigator from '@/components/common/MonthNavigator';
import CarryForwardButton from '@/components/category/CarryForwardButton';
import BudgetCell from '@/components/category/BudgetCell';
import { t } from 'i18next';
import { formatCurrency } from '@/lib/currency';

export const Route = createFileRoute('/dashboard/category/')({
  component: CategoryPage,
})

function CategoryPage() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { categories, isFetching, deleteCategory, isDeleting, error } = useCategories();
  const queryClient = useQueryClient();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: monthlySummary } = useQuery({
    queryKey: ['category-budgets', month, year],
    queryFn: () => getMonthlySummary(month, year),
  });

  const budgetMap = new Map<number, CategoryBudgetDto>(
    (monthlySummary?.categories ?? []).map((b) => [b.categoryId, b])
  );

  const setBudgetMutation = useMutation({
    mutationFn: setBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets', month, year] });
      toast.success('Budget updated!');
    },
    onError: () => toast.error('Failed to update budget.'),
  });
const visibleCategories = categories ?? [];
  const handleSetBudget = (categoryId: number, amount: number) => {
    setBudgetMutation.mutate({ categoryId, month, year, amount });
  };

  const handlePrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const handleNext = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleDelete = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Are you sure you want to delete this category?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 text-sm bg-gray-200 rounded-md">No</button>
          <button
            onClick={() => { deleteCategory(id); toast.dismiss(t.id); }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md"
          >
            Yes
          </button>
        </div>
      </div>
    ));
  };

// Monthly summary
const totalBudget       = monthlySummary?.totalBudget ?? 0;
const totalSpent        = monthlySummary?.totalSpent ?? 0;
const allocated         = monthlySummary?.totalAllocatedToSavings ?? 0;
const availableSurplus  = monthlySummary?.availableSurplus ?? 0;


  if (isFetching) return <Loader text="Loading categories..." />;
  if (error) return <div className="bg-red-300 text-red-900 p-4 rounded-xl">{error.message}</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <Heading HeadTitle={t('category.title')} SubTitle={t('category.subTitle')} />
        <button
          type="button"
          className="w-full rounded-xl bg-primary-gradient px-6 py-3 font-bold text-white editorial-shadow transition-all duration-200 hover:brightness-95 active:scale-95 sm:w-auto sm:px-8 sm:py-4"
          onClick={() => { setSelectedCategory(null); setOpen(true); }}
        >
          {t('category.addCategory')}
        </button>
      </div>

      {open && (
        <CategoryForm onClose={() => setOpen(false)} category={selectedCategory} />
      )}

      {/* Month navigator + summary */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <MonthNavigator month={month} year={year} onPrev={handlePrev} onNext={handleNext} />

        {budgetMap.size > 0 && (
          <CarryForwardButton
            fromMonth={month}
            fromYear={year}
            hasbudgets={budgetMap.size > 0}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['category-budgets', month, year] })}
          />
        )}

       {totalBudget > 0 && (
  <div className="grid w-full grid-cols-2 gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm sm:w-auto sm:grid-cols-4 sm:gap-6 sm:px-5">
    <div className="text-center">
      <p className="text-xs text-gray-400">Total budget</p>
      <p className="font-semibold">{formatCurrency(totalBudget)}</p>
    </div>
    <div className="text-center">
      <p className="text-xs text-gray-400">Total spent</p>
      <p className={`font-semibold ${totalSpent > totalBudget ? 'text-red-500' : 'text-gray-800'}`}>
        {formatCurrency(totalSpent)}
      </p>
    </div>
    {allocated > 0 && (
      <div className="text-center">
        <p className="text-xs text-gray-400">Saved to goals</p>
        <p className="font-semibold text-purple-600">
          -{formatCurrency(allocated)}
        </p>
      </div>
    )}
    <div className="text-center">
      <p className="text-xs text-gray-400">Available</p>
      <p className={`font-semibold ${availableSurplus <= 0 ? 'text-red-500' : 'text-green-600'}`}>
        {formatCurrency(availableSurplus)}
      </p>
    </div>
  </div>
)}
      </div>

      {/* Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full rounded-xl border border-border bg-card shadow-sm">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">{t('category.table.category')}</th>
              <th className="px-6 py-3 text-left">{t('category.table.description')}</th>
              <th className="px-6 py-3 text-left">
                {t('category.table.monthly Budget')}
                <span className="ml-1 text-[10px] text-gray-400 normal-case font-normal">
                  (spent / limit)
                </span>
              </th>
              <th className="px-6 py-3 text-center">{t('category.table.actions')}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-gray-700">
            {visibleCategories.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-sm font-medium text-gray-500">No categories yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Add your first category or copy from the previous month
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition">

                  {/* Category name with icon + color */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{
                          backgroundColor: category.color + "22",
                          border: `1.5px solid ${category.color}55`,
                        }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{category.categoryName}</p>
                        <p
                          className="text-[10px] font-semibold mt-0.5"
                          style={{ color: category.color }}
                        >
                          ●
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {category.categoryDescription}
                  </td>

                  <td className="px-6 py-4">
                    <BudgetCell
                      category={category}
                      budgetEntry={budgetMap.get(category.id)}
                      month={month}
                      year={year}
                      onSet={handleSetBudget}
                      isSaving={setBudgetMutation.isPending}
                    />
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                        title="Edit"
                        onClick={() => { setSelectedCategory(category); setOpen(true); }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                        title="Delete"
                        onClick={() => handleDelete(category.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {visibleCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="font-semibold">No categories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first category to begin tracking expenses.</p>
          </div>
        ) : visibleCategories.map((category) => (
          <article key={category.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: category.color + "22", border: `1.5px solid ${category.color}55` }}>{category.icon}</div>
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{category.categoryName}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{category.categoryDescription}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="rounded-lg bg-blue-500/10 p-2 text-blue-600" onClick={() => { setSelectedCategory(category); setOpen(true); }} aria-label={`Edit ${category.categoryName}`}><Pencil size={16} /></button>
                <button className="rounded-lg bg-red-500/10 p-2 text-red-600" onClick={() => handleDelete(category.id)} disabled={isDeleting} aria-label={`Delete ${category.categoryName}`}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <BudgetCell category={category} budgetEntry={budgetMap.get(category.id)} month={month} year={year} onSet={handleSetBudget} isSaving={setBudgetMutation.isPending} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}