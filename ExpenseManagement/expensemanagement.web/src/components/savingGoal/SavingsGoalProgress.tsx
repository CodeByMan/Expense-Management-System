import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Target } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { usePreferences } from "@/context/PreferencesContext";

export function SavingsGoalProgress() {
  const { goals, isPending } = useSavingsGoals();
  const { showEmptySections } = usePreferences();

  if (isPending) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-5" />
        {[1, 2].map((i) => (
          <div key={i} className="mb-4">
            <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-2 w-full bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (goals.length === 0 && !showEmptySections) return null;

  // show max 3 on dashboard
  const preview = goals.slice(0, 3);
  const completed = goals.filter((g) => g.isComplete).length;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-card-foreground">Savings Goals</h3>
        </div>
        <Link
          to="/dashboard/savings"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {/* Summary badge */}
      {goals.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Total goals</p>
            <p className="font-semibold text-card-foreground text-sm">{goals.length}</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="font-semibold text-green-600 text-sm">{completed}</p>
          </div>
        </div>
      )}

      {/* Goal previews */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
            <Target size={18} className="text-slate-300" />
          </div>
          <p className="text-sm text-muted-foreground">No savings goals yet</p>
          <Link
            to="/dashboard/savings"
            className="text-xs text-blue-500 hover:underline mt-1"
          >
            Create your first goal →
          </Link>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {preview.map((goal) => {
            const pct = Math.min(goal.percentageComplete, 100);
            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: goal.color }}
                    />
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                      {goal.name}
                    </span>
                    {goal.isComplete && (
                      <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                        Done
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatCurrency(goal.saved)} / {formatCurrency(goal.target)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: goal.color }}
                  />
                </div>
              </div>
            );
          })}

          {goals.length > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{goals.length - 3} more goals
            </p>
          )}
        </div>
      )}
    </div>
  );
}