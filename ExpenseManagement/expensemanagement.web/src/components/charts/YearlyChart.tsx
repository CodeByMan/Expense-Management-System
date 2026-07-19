import type { DashboardData } from "@/Types";
import { formatCurrency } from "@/lib/currency";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type YearlyChartProps = {
  yearlyCharts?: DashboardData["yearlyCharts"];
};

export default function YearlyChart({ yearlyCharts = [] }: YearlyChartProps) {
  if (yearlyCharts.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center">
        <BarChart3 className="h-9 w-9 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">No yearly trend yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Year totals are calculated from saved expenses.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={yearlyCharts} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.22} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} width={62} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="total" name="Spending" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={54} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
