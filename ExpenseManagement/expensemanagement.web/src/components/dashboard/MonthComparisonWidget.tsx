import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { TopCategoryDto } from "@/Types";
import { useTranslation } from "react-i18next";

type Props = {
  thisMonth: number;
  lastMonth: number;
  topCategories: TopCategoryDto[];
};

export function MonthComparisonWidget({ thisMonth, lastMonth, topCategories }: Props) {
  const { t, i18n } = useTranslation();

  const diff = thisMonth - lastMonth;
  const pct = lastMonth > 0 ? Math.round((diff / lastMonth) * 100) : 0;
  const isUp = diff > 0;
  const isFlat = diff === 0;

  const TrendIcon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const trendColor = isFlat ? "text-gray-400" : isUp ? "text-red-500" : "text-green-500";
  const trendBg = isFlat ? "bg-gray-50" : isUp ? "bg-red-50" : "bg-green-50";

  const locale = i18n.language === "ar" ? "ar-SA" : "en-US";
  const now = new Date();
  const thisMonthName = now.toLocaleString(locale, { month: "long" });
  const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1).toLocaleString(locale, { month: "long" });

  const maxAmount = topCategories[0]?.amount ?? 1;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {t("dashboard.monthComparison.title")}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastMonthName} vs {thisMonthName}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${trendBg}`}>
          <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
          <span className={`text-xs font-bold ${trendColor}`}>
            {isFlat
              ? t("dashboard.monthComparison.noChange")
              : `${Math.abs(pct)}% ${isUp ? t("dashboard.monthComparison.more") : t("dashboard.monthComparison.less")}`}
          </span>
        </div>
      </div>

      {/* Totals comparison */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
            {lastMonthName}
          </p>
          <p className="text-lg font-bold text-gray-500">{formatCurrency(lastMonth)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-[10px] text-blue-400 uppercase tracking-wide mb-1">
            {thisMonthName}
          </p>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(thisMonth)}</p>
        </div>
      </div>

      {/* Difference callout */}
      <div className={`rounded-xl px-4 py-2.5 mb-5 flex items-center justify-between ${trendBg}`}>
        <span className="text-xs text-gray-500">
          {isFlat
            ? t("dashboard.monthComparison.sameSpending")
            : isUp
            ? t("dashboard.monthComparison.spentMore")
            : t("dashboard.monthComparison.saved")}
        </span>
        <span className={`text-sm font-bold ${trendColor}`}>
          {isUp ? "+" : "-"}{formatCurrency(Math.abs(diff))}
        </span>
      </div>

      {/* Category bars */}
      {topCategories.length > 0 && (
        <>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">
            {t("dashboard.monthComparison.byCategory")}
          </p>
          <div className="flex flex-col gap-3">
            {topCategories.map((cat) => {
              const barWidth = Math.round((cat.amount / maxAmount) * 100);
              return (
                <div key={cat.categoryId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                        style={{ backgroundColor: cat.color + "22" }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-xs text-gray-600 font-medium">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{cat.percentage}%</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${barWidth}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
