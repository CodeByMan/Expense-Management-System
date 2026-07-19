import type { CreateExpense, Expense } from "@/Types";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";

type ExpenseFormProps = {
  onClose: () => void;
  expense?: Expense | null;
};

export default function ExpenseForm({ onClose, expense }: ExpenseFormProps) {
  const isEdit = !!expense;

  const { createExpense,  isCreating , updateExpense, isUpdating} = useExpenses();
  const { categories, isFetching } = useCategories();

  // track selected category to show its icon+color in the trigger
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    expense?.categoryId ?? 0
  );

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Expense>({
    defaultValues: {
      title: expense?.title ?? "",
      amount: expense?.amount ?? 0,
      categoryId: expense?.categoryId ?? 0,
      date: expense?.date ?? "",
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        title: expense.title,
        amount: expense.amount,
        categoryId: Number(expense.categoryId),
        date: expense.date ? expense.date.split("T")[0] : "",
      });
      setSelectedCategoryId(Number(expense.categoryId));
    }
  }, [expense, reset]);

  const onSubmit = (data: Expense) => {
    const payload: CreateExpense = {
      Title: data.title,
      Amount: Number(data.amount),
      CategoryId: Number(data.categoryId),
      Date: data.date,
    };

    if (isEdit) {
      updateExpense(
        { id: expense!.id, data: payload },
        { onSuccess: () => { reset(); onClose(); } }
      );
    } else {
      createExpense(payload, {
        onSuccess: () => { reset(); onClose(); }
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
            style={{
              backgroundColor: selectedCategory ? selectedCategory.color + "22" : "#F1F5F9",
              border: `1.5px solid ${selectedCategory ? selectedCategory.color + "55" : "#E2E8F0"}`,
            }}
          >
            {selectedCategory ? selectedCategory.icon : "💸"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {isEdit ? "Edit Expense" : "New Expense"}
            </h2>
            <p className="text-xs text-gray-400">
              {selectedCategory ? selectedCategory.categoryName : "Select a category below"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
            <Input
              {...register("title", { required: "Title is required" })}
              placeholder="e.g. Lunch at restaurant"
              className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">PKR</span>
              <Input
                {...register("amount", { required: "Amount is required" })}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-200 pl-12 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
            {isFetching ? (
              <div className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-400">
                Loading categories...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories?.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setValue("categoryId", cat.id, { shouldValidate: true });
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isSelected ? cat.color + "18" : "#F9FAFB",
                        borderColor: isSelected ? cat.color : "#E5E7EB",
                        color: isSelected ? cat.color : "#6B7280",
                      }}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate">{cat.categoryName}</span>
                      {isSelected && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {/* hidden input to keep RHF validation working */}
            <input
              type="hidden"
              {...register("categoryId", {
                required: "Category is required",
                validate: (v) => Number(v) !== 0 || "Please select a category",
              })}
            />
            {errors.categoryId && (
              <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
            <Input
              {...register("date", { required: "Date is required" })}
              type="date"
              className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-4 py-2 text-white rounded-xl transition-all"
              style={{ backgroundColor: selectedCategory?.color ?? "#6366F1" }}
            >
              {isEdit
                ? isUpdating ? "Updating..." : "Update"
                : isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}