import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Heading from "@/components/ui/Heading";
import Loader from "@/components/ui/Loader";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { useCategories } from "@/hooks/useCategories";
import type { CreateRecurringExpenseDto, RecurringExpenseDto } from "@/Types";

import RecurringForm from "@/components/recurring/RecurringForm";
import type { RecurringFormState } from "@/components/recurring/RecurringForm";
import RecurringItem from "@/components/recurring/RecurringItem";
import RecurringSummaryCards from "@/components/recurring/RecurringSummaryCards";
import RecurringEmptyState from "@/components/recurring/RecurringEmptyState";

export const Route = createFileRoute("/dashboard/recurring/")({
  component: RecurringExpensesPage,
});

const INTERVALS = [
  { label: "Daily",   value: 0 },
  { label: "Weekly",  value: 1 },
  { label: "Monthly", value: 2 },
  { label: "Yearly",  value: 3 },
];

function RecurringExpensesPage() {
  const { t } = useTranslation();
  const { recurringExpenses, isPending, create, update, toggle, remove } = useRecurringExpenses();
  const { categories } = useCategories();

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<RecurringExpenseDto | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = (dto: CreateRecurringExpenseDto) => {
    create.mutate(dto, {
      onSuccess: () => { toast.success(t("recurring.createdSuccess")); setShowForm(false); },
      onError:   () => toast.error(t("recurring.createFailed")),
    });
  };

  const handleUpdate = (dto: CreateRecurringExpenseDto) => {
    if (!editing) return;
    update.mutate(
      { id: editing.id, dto: { ...dto, isActive: editing.isActive } },
      {
        onSuccess: () => { toast.success(t("recurring.updatedSuccess")); setEditing(null); },
        onError:   () => toast.error(t("recurring.updateFailed")),
      }
    );
  };

  const handleToggle = (id: number) => {
    toggle.mutate(id, {
      onSuccess: () => toast.success(t("recurring.statusUpdated")),
      onError:   () => toast.error(t("recurring.statusFailed")),
    });
  };

  const handleDelete = (id: number) => {
    toast((toastInstance) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">{t("recurring.deleteConfirm")}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(toastInstance.id)}
            className="px-3 py-1 text-sm bg-gray-200 rounded-md"
          >
            {t("common.no")}
          </button>
          <button
            onClick={() => { remove.mutate(id); toast.dismiss(toastInstance.id); }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md"
          >
            {t("common.yes")}
          </button>
        </div>
      </div>
    ));
  };

  // ── Editing form initial state ────────────────────────────────────────────

  const editingFormState: RecurringFormState | undefined = editing
    ? {
        title:       editing.title,
        amount:      String(editing.amount),
        interval:    INTERVALS.find((i) => i.label === editing.interval)?.value ?? 2,
        dayOfPeriod: editing.dayOfPeriod,
        startDate:   editing.startDate.split("T")[0],
        endDate:     editing.endDate?.split("T")[0] ?? "",
        categoryId:  editing.categoryId,
      }
    : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  if (isPending) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Heading
          HeadTitle={t("recurring.title")}
          SubTitle={t("recurring.subTitle")}
        />
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-gradient px-6 py-3 font-bold text-white editorial-shadow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4"
        >
          <Plus size={16} />
          {t("recurring.addRecurring")}
        </button>
      </div>

      {/* Summary cards */}
      {recurringExpenses.length > 0 && (
        <RecurringSummaryCards recurringExpenses={recurringExpenses} />
      )}

      {/* Empty state */}
      {recurringExpenses.length === 0 && (
        <RecurringEmptyState onAdd={() => setShowForm(true)} />
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {recurringExpenses.map((item) => (
          <RecurringItem
            key={item.id}
            item={item}
            onEdit={setEditing}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <RecurringForm
          categories={categories ?? []}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isLoading={create.isPending}
        />
      )}

      {/* Edit form */}
      {editing && (
        <RecurringForm
          initial={editingFormState}
          categories={categories ?? []}
          onSubmit={handleUpdate}
          onClose={() => setEditing(null)}
          isLoading={update.isPending}
        />
      )}
    </div>
  );
}
