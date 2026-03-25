import { createContext, useContext, useState, useEffect } from "react";
import type { User, UserType } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/verify"],
    queryFn: async () => {
      const token = localStorage.getItem("accessedu_token");
      if (!token) return null; // No token → skip the request entirely
      const res = await fetch("/api/auth/verify", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error("Invalid login");
      const data = await res.json();
      localStorage.setItem("accessedu_token", data.token);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/verify"], user);
    },
  });

  const login = async (credentials: any) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    localStorage.removeItem("accessedu_token");
    queryClient.setQueryData(["/api/auth/verify"], null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated: true, // Always authenticated for demo
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
