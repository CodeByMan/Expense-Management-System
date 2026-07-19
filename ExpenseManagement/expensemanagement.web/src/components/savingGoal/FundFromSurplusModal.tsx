import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SavingsGoalDto } from "@/Types";
import { Target, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type Props = {
  goal: SavingsGoalDto;
  surplus: number;
  month: number;
  year: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
};

export default function FundFromSurplusModal({
  goal,
  surplus,
  isPending,
  onClose,
  onConfirm,
}: Props) {
  const [value, setValue] = useState("");

  const parsed = parseFloat(value);
  const isValid = !isNaN(parsed) && parsed > 0 && parsed <= surplus;

  const afterSaved = isValid ? goal.saved + parsed : goal.saved;
  const afterPct = Math.min((afterSaved / goal.target) * 100, 100);
  const beforePct = Math.min(goal.percentageComplete, 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: goal.color + "22", border: `2px solid ${goal.color}55` }}
          >
            <Target size={20} style={{ color: goal.color }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Fund from Surplus</h2>
            <p className="text-xs text-gray-400">
              Goal: <span className="font-medium text-gray-600">{goal.name}</span>
            </p>
          </div>
        </div>

        {/* Surplus badge */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
          <Wallet size={15} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-green-700 font-medium">Available surplus this month</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(surplus)}</p>
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            How much to allocate?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">PKR</span>
              <Input
                autoFocus
                type="number"
                step="0.01"
                min="0.01"
                max={surplus}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 pl-12 pr-3 py-2.5 rounded-xl text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setValue(String(surplus))}
              className="px-3 py-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition"
            >
              Max
            </button>
          </div>
          {!isNaN(parsed) && parsed > surplus && (
            <p className="text-xs text-red-500 mt-1">
              Exceeds available surplus ({formatCurrency(surplus)})
            </p>
          )}
        </div>

        {/* Progress preview */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
            Progress preview
          </p>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Before</span>
              <span>{formatCurrency(goal.saved)} / {formatCurrency(goal.target)}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${beforePct}%`, backgroundColor: goal.color + "88" }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">After</span>
              <span className="font-semibold" style={{ color: goal.color }}>
                {formatCurrency(afterSaved)} / {formatCurrency(goal.target)}
                <span
                  className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: goal.color + "22", color: goal.color }}
                >
                  {afterPct.toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${afterPct}%`, backgroundColor: goal.color }}
              />
            </div>
            {afterSaved >= goal.target && (
              <p className="text-xs text-green-600 font-semibold mt-1.5">
                🎉 This will complete your goal!
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid || isPending}
            onClick={() => onConfirm(parsed)}
            className="px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all"
            style={{ backgroundColor: isValid ? goal.color : "#9CA3AF" }}
          >
            {isPending ? "Saving..." : `Add ${formatCurrency(isValid ? parsed : 0)} to Goal`}
          </Button>
        </div>
      </div>
    </div>
  );
}