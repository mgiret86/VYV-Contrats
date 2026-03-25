import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types/auth';
import { getStoredUser, logout as authLogout } from '@/lib/auth';
import { clearTokens } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const logout = useCallback(async () => {
    await authLogout();
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
