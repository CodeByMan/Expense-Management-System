import { confirmEmailApi } from "@/api/auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

type ConfirmEmailSearch = {
  userId?: string;
  token?: string;
};

export const Route = createFileRoute("/(account)/confirm-email")({
  validateSearch: (search: Record<string, unknown>): ConfirmEmailSearch => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const { userId, token } = Route.useSearch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: confirmEmailApi,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
    },
    onError: (error: any) =>
      toast.error(
        error.response?.data?.message || error.message || "Confirmation failed",
      ),
  });

  useEffect(() => {
    if (userId && token) {
      mutation.mutate({ userId, token });
    }
  }, [userId, token]);

  useEffect(() => {
    if (mutation.isSuccess) {
      const timer = setTimeout(() => navigate({ to: "/login" }), 2000);
      return () => clearTimeout(timer);
    }
  }, [mutation.isSuccess, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        {mutation.isPending && (
          <p className="text-gray-500">Confirming your email...</p>
        )}
        {mutation.isSuccess && (
          <p className="text-lg text-green-600">
            Your email has been confirmed successfully
          </p>
        )}
        {mutation.isError && (
          <p className="text-lg text-red-500">
            Invalid or expired confirmation link
          </p>
        )}
        {(!userId || !token) && (
          <p className="text-lg text-red-500">Missing confirmation data</p>
        )}
      </div>
    </div>
  );
}
