import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type Props = {
  title: string;
  value?: number;
  icon?: React.ReactNode;
  trend?: number;
  subtitle?: string;
  footer?: string;
  isExpenseTrend?: boolean;
  accent?: boolean; // Only the total card uses the accent style
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  footer,
  isExpenseTrend,
  accent = false,
}: Props) {
  const isPositiveTrend = isExpenseTrend ? (trend ?? 0) < 0 : (trend ?? 0) > 0;
  const trendColor = isPositiveTrend ? "text-emerald-600" : "text-red-500";
  const trendBg   = isPositiveTrend ? "bg-emerald-50"   : "bg-red-50";

  return (
    <div
      className={`relative p-5 rounded-2xl border overflow-hidden ${
        accent
          ? "bg-primary-gradient border-transparent text-white"
          : "bg-white border-slate-200 text-gray-800"
      }`}
    >
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div
            className={`p-2 rounded-xl border ${
              accent
                ? "bg-white/15 border-white/20"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            {icon}
          </div>
        )}

        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendBg} ${trendColor}`}>
            {trend > 0
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Title */}
      <p className={`text-xs font-medium tracking-wide uppercase mb-1 ${
        accent ? "text-white/70" : "text-gray-400"
      }`}>
        {title}
      </p>

      {/* Value */}
      <h4 className={`text-2xl font-bold leading-tight ${
        accent ? "text-white" : "text-gray-800"
      }`}>
        {formatCurrency(value)}
      </h4>

      {/* Subtitle badge */}
      {subtitle && (
        <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${
          accent
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-600"
        }`}>
          {subtitle}
        </span>
      )}

      {/* Footer */}
      {footer && (
        <p className={`text-xs mt-2 ${accent ? "text-white/60" : "text-gray-400"}`}>
          {footer}
        </p>
      )}
    </div>
  );
}