'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  passwordResetRequired: boolean;
  login: (token: string, user: User, passwordResetRequired?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  passwordResetRequired: false,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  changePassword: async () => {},
});

async function fetchMe(): Promise<{ user: User | null; token: string | null }> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) return { user: null, token: null };
    const user: User = await res.json();
    return { user, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  useEffect(() => {
    fetchMe().then(({ user }) => {
      if (user) {
        setUser(user);
      }
      setIsLoading(false);
    });
  }, []);

  const login = (newToken: string, newUser: User, passwordResetRequired?: boolean) => {
    setToken(newToken);
    setUser(newUser);
    if (passwordResetRequired) setPasswordResetRequired(true);
  };

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
    }
    setToken(null);
    setUser(null);
    setPasswordResetRequired(false);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    setPasswordResetRequired(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        passwordResetRequired,
        login,
        logout,
        changePassword,
        isAuthenticated: !!token || !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
