import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { tokenStorage } from './secure-store';

type User = { id: string; fullName: string; email: string };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  hasCv: boolean | null; // null = not yet checked
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshHasCv: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCv, setHasCv] = useState<boolean | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  async function checkHasCv() {
    try {
      const { data } = await api.get('/cv/me');
      setHasCv(!!data);
    } catch {
      setHasCv(false);
    }
  }

  async function restoreSession() {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      const { data } = await api.get('/auth/me');
      setUser(data);
      await checkHasCv();
    } catch {
      await tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    await checkHasCv();
  }

  async function register(fullName: string, email: string, password: string) {
    const { data } = await api.post('/auth/register', { fullName, email, password });
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setHasCv(false); // brand-new user, definitely no CV yet
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear locally regardless
    }
    await tokenStorage.clearTokens();
    setUser(null);
    setHasCv(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, hasCv, login, register, logout, refreshHasCv: checkHasCv }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}