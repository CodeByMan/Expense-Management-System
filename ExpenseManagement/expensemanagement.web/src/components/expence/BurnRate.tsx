import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/currency";

type BurnRateItem = {
  name: string;
  budget: number;
  spent: number;
};

type Props = {
  data: BurnRateItem[];
};

const DAYS_IN_MONTH = 30;

function getPaceColor(burnRate: number) {
  if (burnRate <= 1.05) return "#42be85";
  if (burnRate <= 1.25) return "#FFC107";
  return "#FF5252";
}

function getPaceLabel(burnRate: number) {
  if (burnRate <= 0.95) return { label: "Under pace", cls: "bg-green-100 text-green-700" };
  if (burnRate <= 1.05) return { label: "On pace", cls: "bg-green-100 text-green-700" };
  if (burnRate <= 1.25) return { label: "Slightly over", cls: "bg-yellow-100 text-yellow-700" };
  return { label: "Over budget", cls: "bg-red-100 text-red-600" };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const budget = payload.find((p: any) => p.dataKey === "budget")?.value ?? 0;
    const spent = payload.find((p: any) => p.dataKey === "spent")?.value ?? 0;
    const pct = budget > 0 ? ((spent / budget) * 100).toFixed(0) : "0";
    return (
      <div className="bg-white rounded-xl shadow-md p-3 text-sm border border-gray-100">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        <p className="text-[#0058be]">Budget: {formatCurrency(budget)}</p>
        <p className="text-[#42be85]">Spent: {formatCurrency(spent)}</p>
        <p className="text-gray-500">{pct}% used</p>
      </div>
    );
  }
  return null;
};

export default function BurnRate({ data }: Props) {
  const [day, setDay] = useState(20);

  const enriched = data.map((item) => {
    const progress = day / DAYS_IN_MONTH;
    const idealSpend = item.budget * progress;
    const burnRate = idealSpend > 0 ? item.spent / idealSpend : 0;
    const projected = progress > 0 ? item.spent / progress : item.spent;
    const remaining = item.budget - item.spent;
    const overBudget = projected > item.budget;
    return { ...item, burnRate, projected, remaining, overBudget };
  });

  const totalSpent = enriched.reduce((s, i) => s + i.spent, 0);
  const totalBudget = enriched.reduce((s, i) => s + i.budget, 0);
  const totalProjected = enriched.reduce((s, i) => s + i.projected, 0);
  const overCount = enriched.filter((i) => i.overBudget).length;
  const projDiff = totalProjected - totalBudget;

  const chartData = enriched.map((item) => ({
    name: item.name,
    budget: item.budget,
    spent: item.spent,
    burnRate: item.burnRate,
  }));

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="font-bold text-lg">Budget burn rate</h3>
          <p className="text-sm text-gray-500">Spending pace vs. budget — projected to month end</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <span className="text-sm text-gray-500 whitespace-nowrap">Day of month</span>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="min-w-36 flex-1 accent-[#0058be] sm:w-28 sm:flex-none"
          />
          <span className="text-sm font-bold text-[#0058be] min-w-[24px]">{day}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total spent</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-gray-400 mt-1">of {formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Projected total</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(totalProjected)}</p>
          <p className={`text-xs mt-1 font-medium ${projDiff > 0 ? "text-red-500" : "text-green-600"}`}>
            {projDiff > 0
              ? `${formatCurrency(projDiff)} over budget`
              : `${formatCurrency(Math.abs(projDiff))} under budget`}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Categories over pace</p>
          <p className="text-xl font-bold text-gray-800">{overCount}</p>
          <p className="text-xs text-gray-400 mt-1">need attention</p>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} barGap={8} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#0058be", fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,88,190,0.04)" }} />
            <ReferenceLine y={0} stroke="#e5e7eb" />
            <Bar dataKey="budget" name="Budget" radius={[8, 8, 0, 0]} barSize={28} fill="#0058be">
              {chartData.map((_, i) => (
                <Cell key={i} fill="#0058be" fillOpacity={0.15} />
              ))}
            </Bar>
            <Bar dataKey="spent" name="Spent" radius={[8, 8, 0, 0]} barSize={28}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={getPaceColor(entry.burnRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mb-5 mt-1 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#0058be] opacity-20"></span>Budget
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#42be85]"></span>On pace
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#FFC107]"></span>Slightly over
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#FF5252]"></span>Over budget
        </span>
      </div>

      {/* Per-category rows */}
      <div className="flex flex-col gap-3">
        {enriched.map((item, i) => {
          const { label, cls } = getPaceLabel(item.burnRate);
          const barPct = Math.min((item.spent / item.budget) * 100, 100);
          const barColor = getPaceColor(item.burnRate);
          return (
            <div key={i} className="border border-gray-100 rounded-xl px-4 py-3">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                <span className="text-xs text-gray-400">
                  {formatCurrency(item.spent)}{" "}
                  <span className="text-gray-300">/</span>{" "}
                  {formatCurrency(item.budget)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, background: barColor }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
                  {label}
                </span>
                <span className={`text-xs font-medium ${item.overBudget ? "text-red-500" : "text-green-600"}`}>
                  {item.overBudget
                    ? `Proj. ${formatCurrency(item.projected)} (+${formatCurrency(item.projected - item.budget)})`
                    : `${formatCurrency(item.remaining)} remaining`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
