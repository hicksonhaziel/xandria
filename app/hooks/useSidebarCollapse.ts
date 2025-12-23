'use client';
import { useState, useEffect } from 'react';

// Read from localStorage synchronously to prevent flash
const getInitialCollapsedState = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('sidebar_collapsed');
  return saved !== null ? JSON.parse(saved) : false;
};

export function useSidebarCollapse() {
  // Initialize with synchronous read to prevent flash
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);

  useEffect(() => {
    // Listen for changes from other sources
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sidebar_collapsed' && e.newValue !== null) {
        setIsCollapsed(JSON.parse(e.newValue));
      }
    };

    // Custom event for same-window changes
    const handleCustomEvent = (e: CustomEvent) => {
      setIsCollapsed(e.detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-collapse-change' as any, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-collapse-change' as any, handleCustomEvent);
    };
  }, []);

  return isCollapsed;
}