import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DollarSign,
  Award,
  Calendar,
  TrendingDown,
  Plus,
} from "lucide-react";

import { MonthlyExpensesChart } from "@/components/charts/MonthlyExpensesChart";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import StatCard from "@/components/dashboard/StateCard";
import YearlyChart from "@/components/charts/YearlyChart";
import { TopSpendingCategories } from "@/components/dashboard/TopSpendingCategories";
import { SmartAlertsPanel } from "@/components/dashboard/SmartAlertsPanel";
import { useState } from "react";
import { MonthComparisonWidget } from "@/components/dashboard/MonthComparisonWidget";
import { SavingsGoalProgress } from "@/components/savingGoal/SavingsGoalProgress";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

export const Route = createFileRoute("/dashboard/")(({
  component: DashboardPage,
}));

// ─── Skeleton Components ──────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-card animate-pulse">
      <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
      <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-20 bg-slate-100 rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
      <div className="h-4 w-36 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-24 bg-slate-100 rounded mb-6" />
      <div className="flex items-end gap-3 h-48">
        {[60, 85, 45, 90, 70, 55, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-100 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
      <div className="h-4 w-32 bg-slate-200 rounded mb-5" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-slate-100" />
          <div className="flex-1">
            <div className="h-3 w-28 bg-slate-200 rounded mb-1" />
            <div className="h-2 w-16 bg-slate-100 rounded" />
          </div>
          <div className="h-3 w-14 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyActivity() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
        <DollarSign className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">
        {t("dashboard.activity.noExpenses")}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {t("dashboard.activity.startTracking")}
      </p>
      <Link to="/dashboard/expense" className="text-xs text-blue-600 font-medium hover:underline">
        {t("dashboard.activity.addFirst")}
      </Link>
    </div>
  );
}

// ─── Greeting Header ──────────────────────────────────────────────────────────

