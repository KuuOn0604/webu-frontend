import { createContext } from 'react';

export interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
