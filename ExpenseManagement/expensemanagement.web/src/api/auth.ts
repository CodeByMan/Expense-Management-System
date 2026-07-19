import api from "@/service/axios";
import type {
  RegisterFormInputs,
  ApiResponse,
  UserData,
  LoginFormInputs,
  UserProfile,
} from "@/Types";
//Request failed with status code 400
export const registerApi = async (
  formData: RegisterFormInputs,
): Promise<ApiResponse<UserData>> => {
  const res = await api.post("/Accounts/register", {
    ...formData,
  });

  return res.data;
};

export const loginApi = async (
  formData: LoginFormInputs,
): Promise<ApiResponse<UserData>> => {
  const res = await api.post("/Accounts/login", {
    ...formData,
  });

  return res.data;
};
export const logoutApi = async () => {
  const res = await api.post("/Accounts/logout");

  return res.data;
};

export const refreshTokenApi = async () => {
  const res = await api.post("/Accounts/refreshToken");

  return res.data;
};

export const sendConfirmationEmailApi = async (email: string) => {
  const res = await api.post("/Accounts/send-confirmation-email", { email });
  return res.data as ApiResponse<null>;
};

export const confirmEmailApi = async (data: {
  userId: string;
  token: string;
}) => {
  const res = await api.get("/Accounts/confirmEmail", {
    params: { userId: data.userId, token: data.token },
  });
  return res.data as ApiResponse<null>;
};

export const getUserSessionsApi = async () => {
  const res = await api.get("/Accounts/sessions");
  return res.data;
};

export const getProfileApi = async (): Promise<ApiResponse<UserProfile>> => {
  const res = await api.get("/Accounts/profile");
  return res.data;
};

export const updateProfileApi = async (data: { firstName: string; lastName: string }): Promise<ApiResponse<UserProfile>> => {
  const res = await api.put("/Accounts/profile", data);
  return res.data;
};

export const uploadProfileImageApi = async (image: File): Promise<ApiResponse<UserProfile>> => {
  const formData = new FormData();
  formData.append("image", image);
  const res = await api.post("/Accounts/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteProfileImageApi = async (): Promise<ApiResponse<UserProfile>> => {
  const res = await api.delete("/Accounts/profile/avatar");
  return res.data;
};

export const analyzeExpensesApi = async (period: { month?: number; year?: number } = {}) => {
  const res = await api.post("/Insights/analyze", period);
  return res.data;
};
