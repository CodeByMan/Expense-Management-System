import api  from "@/service/axios";
import type { ApiResponse, Category, CreateCategory, CreateExpense, CreateRecurringExpenseDto, DashboardData, Expense, MonthlySummaryDto, RecurringExpenseDto } from "@/Types";

export const createCategoryApi = async (
  formData: CreateCategory
): Promise<ApiResponse<Category>> => {
  const res = await api.post("/category", {
    ...formData
  });

  return res.data;
};
export const getCategoryApi = async (): Promise<ApiResponse<Category[]>> => {
  const res = await api.get("/category");
  return res.data;
};
export const updateCategoryApi = async (data: Category): Promise<ApiResponse<Category>> => {
  const res = await api.put(`/category/update/${data.id}`, data);
  return res.data;
};
export const deleteCategoryApi = async (id: number): Promise<ApiResponse<Category>> => {
  const res = await api.put(`/category/${id}`);
  return res.data;
};
export const getMonthlySummary = async (month: number, year: number): Promise<MonthlySummaryDto> => {
  const res = await api.get(`/categorybudgets/summary?month=${month}&year=${year}`);
  return res.data;
};

export const setBudget = async (dto: { categoryId: number; month: number; year: number; amount: number }) => {
  const res = await api.post('/categorybudgets', dto);
  return res.data;
};
// CREATE
export const createExpenseApi = async (
  formData: CreateExpense
): Promise<ApiResponse<Expense>> => {
  const res = await api.post("/Expense", formData);
  return res.data;
};

// UPDATE
export const updateExpenseApi = async (
  id: number,
  data: CreateExpense
) => {
  const res = await api.put(`/Expense/${id}`, data);
  return res.data;
};

//Select All
export const getExpenseApi = async (): Promise<ApiResponse<Expense[]>> => {
  const res = await api.get("/expense");
  return res.data;
};

export const deleteExpenseApi = async (id: number): Promise<ApiResponse<null>> => {
  const res = await api.delete(`/Expense/${id}`);
  return res.data;
};
// dashboard
export const fetchDashboardData = async (): Promise<DashboardData> => {
  const { data } = await api.get<DashboardData>("/Dashboard");
  return data;
};
// move me to seperate file


// Get all
export const getAllRecurringExpensesApi = async (): Promise<RecurringExpenseDto[]> => {
  const res = await api.get("/recurringexpenses");
  return res.data;
};

// Create
export const createRecurringExpenseApi = async (
  dto: CreateRecurringExpenseDto
): Promise<RecurringExpenseDto> => {
  const res = await api.post("/recurringexpenses", {
    ...dto
  });
  return res.data;
};

// Update
export const updateRecurringExpenseApi = async (
  id: number,
  dto: CreateRecurringExpenseDto & { isActive: boolean }
): Promise<void> => {
  await api.put(`/recurringexpenses/${id}`, {
    ...dto
  });
};

// Toggle
export const toggleRecurringExpenseApi = async (id: number): Promise<void> => {
  await api.patch(`/recurringexpenses/${id}/toggle`);
};

// Delete
export const deleteRecurringExpenseApi = async (id: number): Promise<void> => {
  await api.delete(`/recurringexpenses/${id}`);
};