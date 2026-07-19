import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

type Props={
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}
export default function MonthNavigator({ month, year, onPrev, onNext }: Props) {
  const isCurrentMonth =
    month === new Date().getMonth() + 1 && year === new Date().getFullYear();

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm sm:w-auto sm:gap-3 sm:px-4">
      <button
        onClick={onPrev}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="min-w-0 flex-1 text-center sm:min-w-32">
        <p className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        {isCurrentMonth && (
          <p className="text-[10px] text-blue-500 font-medium">Current month</p>
        )}
      </div>

      <button
        onClick={onNext}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}