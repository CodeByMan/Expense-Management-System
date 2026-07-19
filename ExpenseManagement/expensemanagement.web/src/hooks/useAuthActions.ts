import {
  confirmEmailApi,
  loginApi,
  logoutApi,
  registerApi,
  sendConfirmationEmailApi,
} from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";
import axios from "axios";
import { setStoredAccessToken } from "@/service/authToken";

// ── Shared helper ──────────────────────────────────────────────────────────
const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string" ? message : error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

// ── Hook ───────────────────────────────────────────────────────────────────
export const useAuthActions = () => {
  const { setAccessToken, setUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ── Login ──────────────────────────────────────────────────────────────
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      setAccessToken(res.data.token);
      setStoredAccessToken(res.data.token);
      setUser(res.data);
      toast.success(res.message);
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, "Something went wrong")),
  });

  // ── Logout ─────────────────────────────────────────────────────────────
  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: logoutApi,
    onSuccess: (res) => {
      if (!res?.success) {
        toast.error(res?.message || "Logout failed");
        return;
      }
      setAccessToken(null);
      setStoredAccessToken(null);
      setUser(null);
      queryClient.clear();
      toast.success(res.message || "Logged out successfully");
      navigate({ to: "/login" });
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, "Something went wrong")),
  });

  // ── Register ───────────────────────────────────────────────────────────
  const { mutate: register, isPending: isRegistering } = useMutation({
    mutationFn: registerApi,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, "Something went wrong")),
  });

  // ── Confirm email ──────────────────────────────────────────────────────
  const { mutate: confirmEmail, isPending: isConfirmingEmail } = useMutation({
    mutationFn: confirmEmailApi,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, "Confirmation failed")),
  });

  // ── Send confirmation email ────────────────────────────────────────────
  const { mutate: sendConfirmationEmail, isPending: isSendingEmail } =
    useMutation({
      mutationFn: sendConfirmationEmailApi,
      onSuccess: (res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message || "Email sent successfully");
      },
      onError: (error: unknown) =>
        toast.error(getErrorMessage(error, "Failed to send email")),
    });

  return {
    // actions
    login,
    logout,
    register,
    sendConfirmationEmail,
    confirmEmail,
    // loading states
    isLoggingIn,
    isLoggingOut,
    isRegistering,
    isSendingEmail,
    isConfirmingEmail,
  };
};
