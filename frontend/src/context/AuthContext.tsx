import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  quickSwitch: (role: 'ADMIN' | 'HEAD' | 'QA' | 'DEVELOPER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS = {
  ADMIN: { email: 'admin@qahubbdemo.local', pass: 'Password123!' },
  HEAD: { email: 'head@qahubbdemo.local', pass: 'Password123!' },
  QA: { email: 'qa@qahubbdemo.local', pass: 'Password123!' },
  DEVELOPER: { email: 'dev@qahubbdemo.local', pass: 'Password123!' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const currentUser = await api.get<User>('/auth/me');
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    const loggedUser = await api.post<User>('/auth/login', { email, password });
    setUser(loggedUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const quickSwitch = async (role: 'ADMIN' | 'HEAD' | 'QA' | 'DEVELOPER') => {
    const creds = DEMO_ACCOUNTS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, quickSwitch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
