'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, type LoginPayload, type RegisterPayload, type ProfileUpdatePayload } from '@/lib/api';
import { UserRole } from '@/lib/constants';

// ─── Types ──────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  is_active: boolean;
  profile_id?: number;
  specialization?: string;
  license_number?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileUpdatePayload) => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Role-based dashboard mapping ───────────────────────────────

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    [UserRole.PATIENT]: '/dashboard/patient',
    [UserRole.DENTIST]: '/dashboard/dentist',
    [UserRole.RECEPTIONIST]: '/dashboard/receptionist',
    [UserRole.ADMIN]: '/dashboard/admin',
  };
  return paths[role] || '/dashboard/patient';
}

// ─── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // On mount: try to restore session from localStorage
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = localStorage.getItem('dams_token');
        const storedUser = localStorage.getItem('dams_user');

        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        setToken(storedToken);

        // Try to validate by fetching profile
        try {
          const res = await authApi.getProfile();
          const userData = res.data.data?.user || res.data.data;
          setUser(userData);
          localStorage.setItem('dams_user', JSON.stringify(userData));
        } catch {
          // Token is invalid — try cached user as fallback
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              // Corrupted data, clear everything
              localStorage.removeItem('dams_token');
              localStorage.removeItem('dams_user');
              setToken(null);
            }
          } else {
            localStorage.removeItem('dams_token');
            setToken(null);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { token: newToken, user: newUser } = res.data.data;

    localStorage.setItem('dams_token', newToken);
    localStorage.setItem('dams_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    const res = await authApi.register(data);
    const { token: newToken, user: newUser } = res.data.data;

    localStorage.setItem('dams_token', newToken);
    localStorage.setItem('dams_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dams_token');
    localStorage.removeItem('dams_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateProfile = useCallback(async (data: ProfileUpdatePayload) => {
    const res = await authApi.updateProfile(data);
    const updatedUser = res.data.data?.user || res.data.data;
    setUser(updatedUser);
    localStorage.setItem('dams_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
