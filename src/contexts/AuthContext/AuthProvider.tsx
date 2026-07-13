import { useState, useEffect, ReactNode } from 'react';
import { getAuthToken, clearAuthToken } from '@/api/authService';
import { AuthContext, AuthState } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    userId: null,
    username: null,
    email: null,
    role: null,
    isAuthenticated: false,
  });

  const decodeAndSetToken = (token: string) => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const payload = JSON.parse(decodedJson);

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearAuthToken();
        setAuthState({
          token: null,
          userId: null,
          username: null,
          email: null,
          role: null,
          isAuthenticated: false,
        });
        return;
      }

      setAuthState({
        token,
        userId: payload.sub || null,
        username: payload.username || null,
        email: payload.email || null,
        role: payload.role || null,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Failed to decode token', error);
      clearAuthToken();
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      decodeAndSetToken(token);
    }
  }, []);

  const login = (token: string) => {
    decodeAndSetToken(token);
  };

  const logout = () => {
    clearAuthToken();
    setAuthState({
      token: null,
      userId: null,
      username: null,
      email: null,
      role: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
