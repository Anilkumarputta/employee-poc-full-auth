import React, { createContext } from "react";

export type AuthUser = {
  id: number;
  email: string;
  role: "director" | "manager" | "employee";
};

export type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
  }) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: () => {},
  logout: () => {},
});
