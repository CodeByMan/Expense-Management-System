
import { refreshTokenApi } from "@/api/auth";
import { setStoredAccessToken } from "@/service/authToken";
import type { UserData } from "@/Types";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["authUser"],
    queryFn: refreshTokenApi,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    select: (res) => (res.success ? res.data : null),
  });

  useEffect(() => {
    if (data) {
      setAccessToken(data.token);
      setUser(data);
      setStoredAccessToken(data.token);
      return;
    }

    if (isError) {
      setAccessToken(null);
      setUser(null);
      setStoredAccessToken(null);
    }
  }, [data, isError]);

  const value = useMemo<AuthContextType>(
    () => ({
      accessToken,
      setAccessToken,
      user,
      setUser,
      isAuthenticated: !!accessToken,
      isLoading,
    }),
    [accessToken, user, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="flex h-screen items-center justify-center">
          <span className="text-muted-foreground text-sm">Verifying session...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};