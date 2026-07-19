import type { DashboardData } from "@/Types";
import { formatCurrency } from "@/lib/currency";
import { BarChart3 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyExpensesChartProps = {
  monthlyCharts?: DashboardData["monthlyCharts"];
};

export function MonthlyExpensesChart({ monthlyCharts = [] }: MonthlyExpensesChartProps) {
  if (monthlyCharts.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center">
        <BarChart3 className="h-9 w-9 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">No monthly trend yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Expense records will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyCharts} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.22} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} width={62} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Line type="monotone" dataKey="total" name="Spending" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
