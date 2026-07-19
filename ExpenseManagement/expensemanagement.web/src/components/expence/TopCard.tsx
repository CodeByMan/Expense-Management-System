import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type TopCardProps = {
  totalAll: number | undefined;
  monthlySpend: number | undefined;
};

export default function TopCard({ totalAll = 0, monthlySpend = 0 }: TopCardProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-12">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 xl:col-span-8">
        <div className="relative z-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Spend</p>
          <h3 className="break-words text-3xl font-black tracking-tight sm:text-5xl">{formatCurrency(totalAll)}</h3>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-primary/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Spend</p>
              <p className="mt-1 text-lg font-bold sm:text-xl">{formatCurrency(monthlySpend)}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Outside Selected Month</p>
              <p className="mt-1 text-lg font-bold sm:text-xl">{formatCurrency(Math.max(totalAll - monthlySpend, 0))}</p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 200 100" aria-hidden="true"><path className="text-primary" d="M0,80 Q50,20 100,50 T200,30 L200,100 L0,100 Z" fill="currentColor" /></svg>
        </div>
      </section>

      <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg sm:p-7 xl:col-span-4">
        <div className="relative z-10">
          <Sparkles className="mb-4 h-10 w-10 text-amber-200" />
          <h4 className="text-2xl font-bold sm:text-3xl">Smart Savings Insight</h4>
          <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">Review spending patterns and identify opportunities to improve your monthly budget.</p>
        </div>
        <Link to="/dashboard/report" className="relative z-10 mt-5 inline-flex w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary transition hover:scale-[1.02]">View Insight</Link>
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </section>
    </div>
  );
}