function GreetingHeader({ name }: { name?: string }) {
  const { t, i18n } = useTranslation();

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("dashboard.greeting.morning")
      : hour < 17
      ? t("dashboard.greeting.afternoon")
      : t("dashboard.greeting.evening");

  const today = new Date().toLocaleDateString(i18n.language === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {greeting}{name ? `, ${name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>
      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] sm:w-auto">
        <Plus className="w-4 h-4" />
        <Link to="/dashboard/expense">{t("dashboard.greeting.addExpense")}</Link>
      </button>
    </div>
  );
}

// ─── Daily Average helper ─────────────────────────────────────────────────────

function getDailyAverage(thisMonthExpense?: number) {
  if (!thisMonthExpense) return undefined;
  const dayOfMonth = new Date().getDate();
  return Math.round(thisMonthExpense / dayOfMonth);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showEmptySections } = usePreferences();
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const { data, isPending } = useDashboard();

  const dailyAvg = getDailyAverage(data?.summary.thisMonthExpense);
  const today = new Date();

  const todayExpenses = data?.recentExpenses?.today ?? [];
  const yesterdayExpenses = data?.recentExpenses?.yesterday ?? [];
  const monthlyCharts = data?.monthlyCharts ?? [];
  const yearlyCharts = data?.yearlyCharts ?? [];
  const topCategories = data?.topCategories ?? [];
  const alerts = data?.alerts ?? [];
  const hasTrendData = monthlyCharts.length > 0 || yearlyCharts.length > 0;
  const hasComparisonData = (data?.summary.thisMonthExpense ?? 0) > 0 || (data?.summary.lastMonthTotal ?? 0) > 0;
  const hasRecentActivity = todayExpenses.length > 0 || yesterdayExpenses.length > 0;

  return (
    <div>
      {/* Greeting + Quick Add */}
      <GreetingHeader name={user?.userName ?? "Guest"} />

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isPending ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              accent
              title={t("dashboard.stats.totalExpense")}
              value={data?.summary.totalExpense}
              icon={<DollarSign size={16} className="text-white" />}
              footer={t("dashboard.stats.overallSpending")}
            />
            <StatCard
              title={t("dashboard.stats.thisMonth")}
              value={data?.summary.thisMonthExpense}
              icon={<Calendar size={16} className="text-purple-500" />}
              trend={data?.summary.percentageChange}
              isExpenseTrend
              footer={t("dashboard.stats.vsLastMonth")}
            />
            <StatCard
              title={t("dashboard.stats.topCategory")}
              value={data?.summary.topCategoryAmount}
              subtitle={data?.summary.topCategoryName}
              icon={<Award size={16} className="text-amber-500" />}
            />
            <StatCard
              title={t("dashboard.stats.dailyAverage")}
              value={dailyAvg}
              subtitle={`${t("dashboard.stats.day")} ${today.getDate()} / ${new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}`}
              icon={<TrendingDown size={16} className="text-rose-500" />}
              footer={t("dashboard.stats.thisMonthSoFar")}
            />
          </>
        )}
      </div>

      {/* Charts + Month Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isPending ? (
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
        ) : (
          <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 ${showEmptySections || hasComparisonData ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("dashboard.charts.spendingTrends")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {view === "monthly"
                    ? t("dashboard.charts.monthly")
                    : t("dashboard.charts.yearly")}
                </p>
              </div>
              <div className="flex w-full rounded-full bg-slate-100 p-1 sm:w-auto">
                <button
                  onClick={() => setView("monthly")}
                  className={`flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                    view === "monthly"
                      ? "bg-primary-gradient text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  {t("dashboard.charts.monthly")}
                </button>
                <button
                  onClick={() => setView("yearly")}
                  className={`flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                    view === "yearly"
                      ? "bg-primary-gradient text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  {t("dashboard.charts.yearly")}
                </button>
              </div>
            </div>

            {!hasTrendData && !showEmptySections ? (
              <MonthlyExpensesChart monthlyCharts={[]} />
            ) : view === "monthly" ? (
              <MonthlyExpensesChart monthlyCharts={monthlyCharts} />
            ) : (
              <YearlyChart yearlyCharts={yearlyCharts} />
            )}
          </div>
        )}

        {(showEmptySections || hasComparisonData) && (
          <MonthComparisonWidget
            thisMonth={data?.summary.thisMonthExpense ?? 0}
            lastMonth={data?.summary.lastMonthTotal ?? 0}
            topCategories={topCategories}
          />
        )}
      </div>

      {/* Bottom row: Top Categories · Smart Alerts · Savings Goals */}
      {!isPending && (showEmptySections || topCategories.length > 0 || alerts.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {(showEmptySections || topCategories.length > 0) && <TopSpendingCategories categories={topCategories} />}
          <SmartAlertsPanel alerts={alerts} />
          <SavingsGoalProgress />
        </div>
      )}

      {/* Recent Activity */}
      {isPending ? (
        <ActivitySkeleton />
      ) : (showEmptySections || hasRecentActivity) ? (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mt-6">
          <h3 className="text-lg font-semibold mb-4">
            {t("dashboard.activity.title")}
          </h3>

          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            {t("dashboard.activity.today")}
          </p>
          {todayExpenses.length > 0 ? (
            <div className="space-y-3">
              {todayExpenses.map((exp: any, i: number) => (
                <ActivityItem
                  key={i}
                  title={exp.title}
                  subtitle={exp.categoryName}
                  amount={-exp.amount}
                />
              ))}
            </div>
          ) : (
            <EmptyActivity />
          )}

          {yesterdayExpenses.length > 0 && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-3">
                {t("dashboard.activity.yesterday")}
              </p>
              <div className="space-y-3">
                {yesterdayExpenses.map((exp: any, i: number) => (
                  <ActivityItem
                    key={i}
                    title={exp.title}
                    subtitle={exp.categoryName}
                    amount={-exp.amount}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
