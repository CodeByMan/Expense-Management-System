import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, CircleDollarSign, ReceiptText, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import Heading from "@/components/ui/Heading";
import MonthNavigator from "@/components/common/MonthNavigator";
import { useExpenses } from "@/hooks/useExpenses";
import { getMonthlySummary } from "@/api/expense";
import { generateInsights } from "@/lib/generateInsights";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/dashboard/analysis/")({
  component: AnalyticsPage,
});

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CHART_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#F97316", "#EC4899"];

const currencyTooltip = (value: unknown) => formatCurrency(Number(Array.isArray(value) ? value[0] : value));

function AnalyticsPage() {
  const { t } = useTranslation();
  const { expenses, isPending: expensesPending } = useExpenses();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((current) => current - 1);
    } else {
      setMonth((current) => current - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((current) => current + 1);
    } else {
      setMonth((current) => current + 1);
    }
  };

  const { data: monthlySummary, isPending: summaryPending } = useQuery({
    queryKey: ["category-budgets", month, year],
    queryFn: () => getMonthlySummary(month, year),
  });

  const monthlyExpenses = useMemo(
    () => (expenses ?? []).filter((expense) => {
      const date = new Date(expense.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    }),
    [expenses, month, year],
  );

  const categoryData = useMemo(() => {
    const totals = monthlyExpenses.reduce<Record<string, number>>((result, expense) => {
      const category = expense.categoryName || "Other";
      result[category] = (result[category] ?? 0) + expense.amount;
      return result;
    }, {});

    return Object.entries(totals)
      .map(([name, value], index) => ({
        name,
        value,
        color: monthlySummary?.categories.find((category) => category.categoryName === name)?.color
          ?? CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyExpenses, monthlySummary]);

  const dailyData = useMemo(() => {
    const totals = monthlyExpenses.reduce<Record<number, number>>((result, expense) => {
      const day = new Date(expense.date).getDate();
      result[day] = (result[day] ?? 0) + expense.amount;
      return result;
    }, {});

    const daysInMonth = new Date(year, month, 0).getDate();
    let cumulative = 0;
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const total = totals[day] ?? 0;
      cumulative += total;
      return { day: String(day), total, cumulative };
    });
  }, [monthlyExpenses, month, year]);

  const budgetData = useMemo(
    () => (monthlySummary?.categories ?? [])
      .filter((category) => category.amount > 0 || category.totalSpent > 0)
      .map((category) => ({
        category: category.categoryName,
        budget: category.amount,
        actual: category.totalSpent,
      })),
    [monthlySummary],
  );

  const { insights, warnings, tips } = useMemo(
    () => generateInsights(monthlySummary, monthlyExpenses, MONTH_NAMES[month - 1], year),
    [monthlySummary, monthlyExpenses, month, year],
  );

  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = monthlySummary?.totalBudget ?? 0;
  const remaining = totalBudget - totalSpent;
  const isPending = expensesPending || summaryPending;
  const hasData = monthlyExpenses.length > 0 || budgetData.length > 0;

  const insightSections = [
    { label: t("report.aiInsights"), items: insights, wrap: "border-emerald-200 bg-emerald-500/5", title: "text-emerald-700" },
    { label: t("report.aiWarnings"), items: warnings, wrap: "border-amber-200 bg-amber-500/5", title: "text-amber-700" },
    { label: t("report.aiTips"), items: tips, wrap: "border-blue-200 bg-blue-500/5", title: "text-blue-700" },
  ].filter((section) => section.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Heading
          HeadTitle={t("analytics.title")}
          SubTitle={t("analytics.subtitle", { month: MONTH_NAMES[month - 1], year })}
        />
        <MonthNavigator month={month} year={year} onPrev={handlePrev} onNext={handleNext} />
      </div>

      {isPending ? (
        <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 rounded-2xl border border-border bg-card" />)}
        </div>
      ) : !hasData ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold text-card-foreground">No analytics data for this month</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Add expenses and category budgets to generate trends, comparisons, and spending insights.</p>
          <Link to="/dashboard/expense" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Add an expense</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Monthly spending", value: formatCurrency(totalSpent), icon: CircleDollarSign },
              { label: "Monthly budget", value: formatCurrency(totalBudget), icon: Target },
              { label: "Remaining budget", value: formatCurrency(remaining), icon: BarChart3 },
              { label: "Transactions", value: String(monthlyExpenses.length), icon: ReceiptText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-card-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <h2 className="font-semibold text-card-foreground">Daily and cumulative spending</h2>
              <p className="mt-1 text-xs text-muted-foreground">Actual SQL expense records across {MONTH_NAMES[month - 1]}</p>
              <div className="mt-5 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                    <Tooltip formatter={currencyTooltip} labelFormatter={(label) => `Day ${label}`} />
                    <Legend />
                    <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10B981" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="total" name="Daily" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <h2 className="font-semibold text-card-foreground">Spending by category</h2>
              <p className="mt-1 text-xs text-muted-foreground">Share of actual monthly expense records</p>
              <div className="mt-5 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={105} paddingAngle={3}>
                      {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={currencyTooltip} />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {budgetData.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <h2 className="font-semibold text-card-foreground">Budget versus actual spending</h2>
              <p className="mt-1 text-xs text-muted-foreground">Category limits compared with SQL expense totals</p>
              <div className="mt-5 h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.25} />
                    <XAxis type="number" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                    <YAxis type="category" dataKey="category" width={90} tickLine={false} axisLine={false} />
                    <Tooltip formatter={currencyTooltip} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#94A3B8" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="#10B981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {insightSections.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-3">
              {insightSections.map((section) => (
                <section key={section.label} className={`rounded-2xl border p-5 ${section.wrap}`}>
                  <h2 className={`text-xs font-bold uppercase tracking-wide ${section.title}`}>{section.label}</h2>
                  <ul className="mt-3 space-y-2.5">
                    {section.items.map((item, index) => (
                      <li key={`${section.label}-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
