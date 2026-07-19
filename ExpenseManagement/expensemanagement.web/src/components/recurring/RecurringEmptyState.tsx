import { CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  onAdd: () => void;
};

export default function RecurringEmptyState({ onAdd }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <CalendarClock size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">
        {t("recurring.noRecurring")}
      </p>
      <p className="text-xs text-gray-400 mb-4">
        {t("recurring.noRecurringHint")}
      </p>
      <button
        onClick={onAdd}
        className="text-sm text-blue-600 font-medium hover:underline"
      >
        {t("recurring.addFirst")}
      </button>
    </div>
  );
}
