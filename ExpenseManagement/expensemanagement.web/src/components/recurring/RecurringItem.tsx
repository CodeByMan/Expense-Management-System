import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RecurringExpenseDto } from "@/Types";
import { formatCurrency } from "@/lib/currency";

const INTERVAL_COLORS: Record<string, string> = {
  Daily:   "bg-purple-100 text-purple-700",
  Weekly:  "bg-blue-100 text-blue-700",
  Monthly: "bg-green-100 text-green-700",
  Yearly:  "bg-orange-100 text-orange-700",
};

type Props = {
  item: RecurringExpenseDto;
  onEdit: (item: RecurringExpenseDto) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function RecurringItem({ item, onEdit, onToggle, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
        item.isActive ? "border-gray-100" : "border-dashed border-gray-200 opacity-60"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: icon + info */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {item.title.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{item.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  INTERVAL_COLORS[item.interval] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {item.interval}
              </span>
              <span className="text-xs text-gray-400">{item.categoryName}</span>
            </div>
          </div>
        </div>

        {/* Right: amount + actions */}
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
          <div className="text-left sm:text-right">
            <p className="font-bold text-gray-800">{formatCurrency(item.amount)}</p>
            <p className="text-xs text-gray-400">
              {t("recurring.next")}: {new Date(item.nextDue).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(item.id)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title={item.isActive ? t("recurring.pause") : t("recurring.resume")}
            >
              {item.isActive
                ? <ToggleRight size={18} className="text-green-500" />
                : <ToggleLeft  size={18} className="text-gray-400" />
              }
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
