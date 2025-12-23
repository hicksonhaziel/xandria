'use client';
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { PNode } from '@/app/types';

type VisualStatus = 'pNodes_Explore' | 'Network_3D' | 'pNodes_Analysis';

interface PNodesState {
  searchTerm: string;
  filterStatus: string;
  sortBy: string;
  selectedNode: PNode | null;
  scrollPosition: number;
}

interface AppContextType {
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  visualStatus: VisualStatus;
  setVisualStatus: Dispatch<SetStateAction<VisualStatus>>;
  pnodesState: PNodesState;
  setPnodesState: Dispatch<SetStateAction<PNodesState>>;
}

const defaultPNodesState: PNodesState = {
  searchTerm: '',
  filterStatus: 'all',
  sortBy: '',
  selectedNode: null,
  scrollPosition: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [visualStatus, setVisualStatus] = useState<VisualStatus>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('visualStatus');
      return saved !== null ? JSON.parse(saved) : 'pNodes_Explore';
    }
    return 'pNodes_Explore';
  });

  const [pnodesState, setPnodesState] = useState<PNodesState>(defaultPNodesState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('visualStatus', JSON.stringify(visualStatus));
    }
  }, [visualStatus]);

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode,
        visualStatus,
        setVisualStatus,
        pnodesState,
        setPnodesState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}