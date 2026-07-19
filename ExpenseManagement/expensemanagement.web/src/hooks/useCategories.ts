import {
  getCategoryApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "@/api/expense";
import type { ApiResponse, Category } from "@/Types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useCategories() {
  const queryClient = useQueryClient();

  // ── Query ──────────────────────────────────────────────────────────────
  const {
    data: categories,
    isPending: isFetching,
    error,
  } = useQuery<ApiResponse<Category[]>, Error, Category[]>({
    queryKey: ["categories"],
    queryFn: getCategoryApi,
    select: (res) => res.data,
  });

  // ── Shared handlers ────────────────────────────────────────────────────
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["categories"] });

  const onError = (error: any) =>
    toast.error(error.response?.data?.message ?? "Something went wrong");

  // ── Mutations ──────────────────────────────────────────────────────────
  const { mutate: createCategory, isPending: isCreating } = useMutation({
    mutationFn: createCategoryApi,
    onSuccess: () => { toast.success("Category created successfully"); invalidate(); },
    onError,
  });

  const { mutate: updateCategory, isPending: isUpdating } = useMutation({
    mutationFn: (data: Category) => updateCategoryApi(data),
    onSuccess: () => { toast.success("Category updated successfully"); invalidate(); },
    onError,
  });

  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deleteCategoryApi(id),
    onSuccess: () => { toast.success("Category deleted successfully"); invalidate(); },
    onError,
  });

  // ── Derived state ──────────────────────────────────────────────────────
  const isPending = isFetching || isCreating || isUpdating || isDeleting;

  return {
    // data
    categories,
    error,
    // actions
    createCategory,
    updateCategory,
    deleteCategory,
    // granular loading states
    isPending,
    isFetching,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
