import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { Category, CreateRecurringExpenseDto } from "@/Types";

const INTERVALS = [
  { labelKey: "recurring.form.daily",   value: 0 },
  { labelKey: "recurring.form.weekly",  value: 1 },
  { labelKey: "recurring.form.monthly", value: 2 },
  { labelKey: "recurring.form.yearly",  value: 3 },
];

export type RecurringFormState = {
  title: string;
  amount: string;
  interval: number;
  dayOfPeriod: number;
  startDate: string;
  endDate: string;
  categoryId: number | "";
};

export const defaultForm = (): RecurringFormState => ({
  title: "",
  amount: "",
  interval: 2,
  dayOfPeriod: 1,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  categoryId: "",
});

type Props = {
  initial?: RecurringFormState;
  categories: Category[];
  onSubmit: (dto: CreateRecurringExpenseDto) => void;
  onClose: () => void;
  isLoading: boolean;
};

export default function RecurringForm({
  initial,
  categories,
  onSubmit,
  onClose,
  isLoading,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<RecurringFormState>(initial ?? defaultForm());
  const set = (key: keyof RecurringFormState, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.title || !form.amount || form.categoryId === "") {
      toast.error(t("recurring.form.requiredFields"));
      return;
    }
    onSubmit({
      title:       form.title,
      amount:      parseFloat(form.amount),
      interval:    form.interval,
      dayOfPeriod: form.dayOfPeriod,
      startDate:   form.startDate,
      endDate:     form.endDate || undefined,
      categoryId:  Number(form.categoryId),
    });
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
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {initial ? t("recurring.form.editTitle") : t("recurring.form.newTitle")}
        </h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={t("recurring.form.titlePlaceholder")}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="number"
              placeholder={t("recurring.form.amountPlaceholder")}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            />
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="">{t("recurring.form.categoryPlaceholder")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.categoryName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {t("recurring.form.repeats")}
              </label>
              <select
                value={form.interval}
                onChange={(e) => set("interval", Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                {INTERVALS.map((i) => (
                  <option key={i.value} value={i.value}>{t(i.labelKey)}</option>
                ))}
              </select>
            </div>
            {form.interval === 2 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("recurring.form.dayOfMonth")}
                </label>
                <input
                  type="number" min={1} max={28}
                  value={form.dayOfPeriod}
                  onChange={(e) => set("dayOfPeriod", Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {t("recurring.form.startDate")}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {t("recurring.form.endDate")}
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-3 bg-primary-gradient text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? t("common.saving") : t("common.save")}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 border border-slate-200 rounded-xl text-sm hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
