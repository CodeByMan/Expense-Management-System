import type { MonthlySummaryDto, Expense } from "@/Types";
import { formatCurrency } from "@/lib/currency";

export type InsightsResult = {
  insights: string[];
  warnings: string[];
  tips: string[];
};

export function generateInsights(
  monthlySummary: MonthlySummaryDto | undefined,
  monthlyExpenses: Expense[],
  monthName: string,
  year: number
): InsightsResult {
  const insights: string[] = [];
  const warnings: string[] = [];
  const tips: string[] = [];

  if (!monthlySummary && monthlyExpenses.length === 0) {
    insights.push(`No expenses recorded for ${monthName} ${year} yet.`);
    return { insights, warnings, tips };
  }

  const categories   = monthlySummary?.categories ?? [];
  const totalBudget  = monthlySummary?.totalBudget ?? 0;
  const totalSpent   = monthlySummary?.totalSpent ?? 0;
  const remaining    = monthlySummary?.remaining ?? 0;

  // ── Date helpers ───────────────────────────────────────────────────────────
  const now          = new Date();
  const daysInMonth  = new Date(year, now.getMonth() + 1, 0).getDate();
  const dayOfMonth   = now.getMonth() + 1 === monthlySummary?.month
    ? now.getDate()
    : daysInMonth;
  const daysLeft     = daysInMonth - dayOfMonth;
  const dailyAvg     = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projectedEnd = dailyAvg * daysInMonth;

  // ── Insights ───────────────────────────────────────────────────────────────

  // Budget usage summary
  if (totalBudget > 0) {
    const pct = Math.round((totalSpent / totalBudget) * 100);
    insights.push(
      `You've used ${pct}% of your total budget — ${formatCurrency(totalSpent)} of ${formatCurrency(totalBudget)}.`
    );
  }

  // Highest spending category
  if (categories.length > 0) {
    const top = [...categories].sort((a, b) => b.totalSpent - a.totalSpent)[0];
    if (top.totalSpent > 0) {
      insights.push(
        `Your highest spending category is ${top.categoryName} at ${formatCurrency(top.totalSpent)}.`
      );
    }
  }

  // Daily average
  if (dailyAvg > 0) {
    insights.push(
      `Your daily average spend is ${formatCurrency(dailyAvg)} — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left this month.`
    );
  }

  // Transaction count
  if (monthlyExpenses.length > 0) {
    insights.push(
      `You made ${monthlyExpenses.length} transaction${monthlyExpenses.length !== 1 ? "s" : ""} in ${monthName}.`
    );
  }

  // Remaining budget
  if (totalBudget > 0 && remaining > 0) {
    insights.push(
      `You have ${formatCurrency(remaining)} remaining across all categories.`
    );
  }

  // ── Warnings ───────────────────────────────────────────────────────────────

  // Over budget categories
  const overBudget = categories.filter((c) => c.isOverBudget);
  overBudget.forEach((cat) => {
    const over = cat.totalSpent - cat.amount;
    warnings.push(
      `${cat.categoryName} is over budget by ${formatCurrency(over)} (${formatCurrency(cat.totalSpent)} / ${formatCurrency(cat.amount)}).`
    );
  });

  // Near limit (80-99%)
  const nearLimit = categories.filter(
    (c) => !c.isOverBudget && c.amount > 0 && c.percentageUsed >= 80
  );
  nearLimit.forEach((cat) => {
    const left = cat.amount - cat.totalSpent;
    warnings.push(
      `${cat.categoryName} is at ${cat.percentageUsed.toFixed(0)}% — only ${formatCurrency(left)} left.`
    );
  });

  // Projected to overspend by end of month
  if (totalBudget > 0 && projectedEnd > totalBudget) {
    const overshoot = projectedEnd - totalBudget;
    warnings.push(
      `At your current pace you'll overspend by ${formatCurrency(overshoot)} by end of ${monthName}.`
    );
  }

  // Total over budget
  if (totalBudget > 0 && totalSpent > totalBudget) {
    warnings.push(
      `Total spending (${formatCurrency(totalSpent)}) has exceeded your total budget (${formatCurrency(totalBudget)}).`
    );
  }

  // ── Tips ──────────────────────────────────────────────────────────────────

  // Unused categories with budget set
  const unused = categories.filter((c) => c.amount > 0 && c.totalSpent === 0);
  if (unused.length > 0) {
    const names = unused.map((c) => c.categoryName).join(", ");
    tips.push(
      `${unused.length} categor${unused.length > 1 ? "ies have" : "y has"} ${formatCurrency(0)} spent: ${names}. Consider reallocating their budget.`
    );
  }

  // Suggest shifting budget from unused to over-budget
  if (overBudget.length > 0 && unused.length > 0) {
    const freeBudget = unused.reduce((s, c) => s + c.amount, 0);
    tips.push(
      `You have ${formatCurrency(freeBudget)} in unused budgets — shifting some to ${overBudget[0].categoryName} would cover the gap.`
    );
  }

  // Pacing tip
  if (daysLeft > 0 && remaining > 0) {
    const dailyBudgetLeft = remaining / daysLeft;
    tips.push(
      `To stay on budget, aim to spend no more than ${formatCurrency(dailyBudgetLeft)}/day for the rest of ${monthName}.`
    );
  }

  // Many small transactions
  if (monthlyExpenses.length >= 20) {
    tips.push(
      `You made ${monthlyExpenses.length} transactions this month — consider grouping small purchases to track spending more easily.`
    );
  }

  // Single category dominance
  if (totalSpent > 0 && categories.length > 0) {
    const top = [...categories].sort((a, b) => b.totalSpent - a.totalSpent)[0];
    const domPct = Math.round((top.totalSpent / totalSpent) * 100);
    if (domPct >= 60) {
      tips.push(
        `${top.categoryName} makes up ${domPct}% of your total spending — review if this aligns with your priorities.`
      );
    }
  }

  // Fallback if no tips generated
  if (tips.length === 0) {
    tips.push(`You're on track for ${monthName} — keep it up!`);
  }

  return { insights, warnings, tips };
}
