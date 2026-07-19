import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateSavingsGoalDto, SavingsGoalDto } from "@/Types";

const COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#3B82F6", "#06B6D4", "#84CC16", "#F43F5E",
];

type Props = {
  onClose: () => void;
  onSubmit: (dto: CreateSavingsGoalDto) => void;
  isPending: boolean;
  goal?: SavingsGoalDto | null;
};

export default function SavingsGoalForm({ onClose, onSubmit, isPending, goal }: Props) {
  const isEdit = !!goal;
  const [selectedColor, setSelectedColor] = useState(goal?.color ?? COLORS[0]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSavingsGoalDto>({
    defaultValues: {
      name: goal?.name ?? "",
      target: goal?.target ?? 0,
      saved: goal?.saved ?? 0,
      color: goal?.color ?? COLORS[0],
    },
  });

  useEffect(() => {
    if (goal) {
      reset({ name: goal.name, target: goal.target, saved: goal.saved, color: goal.color });
      setSelectedColor(goal.color);
    }
  }, [goal, reset]);

  const handleFormSubmit = (data: CreateSavingsGoalDto) => {
    onSubmit({ ...data, color: selectedColor });
  };

  const pct = goal ? Math.min((goal.saved / goal.target) * 100, 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header preview */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all"
            style={{ backgroundColor: selectedColor + "22", border: `2px solid ${selectedColor}55` }}
          >
            🎯
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {isEdit ? "Edit Goal" : "New Savings Goal"}
            </h2>
            <p className="text-xs text-gray-400">Set your target and track progress</p>
          </div>
        </div>

        {/* Progress preview for edit mode */}
        {isEdit && (
          <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Current progress</span>
              <span className="font-semibold" style={{ color: selectedColor }}>{pct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: selectedColor }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Goal name</label>
            <Input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Emergency Fund, New Laptop"
              className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Target + Saved side by side */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Target amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">PKR</span>
                <Input
                  {...register("target", { required: "Required", min: { value: 1, message: "Must be > 0" }, valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-gray-200 pl-12 pr-3 py-2.5 rounded-xl text-sm"
                />
              </div>
              {errors.target && <p className="text-xs text-red-500 mt-1">{errors.target.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Already saved</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">PKR</span>
                <Input
                  {...register("saved", { valueAsNumber: true, min: 0 })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-gray-200 pl-12 pr-3 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    selectedColor === color ? "ring-2 ring-offset-2 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color, outlineColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-white rounded-xl"
              style={{ backgroundColor: selectedColor }}
            >
              {isPending
                ? isEdit ? "Updating..." : "Creating..."
                : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}