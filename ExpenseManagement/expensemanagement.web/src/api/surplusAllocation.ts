import api from "@/service/axios";

export const allocateSurplusApi = async (dto: {
  savingsGoalId: number;
  month: number;
  year: number;
  amount: number;
}) => {
  const res = await api.post("/surplusallocation", dto);
  return res.data;
};