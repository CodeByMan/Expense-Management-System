import { createRecurringExpenseApi, deleteRecurringExpenseApi, getAllRecurringExpensesApi, toggleRecurringExpenseApi, updateRecurringExpenseApi } from '@/api/expense';
import type { CreateRecurringExpenseDto } from '@/Types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useRecurringExpenses() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });

  const { data: recurringExpenses = [], isPending } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: getAllRecurringExpensesApi,
  });

  const create = useMutation({ mutationFn: createRecurringExpenseApi, onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: CreateRecurringExpenseDto & { isActive: boolean } }) => updateRecurringExpenseApi(id, dto), onSuccess: invalidate });
  const toggle = useMutation({ mutationFn: toggleRecurringExpenseApi, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteRecurringExpenseApi, onSuccess: invalidate });

  return { recurringExpenses, isPending, create, update, toggle, remove };
}
