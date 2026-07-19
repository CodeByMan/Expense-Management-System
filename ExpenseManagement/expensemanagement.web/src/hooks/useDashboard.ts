import { fetchDashboardData } from "@/api/expense";
import type { DashboardData } from "@/Types";
import { useQuery } from "@tanstack/react-query";

export function useDashboard() {
  const {data , isPending,error} = useQuery<DashboardData, Error>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    // staleTime: 5 * 60 * 1000, 
  });

  return { data, isPending, error };
}