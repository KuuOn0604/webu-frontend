import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getAuthToken, clearAuthToken } from '@/api/authService';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  userId: string | null;
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [token, setToken] = useState<string | null>(getAuthToken);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const storedToken = getAuthToken();
    if (!storedToken) {
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    userId: user?.id ?? (user as AuthUser & { _id?: string })?._id ?? null,
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
