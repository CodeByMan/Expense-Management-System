import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Trash2, Plus, Target, CheckCircle2, Wallet, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import Heading from "@/components/ui/Heading";
import Loader from "@/components/ui/Loader";
import type { SavingsGoalDto } from "@/Types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMonthlySummary } from "@/api/expense";
import SavingsGoalForm from "@/components/savingGoal/SavingsGoalForm";
import FundFromSurplusModal from "@/components/savingGoal/FundFromSurplusModal";
import { allocateSurplusApi } from "@/api/surplusAllocation";
import { isSurplusUnlocked, surplusUnlockDay } from "@/lib/date";
import { formatCurrency } from "@/lib/currency";

export const Route = createFileRoute("/dashboard/savings/")({
  component: SavingsPage,
});

// ── Quick deposit/withdraw inline ─────────────────────────────────────────────

function UpdateSavedCell({
  goal,
  onUpdate,
  isPending,
}: {
  goal: SavingsGoalDto;
  onUpdate: (id: number, saved: number) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"add" | "set" | null>(null);

  const handleConfirm = () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    const next = mode === "add" ? goal.saved + parsed : parsed;
    if (next < 0) { toast.error("Saved amount can't be negative"); return; }
    onUpdate(goal.id, next);
    setMode(null);
    setValue("");
  };

  if (mode) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">PKR</span>
        <input
          autoFocus
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") setMode(null);
          }}
          placeholder={mode === "add" ? "amount to add" : String(goal.saved)}
          className="w-28 text-sm border border-blue-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold"
        >
          ✓
        </button>
        <button
          onClick={() => { setMode(null); setValue(""); }}
          className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode("add")}
        className="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition font-medium"
      >
        + Add
      </button>
      <button
        onClick={() => setMode("set")}
        className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition font-medium"
      >
        Set
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SavingsPage() {
  const { goals, isPending, addGoal, updateGoal, updateSaved, deleteGoal } = useSavingsGoals();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SavingsGoalDto | null>(null);
  const [fundGoal, setFundGoal] = useState<SavingsGoalDto | null>(null);


// Add inside SavingsPage, alongside existing mutations:
const queryClient = useQueryClient();

const allocateMutation = useMutation({
  mutationFn: allocateSurplusApi,
  onSuccess: (res) => {
    toast.success(res.message);
    // invalidate both savings goals and the budget summary
    // so surplus updates immediately
    queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    queryClient.invalidateQueries({ queryKey: ["category-budgets"] });
    setFundGoal(null);
  },
  onError: (error: any) =>
    toast.error(error?.response?.data || "Failed to allocate surplus."),
});

  // ── Current month surplus ──────────────────────────────────────────────
  const now = new Date();
  const { data: monthlySummary } = useQuery({
    queryKey: ["category-budgets", now.getMonth() + 1, now.getFullYear()],
    queryFn: () => getMonthlySummary(now.getMonth() + 1, now.getFullYear()),
  });

const surplus          = monthlySummary?.availableSurplus ?? 0;
const unlocked         = isSurplusUnlocked();
const unlockDay        = surplusUnlockDay();

  // ── Totals ─────────────────────────────────────────────────────────────
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved  = goals.reduce((s, g) => s + g.saved, 0);
  const completed   = goals.filter((g) => g.isComplete).length;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSubmit = (dto: any) => {
    if (selected) {
      updateGoal.mutate(
        { id: selected.id, dto },
        { onSuccess: () => { setOpen(false); setSelected(null); } }
      );
    } else {
      addGoal.mutate(dto, {
        onSuccess: () => setOpen(false),
      });
    }
  };

const handleFundConfirm = (amount: number) => {
  if (!fundGoal) return;
  allocateMutation.mutate({
    savingsGoalId: fundGoal.id,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount,
  });
};

  const handleDelete = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Delete this savings goal?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 text-sm bg-gray-200 rounded-md">No</button>
          <button
            onClick={() => { deleteGoal.mutate(id); toast.dismiss(t.id); }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md"
          >
            Yes
          </button>
        </div>
      </div>
    ));
  };

  if (isPending) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Heading HeadTitle="Saving Goal" SubTitle="Track your progress toward financial targets" />
        <button
          type="button"
          onClick={() => { setSelected(null); setOpen(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-gradient px-6 py-3 font-bold text-white editorial-shadow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {/* Modals */}
      {open && (
        <SavingsGoalForm
          onClose={() => { setOpen(false); setSelected(null); }}
          onSubmit={handleSubmit}
          isPending={addGoal.isPending || updateGoal.isPending}
          goal={selected}
        />
      )}
{fundGoal && (
  <FundFromSurplusModal
    goal={fundGoal}
    surplus={surplus}
    month={now.getMonth() + 1}
    year={now.getFullYear()}
    isPending={allocateMutation.isPending}
    onClose={() => setFundGoal(null)}
    onConfirm={handleFundConfirm}
  />
)}

      {/* Surplus banner */}
{surplus > 0 && (
  <div className={`mb-6 flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:px-5 ${
    unlocked
      ? "bg-green-50 border-green-200"
      : "bg-slate-50 border-slate-200"
  }`}>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
      unlocked ? "bg-green-100" : "bg-slate-100"
    }`}>
      {unlocked
        ? <Wallet size={17} className="text-green-600" />
        : <Lock size={17} className="text-slate-400" />
      }
    </div>
    <div className="flex-1">
      {unlocked ? (
        <>
          <p className="text-sm font-semibold text-green-800">
            You have <span className="text-green-600">{formatCurrency(surplus)}</span> left in your budget this month
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            Use the "Fund from surplus" button on any goal below to allocate it
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-700">
            You have <span className="text-slate-900 dark:text-slate-100">{formatCurrency(surplus)}</span> surplus so far this month
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            🔒 Surplus allocation unlocks on day {unlockDay} of this month — check back then to allocate your remaining budget to savings goals
          </p>
        </>
      )}
    </div>
  </div>
)}
      {/* Summary strip */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-blue-400" />
              <p className="text-xs text-gray-400">Total target</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-green-400" />
              <p className="text-xs text-gray-400">Total saved</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(totalSaved)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}% overall
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <p className="text-xs text-gray-400">Completed</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{completed} / {goals.length}</p>
          </div>
        </div>
      )}

      {/* Goals grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Target size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No savings goals yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Create your first goal to start tracking your savings
          </p>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm text-blue-500 font-medium hover:underline"
          >
            <Plus size={14} /> Create a goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const pct = Math.min(goal.percentageComplete, 100);
            const isOver80 = pct >= 80 && !goal.isComplete;

            return (
              <div
                key={goal.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: goal.color + "22", border: `1.5px solid ${goal.color}55` }}
                    >
                      <Target size={18} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{goal.name}</p>
                      {goal.isComplete ? (
                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                          ✓ Complete
                        </span>
                      ) : isOver80 ? (
                        <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                          Almost there!
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          {formatCurrency(goal.remaining)} remaining
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setSelected(goal); setOpen(true); }}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      disabled={deleteGoal.isPending}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(goal.saved)}
                      <span className="text-gray-400 font-normal"> / {formatCurrency(goal.target)}</span>
                    </span>
                    <span className="font-semibold" style={{ color: goal.isComplete ? "#22C55E" : goal.color }}>
                      {goal.percentageComplete}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.isComplete ? "#22C55E" : goal.color,
                      }}
                    />
                  </div>
                </div>

              
           {/* Actions */}
{!goal.isComplete && (
  <div className="pt-3 border-t border-gray-100 space-y-2">
    <UpdateSavedCell
      goal={goal}
      onUpdate={(id, saved) => updateSaved.mutate({ id, saved })}
      isPending={updateSaved.isPending}
    />

    {/* Fund from surplus */}
    {surplus > 0 && (
      unlocked ? (
        <button
          onClick={() => setFundGoal(goal)}
          className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition font-medium"
        >
          <Wallet size={12} />
          Fund from surplus · {formatCurrency(surplus)} available
        </button>
      ) : (
        <div className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed">
          <Lock size={12} />
          Surplus locked until day {unlockDay}
        </div>
      )
    )}
  </div>
)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}