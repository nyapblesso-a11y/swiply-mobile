import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from './api';
import { useAuth } from './auth-context';

type MatchesContextType = {
  matchesCount: number;
  refreshMatchesCount: () => Promise<void>;
  setMatchesCount: (count: number) => void;
};

const MatchesContext = createContext<MatchesContextType | undefined>(undefined);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [matchesCount, setMatchesCount] = useState(0);

  const refreshMatchesCount = useCallback(async () => {
    try {
      const { data } = await api.get('/jobs/matches');
      setMatchesCount(data.length);
    } catch {
      // fail silently — badge just won't update this cycle
    }
  }, []);

  useEffect(() => {
    if (user) refreshMatchesCount();
    else setMatchesCount(0);
  }, [user, refreshMatchesCount]);

  return (
    <MatchesContext.Provider value={{ matchesCount, refreshMatchesCount, setMatchesCount }}>
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchesContext);
  if (!context) throw new Error('useMatches must be used within MatchesProvider');
  return context;
}