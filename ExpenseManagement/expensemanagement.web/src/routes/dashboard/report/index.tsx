import { useState } from "react";
import Heading from "@/components/ui/Heading";
import { createFileRoute } from "@tanstack/react-router";
import { analyzeExpensesApi } from "../../../api/auth";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Legend,
  Bar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import BurnRate from "@/components/expence/BurnRate";
import { getMonthlySummary } from "@/api/expense";
import { ExportButton } from "@/components/expence/ExportButton";
import MonthNavigator from "@/components/common/MonthNavigator";
import { useExpenses } from "@/hooks/useExpenses";
import { t } from "i18next";
import ReportKPIStrip from "@/components/report/ReportKPIStrip";
import { fetchDashboardData } from "@/api/expense";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/dashboard/report/")({
  component: ReportPage,
});

type AIResponse = {
  insights: string[];
  warnings: string[];
  tips: string[];
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ── Main Page ─────────────────────────────────────────────────────────────────

function ReportPage() {
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { expenses } = useExpenses();

  // Month state
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // ── Fetch monthly budget summary ──────────────────────────────────────────
  const { data: monthlySummary } = useQuery({
    queryKey: ["category-budgets", month, year],
    queryFn: () => getMonthlySummary(month, year),
  });
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  // ── Filter expenses to selected month ─────────────────────────────────────
  const monthlyExpenses = (expenses || []).filter((exp) => {
    const d = new Date(exp.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  // ── Pie chart: spending distribution from actual expenses ─────────────────
  const chartData: any = Object.values(
    monthlyExpenses.reduce((acc: any, item: any) => {
      const category = item.categoryName || "Other";
      if (!acc[category]) acc[category] = { name: category, value: 0 };
      acc[category].value += item.amount;
      return acc;
    }, {}),
  ).sort((a: any, b: any) => b.value - a.value);

  const COLORS = [
    "#4CAF50",
    "#FF5252",
    "#2196F3",
    "#FFC107",
    "#8B5CF6",
    "#F97316",
  ];

  // ── Bar chart + budget cards: from monthly summary ────────────────────────
  // Falls back to expenses-only if no budget is set for the month

  const budgetData = (monthlySummary?.categories ?? []).map((cat) => ({
    category: cat.categoryName,
    icon: cat.icon ?? "",
    color: cat.color ?? "#64748b",
    budget: cat.amount,
    actual: cat.totalSpent,
    percent: cat.percentageUsed,
    isOver: cat.isOverBudget,
  }));
  // If no budgets set yet, still show actual spend with 0 budget
  const hasNoBudgets = budgetData.length === 0;
  const fallbackBudgetData = hasNoBudgets
    ? Object.entries(
        monthlyExpenses.reduce((acc: any, exp: any) => {
          const cat = exp.categoryName || "Other";
          if (!acc[cat]) acc[cat] = 0;
          acc[cat] += exp.amount;
          return acc;
        }, {}),
      ).map(([category, actual]: any) => ({
        category,
        icon: "",
        color: "#64748b",
        budget: 0,
        actual,
        percent: 0,
        isOver: false,
      }))
    : budgetData;

  const displayData = hasNoBudgets ? fallbackBudgetData : budgetData;

  // ── BurnRate component data ───────────────────────────────────────────────
  const burnRateData = (monthlySummary?.categories ?? []).map((cat) => ({
    name: cat.categoryName,
    budget: cat.amount,
    spent: cat.totalSpent,
  }));

  // ── AI analysis ───────────────────────────────────────────────────────────
  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await analyzeExpensesApi({ month, year });
      setAiData(res);
    } catch {
      setAiData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <Heading
            HeadTitle={t("report.title")}
            SubTitle={`${t("report.subtitle")} ${MONTH_NAMES[month - 1]} ${year}`}
          />
          {/* <p className="text-sm text-gray-400 mt-0.5">
      Insights and analysis for {MONTH_NAMES[month - 1]} {year}
    </p> */}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <MonthNavigator
            month={month}
            year={year}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          <ExportButton month={month} year={year} />
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-gradient px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:flex-none sm:py-4"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>
      <p className="-mt-4 mb-4 text-xs text-gray-400">
        AI analysis sends monthly category aggregates to Gemini. It does not send expense titles, identity, or raw transactions.
      </p>

      <ReportKPIStrip
        monthlySummary={monthlySummary}
        dashboard={dashboard}
        month={month}
        year={year}
        monthlyExpenses={monthlyExpenses}
      />
      {/* Budget cards — now from monthly summary */}
      {displayData.length > 0 && (
        <div className="mt-6 mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {displayData.map((item, i) => {
            const barColor = item.isOver
              ? "#ef4444"
              : item.percent >= 80
                ? "#f59e0b"
                : item.color || "#42be85";

            return (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-4 border border-slate-100
                     shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Color accent stripe on top */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: item.color || "#e2e8f0" }}
                />

                {/* Header: icon + name */}
                <div className="flex items-center gap-2.5 mb-3 mt-1">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{
                      backgroundColor: (item.color || "#64748b") + "18",
                      border: `1.5px solid ${item.color || "#64748b"}30`,
                    }}
                  >
                    {item.icon || ""}
                  </div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-wide truncate"
                    style={{ color: item.color || "#94a3b8" }}
                  >
                    {item.category}
                  </p>
                </div>

                {/* Amounts */}
                <p className="text-xl font-black text-gray-800 leading-none">
                  {formatCurrency(item.actual)}
                </p>
                {item.budget > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    of {formatCurrency(item.budget)} budget
                  </p>
                )}

                {/* Progress bar */}
                {item.budget > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(item.percent, 100)}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">
                        {item.percent.toFixed(0)}% used
                      </p>
                      {item.isOver ? (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                          Over
                        </span>
                      ) : item.percent >= 80 ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          Near limit
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="mt-6 mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-0.5">
            Spending distribution
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {MONTH_NAMES[month - 1]} {year}
          </p>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No expenses recorded this month
            </div>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={52}
                    paddingAngle={3}
                  >
                    {chartData.map((_entry: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-0.5">
            Budget vs. actual
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {MONTH_NAMES[month - 1]} {year}
          </p>
          {displayData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No data for this month
            </div>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={displayData} barGap={8} barCategoryGap="35%">
                  <XAxis
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  {!hasNoBudgets && (
                    <Bar
                      dataKey="budget"
                      name="Budget"
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                      fill="#e2e8f0"
                    />
                  )}
                  <Bar
                    dataKey="actual"
                    name="Actual"
                    radius={[6, 6, 0, 0]}
                    barSize={24}
                  >
                    {displayData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.isOver ? "#EF4444" : "#0058be"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Burn rate */}
      {burnRateData.length > 0 && <BurnRate data={burnRateData} />}

      {/* AI loading */}
      {loading && (
        <div className="mt-6 text-gray-500 animate-pulse text-sm">
          Analyzing your {MONTH_NAMES[month - 1]} expenses...
        </div>
      )}

      {/* AI results */}
      {aiData && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            {
              label: "Insights",
              items: aiData.insights,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
              dot: "bg-emerald-400",
            },
            {
              label: "Warnings",
              items: aiData.warnings,
              color: "text-amber-700",
              bg: "bg-amber-50",
              border: "border-amber-100",
              dot: "bg-amber-400",
            },
            {
              label: "Tips",
              items: aiData.tips,
              color: "text-blue-700",
              bg: "bg-blue-50",
              border: "border-blue-100",
              dot: "bg-blue-400",
            },
          ].map((section) => (
            <div
              key={section.label}
              className={`rounded-2xl border p-5 ${section.bg} ${section.border}`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wide mb-3 ${section.color}`}
              >
                {section.label}
              </p>
              <ul className="space-y-2.5">
                {section.items?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${section.dot}`}
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
