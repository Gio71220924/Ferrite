import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { sourcesReducer, initialSourcesState, type SourcesState, type SourcesAction } from './sourcesReducer';

const SourcesContext = createContext<{ state: SourcesState; dispatch: React.Dispatch<SourcesAction> } | null>(null);

export function SourcesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sourcesReducer, initialSourcesState);
  return <SourcesContext.Provider value={{ state, dispatch }}>{children}</SourcesContext.Provider>;
}

export function useSources() {
  const ctx = useContext(SourcesContext);
  if (!ctx) throw new Error('useSources must be used within SourcesProvider');
  return ctx;
}
