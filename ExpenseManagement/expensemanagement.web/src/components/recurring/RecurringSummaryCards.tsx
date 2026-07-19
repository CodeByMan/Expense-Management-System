import { useTranslation } from "react-i18next";
import type { RecurringExpenseDto } from "@/Types";
import { formatCurrency } from "@/lib/currency";

type Props = {
  recurringExpenses: RecurringExpenseDto[];
};

export default function RecurringSummaryCards({ recurringExpenses }: Props) {
  const { t } = useTranslation();

  const totalMonthly = recurringExpenses
    .filter((r) => r.isActive)
    .reduce((sum, r) => {
      if (r.interval === "Monthly") return sum + r.amount;
      if (r.interval === "Weekly")  return sum + r.amount * 4.33;
      if (r.interval === "Daily")   return sum + r.amount * 30;
      if (r.interval === "Yearly")  return sum + r.amount / 12;
      return sum;
    }, 0);

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs text-gray-400 mb-1">{t("recurring.activeSchedules")}</p>
        <p className="text-2xl font-bold text-gray-800">
          {recurringExpenses.filter((r) => r.isActive).length}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs text-gray-400 mb-1">{t("recurring.estMonthlyCost")}</p>
        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalMonthly)}</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs text-gray-400 mb-1">{t("recurring.paused")}</p>
        <p className="text-2xl font-bold text-gray-800">
          {recurringExpenses.filter((r) => !r.isActive).length}
        </p>
      </div>
    </div>
  );
}
