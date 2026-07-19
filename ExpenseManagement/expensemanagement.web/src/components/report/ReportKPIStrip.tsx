import { TrendingUp, TrendingDown, Minus, Flame, Target } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip,
} from "recharts";
import type { MonthlySummaryDto, DashboardData } from "@/Types";
import { formatCurrency } from "@/lib/currency";

type Props = {
  monthlySummary: MonthlySummaryDto | undefined;
  dashboard: DashboardData | undefined;
  month: number;
  year: number;
  monthlyExpenses: { amount: number; categoryName: string; date: string }[];
};

function Sparkline({ data, color }: { data: { value: number }[]; color: string }) {
  if (data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
          fill="url(#sparkGrad)" dot={false} isAnimationActive={false} />
        <Tooltip
          contentStyle={{ borderRadius: "8px", border: "none", fontSize: "11px",
            background: "rgba(0,0,0,0.75)", color: "#fff", padding: "4px 8px" }}
          formatter={(v: any) => [formatCurrency(Number(v)), ""]}
          labelFormatter={() => ""}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrendPill({ pct }: { pct: number }) {
  const up   = pct > 0;
  const flat = pct === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const cls  = flat
    ? "bg-white/10 text-white/60"
    : up
    ? "bg-red-500/20 text-red-300"
    : "bg-emerald-500/20 text-emerald-300";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cls}`}>
      <Icon className="w-3 h-3" />
      {flat ? "—" : `${Math.abs(pct).toFixed(1)}%`}
    </span>
  );
}

export default function ReportKPIStrip({ monthlySummary, dashboard, month, year }: Props) {
  const sparkData = (dashboard?.monthlyCharts ?? []).slice(-6).map((c) => ({ value: Number(c.total) }));

  const now             = new Date();
  const isThisMonth     = now.getMonth() + 1 === month && now.getFullYear() === year;
  const dayOfMonth      = isThisMonth ? now.getDate() : new Date(year, month, 0).getDate();
  const totalSpent      = monthlySummary?.totalSpent ?? 0;
  const totalBudget     = monthlySummary?.totalBudget ?? 0;
  const remaining       = monthlySummary?.remaining ?? 0;
  const dailyAvg        = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const lastMonthTotal  = dashboard?.summary?.lastMonthTotal ?? 0;
  const daysInLastMonth = new Date(year, month - 1, 0).getDate();
  const lastDailyAvg    = daysInLastMonth > 0 ? lastMonthTotal / daysInLastMonth : 0;
  const dailyTrend      = lastDailyAvg > 0 ? ((dailyAvg - lastDailyAvg) / lastDailyAvg) * 100 : 0;
  const pctChange       = dashboard?.summary?.percentageChange ?? 0;
  const budgetPct       = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const topCat          = (monthlySummary?.categories ?? [])
    .slice().sort((a, b) => b.totalSpent - a.totalSpent)[0];

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-xl"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d2444 50%, #0a1e3d 100%)" }}
    >
      {/* ── Hero: main metric + sparkline ────────────────────────────────── */}
      <div className="flex flex-col gap-6 px-5 pb-5 pt-6 sm:px-8 sm:pt-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300/70 mb-2">
            Total Spent
          </p>
          <div className="flex items-end gap-4 flex-wrap">
            <span className="break-words text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {formatCurrency(totalSpent)}
            </span>
            <TrendPill pct={pctChange} />
          </div>
          {lastMonthTotal > 0 && (
            <p className="text-sm text-white/40 mt-2">
              vs {formatCurrency(lastMonthTotal)} last month
            </p>
          )}
        </div>

        <div className="w-full min-w-0 lg:max-w-[260px] lg:flex-1">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">6-month trend</p>
          <div className="opacity-80">
            <Sparkline data={sparkData} color="#60a5fa" />
          </div>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="mx-5 h-px bg-white/[0.07] sm:mx-8" />

      {/* ── 3 supporting metrics ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 divide-y divide-white/[0.07] sm:grid-cols-3 sm:divide-x sm:divide-y-0">

        {/* Daily Average */}
        <div className="group px-5 py-5 transition-colors hover:bg-white/[0.03] sm:px-6 lg:px-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Daily Average
            </p>
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(dailyAvg)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <TrendPill pct={dailyTrend} />
            <span className="text-[10px] text-white/30">Day {dayOfMonth}</span>
          </div>
          {lastDailyAvg > 0 && (
            <p className="text-[10px] text-white/25 mt-1">
              {formatCurrency(lastDailyAvg)}/day last month
            </p>
          )}
        </div>

        {/* Budget Remaining */}
        <div className="group px-5 py-5 transition-colors hover:bg-white/[0.03] sm:px-6 lg:px-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Remaining
            </p>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${remaining <= 0 ? "text-red-400" : "text-emerald-400"}`}>
            {formatCurrency(remaining)}
          </p>
          {/* Gauge bar */}
          <div className="mt-2.5 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${budgetPct}%`,
                background: budgetPct >= 100 ? "#f87171" : budgetPct >= 80 ? "#fbbf24" : "#34d399",
              }}
            />
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            {budgetPct.toFixed(0)}% of {formatCurrency(totalBudget)} used
          </p>
        </div>

        {/* Top Category */}
        <div className="group px-5 py-5 transition-colors hover:bg-white/[0.03] sm:px-6 lg:px-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Top Category
            </p>
            {topCat?.icon && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: (topCat.color || "#334155") + "33" }}
              >
                {topCat.icon}
              </div>
            )}
          </div>
          {topCat ? (
            <>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(topCat.totalSpent)}
              </p>
              <p
                className="text-[11px] font-semibold mt-1"
                style={{ color: topCat.color || "#94a3b8" }}
              >
                {topCat.categoryName}
              </p>
              {totalSpent > 0 && (
                <p className="text-[10px] text-white/30 mt-0.5">
                  {((topCat.totalSpent / totalSpent) * 100).toFixed(0)}% of total
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-white/30 mt-2">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
