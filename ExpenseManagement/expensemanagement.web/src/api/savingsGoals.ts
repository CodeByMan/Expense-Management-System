import api from "@/service/axios";
import type { CreateSavingsGoalDto, SavingsGoalDto } from "@/Types";

export const getSavingsGoalsApi = async (): Promise<SavingsGoalDto[]> => {
  const res = await api.get("/savingsgoals");
  return res.data;
};

export const createSavingsGoalApi = async (dto: CreateSavingsGoalDto): Promise<SavingsGoalDto> => {
  const res = await api.post("/savingsgoals", dto);
  return res.data;
};

export const updateSavingsGoalApi = async (id: number, dto: CreateSavingsGoalDto): Promise<void> => {
  await api.put(`/savingsgoals/${id}`, dto);
};

export const updateSavedAmountApi = async (id: number, saved: number): Promise<void> => {
  await api.patch(`/savingsgoals/${id}/saved`, { saved });
};

export const deleteSavingsGoalApi = async (id: number): Promise<void> => {
  await api.delete(`/savingsgoals/${id}`);
};
