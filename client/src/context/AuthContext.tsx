import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { apiRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ demoOtp?: string }>;
  loginStaff: (email: string, passwordPlain: string) => Promise<void>;
  registerFarmer: (data: any) => Promise<void>;
  quickDemoLogin: (type: 'farmer1' | 'farmer2' | 'operator' | 'manager' | 'admin') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('krishisetu_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await apiRequest('/auth/me');
      setUser(data);
    } catch (err) {
      localStorage.removeItem('krishisetu_token');
      localStorage.removeItem('krishisetu_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const loginWithOtp = async (phone: string, otp: string) => {
    const data = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    localStorage.setItem('krishisetu_token', data.tokens.accessToken);
    localStorage.setItem('krishisetu_refresh_token', data.tokens.refreshToken);
    setUser(data.user);
  };

  const requestOtp = async (phone: string) => {
    return await apiRequest('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  };

  const loginStaff = async (email: string, passwordPlain: string) => {
    const data = await apiRequest('/auth/staff-login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordPlain }),
    });

    localStorage.setItem('krishisetu_token', data.tokens.accessToken);
    localStorage.setItem('krishisetu_refresh_token', data.tokens.refreshToken);
    setUser(data.user);
  };

  const registerFarmer = async (formData: any) => {
    const data = await apiRequest('/auth/register-farmer', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    localStorage.setItem('krishisetu_token', data.tokens.accessToken);
    localStorage.setItem('krishisetu_refresh_token', data.tokens.refreshToken);
    setUser(data.user);
  };

  const quickDemoLogin = async (type: 'farmer1' | 'farmer2' | 'operator' | 'manager' | 'admin') => {
    setIsLoading(true);
    try {
      if (type === 'farmer1') {
        await loginWithOtp('+91 98230 11001', '123456');
      } else if (type === 'farmer2') {
        await loginWithOtp('+91 98230 11002', '123456');
      } else if (type === 'operator') {
        await loginStaff('operator.nagpur@krishisetu.gov.in', 'Operator@12345');
      } else if (type === 'manager') {
        await loginStaff('manager.nagpur@krishisetu.gov.in', 'Manager@12345');
      } else if (type === 'admin') {
        await loginStaff('admin@krishisetu.gov.in', 'Admin@12345');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('krishisetu_token');
    localStorage.removeItem('krishisetu_refresh_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithOtp,
        requestOtp,
        loginStaff,
        registerFarmer,
        quickDemoLogin,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
