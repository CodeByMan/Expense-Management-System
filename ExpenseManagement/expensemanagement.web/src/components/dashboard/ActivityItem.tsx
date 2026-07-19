import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type Props = {
  title: string;
  subtitle: string;
  amount: number;
};

export function ActivityItem({ title, subtitle, amount }: Props) {
  const isPositive = amount > 0;

  return (
    <div className="flex items-center justify-between rounded-xl bg-background/80 backdrop-blur px-5 py-4 shadow-sm transition hover:bg-background">
      
      {/* Left */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full
          ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          ) : (
            <ArrowDownLeft className="h-5 w-5 text-red-500" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div
        className={`text-sm font-semibold
        ${isPositive ? "text-green-600" : "text-red-500"}`}
      >
        {isPositive ? "+" : "-"}{formatCurrency(Math.abs(amount))}
      </div>
    </div>
  );
}
