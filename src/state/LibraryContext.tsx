import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { libraryReducer, initialLibraryState, type LibraryState, type LibraryAction } from './libraryReducer';

const LibraryContext = createContext<{ state: LibraryState; dispatch: React.Dispatch<LibraryAction> } | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(libraryReducer, initialLibraryState);
  return <LibraryContext.Provider value={{ state, dispatch }}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
