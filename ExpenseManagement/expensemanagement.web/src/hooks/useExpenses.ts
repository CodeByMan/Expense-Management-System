import {
  getExpenseApi,
  createExpenseApi,
  updateExpenseApi,
  deleteExpenseApi,
} from "@/api/expense";
import type { ApiResponse, CreateExpense, Expense } from "@/Types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useExpenses() {
  const queryClient = useQueryClient();

  //  Query
  const {
    data: expenses,
    isPending: isFetching,
    error,
  } = useQuery<ApiResponse<Expense[]>, Error, Expense[]>({
    queryKey: ["expenses"],
    queryFn: getExpenseApi,
    select: (res) => res.data,
  });

  //  Shared handlers
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const onError = (error: any) =>
    toast.error(error.response?.data?.message ?? "Something went wrong");

  // Mutations 
  const { mutate: createExpense, isPending: isCreating } = useMutation({
    mutationFn: createExpenseApi,
    onSuccess: (res) => { toast.success(res.message); invalidate(); },
    onError,
  });

  const { mutate: updateExpense, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateExpense }) =>
      updateExpenseApi(id, data),
    onSuccess: (res) => { toast.success(res.message); invalidate(); },
    onError,
  });

  const { mutate: deleteExpense, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deleteExpenseApi(id),
    onSuccess: (res) => { toast.success(res.message); invalidate(); },
    onError,
  });

  //  Derived state
  const isPending = isFetching || isCreating || isUpdating || isDeleting;

  return {
    // data
    expenses,
    error,
    // actions
    createExpense,
    updateExpense,
    deleteExpense,
    // granular loading states
    isPending,
    isFetching,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
