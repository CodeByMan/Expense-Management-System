import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSavingsGoalsApi,
  updateSavingsGoalApi,
  updateSavedAmountApi,
  deleteSavingsGoalApi,
  createSavingsGoalApi,
} from "@/api/savingsGoals";
import type { CreateSavingsGoalDto } from "@/Types";
import toast from "react-hot-toast";

export function useSavingsGoals() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
  const onError = (error: any) =>
    toast.error(error?.response?.data?.message ?? "Something went wrong");

  const { data: goals = [], isPending } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: getSavingsGoalsApi,
  });

  const addGoal = useMutation({
    mutationFn: (dto: CreateSavingsGoalDto) => createSavingsGoalApi(dto),
    onSuccess: () => { toast.success("Goal created!"); invalidate(); },
    onError,
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateSavingsGoalDto }) =>
      updateSavingsGoalApi(id, dto),
    onSuccess: () => { toast.success("Goal updated!"); invalidate(); },
    onError,
  });

  const updateSaved = useMutation({
    mutationFn: ({ id, saved }: { id: number; saved: number }) =>
      updateSavedAmountApi(id, saved),
    onSuccess: () => { toast.success("Progress updated!"); invalidate(); },
    onError,
  });

  const deleteGoal = useMutation({
    mutationFn: (id: number) => deleteSavingsGoalApi(id),
    onSuccess: () => { toast.success("Goal deleted."); invalidate(); },
    onError,
  });

  return { goals, isPending, addGoal, updateGoal, updateSaved, deleteGoal };
}
