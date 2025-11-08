import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, setAccessToken } from '@/services/api';
import type { AuthResponse, LoginDto, RegisterDto } from '@repo/shared-types';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  loading: boolean;
  error: Error | null;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to refresh token to get new access token
        const refreshResponse = await api.auth.refresh();

        if (refreshResponse.data?.accessToken) {
          // Get user profile
          const profileResponse = await api.auth.getProfile();
          if (profileResponse.data?.user) {
            setUser(profileResponse.data.user);
          }
        }
      } catch (err) {
        // Session restore failed - user needs to login
        console.error('Session restore failed:', err);
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.auth.login(dto);

      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (dto: RegisterDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.auth.register(dto);

      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Registration failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
